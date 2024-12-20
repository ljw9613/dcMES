<template>
  <div class="custom-menu-tree">
    <!-- 添加操作按钮 -->
    <div class="tree-operations">
      <el-button type="text" size="small" @click="expandAll">
        <i class="el-icon-circle-plus-outline"></i> 展开全部
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button type="text" size="small" @click="collapseAll">
        <i class="el-icon-remove-outline"></i> 收起全部
      </el-button>
    </div>

    <div v-for="menu in menuList" :key="menu._id" class="menu-item">
      <!-- 目录级别 -->
      <div class="menu-directory" :class="{ 'is-expanded': menu.expanded }">
        <div class="menu-header" @click="toggleExpand(menu)">
          <el-checkbox 
            v-model="menu.checked"
            :indeterminate="menu.indeterminate"
            @change="(val) => handleDirectoryCheck(menu, val)"
            @click.stop
          >
            <i :class="menu.icon" class="menu-icon"></i>
            {{ menu.menuName }}
          </el-checkbox>
          <i v-if="menu.children" 
             class="el-icon-arrow-right expand-icon"
             :class="{ 'is-expanded': menu.expanded }">
          </i>
        </div>
      </div>
      
      <!-- 子菜单 -->
      <el-collapse-transition>
        <div v-if="menu.children && menu.expanded" class="sub-menu">
          <div v-for="subMenu in menu.children" 
               :key="subMenu._id" 
               class="sub-menu-item">
            <el-checkbox 
              v-model="subMenu.checked"
              @change="(val) => handleMenuCheck(menu, subMenu, val)"
            >
              <i :class="subMenu.icon" class="menu-icon"></i>
              {{ subMenu.menuName }}
            </el-checkbox>
          </div>
        </div>
      </el-collapse-transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomMenuTree',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      menuList: []
    }
  },
  watch: {
    options: {
      handler(val) {
        this.initMenuList(val)
      },
      immediate: true
    },
    value: {
      handler(val) {
        this.initSelectedMenus(val)
      },
      immediate: true
    }
  },
  methods: {
    // 初始化菜单列表,添加选中状态
    initMenuList(menus) {
      this.menuList = menus.map(menu => ({
        ...menu,
        checked: false,
        indeterminate: false,
        expanded: false, // 默认收起
        children: menu.children ? menu.children.map(child => ({
          ...child,
          checked: false
        })) : null
      }))
    },
    
    // 展开所有菜单
    expandAll() {
      this.menuList.forEach(menu => {
        menu.expanded = true
      })
    },
    
    // 收起所有菜单
    collapseAll() {
      this.menuList.forEach(menu => {
        menu.expanded = false
      })
    },
    
    // 切换展开/收起状态
    toggleExpand(menu) {
      menu.expanded = !menu.expanded
    },

    // 初始化已选中的菜单
    initSelectedMenus(selectedIds) {
      if(!selectedIds || !selectedIds.length) return
      
      this.menuList.forEach(menu => {
        // 检查目录是否选中
        menu.checked = selectedIds.includes(menu._id)
        
        if(menu.children) {
          let checkedCount = 0
          menu.children.forEach(subMenu => {
            // 检查子菜单是否选中
            subMenu.checked = selectedIds.includes(subMenu._id)
            if(subMenu.checked) checkedCount++
          })
          
          // 更新父级状态
          if(checkedCount === menu.children.length) {
            menu.checked = true
            menu.indeterminate = false
          } else if(checkedCount > 0) {
            menu.checked = false
            menu.indeterminate = true
          } else {
            menu.checked = false
            menu.indeterminate = false
          }
        }
      })
    },
    
    // 处理目录选中状态变化
    handleDirectoryCheck(menu, checked) {
      menu.indeterminate = false
      if(menu.children) {
        menu.children.forEach(subMenu => {
          subMenu.checked = checked
        })
      }
      this.emitChange()
    },
    
    // 处理子菜单选中状态变化
    handleMenuCheck(parentMenu, subMenu, checked) {
      const checkedChildren = parentMenu.children.filter(item => item.checked)
      parentMenu.checked = checkedChildren.length === parentMenu.children.length
      parentMenu.indeterminate = checkedChildren.length > 0 && checkedChildren.length < parentMenu.children.length
      this.emitChange()
    },
    
    // 发送选中值变化事件
    emitChange() {
      const selectedIds = []
      this.menuList.forEach(menu => {
        if(menu.checked || menu.indeterminate) {
          selectedIds.push(menu._id)
        }
        if(menu.children) {
          menu.children.forEach(subMenu => {
            if(subMenu.checked) {
              selectedIds.push(subMenu._id)
            }
          })
        }
      })
      this.$emit('input', selectedIds)
    }
  }
}
</script>

<style scoped>
.custom-menu-tree {
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 添加操作按钮样式 */
.tree-operations {
  padding: 8px 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.tree-operations .el-button {
  padding: 0 4px;
}

.tree-operations .el-button + .el-button {
  margin-left: 8px;
}

.menu-item {
  margin-bottom: 8px;
}

.menu-directory {
  border-radius: 4px;
  transition: all 0.3s;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.menu-header:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}

.expand-icon {
  transition: transform 0.3s;
  font-size: 16px;
  color: #909399;
}

.expand-icon.is-expanded {
  transform: rotate(90deg);
}

.sub-menu {
  padding: 4px 0 4px 48px;
  background: #f5f7fa;
  border-radius: 0 0 4px 4px;
  margin-top: 2px;
}

.sub-menu-item {
  padding: 8px 16px;
  transition: all 0.3s;
  border-radius: 4px;
}

.sub-menu-item:hover {
  background-color: #ecf5ff;
}

/* 自定义 checkbox 样式 */
/deep/ .el-checkbox__label {
  font-weight: normal;
}

/deep/ .menu-directory .el-checkbox__label {
  font-weight: 500;
}

/* 过渡动画 */
.el-collapse-transition {
  transition: 0.3s height ease-in-out, 0.3s padding-top ease-in-out, 0.3s padding-bottom ease-in-out;
}
</style>