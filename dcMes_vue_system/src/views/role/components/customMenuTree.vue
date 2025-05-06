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
          <template v-if="menu.children.length === 0">
            <div class="empty-sub-menu">
              <span class="empty-text">暂无子菜单</span>
            </div>
          </template>
          <template v-else>
            <div v-for="subMenu in menu.children"
                 :key="subMenu._id"
                 class="sub-menu-item">
              <div class="sub-menu-header" @click="toggleExpand(subMenu)">
                <el-checkbox
                  v-model="subMenu.checked"
                  :indeterminate="subMenu.indeterminate"
                  @change="(val) => handleMenuCheck(menu, subMenu, val)"
                  @click.stop
                >
                  <i :class="subMenu.icon" class="menu-icon"></i>
                  {{ subMenu.menuName }}
                </el-checkbox>
                <i v-if="subMenu.children"
                   class="el-icon-arrow-right expand-icon"
                   :class="{ 'is-expanded': subMenu.expanded }">
                </i>
              </div>

              <!-- 三级菜单 -->
              <el-collapse-transition>
                <div v-if="subMenu.children && subMenu.expanded" class="third-level-menu">
                  <template v-if="subMenu.children.length === 0">
                    <div class="empty-sub-menu">
                      <span class="empty-text">暂无子菜单</span>
                    </div>
                  </template>
                  <template v-else>
                    <div v-for="thirdMenu in subMenu.children"
                         :key="thirdMenu._id"
                         :class="['third-level-item', {'permission-item': thirdMenu.type === '权限'}]">
                      <el-checkbox
                        v-model="thirdMenu.checked"
                        @change="(val) => handleThirdLevelCheck(menu, subMenu, thirdMenu, val)"
                      >
                        <i :class="thirdMenu.icon || 'el-icon-key'" class="menu-icon"></i>
                        {{ thirdMenu.menuName }}
                        <el-tag v-if="thirdMenu.type === '权限'" size="mini" type="danger">权限</el-tag>
                      </el-checkbox>
                    </div>
                  </template>
                </div>
              </el-collapse-transition>
            </div>
          </template>
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
        children: menu.children ? (Array.isArray(menu.children) ? menu.children.map(child => ({
          ...child,
          checked: false,
          indeterminate: false,
          expanded: false,
          children: child.children ? (Array.isArray(child.children) ? child.children.map(grandChild => ({
            ...grandChild,
            checked: false
          })) : []) : null
        })) : []) : null
      }))
    },

    // 展开所有菜单
    expandAll() {
      this.menuList.forEach(menu => {
        menu.expanded = true
        if(menu.children && menu.children.length > 0) {
          menu.children.forEach(subMenu => {
            subMenu.expanded = true
          })
        }
      })
    },

    // 收起所有菜单
    collapseAll() {
      this.menuList.forEach(menu => {
        menu.expanded = false
        if(menu.children && menu.children.length > 0) {
          menu.children.forEach(subMenu => {
            subMenu.expanded = false
          })
        }
      })
    },

    // 切换展开/收起状态
    toggleExpand(menu) {
      menu.expanded = !menu.expanded
    },

    // 初始化已选中的菜单
    initSelectedMenus(selectedIds) {
      if(!selectedIds || !selectedIds.length) return

      // 完全重置所有选中状态
      const resetCheckStatus = (menus) => {
        if (!menus) return;
        menus.forEach(menu => {
          menu.checked = false;
          menu.indeterminate = false;
          if (menu.children) {
            resetCheckStatus(menu.children);
          }
        });
      };

      // 首先重置所有状态
      resetCheckStatus(this.menuList);

      // 设置选中状态，不自动设置父节点状态
      this.menuList.forEach(menu => {
        // 检查顶级菜单本身是否被选中
        if (selectedIds.includes(menu._id)) {
          menu.checked = true;
        }

        if(menu.children && menu.children.length > 0) {
          menu.children.forEach(subMenu => {
            // 检查二级菜单是否被选中
            if (selectedIds.includes(subMenu._id)) {
              subMenu.checked = true;
            }

            // 检查三级菜单选中状态
            if(subMenu.children && subMenu.children.length > 0) {
              subMenu.children.forEach(thirdMenu => {
                // 检查三级菜单是否被选中
                if (selectedIds.includes(thirdMenu._id)) {
                  thirdMenu.checked = true;
                }
              });

              // 更新二级菜单的状态（但权限菜单不影响父级）
              this.updateMenuIndeterminateState(subMenu);
            }
          });

          // 更新顶级菜单的状态（但权限菜单不影响父级）
          this.updateMenuIndeterminateState(menu);
        }
      });
    },

    // 新增方法：专门用于更新菜单的半选状态，权限菜单不影响父级状态
    updateMenuIndeterminateState(menu) {
      if (!menu.children || menu.children.length === 0) return;

      // 仅检查非权限类型的子菜单
      const nonPermChildren = menu.children.filter(item => item.type !== '权限');

      if (nonPermChildren.length > 0) {
        // 检查非权限菜单的选中状态
        const allChecked = nonPermChildren.every(item => item.checked);
        const anyChecked = nonPermChildren.some(item => item.checked || item.indeterminate);

        if (allChecked && nonPermChildren.length > 0) {
          // 如果所有非权限子菜单都选中，则父菜单保持选中状态
          menu.indeterminate = false;
        } else if (anyChecked) {
          // 如果部分子菜单选中，则设置为半选状态
          menu.indeterminate = true;
          menu.checked = false;
        } else {
          // 如果没有非权限子菜单选中，则保持父菜单当前状态
          menu.indeterminate = false;
        }
      } else {
        // 如果没有非权限子菜单，权限菜单的选中状态不影响父级
        // 保持父菜单当前状态
      }
    },

    // 处理目录选中状态变化
    handleDirectoryCheck(menu, checked) {
      // 直接设置当前菜单的状态
      menu.checked = checked;
      menu.indeterminate = false;

      // 级联选择子菜单，但不包括权限类型的菜单
      if(menu.children && menu.children.length > 0) {
        menu.children.forEach(subMenu => {
          // 设置二级菜单状态
          subMenu.checked = checked;
          subMenu.indeterminate = false;

          // 级联选择三级菜单，但跳过权限类型菜单
          if(subMenu.children && subMenu.children.length > 0) {
            subMenu.children.forEach(thirdMenu => {
              // 如果是权限类型菜单且当前操作是取消选中，则保持原状态
              if (thirdMenu.type === '权限' && !checked) {
                // 不修改权限菜单的选中状态
              } else {
                thirdMenu.checked = checked;
              }
            });
          }
        });
      }

      // 发送变更
      this.emitChange();
    },

    // 处理子菜单选中状态变化
    handleMenuCheck(parentMenu, subMenu, checked) {
      // 直接设置当前菜单的状态
      subMenu.checked = checked;
      subMenu.indeterminate = false;

      // 级联选择三级菜单，但跳过权限类型菜单
      if(subMenu.children && subMenu.children.length > 0) {
        subMenu.children.forEach(thirdMenu => {
          // 如果是权限类型菜单且当前操作是取消选中，则保持原状态
          if (thirdMenu.type === '权限' && !checked) {
            // 不修改权限菜单的选中状态
          } else {
            thirdMenu.checked = checked;
          }
        });
      }

      // 更新父级状态，但不使用强绑定关系
      this.updateParentState(parentMenu);

      // 发送变更
      this.emitChange();
    },

    // 处理三级菜单选中状态变化
    handleThirdLevelCheck(rootMenu, parentMenu, thirdMenu, checked) {
      // 直接设置当前菜单的状态
      thirdMenu.checked = checked;

      // 如果是权限类型菜单，不影响父级状态
      if (thirdMenu.type === '权限') {
        // 仅发送变更，不修改父级状态
        this.emitChange();
        return;
      }

      // 对于非权限菜单，更新父级状态
      this.updateParentState(parentMenu, rootMenu);

      // 发送变更
      this.emitChange();
    },

    // 新增方法：更新父级菜单状态，但不强制绑定
    updateParentState(menu, rootMenu = null) {
      // 仅检查非权限类型的子菜单
      const nonPermChildren = menu.children.filter(item => item.type !== '权限');

      if (nonPermChildren.length > 0) {
        const allChecked = nonPermChildren.every(item => item.checked);
        const anyChecked = nonPermChildren.some(item => item.checked || item.indeterminate);

        // 如果所有非权限子菜单都选中，则父菜单也选中
        if (allChecked) {
          menu.checked = true;
          menu.indeterminate = false;
        } else if (anyChecked) {
          // 如果部分选中，则显示为半选状态
          menu.checked = false;
          menu.indeterminate = true;
        } else {
          // 如果没有选中，则检查是否有权限类型子菜单被选中
          const anyPermChecked = menu.children
            .filter(item => item.type === '权限')
            .some(item => item.checked);

          // 父菜单状态不受权限菜单选中状态影响
          menu.checked = false;
          menu.indeterminate = anyChecked;
        }
      }

      // 如果提供了根菜单，也更新根菜单状态
      if (rootMenu) {
        this.updateParentState(rootMenu);
      }
    },

    // 发送选中值变化事件
    emitChange() {
      // 收集所有选中的菜单项，包括明确勾选的菜单和权限
      const collectSelectedMenuInfos = (menus) => {
        if (!menus || !menus.length) return [];

        return menus.reduce((acc, menu) => {
          // 如果菜单被选中，添加到结果中
          if (menu.checked === true) {
            acc.push({
              id: menu._id,
              name: menu.menuName,
              type: menu.type || '菜单'
            });
          }

          // 处理子菜单，始终递归检查所有子菜单
          if (menu.children && menu.children.length) {
            const selectedChildren = collectSelectedMenuInfos(menu.children);
            acc.push(...selectedChildren);
          }

          return acc;
        }, []);
      };

      // 获取所有选中的菜单信息
      const selectedMenus = collectSelectedMenuInfos(this.menuList);

      // 提取ID列表
      const selectedIds = selectedMenus.map(item => item.id);

      // 确保没有重复ID
      const uniqueIds = [...new Set(selectedIds)].filter(Boolean);

      // 详细打印选中状态
      console.log('===== 菜单树选中状态 =====');

      // 打印勾选信息，特别标记权限菜单
      const getMenuState = (menu, indent = '') => {
        const state = menu.checked ? '✓' : menu.indeterminate ? '⊙' : '✗';
        const permMark = menu.type === '权限' ? ' [权限]' : '';
        console.log(`${indent}${state} ${menu.menuName}${permMark}`);

        if (menu.children && menu.children.length) {
          menu.children.forEach(child => {
            getMenuState(child, indent + '  ');
          });
        }
      };

      console.log('菜单选中状态树:');
      this.menuList.forEach(menu => getMenuState(menu));

      console.log('最终选中的菜单列表:');
      console.table(selectedMenus.map(item => ({
        菜单名称: item.name,
        菜单类型: item.type
      })));

      // 向父组件发送选中的菜单ID
      this.$emit('input', uniqueIds);
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

.menu-header, .sub-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.menu-header:hover, .sub-menu-header:hover {
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
  margin-bottom: 4px;
}

.third-level-menu {
  padding: 4px 0 4px 32px;
  background: #eef1f6;
  border-radius: 0 0 4px 4px;
  margin-top: 2px;
}

.third-level-item {
  padding: 8px 16px;
  transition: all 0.3s;
  border-radius: 4px;
}

.third-level-item:hover {
  background-color: #e4e9f2;
}

/* 权限菜单样式 */
.permission-item {
  background-color: #fef0f0;
  border-left: 2px solid #f56c6c;
}

.permission-item:hover {
  background-color: #fee6e6;
}

.sub-menu-item {
  transition: all 0.3s;
  border-radius: 4px;
}

.sub-menu-item:hover {
  background-color: #ecf5ff;
}

.empty-sub-menu {
  padding: 12px 16px;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.empty-text {
  font-style: italic;
}

/* 自定义 checkbox 样式 */
::v-deep .el-checkbox__label {
  font-weight: normal;
}

::v-deep .menu-directory .el-checkbox__label {
  font-weight: 500;
}

/* 过渡动画 */
.el-collapse-transition {
  transition: 0.3s height ease-in-out, 0.3s padding-top ease-in-out, 0.3s padding-bottom ease-in-out;
}
</style>
