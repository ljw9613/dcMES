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
import {adjustDataFormat} from '@/utils/filters'
//自定义组件
import BaseTable from "@/components/BaseTable";
import {resetForm, parseTime} from "@/utils/tool"; // global filters

import { requestK3Data } from "@/api/K3Data";

// import HiPrint from 'vue-plugin-hiprint'
import "sv-print/dist/style.css";


// Vue.use(HiPrint)


// 将自动注册所有组件为全局组件

DictData.install()
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


new Vue({
  el: "#app", router, store, render: h => h(App)
});
