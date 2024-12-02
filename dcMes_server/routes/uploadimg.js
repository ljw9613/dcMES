/*
 * @name: **列表
 * @content: 
 * @Author: joyce
 * @Date: 2020-03-15 14:26:04
 */
// 引入node上传模块
const express = require(`express`)
const router = express.Router()
var multer = require('multer');
// const adveArtisement = require('../model/Advertisement')
var fs = require("fs")
let path = require("path");

// 配置存储路径 和 重命名
var storage = multer.diskStorage({
    // 图片上传到服务器以后 要放置的路径
    destination: path.join(__dirname, '../public/images/advertisements'),


    // 图片重命名
    filename: function (req, file, cb) {

        console.log(file)
        let extname = file.mimetype.split('/')[1];
        let imgname = Date.now() + parseInt(Math.random() * 999) + parseInt(Math.random() * 2222);
        let keepname = imgname + '广告图片' + '.' + extname
        cb(null, keepname);
    }
});

// 上传对象
var upload = multer({
    storage,
});
// 接收上传请求
router.post('/api/v1/uploadimg', upload.single('file'), async (req, res) => {
    console.log(req.body.datas)
    console.log("bodyssssss")
    var datas = {
        Adlabel: JSON.parse(req.body.datas).Advertisement_name,
        Adnum: JSON.parse(req.body.datas).Adnum,
        Adimg: req.file.filename,
        aadtime: new Date(),
        Adshow: true,
    }
    adveArtisement.create(datas, function (err, doc) {
        console.log("doc", doc)
        if (err) return next(err);
        res.jsonp({
            code: 20000,
            data: doc
        });
    })
})


// 删除请求
router.post('/api/v1/deleteadimg', async (req, res) => {
    console.log(req.body)
    adveArtisement.remove({
        _id: req.body._id
    }, function (err, doc) {
        if (err) {
            res.json({
                code: 400,
                message: "err"
            });
        } else {
            var filepath = path.join(__dirname, '../public/images/advertisements') + req.body.fileName
            fs.unlink(filepath, function (err) {
                console.log(err)
                console.log("err==")
                res.json({
                    code: 200,
                    message: "删除成功"
                });
            })
        }

    })





})
module.exports = router