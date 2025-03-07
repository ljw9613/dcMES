const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "public/uploads/avatars";
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log("🚀 ~ req:", req);
    // 添加用户ID作为文件名前缀，以便更好地管理文件
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许上传图片
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("只允许上传图片文件！"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 限制2MB
  },
});

// 上传头像接口
router.post("/api/v1/upload/avatar", upload.single("avatar"), (req, res) => {
  try {
    console.log("上传头像接口");
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        msg: "请选择要上传的文件",
      });
    }

    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    res.json({
      code: 200,
      msg: "上传成功",
      data: {
        url: fileUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    console.error("头像上传错误:", error);
    res.status(500).json({
      code: 500,
      msg: "上传失败",
      error: error.message,
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        code: 400,
        msg: "文件大小不能超过2MB",
      });
    }
  }
  res.status(500).json({
    code: 500,
    msg: error.message,
  });
});

module.exports = router;
