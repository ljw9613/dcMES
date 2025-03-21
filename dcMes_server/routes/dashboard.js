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
  try {
    console.log(req.query, "req.query");
    const lineId = req.query.lineId;
    
    // 查询产线信息
    const productionLine = await ProductionLine.findById(lineId);
    if (!productionLine) {
      return res.status(200).json({
        code: 400,
        success: false,
        message: '产线不存在'
      });
    }
    
    // 查询产线当前工单
    const currentWorkOrder = await ProductionPlanWorkOrder.findOne({
      productionLineId: lineId,
      status: 'IN_PROGRESS'
    }).sort({ createAt: -1 });
    
    // 查询产线设备列表
    const machines = await Machine.find({
      lineId: lineId
    });
    
    // 获取工序信息
    const processStepIds = [...new Set(machines.map(m => m.processStepId).filter(id => id))];
    const processSteps = await ProcessStep.find({
      _id: { $in: processStepIds }
    });
    
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
      // 获取当前工单对应的工艺路线信息
      const craft = await craft.findOne({
        materialId: currentWorkOrder.materialId
      });

      const processFlow = await ProcessStep.find({
        craftId: craft._id 
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
    }
    
    // 如果有当前工单，获取工单关联的工艺流程数据
    let workOrderProgress = null;
    // 在 if 语句外部声明这些变量，确保它们始终存在
    const processHourlyOutput = {};
    const workOrderHourlyOutput = {};

    if (currentWorkOrder) {
      // 获取当日该工单的生产进度
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const materialFlows = await MaterialProcessFlow.find({
        productionPlanWorkOrderId: currentWorkOrder._id,
      });
      
      // 获取当天的所有材料流程
      const todayMaterialFlows = await MaterialProcessFlow.find({
        productionPlanWorkOrderId: currentWorkOrder._id,
        updatedAt: { $gte: today }
      });

      // 初始化24小时的数据结构
      for (let hour = 0; hour < 24; hour++) {
        workOrderHourlyOutput[hour] = 0;
        
        processStepIds.forEach(processId => {
          if (!processHourlyOutput[processId]) {
            processHourlyOutput[processId] = {};
          }
          processHourlyOutput[processId][hour] = 0;
        });
      }

      // 统计每小时产能
      todayMaterialFlows.forEach(flow => {
        // 获取最后更新时间的小时
        const updateHour = new Date(flow.updatedAt).getHours();
        
        // 如果是已完成状态，计入工单总体小时产能
        if (flow.status === 'COMPLETED') {
          workOrderHourlyOutput[updateHour]++;
        }
        
        // 计算各工序小时产能
        flow.processNodes.forEach(node => {
          if (node.nodeType === 'PROCESS_STEP' && node.processStepId && node.status === 'COMPLETED') {
            const processId = node.processStepId.toString();
            const completeTime = node.completedTime ? new Date(node.completedTime) : null;
            
            // 如果有完成时间且是今天的数据，将其计入对应小时的产能
            if (completeTime && completeTime >= today) {
              const hour = completeTime.getHours();
              if (!processHourlyOutput[processId]) {
                processHourlyOutput[processId] = {};
              }
              if (!processHourlyOutput[processId][hour]) {
                processHourlyOutput[processId][hour] = 0;
              }
              processHourlyOutput[processId][hour]++;
            }
          }
        });
      });
      
      // 统计各工序的生产数量
      const processStatistics = {};
      materialFlows.forEach(flow => {
        // 遍历工艺流程中的节点
        flow.processNodes.forEach(node => {
          if (node.nodeType === 'PROCESS_STEP' && node.processStepId) {
            const processId = node.processStepId.toString();
            if (!processStatistics[processId]) {
              processStatistics[processId] = {
                completed: 0,
                abnormal: 0,
                total: 0
              };
            }
            
            processStatistics[processId].total++;
            
            if (node.status === 'COMPLETED') {
              processStatistics[processId].completed++;
            } else if (node.status === 'ABNORMAL') {
              processStatistics[processId].abnormal++;
            }
          }
        });
      });
      
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
      
      workOrderProgress = {
        totalCompleted: materialFlows.filter(f => f.status === 'COMPLETED').length,
        totalAbnormal: materialFlows.filter(f => f.status === 'ABNORMAL').length,
        totalPending: currentWorkOrder.planQuantity - materialFlows.length
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
    
    res.json({
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
        processHourlyOutput,
        workOrderHourlyOutput
      }
    });
  } catch (error) {
    console.error('获取大屏数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取大屏数据失败'
    });
  }
});

module.exports = router;