<template>
  <div style="border: 1px solid #ccc; width: 100%">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editor"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <ZrFile :max="1" :value.sync="img"></ZrFile>
    <Editor
      style="height: 500px; width: 100%; overflow-y: hidden"
      v-model="html"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="onCreated"
      @onChange="onChange"
      @onDestroyed="onDestroyed"
      @onMaxLength="onMaxLength"
      @onFocus="onFocus"
      @onBlur="onBlur"
      @customAlert="customAlert"
      @customPaste="customPaste"
    />
  </div>
</template>
<script>
import Vue from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import ZrFile from "@/components/ZrFile/index.vue";

export default Vue.extend({
  components: { Editor, Toolbar, ZrFile },
  props: {
    value: {
      type: String,
      default: "",
    },
  },
  data() {
    let that = this;
    return {
      editor: null,
      html: this.value,
      img:"",
      // 工具栏配置
      toolbarConfig: {
        //新增菜单
        // insertKeys: {
        //   index: 32,
        //   keys: ["geshi"],
        // },
        //去掉网络上传图片和视频
        // excludeKeys: ["insertImage", "insertVideo"],
      },
      // toolbarConfig: {},
      // editorConfig: {
      //   placeholder: "请输入内容...",
      //   MENU_CONF: {
      //     uploadImage: { server: "/api/v1/upload-file" },
      //     // uploadImage: { server: "http://127.0.0.1:2222/api/v1/upload-file" },
      //   },
      // },
      editorConfig: {
        placeholder: "请输入内容...",
        // autoFocus: false,
        // 所有的菜单配置，都要在 MENU_CONF 属性下
        MENU_CONF: {
          // 图片上传
          uploadImage: {
            customBrowseAndUpload(insertFn) {
              // JS 语法
              // 自己选择文件

              // 自己上传文件，并得到视频 url poster
              // 最后插入视频
              insertFn(that.img)
            },
            //   server: "/fengyangServer/api/v1/upload-file",
            //   fieldName: "file",
            //   // 单个文件的最大体积限制，默认为 2M
            //   maxFileSize: 10 * 1024 * 1024, // 10M
            //   // 最多可上传几个文件，默认为 100
            //   maxNumberOfFiles: 10,
            //   // 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
            //   allowedFileTypes: ["image/*"],
            //   // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
            //   meta: {
            //     // token: 'xxx',
            //     // otherKey: 'yyy'
            //     // file:''
            //   },
            //   // 将 meta 拼接到 url 参数中，默认 false
            //   metaWithUrl: false,

            //   // 自定义增加 http  header
            //   headers: {
            //     // Accept: 'text/x-json',
            //     // otherKey: 'xxx'
            //   },

            //   // 跨域是否传递 cookie ，默认为 false
            //   withCredentials: true,

            //   // 超时时间，默认为 10 秒
            //   timeout: 10 * 1000, //10 秒

            //   // 上传前
            //   onBeforeUpload(files) {
            //     console.log({
            //       message: "图片正在上传中,请耐心等待",
            //       duration: 0,
            //       customClass: "uploadTip",
            //       iconClass: "el-icon-loading",
            //       showClose: true,
            //     });
            //     return files;
            //   },
            //   // 自定义插入图片
            //   customInsert(res, insertFn) {
            //     // 因为自定义插入导致onSuccess与onFailed回调函数不起作用,自己手动处理
            //     // 先关闭等待的Message
            //     // that.$message.closeAll();
            //     if (res.code === 200) {
            //       console.log({
            //         message: `${res.data.originalName} 上传成功`,
            //       });
            //     } else {
            //       console.log({
            //         message: `${res.data.originalName} 上传失败，请重新尝试`,
            //       });
            //     }
            //     insertFn(res.data.url, res.data.href, res.data.url);
            //   },

            //   // 单个文件上传成功之后
            //   onSuccess(file, res) {
            //     console.log(`${file.name} 上传成功`, res);
            //   },

            //   // 单个文件上传失败
            //   onFailed(file, res) {
            //     console.log(`${file.name} 上传失败`, res);
            //   },

            //   // 上传进度的回调函数
            //   onProgress(progress) {
            //     console.log("progress", progress);
            //     // progress 是 0-100 的数字
            //   },

            //   // 上传错误，或者触发 timeout 超时
            //   onError(file, err, res) {
            //     console.log(`${file.name} 上传出错`, err, res);
            //   },
          },
          // 视频上传
          uploadVideo: {
            fieldName: "file",
            server: "/fengyangServer/api/v1/upload-file",

            // 单个文件的最大体积限制，默认为 10M
            maxFileSize: 50 * 1024 * 1024, // 50M

            // 最多可上传几个文件，默认为 5
            maxNumberOfFiles: 3,
            // 选择文件时的类型限制，默认为 ['video/*'] 。如不想限制，则设置为 []
            allowedFileTypes: ["video/*"],

            // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
            meta: {
              // token: 'xxx',
              // otherKey: 'yyy'
            },

            // 将 meta 拼接到 url 参数中，默认 false
            metaWithUrl: false,

            // 自定义增加 http  header
            headers: {
              // Accept: 'text/x-json',
              // otherKey: 'xxx'
            },

            // 跨域是否传递 cookie ，默认为 false
            withCredentials: true,

            // 超时时间，默认为 30 秒
            timeout: 1000 * 1000, // 1000 秒,
            // 上传之前触发
            onBeforeUpload(file) {
              that.$message({
                message: "视频正在上传中,请耐心等待",
                duration: 0,
                customClass: "uploadTip",
                iconClass: "el-icon-loading",
                showClose: true,
              });
              return file;
            },
            // 自定义插入视频
            customInsert(res, insertFn) {
              // 因为自定义插入导致onSuccess与onFailed回调函数不起作用,自己手动处理
              // 先关闭等待的Message
              that.$message.closeAll();
              if (res.code === 200) {
                console.log({
                  message: `${res.data.originalName} 上传成功`,
                });
              } else {
                console.log({
                  message: `${res.data.originalName} 上传失败，请重新尝试`,
                });
              }
              insertFn(res.data.url, res.data.url);
            },
            // 上传进度的回调函数
            onProgress(progress) {
              console.log(progress);
              // onProgress(progress) {       // JS 语法
              // progress 是 0-100 的数字
            },

            // // 单个文件上传成功之后
            // onSuccess(file, res) {
            //   console.log(`${file.name} 上传成功`, res);
            //   this.successMsg(file);
            // },

            // // 单个文件上传失败
            // onFailed(file, res) {
            //   console.log(`${file.name} 上传失败`, res);
            //   this.errorMsg(file);
            // },

            // 上传错误，或者触发 timeout 超时
            onError(file, err, res) {
              console.log(`${file.name} 上传出错`, err, res);
              Notification.error({
                title: "错误",
                message: `${file.name} 上传失败，请重新尝试`,
              });
            },
          },
        },
      },
      mode: "default", // or 'simple'
    };
  },
  watch: {
    value(value) {
      console.log("Watch", value);
      this.html = value;
    },
  },
  methods: {
  
    onCreated(editor) {
      this.editor = Object.seal(editor); // 一定要用 Object.seal() ，否则会报错
    },
    onChange(editor) {
      console.log("onChange", editor.children);
      this.$emit("update:value", this.html);
    },
    onDestroyed(editor) {
      console.log("onDestroyed", editor);
    },
    onMaxLength(editor) {
      console.log("onMaxLength", editor);
    },
    onFocus(editor) {
      console.log("onFocus", editor);
    },
    onBlur(editor) {
      console.log("onBlur", editor);
    },
    customAlert(info) {
      window.alert(`customAlert in Vue demo\n${type}:\n${info}`);
    },
    customPaste(editor, event, callback) {
      console.log("ClipboardEvent 粘贴事件对象", event);
      // const html = event.clipboardData.getData('text/html') // 获取粘贴的 html
      // const text = event.clipboardData.getData('text/plain') // 获取粘贴的纯文本
      // const rtf = event.clipboardData.getData('text/rtf') // 获取 rtf 数据（如从 word wsp 复制粘贴）

      // 自定义插入内容
      //   editor.insertText("xxx");
      // 返回 false ，阻止默认粘贴行为
      //   event.preventDefault();
      //   callback(false); // 返回值（注意，vue 事件的返回值，不能用 return）
      // 返回 true ，继续默认的粘贴行为
      callback(true);
    },
  },
  mounted() {
    // 模拟 ajax 请求，异步渲染编辑器
  },
  beforeDestroy() {
    this.html = "";
    const editor = this.editor;
    if (editor == null) return;
    editor.destroy(); // 组件销毁时，及时销毁编辑器
  },
});
</script>
<style src="@wangeditor/editor/dist/css/style.css"></style>