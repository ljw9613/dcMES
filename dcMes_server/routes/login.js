/*
 * @name: **列表
 * @content:
 * @Author: joyce
 * @Date: 2020-03-16 14:21:04
 */

let express = require('express');
let router = express.Router();
const axiosed = require('axios')
//用户表
var mongoose = require('mongoose');
const user_login = require('../model/user_login')

var client_id = '20200908124905112012827'
var client_secret = 'bd1184c1-23e2-4c0a-a013-41fd9b56a051'
/* GET users listing. */
router.post('/api/v1/login', async function (req, res, next) {
    try {
        var {code} = req.body

        if (code == '') {
            return res.jsonp({
                code: 500,
                data: 'code无效',
            });
        }
        console.log(req.body);
        var access_token = ''
        let resdata = await axiosed.post("https://open.welink.huaweicloud.com/api/auth/v2/tickets", {
            client_id: client_id,
            client_secret: client_secret
        });
        if (resdata.data.code == '0') {
            access_token = resdata.data.access_token;
        }
        console.log('access_token', access_token)


        // 根据用户code获取用户信息
        var result = await axiosed({
            url: "https://open.welink.huaweicloud.com/api/auth/v2/userid?code=" + code,
            method: "GET",
            headers: {
                "x-wlk-Authorization": access_token,
            },
        })
        let userId = result.data.userId;
        console.log(userId);
        var usersD = await user_login.findOne({userId: userId}).exec()
        console.log(usersD, '数据库用户信息')
        if (usersD) {
            res.jsonp({
                code: 200,
                data: '获取成功',
                userId: usersD._id
            });
        } else {
            // 使用UserId 获取用户详细信息
            result = await axiosed({
                url: "https://open.welink.huaweicloud.com/api/contact/v1/users?userId=" + userId,
                method: "GET",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                    "x-wlk-Authorization": access_token,
                },
            })
            console.log(result.data);
            if (typeof (result.data.userId) !== 'undefined') {
                var logindata = new user_login(result.data)
                logindata.save(function (err, ccc) {
                    if (err) {
                        res.send('error')
                    }
                    console.log('userId:' + ccc._id + '注册成功' + new Date)
                    res.jsonp({
                        code: 200,
                        data: '注册成功',
                        userId: ccc._id
                    });
                })
            } else {
                res.jsonp({
                    code: 500,
                    data: '错误',
                    userId: ''
                });
            }
        }

    } catch (error) {
        res.send(error);
    }
});


module.exports = router;
