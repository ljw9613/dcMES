/*
 * @Autor Wei
 * @Date 2020-03-07 13:25:20
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-08-13 12:39:16
 */
import Vue from "vue";

import "normalize.css/normalize.css"; // A modern alternative to CSS resets 一个现代的替代CSS重置
import ElementUI from "element-ui";
// import dataV from "@jiaminghi/data-view";
import "element-ui/lib/theme-chalk/index.css";
// import locale from 'element-ui/lib/locale/lang/en' // lang i18n
import "@/styles/element-variables.scss";
import "@/styles/index.scss"; // global css
import "babel-polyfill";
import App from "./App";
import store from "./store";
import router from "./router";
import moment from "moment";
import VideoPlayer from "vue-video-player";
import "vue-video-player/src/custom-theme.css";
import "video.js/dist/video-js.css";

import "@/icons"; // icon
import "@/permission"; // permission control 权限控制
import * as filters from "./filters";
import plugins from "@/plugins"; // global filters
// 字典标签组件
import DictTag from '@/components/DictTag'
// 分页组件
import Pagination from "@/components/Pagination";
import DictData from '@/components/DictData'
import ZrFile from '@/components/ZrFile/index.vue'
import ZrSelect from '@/components/ZrSelect'
import ZrUpload from '@/components/ZrUpload/index.vue'
import {adjustDataFormat} from '@/utils/filters'
//自定义组件
import BaseTable from "@/components/BaseTable";
import {resetForm, parseTime} from "@/utils/tool"; // global filters

import { requestK3Data } from "@/api/K3Data";

// import HiPrint from 'vue-plugin-hiprint'
import "sv-print/dist/style.css";

import Dict from '@/utils/dict'  // 引入字典工具
import { getData } from '@/api/data' // 假设这是获取字典数据的API

// Vue.use(HiPrint)


// 将自动注册所有组件为全局组件


/**
 *你想要使用MockJs的模拟api
 *您可以执行:mockXHR()
 *目前MockJs将在生产环境中使用，
 *请在上线前删除!!!
 */
// if (process.env.NODE_ENV === "production") {
//   const {mockXHR} = require("../mock");
//   mockXHR();
// }

// set ElementUI lang to EN
// Vue.use(ElementUI, { locale })
// 如果想要中文版 element-ui，按如下方式声明
Vue.use(ElementUI);
Vue.use(plugins);
Vue.use(VideoPlayer);


Vue.prototype.resetForm = resetForm
Vue.prototype.parseTime = parseTime
Vue.prototype.$adjustDataFormat = adjustDataFormat
Vue.prototype.$requestK3Data = requestK3Data;


Vue.component('Pagination', Pagination)
Vue.component("BaseTable", BaseTable);
Vue.component('DictTag', DictTag)
Vue.component('ZrFile', ZrFile)
Vue.component('ZrSelect', ZrSelect)
Vue.component('ZrUpload', ZrUpload)

//全局时间过滤器
Vue.filter("dateFormat", function (value, format = "YYYY-MM-DD HH:mm:ss") {
  return moment(value).format(format);
});
Vue.config.productionTip = false;

// register global utility filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key]);
});

// 注册全局过滤器

// 配置字典选项
Vue.use(Dict, {
  metas: {
    '*': {
      request: (dictMeta) => {
        return getData('dictData', { query: { dictType: dictMeta.type } }).then(res => {
          // 处理返回的数据格式，将raw中的数据提取出来
          return res.data.map(item => ({
            label: item.dictLabel,
            value: item.dictValue,
            // 可以根据需要添加其他字段
            sort: item.dictSort,
            status: item.status
          }))
        })
      }
    }
  }
})

// 添加权限检查工具
import permission from '@/utils/permission'
// 添加全局指令
import directives from '@/directives'

// 权限方法挂载
Vue.prototype.$checkPermission = permission.checkPermission
// 注册全局指令
Vue.use(directives)

new Vue({
  el: "#app", router, store, render: h => h(App)
});
