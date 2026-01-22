
var wechatAPI = require('wechat-api');
var request = require('request');
let { SubscriptionAppID, SubscriptionAppSecret } = require("../../libs/config")
var api = new wechatAPI(SubscriptionAppID, SubscriptionAppSecret);

//新消息提醒
exports.sendmessage_tips = function (data) {
    console.log("运行")
    var openid = 'oCRrbw5Qq_k1n7TDzmMg5cBLk62I';
    //维修单ID
    var date = new Date();
    Y = date.getFullYear() + '-';
    M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    D = date.getDate() + ' ';
    h = date.getHours() + ':';
    m = date.getMinutes() + ':';
    s = date.getSeconds();
    var template_id = '-VsNMoCbIZ0TFYh4QIkJR_yFJsnGy_kqQZXi8iHESuQ';
    // URL置空，则在发送后,点击模板消息会进入一个空白页面（ios）, 或无法点击（android）
    var url = '';
    var data = {
        keyword1: {
            "value": "奥创集团",
            "color": "#173177"
        },
        keyword2: {
            "value": '有HR正在对你发起会话',
            "color": "#173177"
        }
    };
    console.log('22');
    console.log(openid);
    api.sendTemplate(openid, template_id, url, data, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
    });

}

