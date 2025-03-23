/*
 * @name: 检验记录图片上传
 * @content: 处理检验记录相关的图片上传
 * @Date: 2023-11-10
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const FileResource = require('../model/project/fileResource');
const fs = require("fs");
const path = require("path");

// 配置图片存储路径和重命名
const storage = multer.diskStorage({
    // 使用临时文件夹
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, `../public/uploads/inspection/temp`);
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        // 获取扩展名
        const extname = file.originalname.split('.').pop();
        
        // 临时文件名使用时间戳和随机数
        const dateCode = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
        const serialNumber = Math.floor(100000 + Math.random() * 900000);
        
        // 确保文件是图片
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!allowedTypes.includes(extname.toLowerCase())) {
            return cb(new Error('只允许上传图片文件'));
        }
        
        // 组合临时文件名
        const filename = `temp_${dateCode}_${serialNumber}.${extname}`;
        cb(null, filename);
    }
});

// 文件大小限制 (5MB)
const limits = {
    fileSize: 5 * 1024 * 1024
};

// 上传对象
const upload = multer({
    storage,
    limits,
    fileFilter: (req, file, cb) => {
        // 检查 MIME 类型是否为图片
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 接收检验记录图片上传请求
router.post('/api/v1/uploadInspectionImage', upload.single('image'), async (req, res) => {
    try {
        console.log("请求体:", req.body);
        console.log("条码值:", req.body.barcode);
        
        if (!req.file) {
            return res.json({
                code: 400,
                message: "未检测到上传图片"
            });
        }

        // 获取实际条码和检验类型
        const barcode = req.body.barcode || 'unknown';
        const folderName = barcode.replace(/[^\w\u4e00-\u9fa5]/g, '_');
        const inspectionType = req.body.inspectionType || 'sampling';
        
        // 构建目标路径
        const targetDir = path.join(__dirname, `../public/uploads/inspection/${inspectionType}/${folderName}`);
        
        // 确保目标目录存在
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 生成正确的文件名
        const extname = req.file.originalname.split('.').pop();
        const dateCode = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
        const serialNumber = Math.floor(100000 + Math.random() * 900000);
        const newFilename = `${folderName}_${dateCode}_${serialNumber}.${extname}`;
        
        // 移动文件到目标路径并重命名
        const targetPath = path.join(targetDir, newFilename);
        fs.renameSync(req.file.path, targetPath);
        
        // 更新文件路径和文件名
        req.file.path = targetPath;
        req.file.filename = newFilename;
        
        const fileData = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.originalname.split('.').pop(),
            mimeType: req.file.mimetype,
            storageType: 'LOCAL',
            storagePath: req.file.path,
            url: `/uploads/inspection/${inspectionType}/${folderName}/${newFilename}`,
            category: 'inspection',
            businessType: 'inspection',
            businessId: req.body.inspectionId, // 关联的检验记录ID
            relatedBarcode: req.body.barcode, // 相关条码
            inspectionType: inspectionType, // 检验类型
            originalFolder: folderName, // 存储所在文件夹名称
            remark: req.body.remark,
            createBy: req.body.userId
        };

        // 保存文件信息到数据库
        const fileResource = await FileResource.create(fileData);

        res.json({
            code: 20000,
            data: {
                fileId: fileResource._id,
                fileName: fileResource.fileName,
                url: fileResource.url,
                inspectionId: req.body.inspectionId,
                barcode: req.body.barcode,
                folder: folderName
            }
        });
    } catch (error) {
        console.error('检验图片上传错误:', error);
        res.json({
            code: 500,
            message: `图片上传失败: ${error.message}`
        });
    }
});

module.exports = router; 