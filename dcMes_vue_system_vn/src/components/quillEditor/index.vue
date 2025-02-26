<template>
  <div class="editorbox">
    <!-- 为两个图片上传分别定义了类名，以做调用时的区分。 -->
    <!-- 上传图片 -->
    <el-upload
      :on-success="handleSuccess"
      :before-upload="handleBeforeUpload"
      :action="api.imgManage"
      :headers="headers"
      class="uploadImage"
    ></el-upload>
    <!-- 富文本 -->
    <quill-editor
      v-model="content"
      :options="editorOption"
      ref="QuillEditor"
      @change="onEditorChange($event)"
      style="height:400px;width:1200px;margin: 0 auto"
    ></quill-editor>
    <!-- <el-button @click="removeImg">删除</el-button> -->
  </div>
</template>

<script>
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import { quillEditor } from "vue-quill-editor";
import { rich_text_img, rich_text_img_prefix } from "../../utils/global";
import Quills from "quill";
// import axios from "axios";
//调节图片大小
import ImageResize from "quill-image-resize-module"; //添加
Quills.register("modules/imageResize", ImageResize); //添加

// 工具栏配置
const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], //加粗，斜体，下划线，删除线
  ["blockquote", "code-block"], //引用，代码块

  [{ header: 1 }, { header: 2 }], // 标题，键值对的形式；1、2表示字体大小
  [{ list: "ordered" }, { list: "bullet" }], //列表
  [{ script: "sub" }, { script: "super" }], // 上下标
  [{ indent: "-1" }, { indent: "+1" }], // 缩进
  [{ direction: "rtl" }], // 文本方向

  [{ size: ["small", false, "large", "huge"] }], // 字体大小
  [{ header: [1, 2, 3, 4, 5, 6, false] }], //几级标题

  [{ color: [] }],
  [{ background: [] }], // 字体颜色，字体背景颜色
  [{ font: [] }], //字体
  [{ align: [] }], //对齐方式
  ["link", "image"], //上传图片、上传视频
  ["clean"] //清除字体样式
];

// 给菜单栏添加中文标题title
const titleConfig = {
  "ql-bold": "加粗",
  "ql-color": "颜色",
  "ql-font": "字体",
  "ql-code": "插入代码",
  "ql-italic": "斜体",
  "ql-link": "添加链接",
  "ql-background": "背景颜色",
  "ql-size": "字体大小",
  "ql-strike": "删除线",
  "ql-script": "上标/下标",
  "ql-underline": "下划线",
  "ql-blockquote": "引用",
  "ql-header": "标题",
  "ql-indent": "缩进",
  "ql-list": "列表",
  "ql-align": "文本对齐",
  "ql-direction": "文本方向",
  "ql-code-block": "代码块",
  "ql-formula": "公式",
  "ql-image": "图片",
  "ql-video": "视频",
  "ql-clean": "清除字体样式"
};

// 回车光标不显示
const bindings = {
  custom: {
    key: 13,
    handler: function(range) {
      this.quill.insertText(range.index, "\n ");
      setTimeout(() => {
        let nowRange = this.quill.getSelection().index - 1;
        this.quill.setSelection(nowRange);
      }, 0);
    }
  }
};

//获取富文本所有图片的id和被删除图片id
const getRemovImgId = (ids, html, api) => {
  let dom = document.createElement("DIV");
  dom.innerHTML = html;
  const imgDom = dom.getElementsByTagName("img");
  // const url = window.location.host;
  const arr = [];
  console.log("api,api", api);
  let hearderurl = api.img_prefix;
  for (let i = 0; i < imgDom.length; i++) {
    let name = imgDom[i].src.replace(hearderurl, "");
    ids.splice(ids.indexOf(name), 1);
    arr.push(name);
  }
  return {
    removeIds: ids,
    imgIds: arr
  };
};

export default {
  props: {
    //富文本内容
    oldcontent: {
      type: String,
      default: ""
    },
    //被删除图片id
    oldremoveIds: {
      type: Array,
      default: function() {
        return [];
      }
    }
  },
  data() {
    return {
      headers: { authorization: "Bearer " + this.$store.getters.token },
      //富文本内容
      content: "",
      //富文本配置
      editorOption: {
        modules: {
          keyboard: {
            bindings: bindings
          },
          //调节图片大小
          imageResize: {
            //添加
            displayStyles: {
              //添加
              backgroundColor: "black",
              border: "none",
              color: "white"
            },
            modules: ["Resize", "DisplaySize", "Toolbar"] //添加
          },
          toolbar: {
            container: toolbarOptions, // 工具栏
            handlers: {
              // 修改工具栏配置，当点击富文本时，调用相应的上传组件
              image: value => {
                if (value) {
                  document.querySelector(".uploadImage input").click();
                } else {
                  this.quill.format("image", false);
                }
              }
            }
          }
        },
        placeholder: "请输入正文"
      },
      api: {
        imgManage: rich_text_img,
        img_prefix: rich_text_img_prefix
      },
      imgIds: [], //所有图片id
      removeIds: [] //被删除图片id
    };
  },
  components: {
    quillEditor
  },
  watch: {
    oldcontent() {
      this.content = this.oldcontent;
    },
    oldremoveIds() {
      this.removeIds = this.oldremoveIds;
      console.log("初始化this.removeIds", this.removeIds);
    }
  },
  mounted() {
    // 给菜单栏添加中文标题title
    this.addQuillTitle();
    // this.content = this.oldcontent;
    // this.removeIds = this.oldremoveIds;
  },
  methods: {
    // 图片上传成功回调
    handleSuccess(res) {
      // 获取富文本组件实例
      let quill = this.$refs.QuillEditor.quill;
      // 如果上传成功
      if (res) {
        // 获取光标所在位置
        let length = quill.getSelection().index;
        // 插入图片，res为服务器返回的图片链接地址
        quill.insertEmbed(length, "image", res.url);
        // 调整光标到最后
        quill.setSelection(length + 1);
        this.$emit("uploadImageChange");
      } else {
        // 提示信息，需引入Message
        this.$message.error("图片插入失败");
      }
    },
    onEditorChange({ html }) {
      console.log("editor change!", this.removeIds);
      const ids = getRemovImgId(this.imgIds, html, this.api);
      this.imgIds = ids.imgIds;
      this.removeIds = [...this.removeIds, ...ids.removeIds];
      // console.log("所有图片：", this.imgIds);
      // console.log("删除", this.removeIds);
      // console.log("富文本", this.content);
      for (let i = 0; i < this.imgIds.length; i++) {
        let name = this.imgIds[i];
        if (this.removeIds.indexOf(name) > -1) {
          this.removeIds.splice(this.removeIds.indexOf(name), 1);
        }
      }
      let changeDate = {
        html,
        removeIds: this.removeIds
      };
      this.$emit("EditorChange", changeDate);
    },
    // 给菜单栏添加中文标题title
    addQuillTitle() {
      const oToolBar = document.querySelector(".ql-toolbar"),
        aButton = oToolBar.querySelectorAll("button"),
        aSelect = oToolBar.querySelectorAll("select");
      aButton.forEach(function(item) {
        if (item.className === "ql-script") {
          item.value === "sub" ? (item.title = "下标") : (item.title = "上标");
        } else if (item.className === "ql-indent") {
          item.value === "+1"
            ? (item.title = "向右缩进")
            : (item.title = "向左缩进");
        } else {
          item.title = titleConfig[item.classList[0]];
        }
      });
      aSelect.forEach(function(item) {
        item.parentNode.title = titleConfig[item.classList[0]];
      });
    },
    // 删除图片
    // removeImg() {
    //   if (this.removeIds.length == 0) return;
    //   axios
    //     .post("http://127.0.0.1:4433/api/v1/delectImg", {
    //       deleImgArr: this.removeIds
    //     })
    //     .then(function(response) {
    //       console.log(response);
    //     })
    //     .catch(function(error) {
    //       console.log(error);
    //     });
    // },
    handleBeforeUpload() {},
    handleFileBeforeUpload() {}
  }
};
</script>

<style>
.editorbox {
  width: 100%;
  margin: 0 auto;
}

/* 隐藏上传组件 */
.uploadImage {
  width: 0;
  height: 0;
  display: none;
}.editor {
    min-height: 500px;
    margin-top: 40px;
  }
</style>
