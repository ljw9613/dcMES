#!/usr/bin/env node

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// 引入数据库连接配置
require("../db")({ /* app placeholder */ });

// 引入模型
const ProductionPlanWorkOrder = require("../model/project/productionPlanWorkOrder");
const MaterialProcessFlow = require("../model/project/materialProcessFlow");
const UdiSamplingInspectionFlow = require("../model/project/udiSamplingInspectionFlow");

// 尝试引入用户模型（可选）
let UserLogin = null;
try {
    UserLogin = require("../model/system/user_login");
} catch (error) {
    console.log('注意: 用户模型未找到，将显示用户ID而非用户名');
}

/**
 * 根据销售单号导出条码抽检记录
 * @param {string} saleOrderNo - 销售单号
 * @param {string} outputPath - 输出文件路径（可选）
 */
async function exportSamplingInspectionByOrderNo(saleOrderNo, outputPath = null) {
    try {
        console.log(`开始查询销售单号: ${saleOrderNo} 的条码抽检记录...`);
        
        // 第一步：根据销售单号查询工单
        console.log("1. 查询工单信息...");
        const workOrders = await ProductionPlanWorkOrder.find({
            saleOrderNo: saleOrderNo
        }).select('_id workOrderNo saleOrderNo materialNumber materialName fSpecification planQuantity');
        
        if (workOrders.length === 0) {
            console.log(`未找到销售单号为 ${saleOrderNo} 的工单记录`);
            return;
        }
        
        console.log(`找到 ${workOrders.length} 个工单记录`);
        
        // 第二步：根据工单ID查询条码流程记录
        console.log("2. 查询条码流程记录...");
        const workOrderIds = workOrders.map(wo => wo._id);
        const materialProcessFlows = await MaterialProcessFlow.find({
            productionPlanWorkOrderId: { $in: workOrderIds }
        }).select('_id barcode materialCode materialName status createAt productionPlanWorkOrderId');
        
        if (materialProcessFlows.length === 0) {
            console.log(`未找到相关的条码流程记录`);
            return;
        }
        
        console.log(`找到 ${materialProcessFlows.length} 个条码流程记录`);
        
        // 第三步：根据条码查询抽检记录
        console.log("3. 查询抽检记录...");
        const barcodes = materialProcessFlows.map(mpf => mpf.barcode);
        const materialProcessFlowIds = materialProcessFlows.map(mpf => mpf._id);
        
        // 使用条码和流程ID两种方式查询，确保数据完整性
        const samplingInspections = await UdiSamplingInspectionFlow.find({
            $or: [
                { barcode: { $in: barcodes } },
                { materialProcessFlowId: { $in: materialProcessFlowIds } }
            ]
        });
        
        console.log(`找到 ${samplingInspections.length} 个抽检记录`);
        
        if (samplingInspections.length === 0) {
            console.log("未找到抽检记录");
            return;
        }
        
        // 第四步：查询用户信息（可选）
        let userMap = new Map();
        if (UserLogin) {
            console.log("4. 查询用户信息...");
            const userIds = [...new Set([
                ...samplingInspections.map(si => si.createBy).filter(id => id),
                ...samplingInspections.map(si => si.updateBy).filter(id => id)
            ])];
            
            if (userIds.length > 0) {
                try {
                    const users = await UserLogin.find({
                        _id: { $in: userIds }
                    }).select('_id userName nickName');
                    
                    users.forEach(user => {
                        userMap.set(user._id.toString(), {
                            userName: user.userName,
                            nickName: user.nickName
                        });
                    });
                    console.log(`查询到 ${users.length} 个用户信息`);
                } catch (error) {
                    console.log('用户信息查询失败，将显示用户ID:', error.message);
                }
            }
        }
        
        // 第五步：整合数据并导出
        console.log("5. 整合数据并导出...");
        
        // 创建工单映射
        const workOrderMap = new Map();
        workOrders.forEach(wo => {
            workOrderMap.set(wo._id.toString(), wo);
        });
        
        // 创建条码流程映射
        const processFlowMap = new Map();
        materialProcessFlows.forEach(mpf => {
            processFlowMap.set(mpf.barcode, mpf);
            processFlowMap.set(mpf._id.toString(), mpf);
        });
        
        // 整合数据
        const exportData = samplingInspections.map(inspection => {
            const processFlow = processFlowMap.get(inspection.barcode) || 
                              processFlowMap.get(inspection.materialProcessFlowId?._id?.toString());
            const workOrder = processFlow ? workOrderMap.get(processFlow.productionPlanWorkOrderId?.toString()) : null;
            
            return {
                // 销售订单信息
                '销售单号': saleOrderNo,
                '工单号': workOrder?.workOrderNo || '',
                '物料编码': workOrder?.materialNumber || inspection.materialCode,
                '物料名称': workOrder?.materialName || inspection.materialName,
                '产品型号': workOrder?.fSpecification || '',
                '计划数量': workOrder?.planQuantity || '',
                
                // 条码信息
                '主条码': inspection.barcode,
                '打印条码': inspection.barcodeValidation?.printBarcode || '',
                '转换条码': inspection.barcodeValidation?.transformedBarcode || '',
                '打印条码匹配': inspection.barcodeValidation?.isPrintBarcodeValid ? '是' : '否',
                '转换条码匹配': inspection.barcodeValidation?.isTransformedBarcodeValid ? '是' : '否',
                '条码校验时间': inspection.barcodeValidation?.validationTime ? 
                    new Date(inspection.barcodeValidation.validationTime).toLocaleString('zh-CN') : '',
                
                // 抽检结果
                '抽检状态': getStatusText(inspection.samplingStatus),
                '是否合格': inspection.isQualified ? '合格' : '不合格',
                '抽检时间': inspection.samplingTime ? 
                    new Date(inspection.samplingTime).toLocaleString('zh-CN') : '',
                '抽检人员': inspection.samplingOperator || '',
                '批次号': inspection.batchNo || '',
                
                // 作废信息
                '作废原因': inspection.voidReason || '',
                '作废时间': inspection.voidTime ? 
                    new Date(inspection.voidTime).toLocaleString('zh-CN') : '',
                '作废人员': inspection.voidOperator || '',
                
                // 其他信息
                '抽检照片': inspection.photoUrl || '',
                '备注': inspection.remark || '',
                '创建人': getUserDisplayName(inspection.createBy, userMap),
                '创建时间': new Date(inspection.createAt).toLocaleString('zh-CN'),
                '更新人': getUserDisplayName(inspection.updateBy, userMap),
                '更新时间': new Date(inspection.updateAt).toLocaleString('zh-CN')
            };
        });
        
        // 生成Excel文件
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "抽检记录");
        
        // 设置列宽
        const colWidths = [
            { wch: 15 }, // 销售单号
            { wch: 15 }, // 工单号
            { wch: 15 }, // 物料编码
            { wch: 25 }, // 物料名称
            { wch: 20 }, // 产品型号
            { wch: 10 }, // 计划数量
            { wch: 20 }, // 主条码
            { wch: 20 }, // 打印条码
            { wch: 20 }, // 转换条码
            { wch: 12 }, // 打印条码匹配
            { wch: 12 }, // 转换条码匹配
            { wch: 20 }, // 条码校验时间
            { wch: 10 }, // 抽检状态
            { wch: 10 }, // 是否合格
            { wch: 20 }, // 抽检时间
            { wch: 12 }, // 抽检人员
            { wch: 15 }, // 批次号
            { wch: 20 }, // 作废原因
            { wch: 20 }, // 作废时间
            { wch: 12 }, // 作废人员
            { wch: 30 }, // 抽检照片
            { wch: 20 }, // 备注
            { wch: 12 }, // 创建人
            { wch: 20 }, // 创建时间
            { wch: 12 }, // 更新人
            { wch: 20 }  // 更新时间
        ];
        worksheet['!cols'] = colWidths;
        
        // 确定输出路径
        if (!outputPath) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            outputPath = path.join(__dirname, `../exports/抽检记录_${saleOrderNo}_${timestamp}.xlsx`);
        }
        
        // 确保导出目录存在
        const exportDir = path.dirname(outputPath);
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        // 写入文件
        XLSX.writeFile(workbook, outputPath);
        
        console.log(`导出完成！`);
        console.log(`文件路径: ${outputPath}`);
        console.log(`导出记录数: ${exportData.length}`);
        
        // 打印统计信息
        const stats = {
            总记录数: exportData.length,
            合格数: exportData.filter(item => item['是否合格'] === '合格').length,
            不合格数: exportData.filter(item => item['是否合格'] === '不合格').length,
            已完成: exportData.filter(item => item['抽检状态'] === '已完成').length,
            待处理: exportData.filter(item => item['抽检状态'] === '待处理').length,
            已作废: exportData.filter(item => item['抽检状态'] === '已作废').length
        };
        
        console.log('\n统计信息:');
        Object.entries(stats).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        
        return {
            success: true,
            filePath: outputPath,
            recordCount: exportData.length,
            stats: stats
        };
        
    } catch (error) {
        console.error('导出过程中发生错误:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 获取状态文本
 * @param {string} status - 状态代码
 * @returns {string} 状态文本
 */
function getStatusText(status) {
    const statusMap = {
        'PENDING': '待处理',
        'COMPLETED': '已完成',
        'VOIDED': '已作废'
    };
    return statusMap[status] || status;
}

/**
 * 获取用户显示名称
 * @param {ObjectId} userId - 用户ID
 * @param {Map} userMap - 用户信息映射
 * @returns {string} 用户显示名称
 */
function getUserDisplayName(userId, userMap) {
    if (!userId) return '';
    
    const userIdStr = userId.toString();
    const userInfo = userMap.get(userIdStr);
    
    if (userInfo) {
        return userInfo.nickName || userInfo.userName || userIdStr;
    }
    
    return userIdStr;
}

/**
 * 主函数 - 处理命令行参数
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log('销售单号抽检记录导出工具');
        console.log('==============================');
        console.log('');
        console.log('使用方法:');
        console.log('node exportSamplingInspectionByOrderNo.js <销售单号> [输出文件路径]');
        console.log('');
        console.log('参数说明:');
        console.log('  <销售单号>      必需，要查询的销售单号');
        console.log('  [输出文件路径]   可选，Excel文件保存路径');
        console.log('');
        console.log('选项:');
        console.log('  --help, -h      显示帮助信息');
        console.log('');
        console.log('示例:');
        console.log('node exportSamplingInspectionByOrderNo.js SO202401001');
        console.log('node exportSamplingInspectionByOrderNo.js SO202401001 /path/to/output.xlsx');
        console.log('');
        console.log('查询逻辑:');
        console.log('1. 销售单号 → 工单表 (production_plan_work_order)');
        console.log('2. 工单ID → 条码流程记录表 (material_process_flow)');
        console.log('3. 条码 → 抽检记录表 (udi_sampling_inspection_flow)');
        process.exit(args.length === 0 ? 1 : 0);
    }
    
    const saleOrderNo = args[0];
    const outputPath = args[1];
    
    console.log('销售单号抽检记录导出工具');
    console.log('==============================');
    
    const result = await exportSamplingInspectionByOrderNo(saleOrderNo, outputPath);
    
    if (result.success) {
        console.log('\n导出成功！');
    } else {
        console.log('\n导出失败:', result.error);
        process.exit(1);
    }
    
    // 关闭数据库连接
    mongoose.connection.close();
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

module.exports = {
    exportSamplingInspectionByOrderNo
}; 