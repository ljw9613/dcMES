const express = require(`express`);
const router = express.Router();
var multer = require("multer");
var path = require("path");
const nodeZip = require("node-zip");
const crypto = require("crypto");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({
  storage: storage,
  onError: function (err, next) {
    console.log("error", err);
    next(err);
  },
});
var fs = require("fs");
router.post("/api/v1/upload-file", upload.any(), function (req, res, next) {
  try {
    var file = req.files[0];
    let pathurl = "http:/www.fengyang-zh.com/fengyangServer/uploads/";
    // let pathurl = "http://127.0.0.1:2222/uploads/";
    var wordBuffer = fs.readFileSync(
      path.join(__dirname, "../public/uploads/") + file.filename
    );

    var extension = file.filename.split(".").pop();
    console.log("🚀 ~ req.extension:", extension);

    var fileName = new Date().getTime() + "." + extension;
    console.log("🚀 ~ fileName:", fileName);

    fs.writeFileSync(
      path.join(__dirname, "../public/uploads/") + fileName,
      wordBuffer
    );
    fs.unlink(
      path.join(__dirname, "../public/uploads/") + file.filename,
      function (err) {
        console.log(err);
      }
    );

    res.jsonp({
      errno: 0, // 注意：值是数字，不能是字符串
      data: {
        url: pathurl + fileName, // 图片 src ，必须
        alt: fileName, // 图片描述文字，非必须
        href: fileName, // 图片的链接，非必须
      },
    });
  } catch (err) {
    console.log(err);
    res.status(501).jsonp(err);
  }
});

router.post(
  "/api/v1/phone-upload-file",
  upload.any(),
  function (req, res, next) {
    try {
      var file = req.files[0];

      var wordBuffer = fs.readFileSync(
        path.join(__dirname, "../public/uploads/") + file.filename
      );

      var extension = file.filename.split(".").pop();
      console.log("🚀 ~ req.body:", req.body);

      var fileName = new Date().getTime() + "." + extension;
      console.log("🚀 ~ fileName:", fileName);

      fs.writeFileSync(
        path.join(__dirname, "../public/uploads/") + fileName,
        wordBuffer
      );
      fs.unlink(
        path.join(__dirname, "../public/uploads/") + file.filename,
        function (err) {
          console.log(err);
        }
      );

      res.jsonp(fileName);
    } catch (err) {
      console.log(err);
      res.status(501).jsonp(err);
    }
  }
);

const welinkUploadMulter = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname);
    },
  }),
  onError: function (err, next) {
    console.log("error", err);
    next(err);
  },
});

router.post(
  "/api/v1/welink-upload-file",
  welinkUploadMulter.any(),
  function (req, res, next) {
    try {
      const number = (req.session && req.session.number) || null;
      if (!number) {
        return res
          .status(501)
          .json({ error: "无账号,请重新登录,或尝试升级welink或重启welink" });
      }
      return res.send("ok");
    } catch (err) {
      res.status(501).jsonp(err);
    }
  }
);

router.get("/api/v1/welink-download-file", function (req, res) {
  const { fileName, downloadName } = req.query;
  // 判断文件是否存在
  const filePath = path.join(__dirname, `../public/uploads/${fileName}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("文件不存在");
  }
  res.set({
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename=${encodeURIComponent(
      downloadName
    )}`,
  });
  res.download(filePath, downloadName);
});

router.post("/api/v1/files-to-zip", async function (req, res) {
  let fileNames = req.body.fileNames || [];
  if (!fileNames || !fileNames.length) {
    return res.status(501).send("文件名不能为空");
  }
  // 排序
  fileNames.sort((a, b) => {
    return a.localeCompare(b);
  });

  const md5 = crypto.createHash("md5");
  md5.update(fileNames.join(","));
  const fileMd5Str = md5.digest("hex");

  // 如果已经存在，则直接返回
  if (
    fs.existsSync(
      path.join(__dirname, `../public/uploads/merge-${fileMd5Str}.zip`)
    )
  ) {
    return res.jsonp(`merge-${fileMd5Str}.zip`);
  }

  const zip = new nodeZip();
  await Promise.all(
    fileNames.map((fileName) => {
      return new Promise((resolve, reject) => {
        if (
          !fs.existsSync(path.join(__dirname, `../public/uploads/${fileName}`))
        )
          resolve();
        fs.readFile(
          path.join(__dirname, `../public/uploads/${fileName}`),
          function (err, data) {
            if (err) {
              return reject(err);
            }
            zip.file(fileName, data);
            resolve();
          }
        );
      });
    })
  );
  const data = zip.generate({ base64: false, compression: "DEFLATE" });
  // 保存到uploads目录下
  const zipFileName = `merge-${fileMd5Str}.zip`;
  fs.writeFileSync(
    path.join(__dirname, `../public/uploads/${zipFileName}`),
    data,
    "binary"
  );
  res.jsonp(zipFileName);
});

module.exports = router;
