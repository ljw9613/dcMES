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
const FileResource = require('../model/project/fileResource')
var fs = require("fs")
let path = require("path");

// 配置存储路径 和 重命名
var storage = multer.diskStorage({
    // 根据业务类型动态设置存储路径
    destination: function (req, file, cb) {
        const businessType = req.body.businessType || 'common';
        const uploadPath = path.join(__dirname, `../public/uploads/${businessType}`);
        
        // 确保目录存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        const extname = file.originalname.split('.').pop(); // 获取文件扩展名
        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${extname}`;
        cb(null, filename);
    }
});

// 上传对象
var upload = multer({
    storage,
});
// 接收上传请求
router.post('/api/v1/uploadMesFile', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                code: 400,
                message: "未检测到上传文件"
            });
        }

        const fileData = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.originalname.split('.').pop(),
            mimeType: req.file.mimetype,
            storageType: 'LOCAL',
            storagePath: req.file.path,
            url: `/uploads/${req.body.businessType || 'common'}/${req.file.filename}`,
            category: req.body.category,
            businessType: req.body.businessType,
            businessId: req.body.businessId,
            remark: req.body.remark,
            createBy: req.body.userId // 假设从请求中获取用户ID
        };

        // 保存文件信息到数据库
        const fileResource = await FileResource.create(fileData);

        res.json({
            code: 20000,
            data: {
                fileId: fileResource._id,
                fileName: fileResource.fileName,
                url: fileResource.url
            }
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.json({
            code: 500,
            message: "文件上传失败"
        });
    }
});



module.exports = router