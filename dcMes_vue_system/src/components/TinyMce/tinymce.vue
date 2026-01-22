
<template>
  <div class="myEditor">
    <div class="tinymce-editor-wrapper">
      <editor
        v-model="content"
        :disabled="disabled"
        :init="options"
        initial-value="请输入内容..."
      />
    </div>
  </div>
</template>
 
<script>
import { postuploadtimyceimg } from "@/api/rule_list";
import axios from 'axios'
// import { getDetail } from '_api/common'  //api
import tinymce from 'tinymce'
import Editor from '@tinymce/tinymce-vue'
import { tinymce_URL } from '@/utils/global';

import 'tinymce/themes/silver'
// 编辑器插件plugins
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/print'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/anchor'
 
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/fullscreen'
 
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
 
// https://www.tiny.cloud/docs/configure/editor-appearance/#toolbar
const toolbar =
  'undo redo | insert | styleselect | fontselect bold italic forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent | link image media | fullscreen'
 
// https://www.tiny.cloud/docs/configure/integration-and-setup/#plugins
const plugins = [
  'advlist autolink lists link image charmap print preview anchor',
  'searchreplace visualblocks fullscreen',
  'insertdatetime media table'
]
 
// https://www.tiny.cloud/docs/configure/editor-appearance/#fontsize_formats
const fonts =
  'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; 黑体=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; 宋体=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats'
 
export default {
  components: {
    Editor
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      content: this.value,
    tinymce_URL:tinymce_URL,
      options: {
        language_url: "/tinymce/zh_CN.js", // 语言包的路径
        language: 'zh_CN', // 语言
        skin_url: '/tinymce/skins/ui/oxide', // 浅色
        plugins: plugins, // 插件
        toolbar: toolbar, // 工具栏
        font_formats: fonts, // 字体
        height: 500, // 编辑器高度
        branding: false, // 是否禁用“Powered by TinyMCE”
        menubar: true, // 顶部菜单栏显示
        convert_urls:false,//绝对路径
        images_upload_handler: (blobInfo, success, failure) => {
          this.handleImageAdded(blobInfo, success, failure)
        }
      }
    }
  },
  watch: {
    value(val) {  //父子组建双向绑定
      this.content = val
    },
    content(val) {
      this.$emit('input', val)
    }
  },
  mounted() {
    tinymce.init({})
  },
  created() {
  },
  methods: {
  async handleImageAdded(blobInfo, success, failure) {
      let file = blobInfo.blob()
      const isLt8M = file.size / 1024 / 1024 < 20
      if (!isLt8M) {
        this.$message.error('图片大小不能超过 20MB!')
        return
      }
      let params = new FormData()
      params.append('file', file)
        params.append("datas", JSON.stringify({ _id: "this._id" }));
      console.log(params)

   await postuploadtimyceimg(params)
        .then(response => {
          // 获取地址
          if(response.code==200){
 let fileName = response.fileName;

console.log(fileName)
          var imageUrl = this.tinymce_URL + fileName;
          var fileName1 = fileName;
          console.log(imageUrl)
          console.log(fileName1)
          success(imageUrl)
            this.$message.success("上传图片成功,请提交");
          }else{
            this.$message.error("上传图片失败,请重试");

          }
          
        
        })
        .catch(err => {
          if(err){
     failure('图片上传失败，请压缩后重试')
     this.$message.error('图片上传失败，请重试')
          }else{
     failure("无法上传该图片，请压缩后再试")
     this.$message.error('图片上传失败，请重试')
          }


        });
      // let headers = {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //     Authorization: getToken()
      //   }
      // } // 添加请求头
      // axios
      //   .post('/upload/picture', params, headers)
      //   .then(({ data }) => {
      //     if (data.code == 200) {
      //       let url = 'https://m.shanxijsd.com/daojia/api/v1' + data.data.relativeFileUrl
      //       success(url)
      //     } else {
      //       failure(data.message)
      //       this.$message.error(data.message)
      //     }
      //   })
      //   .catch(e => {
      //     failure(e.message)
      //     this.$message.error(e.message)
      //   })
    },
    async info() {  //回显内容
      console.log(this.mubanId)
      // let { data } = await getDetail({
      //   templateId: this.mubanId
      // })
      // this.content = data
    }
  }
}
</script>

<style>
.tinymce-editor-wrapper {
}
.tox-silver-sink {
  z-index: 13000 !important;
}
</style>