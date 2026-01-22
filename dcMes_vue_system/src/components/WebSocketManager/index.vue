<template>
  <div class="websocket-manager" style="display: none;">
    <!-- 这是一个无渲染组件，仅负责管理WebSocket连接 -->
  </div>
</template>

<script>
export default {
  name: 'WebSocketManager',
  props: {
    // 是否自动连接WebSocket
    autoConnect: {
      type: Boolean,
      default: true
    },
    // 自定义WebSocket地址，如果不提供则使用环境变量
    wsAddress: {
      type: String,
      default: ''
    },
    // 自定义令牌
    token: {
      type: String,
      default: 'DcMes_Server_Token'
    },
    // 最大重连次数
    maxReconnectAttempts: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {
      ws: null,
      websocketConnected: false,
      reconnectAttempts: 0,
      heartbeatTimer: null
    };
  },
  created() {
    if (this.autoConnect) {
      this.initWebSocket();
    }
  },
  beforeDestroy() {
    this.closeWebSocket();
  },
  methods: {
    initWebSocket() {
      try {
        // 关闭之前的连接
        this.closeWebSocket();

        // 创建WebSocket连接
        const wsAddress = this.wsAddress || process.env.VUE_APP_WS_ADDRESS;
        this.ws = new WebSocket(`${wsAddress}?token=${this.token}`);

        // 连接成功
        this.ws.onopen = () => {
          this.websocketConnected = true;
          this.$emit('connected', true);
          this.startHeartbeat();
          this.reconnectAttempts = 0; // 重置重连计数
        };

        // 连接关闭
        this.ws.onclose = (event) => {
          this.websocketConnected = false;
          this.$emit('connected', false);
          this.stopHeartbeat();

          console.log("WebSocket连接关闭:", event);

          // 检查是否达到最大重连次数
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(
              1000 * Math.pow(2, this.reconnectAttempts),
              10000
            ); // 指数退避，最大10秒
            
            this.$emit('reconnecting', {
              attempt: this.reconnectAttempts,
              delay: delay
            });
            
            setTimeout(() => {
              this.initWebSocket();
            }, delay);
          } else {
            this.$emit('reconnect-failed');
          }
        };

        // 连接错误
        this.ws.onerror = (error) => {
          this.websocketConnected = false;
          this.$emit('error', error);
          console.error("WebSocket连接错误:", error);
        };

        // 接收消息
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.$emit('message', data);
          } catch (error) {
            console.error("消息解析错误:", error);
            this.$emit('message-error', error);
          }
        };
      } catch (error) {
        console.error("WebSocket初始化失败:", error);
        this.$emit('init-error', error);
      }
    },

    // 关闭WebSocket连接
    closeWebSocket() {
      this.stopHeartbeat();
      if (this.ws) {
        // 移除所有事件监听器，防止内存泄漏
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        
        // 如果连接仍然开放，则关闭它
        if (this.ws.readyState === WebSocket.OPEN || 
            this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
        this.ws = null;
      }
      this.websocketConnected = false;
    },

    // 发送消息
    sendMessage(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
        return true;
      }
      return false;
    },

    // 开始心跳检测
    startHeartbeat() {
      this.stopHeartbeat(); // 先停止现有的心跳，避免多个定时器
      this.heartbeatTimer = setInterval(() => {
        this.sendMessage(JSON.stringify({ type: "heartbeat" }));
      }, 10000); // 每10秒发送一次心跳
    },

    // 停止心跳检测
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },

    // 手动重连
    reconnect() {
      this.reconnectAttempts = 0;
      this.initWebSocket();
    },

    // 获取连接状态
    getConnectionState() {
      return {
        connected: this.websocketConnected,
        readyState: this.ws ? this.ws.readyState : -1,
        reconnectAttempts: this.reconnectAttempts
      };
    }
  }
};
</script> 