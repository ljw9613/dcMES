<template>
     <div class="chooseIcons">
        <el-popover placement="top-start" :append-to-body="false" width="30vw" trigger="click">
          <div slot="reference"   class="iconDiv">
            <div class="iconName">
            <i :class="userChooseIcon"></i>
              {{ chooseIcons }}</div>
          </div>
          <div class="iconList">
            <i
              v-for="item in iconList"
              :key="item"
              :class="[item, 'icon']"
              @click="setIcon(item)"
              style="font-size: 20px"
            ></i>
          </div>
        </el-popover>
      </div>
  </template>
  
  <script>
  import {elementIcons} from '@/utils/icons'

  export default {
    name: 'IconSelects',
    props: ['IconData'],
    data(){
        return {
        userChooseIcon:"",
        chooseIcons:"请选择图标",
        iconList:[]
        }
    },
    watch:{
      IconData:function(newVal){
      if(newVal){
        console.log(newVal)
        this.userChooseIcon = newVal
        this.chooseIcons = newVal
      }
      },
    },
    created() {
this.iconList=elementIcons
    },
    methods: {
      editClicks(){
        this.userChooseIcon = this.IconData;
        this.chooseIcons = this.IconData;
      },
    //给icon绑定的点击事件
    setIcon(icon){
    console.log(icon)
    this.userChooseIcon=icon;//将i的样式设为选中的样式el-icon-xxx
    this.chooseIcons=icon
    this.$emit('update:IconData',icon)
}
    }
  }
  </script>
  
  <style scoped>
  .chooseIcons {
  width: 100%;

}
.iconList {
  width: 30vw;
  height: 300px;
  overflow-y: scroll;
  overflow-x: hidden;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}
.icon {
  display: inline-block;
  width: 60px;
  height: 45px;
  color: #000000;
  font-size: 20px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  line-height: 45px;
  margin: 5px;

}
.icon:hover {
  color: red;
  border-color: red;
}
.iconDiv {
  width: 100%;
  height: 50%;

  display: flex;
  flex-direction: row;
  align-items: center;
}
.iconName {
  width: 100%;
  height: 45px;
  text-align: center;
  border: 1px solid #C0C4CC;
  border-radius: 4px;
}
  </style>
  