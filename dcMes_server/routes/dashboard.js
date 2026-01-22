const express = require('express');
const router = express.Router();
const ProductionLine = require('../model/project/productionLine');
const ProductionPlanWorkOrder = require('../model/project/productionPlanWorkOrder');
const Machine = require('../model/project/machine');
const MaterialProcessFlow = require('../model/project/materialProcessFlow');
const ProcessStep = require('../model/project/processStep');
const craft = require('../model/project/craft');
const mongoose = require('mongoose');



// 获取产线大屏数据
router.get('/api/v1/dashboard', async (req, res) => {
  console.time('dashboard-total-time');
  console.log('开始处理大屏数据请求:', new Date().toISOString());
  
  try {
    console.log(req.query, "req.query");
    const lineId = req.query.lineId;
    
    // 查询产线信息
    console.time('查询产线信息');
    const productionLine = await ProductionLine.findById(lineId);
    console.timeEnd('查询产线信息');
    
    if (!productionLine) {
      return res.status(200).json({
        code: 400,
        success: false,
        message: '产线不存在'
      });
    }
    
    // 查询产线当前工单
    console.time('查询当前工单');
    const currentWorkOrder = await ProductionPlanWorkOrder.findOne({
      productionLineId: lineId,
      status: 'IN_PROGRESS'
    }).sort({ createAt: -1 });
    console.timeEnd('查询当前工单');
    console.log('当前工单ID:', currentWorkOrder ? currentWorkOrder._id : '无工单');
    
    // 查询产线设备列表
    console.time('查询设备列表');
    const machines = await Machine.find({
      lineId: lineId
    });
    console.timeEnd('查询设备列表');
    console.log('设备数量:', machines.length);
    
    // 获取工序信息
    console.time('查询工序信息');
    const processStepIds = [...new Set(machines.map(m => m.processStepId).filter(id => id))];
    console.log('工序ID数量:', processStepIds.length);
    
    const processSteps = await ProcessStep.find({
      _id: { $in: processStepIds }
    });
    console.timeEnd('查询工序信息');
    console.log('工序数量:', processSteps.length);
    
    // 整理工序信息为映射表
    const processStepMap = {};
    processSteps.forEach(step => {
      processStepMap[step._id.toString()] = {
        _id: step._id,
        processName: step.processName,
        processCode: step.processCode,
        processOrder: step.processOrder || 0
      };
    });
    
    // 根据工单、工艺、工序排序设备列表
    if (currentWorkOrder) {
      console.time('工艺路线查询与设备排序');
      // 获取当前工单对应的工艺路线信息
      const craftInfo = await craft.findOne({
        materialId: currentWorkOrder.materialId
      });
      console.log('工艺ID:', craftInfo ? craftInfo._id : '未找到工艺');

      const processFlow = await ProcessStep.find({
        craftId: craftInfo._id 
      }).sort({sort:1});
      
      // 创建工序顺序映射
      const processOrderMap = {};
      if (processFlow) {
        processFlow.forEach((step, index) => {
          processOrderMap[step._id.toString()] = index;
        });
      }
      
      // 根据工艺路线中的工序顺序排序设备
      machines.sort((a, b) => {
        // 如果两个设备都有工序ID
        if (a.processStepId && b.processStepId) {
          const orderA = processOrderMap[a.processStepId.toString()] !== undefined ? 
                        processOrderMap[a.processStepId.toString()] : 999;
          const orderB = processOrderMap[b.processStepId.toString()] !== undefined ? 
                        processOrderMap[b.processStepId.toString()] : 999;
          return orderA - orderB;
        }
        // 有工序的设备排在前面
        else if (a.processStepId && !b.processStepId) return -1;
        else if (!a.processStepId && b.processStepId) return 1;
        // 如果都没有工序，按原来的顺序
        return a.machineOrder - b.machineOrder;
      });
      console.timeEnd('工艺路线查询与设备排序');
    }
    
    // 如果有当前工单，获取工单关联的工艺流程数据
    let workOrderProgress = null;
    // 在 if 语句外部声明这些变量，确保它们始终存在
    const processHourlyOutput = {};
    const workOrderHourlyOutput = {};

    if (currentWorkOrder) {
      console.log('开始处理工单数据:', currentWorkOrder._id);
      // 获取当日该工单的生产进度
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 使用聚合查询统计工单总体情况，避免获取全部数据
      console.time('工单状态统计查询');
      
      // 方法1：使用多个简单查询替代一个复杂的聚合查询
      const statsMap = {};
      const statuses = ['COMPLETED', 'ABNORMAL', 'PROCESSING'];
      
      try {
        // 并行执行多个简单查询
        const countPromises = statuses.map(status => 
          MaterialProcessFlow.countDocuments({ 
            productionPlanWorkOrderId: currentWorkOrder._id,
            status: status
          }).exec()
        );
        
        const results = await Promise.all(countPromises);
        
        // 填充结果
        statuses.forEach((status, index) => {
          statsMap[status] = results[index];
        });
        
        console.log('工单状态统计结果:', JSON.stringify(statsMap));
      } catch (error) {
        console.error('状态统计查询失败:', error.message);
        // 设置默认值
        statuses.forEach(status => {
          statsMap[status] = 0;
        });
      }
      
      console.timeEnd('工单状态统计查询');
      
      // 只获取今天完成的物料流程数据
      const todayTimeLabel = `获取今日完成物料流程数据-${Date.now()}`;
      console.time(todayTimeLabel);
      
      // 修改查询条件：使用endTime而不是updatedAt，只查询已完成的记录
      const todayCompletedFlows = await MaterialProcessFlow.find({
        productionPlanWorkOrderId: currentWorkOrder._id,
        status: 'COMPLETED',  // 只获取已完成的记录
        endTime: { $gte: today }  // 使用endTime代替updatedAt
      }, {
        endTime: 1  // 只选取endTime字段以减少数据量
      });
      
      console.timeEnd(todayTimeLabel);
      console.log('今日已完成物料流程数据数量:', todayCompletedFlows.length);

      // 初始化24小时的数据结构
      for (let hour = 0; hour < 24; hour++) {
        workOrderHourlyOutput[hour] = 0;
      }

      // 统计工单每小时产能（简化版）
      console.time('工单小时产能统计');
      
      // 直接统计已完成记录的每小时数量
      todayCompletedFlows.forEach(flow => {
        if (flow.endTime) {
          const hour = new Date(flow.endTime).getHours();
          workOrderHourlyOutput[hour]++;
        }
      });
      
      console.timeEnd('工单小时产能统计');
      
      // 使用更高效的方法获取各工序统计数据
      const processStatsTimeLabel = `工序统计查询-${Date.now()}`;
      console.time(processStatsTimeLabel);
      
      try {
        // 初始化统计对象
        const processStatistics = {};
        const BATCH_SIZE = 100; // 每批处理100条记录
        
        // 创建一个游标而不是直接获取所有数据
        const cursor = MaterialProcessFlow.find(
          { productionPlanWorkOrderId: currentWorkOrder._id },
          { processNodes: 1 } // 只选择processNodes字段
        ).cursor();
        
        console.log('开始批量处理工序统计...');
        let processedCount = 0;
        let batchCount = 0;
        
        // 批量处理数据
        let batch = [];
        for await (const doc of cursor) {
          batch.push(doc);
          processedCount++;
          
          // 当积累了BATCH_SIZE条记录或是最后一批数据时处理
          if (batch.length >= BATCH_SIZE) {
            batchCount++;
            console.log(`处理批次 ${batchCount}, 记录数: ${batch.length}`);
            
            // 处理当前批次
            processBatch(batch, processStatistics);
            
            // 清空批次数组，准备下一批
            batch = [];
          }
        }
        
        // 处理最后一批可能不足BATCH_SIZE的数据
        if (batch.length > 0) {
          batchCount++;
          console.log(`处理最后批次 ${batchCount}, 记录数: ${batch.length}`);
          processBatch(batch, processStatistics);
        }
        
        console.log('工序统计处理完成，总记录数:', processedCount, '总批次:', batchCount, '工序数量:', Object.keys(processStatistics).length);
        console.timeEnd(processStatsTimeLabel);
        
        // 为每个设备添加生产数据
        machines.forEach(machine => {
          if (machine.processStepId) {
            const processId = machine.processStepId.toString();
            const stats = processStatistics[processId] || { completed: 0, abnormal: 0, total: 0 };
            
            machine.productionData = {
              processed: stats.completed,
              defects: stats.abnormal,
              planned: currentWorkOrder.planQuantity
            };
            
            // 判断设备工序状态
            machine.processStatus = machine.status && stats.completed > 0 ? 'RUNNING' : 'STOPPED';
          } else {
            machine.productionData = {
              processed: 0,
              defects: 0,
              planned: currentWorkOrder.planQuantity || 0
            };
            machine.processStatus = 'STOPPED';
          }
        });
        
      } catch (error) {
        console.error('工序统计查询失败:', error.message);
        console.timeEnd(processStatsTimeLabel); // 确保在错误情况下也结束计时
        // 出错时设置默认值
        machines.forEach(machine => {
          machine.productionData = {
            processed: 0,
            defects: 0,
            planned: currentWorkOrder.planQuantity || 0
          };
          machine.processStatus = 'STOPPED';
        });
      }
      
      // 处理批次数据的函数
      function processBatch(batchDocs, statistics) {
        batchDocs.forEach(flow => {
          if (!flow.processNodes || !Array.isArray(flow.processNodes)) return;
          
          flow.processNodes.forEach(node => {
            if (node.nodeType !== 'PROCESS_STEP' || !node.processStepId) return;
            
            const processId = node.processStepId.toString();
            const status = node.status;
            
            if (!statistics[processId]) {
              statistics[processId] = {
                completed: 0,
                abnormal: 0,
                total: 0
              };
            }
            
            if (status === 'COMPLETED') {
              statistics[processId].completed++;
            } else if (status === 'ABNORMAL') {
              statistics[processId].abnormal++;
            }
            
            statistics[processId].total++;
          });
        });
      }
      
      workOrderProgress = {
        totalCompleted: statsMap['COMPLETED'] || 0,
        totalAbnormal: statsMap['ABNORMAL'] || 0,
        totalPending: currentWorkOrder.planQuantity - (statsMap['COMPLETED'] || 0) - (statsMap['ABNORMAL'] || 0) - (statsMap['PROCESSING'] || 0)
      };
    } else {
      // 如果没有当前工单，设置默认值
      machines.forEach(machine => {
        machine.productionData = {
          processed: 0,
          defects: 0,
          planned: 0
        };
        machine.processStatus = 'STOPPED';
      });
    }
    
    console.time('构建响应数据');
    const responseData = {
      success: true,
      data: {
        productionLine,
        currentWorkOrder,
        machines: machines.map(m => ({
          _id: m._id,
          machineName: m.machineName,
          machineCode: m.machineCode,
          machineType: m.machineType,
          machineIp: m.machineIp,
          status: m.status,
          processStepId: m.processStepId,
          processStep: m.processStepId ? processStepMap[m.processStepId.toString()] : null,
          materialId: m.materialId,
          processStatus: m.processStatus,
          principal: m.principal,
          factoryName: m.factoryName,
          upperLimit: m.upperLimit,
          lowerLimit: m.lowerLimit,
          comment: m.comment,
          productionData: m.productionData
        })),
        workOrderProgress,
        workOrderHourlyOutput
      }
    };
    console.timeEnd('构建响应数据');
    
    console.log('响应数据大小(字节):', JSON.stringify(responseData).length);
    console.timeEnd('dashboard-total-time');
    res.json(responseData);
  } catch (error) {
    console.error('获取大屏数据失败:', error);
    // 打印更详细的错误信息
    console.error('错误堆栈:', error.stack);
    console.timeEnd('dashboard-total-time');
    res.status(500).json({
      success: false,
      message: '获取大屏数据失败: ' + error.message
    });
  }
});

module.exports = router;