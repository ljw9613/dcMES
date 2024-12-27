<template>
    <div>
        <!-- 添加模板选择 -->
        <el-select v-model="selectedTemplate" placeholder="请选择打印模板" @change="handleTemplateChange">
            <el-option 
                v-for="item in templateList" 
                :key="item.value"
                :label="item.label"
                :value="item.value">
            </el-option>
        </el-select>

        <div ref="filePath" id="printDiv">
            <div v-for="(item, index) in filePath" :key="index">
                <div :ref="'filePath' + index">
                    我的打印内容；{{ item }}
                </div>
            </div>
        </div>

        <!-- 添加打印按钮 -->
        <el-button type="primary" @click="handlePrints">打印</el-button>
    </div>
</template>

<script>
//为了静默打印  
import {
    io
} from "socket.io-client";

export default {
    data() {
        return {
            ids: [],//存储获取的id
            hiprintTemplate: '',
            filePath: [],
            socket: '',
            selectedTemplate: '', // 选中的模板
            templateList: [
                { label: '打包托盘单', value: 'template1' }
            ],
            printData: {  // 打印数据
                title: '打包托盘单',
                name: '',
                table: []
            }
        }
    },
    created() {
        //为了静默打印  //连接静默打印客户端
        this.socket = io(process.env.VUE_APP_HIPRINT_WS_ADDRESS, {
            transports: ["websocket"],
            auth: {
                token: "vue-plugin-hiprint", // 在此处填入你 client 设置的 token，缺省可留空
            }
        })
        //打印
        const hiprintTemplate_ = new this.$pluginName.PrintTemplate()
        this.hiprintTemplate = hiprintTemplate_
    },
    methods: {
        // 处理模板选择变化
        handleTemplateChange(val) {
            // 根据选择的模板初始化打印模板
            this.initTemplate(val)
        },

        // 初始化模板
        initTemplate(templateId) {
            // 这里可以根据templateId加载不同的模板配置
            const template = {
                panels: [ /* 你提供的模板数据 */ ]
            }
            this.hiprintTemplate = new this.$pluginName.PrintTemplate(template)
        },

        // 准备打印数据
        preparePrintData() {
            return {
                title: this.printData.title,
                name: this.printData.name,
                table: this.printData.table
            }
        },

        // 修改打印方法
        handlePrints() {
            if (!this.selectedTemplate) {
                this.$message.warning('请先选择打印模板')
                return
            }

            const printData = this.preparePrintData()
            // 获取打印内容
            const html = this.hiprintTemplate.getHtml(printData)
            // 发送到打印服务
            this.socket.emit("news", { 
                html, 
                pageSize: 'A4', 
                printBackground: false 
            });
        },
    }
}
</script>
