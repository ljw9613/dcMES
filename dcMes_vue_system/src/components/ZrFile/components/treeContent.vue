<template>
  <div>
    <div class="title">
      文件展示{{ nodeTitle ? "-" + nodeTitle : "-请先选择目录" }}
    </div>
    <el-collapse v-if="nodeTitle">
      <el-collapse-item title="上传文件" name="1">
        <el-button style="margin: 0 0 10px 0" size="small" type="success" @click="submitUpload">上传到服务器</el-button>
        <el-upload v-if="showUpload" class="upload-demo" ref="upload" drag :data="{
          zrFileTreeId: nodeId,
        }" :on-preview="handlePreview" :on-remove="handleRemove" :on-success="handleSuccess"
          action="http://www.fengyang-zh.com/fengyangServer/zrupload" :auto-upload="false" multiple>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">
            只能上传jpg/png文件，且不超过500kb
          </div>
        </el-upload>
      </el-collapse-item>
    </el-collapse>
    <!-- <el-checkbox
      v-if="fileList.length > 0"
      :indeterminate="isIndeterminate"
      v-model="checkAll"
      @change="handleCheckAllChange"
      >全选</el-checkbox
    > -->
    <el-checkbox-group v-model="checkedArray" :min="min" :max="max">
      <div class="filecontent">
        <div class="btnlist">
          <el-button v-if="select" @click="enterSelect()" plain type="primary" icon="el-icon-upload">确认选择此{{
            checkedArray.length }}个文件</el-button>
          <el-button v-if="checkedArray.length > 0" @click="delSelect()" plain type="warning"
            icon="el-icon-delete">确认删除此{{ checkedArray.length }}个文件</el-button>
        </div>

        <el-divider v-if="images.length > 0">图片</el-divider>
        <div class="file" v-for="(item, index) in images" :key="index">
          <el-image style="width: 100px; height: 100px" :src="item.url" fit="cover" :preview-src-list="imgList">
          </el-image>
          <div class="file-title">
            <el-checkbox :label="item._id" :key="item._id">{{ item.name }}
            </el-checkbox>
          </div>
        </div>
        <el-divider v-if="videos.length > 0">视频</el-divider>
        <div class="file" v-for="(item, index) in videos" :key="index">
          <el-button type="primary" icon="el-icon-video-camera" @click="lookCamera(item)">播放</el-button>
          <el-checkbox :label="item._id" :key="item._id">{{ item.name }}
          </el-checkbox>
        </div>
      </div>
    </el-checkbox-group>
    <div class="filetip" v-if="fileList.length == 0">
      该目录暂无资源，请上传资源
    </div>
    <Camera ref="Camera" :CameraUrl="CameraUrl"></Camera>
  </div>
</template>

<script>
import upload from "./upload";
import Camera from "@/components/Camera";
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
  props: {
    fileList: {
      type: Array,
      default: [],
    },
    nodeTitle: {
      type: String,
      default: "",
    },
    nodeId: {
      type: String,
      default: "",
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    select: {
      type: Boolean,
      default: false,
    },
  },
  components: { upload, Camera },
  watch: {
    fileList(files) {
      // 图片、视频和其他文件的数组
      let images = [];
      let imgList = [];
      let videos = [];
      let documents = [];

      // 定义文件类型的扩展
      const imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp"];
      const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv"];

      // 对原始数组进行迭代并分类
      files.forEach((file) => {
        // 获取文件后缀名
        const extension = file.fileName.split(".").pop().toLowerCase();

        // 分类
        if (imageExtensions.includes(extension)) {
          images.push(file);
          imgList.push(file.url);
        } else if (videoExtensions.includes(extension)) {
          videos.push(file);
        } else {
          documents.push(file);
        }
      });
      this.images = images;
      this.imgList = imgList;
      this.videos = videos;
      this.documents = documents;
    },
  },
  mounted() { },
  methods: {
    lookCamera(row) {
      this.CameraUrl = row.url;
      console.log(this.CameraUrl);
      this.$refs.Camera.openDiaolog();
    },
    submitUpload() {
      this.$refs.upload.submit();
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleSuccess(response, file, fileList) {
      if (response.code == 200) {
        this.$message.success("上传成功");
        this.$emit("refresh");
        this.showUpload = false;
        this.$nextTick(() => {
          this.showUpload = true;
        });
      }
    },
    handleCheckAllChange(val) {
      this.checkedArray = val ? this.fileList : [];
      this.isIndeterminate = false;
    },
    async delSelect() {
      this.$confirm("此操作将永久删除该文件, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          await removeData("zrFile", {
            query: { _id: { $in: this.checkedArray } },
          });
          this.$message({
            type: "success",
            message: "删除成功!",
          });
          this.$emit("refresh");
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    enterSelect() {
      console.log(this.checkedArray, "checkedArray");
      let selectfile = [];
      let selectfileUrl = [];
      let selectfileId = [];
      for (const iterator of this.checkedArray) {
        let file = this.fileList.find((e) => {
          return iterator == e._id;
        });
        selectfile.push(file);
        selectfileUrl.push(file.url);
        selectfileId.push(file._id);
      }

      this.$emit("enterSelect", { selectfile, selectfileUrl, selectfileId });
    },
  },
  data() {
    return {
      dataForm: {
        businessLicense: "",
      },
      images: [],
      imgList: [],
      videos: [],
      documents: [],
      showUpload: true,

      checkedArray: [],
      CameraUrl: "",
      checkAll: false,
      isIndeterminate: false,
    };
  },
};
</script>

<style lang="scss" scoped>
.title {
  font-size: 0.8rem;
  color: #b1b1b1;
  font-weight: 550;
  margin: 10px 0;
}

.filetip {
  width: 100%;
  height: 20vh;
  line-height: 20vh;
  text-align: center;
  color: #b1b1b1;
  font-weight: 550;
}

.filecontent {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;

  .btnlist {
    margin: 10px 0 0 0;
    width: 100%;
    display: flex;
  }

  .file {
    margin: 10px;
    width: 110px;
    height: 150px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-direction: column;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
    border-radius: 10px;

    .file-title {
      width: 90%;
      height: 20px;
      line-height: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      overflow: hidden;
      /* 确保超出容器的内容被裁剪 */
      white-space: nowrap;
      /* 确保文本在一行内显示 */
      text-overflow: ellipsis;
      /* 超出部分显示省略号 */
    }
  }
}
</style>