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
                
                // 创建包含更多用户信息的token负载
                const userData = user.toJSON();
                const tokenPayload = {
                    _id: userData._id, 
                    userName: userData.userName,
                    realName: userData.realName || userData.userName,
                    roleId: userData.role ? userData.role._id : null
                };
                
                // 记录生成的token信息
                console.log('TokenPayload:', tokenPayload);
                
                let token = jwt.sign(
                    tokenPayload,
                    config.secretOrPrivateKey,
                    {
                        expiresIn: "1 days"
                    }
                );
                
                console.log('Generated token:', token.substring(0, 20) + '...');
                
                res.json({
                    code: 200,
                    token: token,
                    user: userData
                })
            } else {
                res.json({
                    code: 4022,
                    message: "账号或密码错误!"
                });
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
    console.log(reqs.body)
    var user = await user_login.findOne({
        _id: reqs.body.id
    }).populate({ path: 'role', populate: { path: 'menuList' } });
    console.log(user)
    if (user !== null) {
        res.json({
            code: 200,
            data: user
        })
    }
})

//管理后台获得登录信息
router.post('/api/v1/user/logout', async (req, res, next) => {
    res.json({
        code: 20000,
        data: 'success'
    })
})

module.exports = router;
