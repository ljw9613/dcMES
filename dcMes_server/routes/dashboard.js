const express = require('express');
const router = express.Router();
const ProductionLine = require('../model/project/productionLine');
const ProductionPlanWorkOrder = require('../model/project/productionPlanWorkOrder');
const Machine = require('../model/project/machine');
const MaterialProcessFlow = require('../model/project/materialProcessFlow');
const ProcessStep = require('../model/project/processStep');
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
    }).sort({ machineOrder: 1 });
    
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
        processCode: step.processCode
      };
    });
    
    // 如果有当前工单，获取工单关联的工艺流程数据
    let workOrderProgress = null;
    if (currentWorkOrder) {
      // 获取当日该工单的生产进度
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const materialFlows = await MaterialProcessFlow.find({
        productionPlanWorkOrderId: currentWorkOrder._id,
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
        workOrderProgress
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