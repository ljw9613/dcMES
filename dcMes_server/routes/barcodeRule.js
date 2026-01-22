/**
 * 条码规则缓存管理API接口
 * 提供条码规则缓存清理功能
 */

const express = require('express');
const router = express.Router();
const MaterialProcessFlowService = require('../services/materialProcessFlowService');

/**
 * 清除条码规则缓存
 * GET /clearBarcodeRuleCache
 * 
 * Query参数：
 * - materialId: string | string[] - 物料ID（可选，不传则清除所有）
 * 
 * 使用场景：
 * 1. 创建/更新/删除条码规则后
 * 2. 创建/删除产品条码规则关联后
 * 3. 启用/禁用条码规则后
 */
router.get('/api/v1/clearBarcodeRuleCache', async (req, res) => {
  try {
    const { materialId } = req.query;
    
    // 如果传入的是字符串数组（逗号分隔），转换为数组
    let materialIds = null;
    if (materialId) {
      if (typeof materialId === 'string' && materialId.includes(',')) {
        materialIds = materialId.split(',').filter(id => id.trim());
      } else if (Array.isArray(materialId)) {
        materialIds = materialId;
      } else {
        materialIds = materialId;
      }
    }
    
    // 调用服务清除缓存
    const result = await MaterialProcessFlowService.clearBarcodeRuleCache(materialIds);
    
    res.json({
      success: result.success,
      message: result.message,
      type: result.type,
      count: result.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('清除条码规则缓存失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取条码规则缓存统计信息
 * GET /api/barcode-rule-cache/stats
 */
router.get('/api/barcode-rule-cache/stats', async (req, res) => {
  try {
    const stats = await MaterialProcessFlowService.getBarcodeRuleCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Redis 连接健康检查
 * GET /api/barcode-rule-cache/health
 * 
 * 返回：
 * - connected: Redis 连接状态
 * - config: Redis 配置信息
 * - testResult: 读写测试结果
 */
router.get('/api/barcode-rule-cache/health', async (req, res) => {
  try {
    const health = await MaterialProcessFlowService.checkBarcodeRuleCacheHealth();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

