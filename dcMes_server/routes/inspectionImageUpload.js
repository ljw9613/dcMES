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
    // 根据检验类型和原始文件名设置存储路径
    destination: function (req, file, cb) {
        // 使用条码作为文件夹名
        const barcode = req.body.barcode || 'unknown';
        // 文件夹名去除特殊字符，避免路径问题
        const folderName = barcode.replace(/[^\w\u4e00-\u9fa5]/g, '_');
        
        const inspectionType = req.body.inspectionType || 'sampling';
        // 构建最终存储路径：.../uploads/inspection/检验类型/条码/
        const uploadPath = path.join(__dirname, `../public/uploads/inspection/${inspectionType}/${folderName}`);
        
        // 确保目录存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        // 获取扩展名
        const extname = file.originalname.split('.').pop();
        
        // 使用条码作为文件名
        const barcode = req.body.barcode || 'unknown';
        // 文件名去除特殊字符
        const safeFilename = barcode.replace(/[^\w\u4e00-\u9fa5]/g, '_');
        
        // 确保文件是图片
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!allowedTypes.includes(extname.toLowerCase())) {
            return cb(new Error('只允许上传图片文件'));
        }
        
        // 添加时间戳和随机数，确保即使重复使用相同条码也不会覆盖
        const dateCode = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
        const serialNumber = Math.floor(100000 + Math.random() * 900000);
        
        // 组合最终文件名：条码_时间编码_流水号.扩展名
        const filename = `${safeFilename}_${dateCode}_${serialNumber}.${extname}`;
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
        if (!req.file) {
            return res.json({
                code: 400,
                message: "未检测到上传图片"
            });
        }

        const inspectionType = req.body.inspectionType || 'sampling';
        // 获取原始文件名（不含扩展名）作为文件夹名
        const originalNameWithoutExt = req.file.originalname.replace(/\.[^/.]+$/, "");
        const folderName = originalNameWithoutExt.replace(/[^\w\u4e00-\u9fa5]/g, '_');
        
        const fileData = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.originalname.split('.').pop(),
            mimeType: req.file.mimetype,
            storageType: 'LOCAL',
            storagePath: req.file.path,
            url: `/uploads/inspection/${inspectionType}/${folderName}/${req.file.filename}`,
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