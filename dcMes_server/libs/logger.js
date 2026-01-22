let FileStreamRotator = require('file-stream-rotator')
let fs = require('fs')
let path = require('path')

// 下面代码写在var app = express();下面
let logDir = path.join(__dirname, '../logs')

// 检查是否存在logDir这个目录没有则创建
fs.existsSync(logDir) || fs.mkdirSync(logDir)

// 日志分割流
module.exports = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDir, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})