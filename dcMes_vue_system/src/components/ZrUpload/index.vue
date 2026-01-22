<template>
    <div class="file-upload">
      <el-upload
        class="uploader"
        :action="uploadUrl"
        :data="uploadData"
        :multiple="multiple"
        :show-file-list="showFileList"
        :file-list="fileList"
        :accept="acceptTypes"
        :limit="limit"
        :disabled="disabled"
        :before-upload="handleBeforeUpload"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-exceed="handleExceed"
        :on-remove="handleRemove"
      >
        <!-- 上传按钮/区域 -->
        <div v-if="uploadType === 'button'">
          <el-button size="small" type="primary" :disabled="disabled">
            <i class="el-icon-upload"></i> {{ buttonText }}
          </el-button>
        </div>
        <div v-else-if="uploadType === 'image'" class="image-uploader">
          <img v-if="imageUrl" :src="imageUrl" class="image">
          <i v-else class="el-icon-plus image-uploader-icon"></i>
        </div>
        <div v-else class="drop-area">
          <i class="el-icon-upload"></i>
          <div class="drop-text">将文件拖到此处，或<em>点击上传</em></div>
        </div>
  
        <!-- 提示文本 -->
        <div class="tip-text" v-if="tip">{{ tip }}</div>
      </el-upload>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FileUpload',
    props: {
      // 上传地址
      uploadUrl: {
        type: String,
        default: '/api/v1/uploadMesFile'
      },
      // 业务类型
      businessType: {
        type: String,
        default: 'common'
      },
      // 业务分类
      category: {
        type: String,
        default: ''
      },
      // 关联业务ID
      businessId: {
        type: String,
        default: ''
      },
      // 是否多文件上传
      multiple: {
        type: Boolean,
        default: false
      },
      // 上传数量限制
      limit: {
        type: Number,
        default: 1
      },
      // 是否显示文件列表
      showFileList: {
        type: Boolean,
        default: true
      },
      // 接受的文件类型
      fileTypes: {
        type: Array,
        default: () => []
      },
      // 文件大小限制(MB)
      maxSize: {
        type: Number,
        default: 10
      },
      // 上传按钮文字
      buttonText: {
        type: String,
        default: '点击上传'
      },
      // 提示文本
      tip: {
        type: String,
        default: ''
      },
      // 上传类型：button/image/drag
      uploadType: {
        type: String,
        default: 'button'
      },
      // 是否禁用
      disabled: {
        type: Boolean,
        default: false
      },
      // 初始文件列表
      value: {
        type: [String, Array],
        default: ''
      }
    },
  
    data() {
      return {
        fileList: [],
        imageUrl: '',
        uploadData: {
          businessType: this.businessType,
          category: this.category,
          businessId: this.businessId,
          userId: this.$store.state.user.id
        }
      }
    },
  
    computed: {
      // 计算接受的文件类型字符串
      acceptTypes() {
        if (!this.fileTypes.length) return ''
        return this.fileTypes.map(type => {
          if (type.startsWith('.')) return type
          return '.' + type
        }).join(',')
      }
    },
  
    watch: {
      value: {
        immediate: true,
        handler(val) {
          if (!val) {
            this.fileList = []
            this.imageUrl = ''
            return
          }
          
          if (typeof val === 'string') {
            this.fileList = [{ name: '已上传文件', url: val }]
            this.imageUrl = val
          } else if (Array.isArray(val)) {
            this.fileList = val.map(url => ({ name: '已上传文件', url }))
          }
        }
      }
    },
  
    methods: {
      // 上传前验证
      handleBeforeUpload(file) {
        // 验证文件类型
        if (this.fileTypes.length) {
          const extension = file.name.split('.').pop().toLowerCase()
          if (!this.fileTypes.includes(extension)) {
            this.$message.error(`只能上传 ${this.fileTypes.join(', ')} 格式的文件！`)
            return false
          }
        }
  
        // 验证文件大小
        const isLtMaxSize = file.size / 1024 / 1024 < this.maxSize
        if (!isLtMaxSize) {
          this.$message.error(`文件大小不能超过 ${this.maxSize}MB!`)
          return false
        }
  
        return true
      },
  
      // 上传成功
      handleSuccess(response, file, fileList) {
        if (response.code === 20000) {
          this.$message.success('上传成功')
          
          if (this.uploadType === 'image') {
            this.imageUrl = response.data.url
          }
          
          // 触发v-model更新
          if (this.multiple) {
            this.$emit('input', fileList.map(file => file.url || file.response.data.url))
          } else {
            this.$emit('input', response.data.url)
          }
          
          // 触发成功事件
          this.$emit('success', response.data)
        } else {
          this.$message.error(response.message || '上传失败')
          // 从文件列表中移除
          this.fileList = fileList.filter(item => item.uid !== file.uid)
        }
      },
  
      // 上传失败
      handleError(err) {
        this.$message.error('上传失败')
        this.$emit('error', err)
      },
  
      // 超出数量限制
      handleExceed() {
        this.$message.warning(`最多只能上传 ${this.limit} 个文件`)
      },
  
      // 移除文件
      handleRemove(file) {
        this.$emit('remove', file)
        if (this.uploadType === 'image') {
          this.imageUrl = ''
        }
        
        // 更新v-model
        const fileList = this.fileList.filter(item => item.uid !== file.uid)
        if (this.multiple) {
          this.$emit('input', fileList.map(file => file.url || file.response.data.url))
        } else {
          this.$emit('input', '')
        }
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .file-upload {
    .image-uploader {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 178px;
      height: 178px;
  
      &:hover {
        border-color: #409EFF;
      }
  
      .image {
        width: 178px;
        height: 178px;
        display: block;
      }
  
      .image-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 178px;
        height: 178px;
        line-height: 178px;
        text-align: center;
      }
    }
  
    .drop-area {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      color: #606266;
      
      &:hover {
        border-color: #409EFF;
      }
  
      .el-icon-upload {
        font-size: 28px;
        margin-bottom: 10px;
      }
  
      .drop-text {
        em {
          color: #409EFF;
          font-style: normal;
        }
      }
    }
  
    .tip-text {
      font-size: 12px;
      color: #909399;
      margin-top: 5px;
    }
  }
  </style>