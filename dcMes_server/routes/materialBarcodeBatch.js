const express = require('express');
const router = express.Router();
const MaterialBarcodeBatch = require('../model/project/materialBarcodeBatch');
const { v4: uuidv4 } = require('uuid'); 
// const sql = require('mssql');
// const { sqlServerConfig } = require('../config/index');

// // 在文件顶部添加连接池
// const pool = new sql.ConnectionPool(sqlServerConfig);
// const poolConnect = pool.connect().catch(err => {
//     console.error('SQL Server 连接池初始化失败:', err);
// });

// // 确保在应用程序退出时关闭连接池
// process.on('SIGINT', async () => {
//     try {
//         await pool.close();
//         console.log('SQL Server 连接池已正常关闭');
//     } catch (err) {
//         console.error('关闭 SQL Server 连接池时出错:', err);
//     }
//     process.exit(0);
// });

/**
 * @api {post} /api/material-barcode/create 创建物料条码批次
 * @apiDescription 根据物料编码创建条码批次
 * @apiParam {String} materialCode 物料编码
 */
router.post('/api/v1/material-barcode/create', async (req, res) => {
    let transaction;
    try {
        const { materialCode } = req.body;
        // 自动获取 IP 地址
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress;

        console.log(ipAddress);

        if (!materialCode) {
            return res.status(400).json({
                success: false,
                message: '物料编码不能为空'
            });
        }

        let batchId;
        let isUnique = false;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        // 循环尝试生成唯一批次号
        while (!isUnique && retryCount < MAX_RETRIES) {
            // 生成日期和时间部分 YYMMDD-HHMMSS
            const now = new Date();
            const dateStr = now.toISOString().slice(2,10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0,8).replace(/:/g, '');
            
            // 生成批次号：物料编码-年月日时分秒
            batchId = `${materialCode}-${dateStr}${timeStr}`;

            // 检查批次号是否已存在
            const existingBatch = await MaterialBarcodeBatch.findOne({ batchId });
            
            if (!existingBatch) {
                isUnique = true;
            } else {
                retryCount++;
                // 等待一秒再重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!isUnique) {
            return res.status(500).json({
                success: false,
                message: '无法生成唯一批次号，请稍后重试'
            });
        }

        // 创建新的批次记录
        const newBatch = new MaterialBarcodeBatch({
            batchId,
            materialCode,
            ipAddress,
            createBy: req.user?.username || 'system',
            updateBy: req.user?.username || 'system'
        });

        await newBatch.save();

        res.json({
            code: 200,
            success: true,
            data: {
                batchId,
                materialCode,
                ipAddress
            },
            message: '批次创建成功'
        });

    } catch (error) {
        console.error('创建物料条码批次失败:', error);
        
        // 根据错误类型返回适当的状态码
        const statusCode = error.message.includes('数据库') ? 503 : 500;
        
        res.status(statusCode).json({
            code: 500,
            success: false,
            message: '创建物料条码批次失败',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
