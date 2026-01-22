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
            wsConnected: false,  // 保留WebSocket连接状态标志
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

    async mounted() {
        try {
            await this.initWebSocket()
            setTimeout(() => {
                this.getUsbPrinterList()
                this.getDriverList()
            }, 1000)
        } catch (error) {
            console.error('打印服务连接失败:', error)
            this.$message.error('打印服务连接失败，请确保TSC打印服务已启动')
        }
    },

    methods: {
        async initWebSocket() {
            try {
                this.websocket = new WebSocket(process.env.VUE_APP_TSC_WS_ADDRESS)
                this.websocket.onopen = this.handleWsOpen
                this.websocket.onclose = this.handleWsClose
                this.websocket.onmessage = this.handleWsMessage
                this.websocket.onerror = this.handleWsError
            } catch (error) {
                console.error('WebSocket连接失败:', error)
                this.$message.error('打印服务连接失败，请确保TSC打印服务已启动')
            }
        },

        handleWsOpen() {
            this.wsConnected = true
            this.reconnectAttempts = 0
            console.log('WebSocket连接成功')
            this.$message.success('打印服务连接成功')
        },

        handleWsClose(event) {
            this.wsConnected = false
            let reason = this.getCloseReason(event.code)
            console.error(`WebSocket连接关闭: ${reason}`)
            this.$message.error(`打印服务连接断开: ${reason}`)
        },

        getCloseReason(code) {
            const reasons = {
                1001: "服务器关闭或浏览器离开页面",
                1002: "协议错误",
                1003: "接收到不支持的数据类型",
                1004: "保留状态码",
                1005: "没有收到状态码",
                1006: "连接异常关闭",
                1007: "接收到非UTF-8数据",
                1008: "违反策略",
                1009: "接收到过大的消息",
                1010: "客户端需要的扩展未协商",
                1011: "服务器遇到意外情况",
                1015: "TLS握手失败"
            }
            return reasons[code] || "未知原因"
        },

        handleWsMessage(event) {
            console.log('收到服务器消息:', event.data)
            try {
                if (event.data === 'Finished') {
                    this.$message.success('成功收到打印服务消息')
                    return
                }
                const response = JSON.parse(event.data)
                // 处理USB打印机列表
                if (response.usb_list) {
                    if (response.usb_list.length === 0) {
                        this.$message.warning('未找到USB打印机')
                    }
                    this.usbPrinters = response.usb_list
                    if (this.usbPrinters.length > 0) {
                        this.selectedUsbPrinter = this.usbPrinters[0].USBPath
                    }
                }
                // 处理驱动打印机列表
                if (response.driver_list) {
                    if (response.driver_list.length === 0) {
                        this.$message.warning('未找到驱动打印机')
                    }
                    this.driverPrinters = response.driver_list
                    if (this.driverPrinters.length > 0) {
                    }
                }
                // 处理错误信息
                if (response.Function_Failed) {
                    this.$message.error(`操作失败: ${response.Function_Failed}`)
                }
                // 处理打印机状态信息
                if (response.printerstatus && response.printerstatus.length > 0) {
                    this.$message.info(`打印机状态:\n${response.printerstatus.join('\n')}`)
                }
                // 处理打印机名称
                if (response.printername) {
                    this.$message.info(`打印机名称: ${response.printername}`)
                }
                // 处理打印机序列号
                if (response.printerserial) {
                    this.$message.info(`打印机序列号: ${response.printerserial}`)
                }

            } catch (e) {
                console.error('消息解析错误:', e)
                this.$message.error('接收到无效数据')
            }
        },

        handleWsError(error) {
            this.wsConnected = false
            console.error('WebSocket错误:', error)
            this.$message.error('打印服务连接错误，请确保TSC打印服务已启动')
        },

        async sendWsMessage(obj) {
            console.log('sendWsMessage', obj);
            if (!this.wsConnected) {
                throw new Error('打印服务未连接，请检查打印服务是否启动')
            }

            if (this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(obj))
            } else {
                throw new Error('WebSocket连接未就绪')
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
            if (!this.checkInterface()) return;

            try {
                this.printing = true;

                // 定义打印参数常量
                const MM_TO_DOTS = 8;
                const defaultFontSize = 28;

                // 构建打印指令对象
                const printObj = {
                    functions_inorder: [
                        {
                            init: ""
                        },
                        // 根据连接方式选择打开端口
                        this.usbChecked ? {
                            openport_usb: this.selectedUsbPrinter
                        } : this.networkChecked ? {
                            openport_net: `${this.printerIP},${this.printerPort}`
                        } : {
                            openport_driver: this.selectedDriver
                        },
                        {
                            clearbuffer: ""
                        },
                        {
                            setup: "60,28,4,8,0,3,0"  // 参数用逗号连接
                        },
                        // 打印物料编码
                        {
                            windowsfont: `40,40,${defaultFontSize},0,0,0,Arial,物料：${this.materialCode}`
                        },
                        // 打印条码
                        {
                            windowsfont: `40,120,${defaultFontSize},0,0,0,Arial,条码如下：`
                        },
                        // 打印条码
                        {
                            windowsfont: `40,200,${defaultFontSize},0,0,0,Arial,${this.barcode}`
                        },
                        // 打印二维码
                        {
                            sendcommand_crlf: `QRCODE 440,24,H,8,A,0,M2,S5,"${this.barcode}"`
                        },
                        {
                            printlabel: "1,1"
                        },
                        {
                            closeport: ""
                        }
                    ]
                };

                await this.sendWsMessage(printObj);

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
        async printTestPage() {
            if (!this.checkInterface()) return;

            try {
                const testObj = {
                    functions_inorder: [
                        {
                            function: "init"
                        },
                        // 根据选择的连接方式打开端口
                        this.usbChecked ? {
                            function: "openport_usb",
                            args: [this.selectedUsbPrinter]
                        } : this.networkChecked ? {
                            function: "openport_net",
                            args: [this.printerIP, this.printerPort]
                        } : {
                            function: "openport_driver",
                            args: [this.selectedDriver]
                        },
                        {
                            function: "sendcommand",
                            args: ["SELFTEST"]
                        },
                        {
                            function: "closeport"
                        }
                    ]
                };

                await this.sendWsMessage(testObj);
                this.$message.success('测试页打印成功');
            } catch (error) {
                this.$message.error(`测试页打印失败: ${error.message || '未知错误'}`);
            }
        },

        // 获取打印机状态
        async checkPrinterStatus() {
            if (!this.checkInterface()) return;

            try {
                this.checkingStatus = true;

                const statusObj = {
                    functions_inorder: [
                        {
                            function: "init"
                        },
                        // 根据选择的连接方式打开端口
                        this.usbChecked ? {
                            function: "openport_usb",
                            args: [this.selectedUsbPrinter]
                        } : this.networkChecked ? {
                            function: "openport_net",
                            args: [this.printerIP, this.printerPort]
                        } : {
                            function: "openport_driver",
                            args: [this.selectedDriver]
                        },
                        {
                            function: "printerstatus"
                        },
                        {
                            function: "printername"
                        },
                        {
                            function: "printerserial"
                        },
                        {
                            function: "closeport"
                        }
                    ]
                };

                await this.sendWsMessage(statusObj);
                this.$message.success('打印机连接正常');
            } catch (error) {
                console.error('检查打印机状态失败:', error);
                this.$message.error(`检查打印机状态失败: ${error.message || '未知错误'}`);
            } finally {
                this.checkingStatus = false;
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
