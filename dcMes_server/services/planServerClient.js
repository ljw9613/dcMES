/**
 * 工单处理服务客户端
 * 用于调用独立的工单处理服务API
 */

const request = require('request');

// 工单处理服务配置
const PLAN_SERVER_CONFIG = {
  host: process.env.PLAN_SERVER_HOST || 'localhost',
  port: process.env.PLAN_SERVER_PORT || 3001,
  timeout: 30000 // 请求超时30秒
};

// 获取基础URL
const getBaseUrl = () => {
  return `http://${PLAN_SERVER_CONFIG.host}:${PLAN_SERVER_CONFIG.port}`;
};

/**
 * 工单处理服务客户端类
 */
class PlanServerClient {
  /**
   * 更新工单数量
   * @param {string} workOrderId - 工单ID
   * @param {string} type - 更新类型 ('input' | 'output')
   * @param {number} quantity - 更新数量
   * @param {Object} logContext - 日志上下文信息
   */
  static async updateWorkOrderQuantity(workOrderId, type, quantity = 1, logContext = {}) {
    return new Promise((resolve, reject) => {
      const url = `${getBaseUrl()}/api/workorder/update-quantity`;
      
      const options = {
        url,
        method: 'POST',
        json: true,
        body: {
          workOrderId,
          type,
          quantity,
          logContext
        },
        timeout: PLAN_SERVER_CONFIG.timeout
      };

      console.log(`🔗 调用工单处理服务: ${url}`, {
        workOrderId,
        type,
        quantity
      });

      request(options, (error, response, body) => {
        if (error) {
          console.error('❌ 调用工单处理服务失败:', error.message);
          
          // 如果是网络错误，返回降级处理标识
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.warn('⚠️ 工单处理服务不可用，建议检查服务状态');
            return resolve({
              success: false,
              error: '工单处理服务不可用',
              code: 'SERVICE_UNAVAILABLE',
              fallback: true // 标识可以降级处理
            });
          }
          
          return reject(error);
        }

        if (response.statusCode !== 200) {
          console.error(`❌ 工单处理服务返回错误状态: ${response.statusCode}`);
          return resolve({
            success: false,
            error: body?.message || '服务调用失败',
            code: body?.code || 'SERVICE_ERROR',
            statusCode: response.statusCode
          });
        }

        console.log(`✅ 工单处理服务响应:`, {
          success: body.success,
          jobId: body.data?.jobId,
          queueLength: body.data?.queueLength
        });

        resolve(body.data || body);
      });
    });
  }

  /**
   * 批量更新工单数量
   * @param {Array} updates - 更新数组
   */
  static async batchUpdateWorkOrderQuantity(updates) {
    return new Promise((resolve, reject) => {
      const url = `${getBaseUrl()}/api/workorder/batch-update-quantity`;
      
      const options = {
        url,
        method: 'POST',
        json: true,
        body: { updates },
        timeout: PLAN_SERVER_CONFIG.timeout
      };

      console.log(`🔗 批量调用工单处理服务: ${url}`, {
        count: updates.length
      });

      request(options, (error, response, body) => {
        if (error) {
          console.error('❌ 批量调用工单处理服务失败:', error.message);
          
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return resolve({
              success: false,
              error: '工单处理服务不可用',
              code: 'SERVICE_UNAVAILABLE',
              fallback: true
            });
          }
          
          return reject(error);
        }

        if (response.statusCode !== 200) {
          console.error(`❌ 工单处理服务返回错误状态: ${response.statusCode}`);
          return resolve({
            success: false,
            error: body?.message || '服务调用失败',
            code: body?.code || 'SERVICE_ERROR',
            statusCode: response.statusCode
          });
        }

        resolve(body.data || body);
      });
    });
  }

  /**
   * 获取工单详情
   * @param {string} workOrderId - 工单ID
   */
  static async getWorkOrderDetail(workOrderId) {
    return new Promise((resolve, reject) => {
      const url = `${getBaseUrl()}/api/workorder/detail/${workOrderId}`;
      
      const options = {
        url,
        method: 'GET',
        json: true,
        timeout: PLAN_SERVER_CONFIG.timeout
      };

      request(options, (error, response, body) => {
        if (error) {
          return reject(error);
        }

        if (response.statusCode !== 200) {
          return resolve({
            success: false,
            error: body?.message || '获取工单详情失败'
          });
        }

        resolve(body.data || body);
      });
    });
  }

  /**
   * 获取队列统计信息
   */
  static async getQueueStats() {
    return new Promise((resolve, reject) => {
      const url = `${getBaseUrl()}/api/workorder/queue/stats`;
      
      const options = {
        url,
        method: 'GET',
        json: true,
        timeout: 10000
      };

      request(options, (error, response, body) => {
        if (error) {
          return resolve({
            success: false,
            error: error.message
          });
        }

        if (response.statusCode !== 200) {
          return resolve({
            success: false,
            error: body?.message || '获取队列统计失败'
          });
        }

        resolve(body.data || body);
      });
    });
  }

  /**
   * 健康检查
   */
  static async healthCheck() {
    return new Promise((resolve) => {
      const url = `${getBaseUrl()}/health`;
      
      const options = {
        url,
        method: 'GET',
        json: true,
        timeout: 5000
      };

      request(options, (error, response, body) => {
        if (error) {
          return resolve({
            healthy: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }

        if (response.statusCode !== 200) {
          return resolve({
            healthy: false,
            statusCode: response.statusCode,
            timestamp: new Date().toISOString()
          });
        }

        resolve({
          healthy: true,
          ...body,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 检查服务是否可用
   */
  static async isServiceAvailable() {
    const health = await this.healthCheck();
    return health.healthy === true;
  }

  /**
   * 获取服务配置信息
   */
  static getConfig() {
    return {
      ...PLAN_SERVER_CONFIG,
      baseUrl: getBaseUrl()
    };
  }
}

module.exports = PlanServerClient;










