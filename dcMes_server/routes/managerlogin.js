/*
 * @name: 管理后台登陆接口
 * @content:
 * @Author: joyce
 * @Date: 2020-03-11 11:22:37
 */
const express = require(`express`)
const router = express.Router()
let jwt = require("jsonwebtoken");
let config = require("../libs/config");
const user_login = require('../model/system/user_login')
const decrypt = require('../utils/crypto');
const apiLogger = require("../middleware/apiLogger");
const lockConfig = require('../config/lockConfig');

// 使用API日志中间件
router.use(apiLogger("userAuth"));

/* GET users listing. */
//管理后台登录
router.post('/api/v1/user/login', async (req, res, next) => {
    //
    try {
        console.log('req.body', req.body)
        let user = await user_login.findOne({
            userName: req.body.userName
        }).populate('role');
        console.log('user', user)
        //  何时返回token  要根据自己的业务逻辑
        if (user !== null) {
            // 检查账号是否被锁定
            const now = new Date();
            if (user.lockedUntil && user.lockedUntil > now) {
                const remainingTime = Math.ceil((user.lockedUntil - now) / (1000 * 60)); // 转换为分钟
                
                // 根据自动解锁配置生成不同的提示信息
                let message, unlockHint;
                if (lockConfig.autoUnlock.enabled) {
                    message = `账号已被锁定，请在${remainingTime}分钟后再试！`;
                    unlockHint = lockConfig.messages.autoUnlockEnabled.unlockHint.replace('{remainingTime}', `${remainingTime}分钟`);
                } else {
                    message = lockConfig.messages.autoUnlockDisabled.lockMessage;
                    unlockHint = lockConfig.messages.autoUnlockDisabled.unlockHint;
                }
                
                res.json({
                    code: 4023,
                    message: message,
                    lockedUntil: user.lockedUntil,
                    remainingMinutes: remainingTime,
                    autoUnlockEnabled: lockConfig.autoUnlock.enabled,
                    unlockHint: unlockHint
                });
                return;
            } else if (user.lockedUntil && user.lockedUntil <= now && lockConfig.autoUnlock.enabled) {
                // 仅在自动解锁启用时，锁定时间过期后自动清除锁定状态
                await user_login.updateOne(
                    { _id: user._id },
                    { 
                        $unset: { lockedUntil: 1 },
                        $set: { loginFailCount: 0 }
                    }
                );
            }

            console.log(req.body)
            // 获取到用户信息后进行解密密码校对
            let password = decrypt(req.body.password)
            console.log(user.password)
            if (user.password === password) {
                if (!user.status) {
                    res.json({
                        code: 4022,
                        message: "该账号已下线，若要登录请联系管理员!"
                    });
                    return;
                }

                // 登录成功，重置失败计数和锁定时间
                await user_login.updateOne(
                    { _id: user._id },
                    { 
                        $unset: { lockedUntil: 1 },
                        $set: { loginFailCount: 0 }
                    }
                );
                
                // 创建包含更多用户信息的token负载
                const userData = user.toJSON();
                const now = Date.now();
                const tokenPayload = {
                    _id: userData._id, 
                    userName: userData.userName,
                    realName: userData.realName || userData.userName,
                    roleId: userData.role ? userData.role._id : null,
                    loginTime: now,
                    lastActivityTime: now
                };
                
                // 记录生成的token信息
                console.log('TokenPayload:', tokenPayload);
                
                let token = jwt.sign(
                    tokenPayload,
                    config.secretOrPrivateKey,
                    {
                        expiresIn: "30 days"
                    }
                );
                
                console.log('Generated token:', token.substring(0, 20) + '...');
                
                res.json({
                    code: 200,
                    token: token,
                    user: userData
                })
            } else {
                // 密码错误，增加失败计数
                const failCount = (user.loginFailCount || 0) + 1;
                const maxFailCount = lockConfig.loginFail.maxFailCount;
                
                if (failCount >= maxFailCount) {
                    // 达到最大失败次数，根据配置决定锁定策略
                    let updateData = { 
                        loginFailCount: failCount
                    };
                    
                    let responseData = {
                        code: 4023,
                        autoUnlockEnabled: lockConfig.autoUnlock.enabled
                    };
                    
                    if (lockConfig.autoUnlock.enabled) {
                        // 自动解锁启用：设置锁定过期时间
                        const lockTime = new Date(Date.now() + lockConfig.loginFail.lockDuration * 60 * 1000);
                        updateData.lockedUntil = lockTime;
                        
                        responseData.message = lockConfig.messages.autoUnlockEnabled.lockMessage
                            .replace('{duration}', lockConfig.loginFail.lockDuration);
                        responseData.lockedUntil = lockTime;
                        responseData.remainingMinutes = lockConfig.loginFail.lockDuration;
                        responseData.unlockHint = lockConfig.messages.autoUnlockEnabled.unlockHint
                            .replace('{remainingTime}', `${lockConfig.loginFail.lockDuration}分钟`);
                    } else {
                        // 自动解锁禁用：永久锁定，直到管理员解锁
                        updateData.lockedUntil = new Date('2099-12-31'); // 设置一个很远的日期表示永久锁定
                        
                        responseData.message = lockConfig.messages.autoUnlockDisabled.lockMessage;
                        responseData.unlockHint = lockConfig.messages.autoUnlockDisabled.unlockHint;
                    }
                    
                    await user_login.updateOne(
                        { _id: user._id },
                        { $set: updateData }
                    );
                    
                    res.json(responseData);
                } else {
                    // 更新失败计数
                    await user_login.updateOne(
                        { _id: user._id },
                        { $set: { loginFailCount: failCount } }
                    );
                    
                    const remainingAttempts = maxFailCount - failCount;
                    res.json({
                        code: 4022,
                        message: `账号或密码错误！还可尝试${remainingAttempts}次`,
                        remainingAttempts: remainingAttempts
                    });
                }
            }
        } else {
            res.json({
                code: 4022,
                message: "用户不存在,请重新登陆!"
            });
        }

    } catch (e) {
        console.error('登录异常:', e);
        res.status(500).send(e.toString());
    }
    //
})

//管理后台获得登录信息
router.post('/api/v1/user/info', async (reqs, res, next) => {
    try {
        // console.log('用户信息查询请求体:', reqs.body);
        // console.log('请求头:', reqs.headers);
        
        // 检查是否有用户ID
        if (!reqs.body.id) {
            console.error('缺少用户ID参数');
            return res.status(400).json({
                code: 400,
                message: '缺少必要的用户ID参数'
            });
        }
        
        var user = await user_login.findOne({
            _id: reqs.body.id
        }).populate({ path: 'role', populate: { path: 'menuList' } });
        
        // console.log('查询到的用户信息:', user);
        
        if (user !== null) {
            res.json({
                code: 200,
                data: user
            });
        } else {
            console.error('未找到用户信息:', reqs.body.id);
            res.status(404).json({
                code: 404,
                message: '未找到用户信息'
            });
        }
    } catch (error) {
        console.error('获取用户信息出错:', error);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})

//管理后台获得登录信息
router.post('/api/v1/user/logout', async (req, res, next) => {
    res.json({
        code: 20000,
        data: 'success'
    })
})

// 管理员解锁用户账号
router.post('/api/v1/user/unlock', async (req, res, next) => {
    try {
        const { userName } = req.body;
        
        if (!userName) {
            return res.json({
                code: 400,
                message: '用户名不能为空'
            });
        }

        // 查找用户
        const user = await user_login.findOne({ userName: userName });
        
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        // 重置失败计数和锁定时间
        await user_login.updateOne(
            { _id: user._id },
            { 
                $unset: { lockedUntil: 1 },
                $set: { loginFailCount: 0 }
            }
        );

        res.json({
            code: 200,
            message: `用户 ${userName} 已成功解锁`,
            data: 'success'
        });

    } catch (error) {
        console.error('解锁用户失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})

// 获取用户锁定状态
router.post('/api/v1/user/lockStatus', async (req, res, next) => {
    try {
        const { userName } = req.body;
        
        if (!userName) {
            return res.json({
                code: 400,
                message: '用户名不能为空'
            });
        }

        const user = await user_login.findOne({ userName: userName });
        
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        const now = new Date();
        const isLocked = user.lockedUntil && user.lockedUntil > now;
        const remainingTime = isLocked ? Math.ceil((user.lockedUntil - now) / (1000 * 60)) : 0;

        res.json({
            code: 200,
            data: {
                userName: user.userName,
                isLocked: isLocked,
                lockedUntil: user.lockedUntil,
                remainingMinutes: remainingTime,
                loginFailCount: user.loginFailCount || 0,
                autoUnlockEnabled: lockConfig.autoUnlock.enabled,
                maxFailCount: lockConfig.loginFail.maxFailCount,
                lockDuration: lockConfig.loginFail.lockDuration
            }
        });

    } catch (error) {
        console.error('获取用户锁定状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})

module.exports = router;
