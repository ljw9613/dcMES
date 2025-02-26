<template>
    <el-dialog title="打印设置" :visible.sync="dialogVisible" width="600px" :before-close="handleClose"
        :close-on-click-modal="false" :close-on-press-escape="false">
        <div class="tsc-printer">
            <!-- 参数展示区域 -->
            <div class="param-display interface-block">
                <div class="card-header">
                    <i class="el-icon-document"></i>
                    <span>打印参数</span>
                </div>
                <div class="param-table">
                    <table>
                        <tr>
                            <th>物料编码</th>
                            <td>{{ materialCode }}</td>
                            <th>条码内容</th>
                            <td>{{ barcode }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- 现有的打印机连接选项 -->
            <div class="interface-block">
                <div class="card-header">
                    <i class="el-icon-printer"></i>
                    <span>打印机连接</span>
                </div>
                <!-- USB连接选项 -->
                <div class="connection-type">
                    <el-checkbox v-model="usbChecked" @change="handleUsbCheck">USB连接</el-checkbox>
                    <i class="el-icon-usb"></i>
                </div>
                <div class="printer-select" v-if="usbChecked">
                    <span>打印机名称：</span>
                    <el-select v-model="selectedUsbPrinter">
                        <el-option v-for="printer in usbPrinters" :key="printer.USBPath" :label="printer.USBName"
                            :value="printer.USBPath" />
                    </el-select>
                </div>
            </div>

            <!-- 网络连接选项 -->
            <div class="interface-block">
                <div class="connection-type">
                    <el-checkbox v-model="networkChecked" @change="handleNetworkCheck">网络连接</el-checkbox>
                    <i class="el-icon-connection"></i>
                </div>
                <template v-if="networkChecked">
                    <div class="network-input">
                        <span>打印机IP地址：</span>
                        <el-input v-model="printerIP" placeholder="请输入IP地址" />
                    </div>
                    <div class="network-input">
                        <span>端口号：</span>
                        <el-input v-model="printerPort" placeholder="9100" />
                    </div>
                </template>
            </div>

            <!-- 驱动连接选项 -->
            <div class="interface-block">
                <div class="connection-type">
                    <el-checkbox v-model="driverChecked" @change="handleDriverCheck">驱动连接</el-checkbox>
                </div>
                <div class="printer-select" v-if="driverChecked">
                    <span>驱动名称：</span>
                    <el-select v-model="selectedDriver">
                        <el-option v-for="driver in driverPrinters" :key="driver.DriverName" :label="driver.DriverName"
                            :value="driver.DriverName" />
                    </el-select>
                </div>
            </div>

            <!-- 打印控制按钮 -->
            <div class="print-controls">
                <el-button type="primary" @click="confirmPrint" :loading="printing">
                    {{ printing ? '打印中...' : '确认打印' }}
                </el-button>
                <el-button type="info" @click="checkPrinterStatus" :loading="checkingStatus">
                    {{ checkingStatus ? '检查中...' : '检查打印机' }}
                </el-button>
                <el-button @click="handleClose">取消</el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script>
import * as TSC from './utils/js/TSC.js'

export default {
    name: 'TscPrinter',

    props: {
        materialCode: {
            type: String,
            default: ''
        },
        barcode: {
            type: String,
            default: ''
        },
        visible: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            usbChecked: true,
            networkChecked: false,
            driverChecked: false,

            usbPrinters: [],
            selectedUsbPrinter: '',

            printerIP: '',
            printerPort: '9100',

            driverPrinters: [],
            selectedDriver: '',

            printing: false, // 打印状态
            websocket: null,
            wsUrl: 'ws://127.0.0.1:8888',
            dialogVisible: false,
            checkingStatus: false, // 添加检查状态的标志
            wsConnected: false,  // 添加WebSocket连接状态标志
            reconnectAttempts: 0,  // 重连尝试次数
            maxReconnectAttempts: 5,  // 最大重连次数
            reconnectInterval: 3000,  // 重连间隔(毫秒)
        }
    },

    watch: {
        visible: {
            handler(val) {
                this.dialogVisible = val;
            },
            immediate: true
        },
    },

    mounted() {
        this.initWebSocket()
        this.getUsbPrinterList()
        this.getDriverList()
    },

    methods: {
        initWebSocket() {
            this.websocket = new WebSocket(this.wsUrl)
            this.websocket.onopen = this.handleWsOpen
            this.websocket.onclose = this.handleWsClose
            this.websocket.onmessage = this.handleWsMessage
            this.websocket.onerror = this.handleWsError
        },

        handleWsOpen() {
            this.wsConnected = true
            this.reconnectAttempts = 0
            console.log('WebSocket连接成功')
            this.$message.success('打印服务连接成功')
        },

        handleWsClose() {
            this.wsConnected = false
            console.log('WebSocket连接关闭')
            this.reconnectWebSocket()
        },

        handleWsError(error) {
            this.wsConnected = false
            console.error('WebSocket错误:', error)
            this.$message.error('打印服务连接错误')
        },

        reconnectWebSocket() {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++
                console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
                setTimeout(() => {
                    this.initWebSocket()
                }, this.reconnectInterval)
            } else {
                console.error('WebSocket重连失败，已达到最大重试次数')
                this.$message.error('打印服务连接失败，请检查打印服务是否正常运行')
            }
        },

        handleUsbCheck(val) {
            if (val) {
                this.networkChecked = false
                this.driverChecked = false
            }
        },

        handleNetworkCheck(val) {
            if (val) {
                this.usbChecked = false
                this.driverChecked = false
            }
        },

        handleDriverCheck(val) {
            if (val) {
                this.usbChecked = false
                this.networkChecked = false
            }
        },

        getUsbPrinterList() {
            const obj = { usb_list: [] }
            this.sendWsMessage(obj)
        },

        getDriverList() {
            const obj = { driver_list: [] }
            this.sendWsMessage(obj)
        },

        handleWsMessage(event) {
            try {
                const data = JSON.parse(event.data)
                if (data.usb_list) {
                    this.usbPrinters = data.usb_list
                }
                if (data.driver_list) {
                    this.driverPrinters = data.driver_list
                }
                if (data.Function_Failed) {
                    this.$message.error(`操作失败: ${data.Function_Failed}`)
                }
                // 处理打印机状态信息
                if (data.printerstatus) {
                    if (data.printerstatus.length > 0) {
                        this.$message.info(`打印机状态:\n${data.printerstatus.join("\n")}`)
                    }
                }
                if (data.printername) {
                    this.$message.info(`打印机名称: ${data.printername}`)
                }
                if (data.printerserial) {
                    this.$message.info(`打印机序列号: ${data.printerserial}`)
                }
            } catch (e) {
                console.error('WebSocket消息解析错误:', e)
                this.$message.error('消息解析错误')
            }
        },

        async sendWsMessage(obj) {
            if (!this.wsConnected) {
                throw new Error('打印服务未连接，请检查打印服务是否启动')
            }
            
            if (this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(obj))
            } else {
                throw new Error('WebSocket连接未就绪')
            }
        },

        checkInterface() {
            if (this.usbChecked) {
                if (this.usbPrinters.length <= 0 || !this.selectedUsbPrinter) {
                    this.$message.error('请选择USB打印机')
                    return false
                }
                return true
            } else if (this.networkChecked) {
                const regexIP = /^(\d{1,3}\.){3}\d{1,3}$/
                const regexPort = /^[1-9]\d*$/

                if (!regexIP.test(this.printerIP)) {
                    this.$message.error('无效的IP地址')
                    return false
                }
                if (!regexPort.test(this.printerPort)) {
                    this.$message.error('无效的端口号')
                    return false
                }
                return true
            } else if (this.driverChecked) {
                if (this.driverPrinters.length <= 0 || !this.selectedDriver) {
                    this.$message.error('请选择打印机驱动')
                    return false
                }
                return true
            }
            this.$message.error('请选择打印机连接方式')
            return false
        },

        // 打印模板
        async printTemplate() {
            // if (!this.checkInterface()) return;
            
            try {
                this.printing = true;
                
                // 确保所有TSC函数都已正确导入
                if (typeof TSC.init !== 'function') {
                    throw new Error('TSC打印函数未正确加载');
                }

                // 使用导入的TSC函数
                TSC.init();
                
                // 根据选择的连接方式打开端口
                if (this.usbChecked) {
                    TSC.openport_usb(this.selectedUsbPrinter);
                } else if (this.networkChecked) {
                    TSC.openport_net(this.printerIP, this.printerPort);
                } else if (this.driverChecked) {
                    TSC.openport_driver(this.selectedDriver);
                }

                TSC.clearbuffer();
                TSC.setup("60", "28", "4", "8", "0", "3", "0");
                
                // 打印物料编码
                TSC.windowsfont("40", "40", "24", "0", "0", "0", "Arial", `物料：${this.materialCode}`);
                
                // 打印条码
                TSC.barcode("40", "120", "128", "100", "1", "0", "2", "2", this.barcode);
                
                TSC.printlabel("1", "1");
                TSC.closeport();

                this.$emit('print-success');
                this.$message.success('打印成功');
            } catch (error) {
                console.error('打印失败:', error);
                this.$emit('print-error', error.message || '打印失败');
                this.$message.error(`打印失败: ${error.message || '未知错误'}`);
            } finally {
                this.printing = false;
            }
        },

        // 打印测试页
        printTestPage() {
            // if (!this.checkInterface()) return;
            
            try {
                TSC.init();
                if (this.usbChecked) {
                    TSC.openport_usb(this.selectedUsbPrinter);
                } else if (this.networkChecked) {
                    TSC.openport_net(this.printerIP, this.printerPort);
                } else if (this.driverChecked) {
                    TSC.openport_driver(this.selectedDriver);
                }
                
                TSC.sendcommand("SELFTEST");
                TSC.closeport();
                
                this.$message.success('测试页打印成功');
            } catch (error) {
                this.$message.error(`测试页打印失败: ${error.message || '未知错误'}`);
            }
        },

        // 获取打印机状态
        getPrinterStatus() {
            // if (!this.checkInterface()) return;
            
            try {
                TSC.init();
                if (this.usbChecked) {
                    TSC.openport_usb(this.selectedUsbPrinter);
                } else if (this.networkChecked) {
                    TSC.openport_net(this.printerIP, this.printerPort);
                } else if (this.driverChecked) {
                    TSC.openport_driver(this.selectedDriver);
                }
                
                TSC.printerstatus();
                TSC.printername();
                TSC.printerserial();
                TSC.closeport();
            } catch (error) {
                this.$message.error(`获取打印机状态失败: ${error.message || '未知错误'}`);
            }
        },

        handleClose() {
            this.dialogVisible = false;
        },

        confirmPrint() {
            this.printTemplate().then(() => {
                this.handleClose();
            });
        },

        // 新增：供外部直接调用的打印方法
        print() {
            return this.printTemplate();
        },

        // 添加检查打印机状态的方法
        async checkPrinterStatus() {
            // if (!this.checkInterface()) return;
            
            try {
                this.checkingStatus = true;
                
                TSC.init();
                if (this.usbChecked) {
                    TSC.openport_usb(this.selectedUsbPrinter);
                } else if (this.networkChecked) {
                    TSC.openport_net(this.printerIP, this.printerPort);
                } else if (this.driverChecked) {
                    TSC.openport_driver(this.selectedDriver);
                }
                
                // 获取打印机状态
                TSC.printerstatus();
                TSC.printername();
                TSC.printerserial();
                TSC.closeport();
                
                this.$message.success('打印机连接正常');
            } catch (error) {
                console.error('检查打印机状态失败:', error);
                this.$message.error(`检查打印机状态失败: ${error.message || '未知错误'}`);
            } finally {
                this.checkingStatus = false;
            }
        },
    }
}
</script>

<style scoped>
.tsc-printer {
    padding: 0;
}

.param-display {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: 500;
}

.card-header i {
    margin-right: 8px;
    color: #409EFF;
}

.interface-block {
    border: 1px solid #dcdfe6;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 4px;
}

.connection-type {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.printer-select,
.network-input {
    margin-top: 10px;
    display: flex;
    align-items: center;
}

.print-controls {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

/* 打印状态样式 */
.el-button.is-loading {
    min-width: 90px;
}

.param-table table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #DCDFE6;
}

.param-table th,
.param-table td {
    padding: 12px;
    border: 1px solid #DCDFE6;
    text-align: left;
}

.param-table th {
    background-color: #F5F7FA;
    color: #606266;
    font-weight: normal;
    width: 90px;
}

.param-table td {
    color: #303133;
}
</style>
