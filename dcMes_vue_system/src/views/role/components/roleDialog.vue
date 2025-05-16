<!--
 * @name: 职位字典列表
 * @content: 对所有的职位字典进行管理
 * @Author: joyce
 * @Date: 2020-03-10 16:22:05
-->
<template>
  <div class="app-container">
    <!-- 弹窗start -->
    <el-dialog :title="add ? '添加角色' : '编辑角色'" :visible.sync="dialogFormVisible" @open="handleDialogOpen">
      <el-form v-if="isShow" ref="dataForm" v-model="postList" label-position="right">
        <el-form-item label="角色名称" label-width="100px" required>
          <el-input v-model="postList.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" label-width="100px" required>
          <el-input v-model="postList.label" placeholder="请输入角色标识" />
        </el-form-item>

        <!-- 原按钮权限部分，暂时注释掉 -->
        
        <!-- <el-form-item label="按钮权限" label-width="100px" required>
          <el-select
            v-model="postList.buttonList"
            multiple
            filterable
            collapse-tags
            placeholder="请选择按钮权限"
            class="permission-select"
            :popper-class="permission-dropdown"
          >
            <el-option
              v-for="dict in dict.type.button_permissions"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value">
              <span class="permission-option">
                <i class="el-icon-key permission-icon"></i>
                {{dict.label}}
              </span>
            </el-option>
          </el-select>
          <div class="selected-permissions" v-if="postList.buttonList && postList.buttonList.length > 0">
            <el-tag
              v-for="(btn, index) in selectedPermissions"
              :key="index"
              type="success"
              size="small"
              class="permission-tag"
              closable
              @close="removePermission(btn.value)">
              {{btn.label}}
            </el-tag>
          </div>
        </el-form-item> -->
       

        <!-- 菜单权限，现在包含按钮权限功能 -->
        <el-form-item label="菜单及权限" label-width="100px" required>
          <div class="permission-description">
            <i class="el-icon-info"></i>
            <span>勾选相应菜单以授予访问权限，勾选"权限"类型的菜单项以启用相应按钮权限</span>
          </div>
          <el-card v-if="menu" shadow="never">
            <custom-menu-tree v-if="dialogFormVisible && optionsList.length > 0" v-model="postList.menuList" :options="optionsList" />
          </el-card>
        </el-form-item>

        <el-form-item label="备注" label-width="100px">
          <el-input v-model="postList.remark" placeholder="请输入备注" type="textarea" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="add ? createData() : editData()">确定
        </el-button>
      </div>
    </el-dialog>
    <!-- 弹窗end -->
  </div>
</template>

<script>
import { addData, getData, updateData } from "@/api/data";
import IconSelect from "@/components/IconSelect";
import { formatMenu2Tree } from "@/utils/format2Tree";
import CustomMenuTree from "./customMenuTree.vue";
export default {
  components: { IconSelect, CustomMenuTree },
  dicts: ['button_permissions'],
  porps: ["dialogFormVisible"],
  data() {
    return {
      menu: false,
      dialogFormVisible: false, //显示弹窗
      add: true,
      _id: null,
      postList: {},
      buttonList: [],
      optionsList: null,
      isShow: false,
      permissionMenus: [] // 存储权限类型的菜单项
    };
  },
  async created() {
    // 如果使用了字典管理器，可以等待字典加载完成
    console.log('字典数据已加载:', this.dict.type.button_permissions);
  },
  watch: {
    dialogFormVisible(val) {
      if (!val) {
        // 弹窗关闭时重置数据
        this.resetForm()
      }
    }
  },
  computed: {
    selectedPermissions() {
      if (!this.postList.buttonList || !this.dict.type.button_permissions) {
        return [];
      }
      return this.postList.buttonList.map(value => {
        const found = this.dict.type.button_permissions.find(dict => dict.value === value);
        return found || { value, label: value };
      });
    }
  },
  methods: {
    // 收集权限类型的菜单
    collectPermissionMenus(menus) {
      if (!menus || !menus.length) return [];

      let permissions = [];

      menus.forEach(menu => {
        // 如果菜单类型是"权限"，则添加到权限列表
        if (menu.type === '权限') {
          permissions.push({
            id: menu._id,
            name: menu.menuName,
            perms: menu.perms || menu.menuName
          });
        }

        // 递归处理子菜单
        if (menu.children && menu.children.length) {
          permissions = permissions.concat(this.collectPermissionMenus(menu.children));
        }
      });

      return permissions;
    },

    // 从菜单ID提取权限标识
    extractPermissionsFromMenuList() {
      // 不再需要使用buttonList，因为权限现在存储在menuList中
      // 根据菜单选择自动生成buttonList
      if (!this.postList || !this.postList.menuList || !this.postList.menuList.length) {
        console.log('%c提取权限 - 选中的菜单列表为空或未定义，返回空权限列表。', 'color:#FF0000; font-weight:bold;');
        return [];
      }
      if (!this.permissionMenus || !this.permissionMenus.length) {
        console.log('%c提取权限 - 权限菜单定义列表(permissionMenus)为空，返回空权限列表。', 'color:#FF0000; font-weight:bold;');
        return [];
      }

      const selectedPerms = [];

      console.groupCollapsed('%c权限提取详细日志', 'color:#007bff; font-weight:bold;');
      console.log('%c可用权限项 (this.permissionMenus):', 'color:#E6A23C; font-weight:bold;', JSON.parse(JSON.stringify(this.permissionMenus)));
      console.log('%c当前选中的菜单ID (this.postList.menuList):', 'color:#67C23A; font-weight:bold;', JSON.parse(JSON.stringify(this.postList.menuList)));

      // 遍历所有预定义的权限菜单项
      this.permissionMenus.forEach(permDefinition => {
        console.log(`%c检查权限项: ${permDefinition.name} (ID: ${permDefinition.id}, Perms: ${permDefinition.perms})`, 'color:grey;');
        // 检查这个预定义权限项的ID是否存在于实际选中的菜单ID列表中
        if (this.postList.menuList.includes(permDefinition.id)) {
          console.log(`%c  匹配成功! 权限 '${permDefinition.name}' (ID: ${permDefinition.id}) 在选中的菜单列表中。将添加权限: ${permDefinition.perms}`, 'color:green; font-weight:bold;');
          selectedPerms.push(permDefinition.perms);
        } else {
          console.log(`%c  未匹配。权限 '${permDefinition.name}' (ID: ${permDefinition.id}) 不在选中的菜单列表中。`, 'color:red;');
        }
      });
      console.groupEnd();

      console.log('%c提取权限 - 最终生成的权限标识列表 (selectedPerms):', 'color:#28a745; font-weight:bold;', JSON.parse(JSON.stringify(selectedPerms)));

      return selectedPerms;
    },

    async getSelectData() {
      let { data: dataList } = await getData("menu", {
        query: {},
        sort: { sortNum: 1 },
      });
      this.optionsList = formatMenu2Tree(dataList, null, []);

      // 收集所有权限类型的菜单
      this.permissionMenus = this.collectPermissionMenus(this.optionsList);
      console.log('权限类型菜单:', this.permissionMenus);
    },

    AddClick() {
      console.log("AddClick");
      this.menu = false;
      this.isShow = false;
      this.postList = {};
      this.add = true;
      this.dialogFormVisible = true;
      this.getSelectData();
      this.$nextTick(() => {
        this.menu = true;
        this.isShow = true;
      });
    },

    async EditClick(item) {
      this.menu = false
      this.add = false
      this.isShow = false
      this._id = item._id

      // 先获取菜单数据
      await this.getSelectData()

      // 设置初始数据 - 深拷贝以避免引用问题
      this.postList = JSON.parse(JSON.stringify(item))

      // 确保按钮列表和菜单列表字段存在
      this.postList.buttonList = item.buttonList || []

      // 确保menuList是一个数组，过滤掉无效值
      if (this.postList.menuList) {
        this.postList.menuList = this.postList.menuList.filter(id => id !== null && id !== undefined)
      } else {
        this.postList.menuList = []
      }

      // 打开弹窗
      this.dialogFormVisible = true

      this.$nextTick(() => {
        this.menu = true
        this.isShow = true
      })
    },

    async createData() {
      if (!this.postList.name) {
        this.$message.warning("角色名称不能为空");
        return;
      } else if (!this.postList.label) {
        this.$message.warning("角色标识不能为空");
        return;
      }

      // 确保提交前过滤无效的菜单项
      if (this.postList.menuList) {
        this.postList.menuList = this.postList.menuList.filter(id => id !== null && id !== undefined);
      }

      // 从选中的权限菜单生成buttonList
      this.postList.buttonList = this.extractPermissionsFromMenuList();

      // 详细记录提交数据
      console.log('%c===== 角色提交数据详情 =====', 'background:#1E1E1E; color:#00FF00; font-size:14px; font-weight:bold;');
      console.log('%c角色名称:', 'color:#409EFF; font-weight:bold;', this.postList.name);
      console.log('%c角色标识:', 'color:#409EFF; font-weight:bold;', this.postList.label);

      // 显示选中菜单的详细信息而不只是ID列表
      console.log('%cmenuList详细信息:', 'color:#409EFF; font-weight:bold;');
      this.logMenuDetails(this.postList.menuList);

      console.log('%cbuttonList(权限列表):', 'color:#409EFF; font-weight:bold;', JSON.parse(JSON.stringify(this.postList.buttonList)));

      console.log('根据菜单选择生成的按钮权限列表:', this.postList.buttonList);

      // 详细打印菜单权限数据
      console.log('===== 提交的菜单权限数据 =====');

      const todata = {
        ...this.postList,
      };

      let response = await addData("role", todata);
      console.log(response);
      if (response) {
        console.log(response);
        this.$emit("custom-event");
        this.dialogFormVisible = false;
        this.postList = {
          type: "目录",
          sortNum: 1,
          status: true,
        };
        this.$notify({
          title: "添加角色成功",
          message: "Add Successfully",
          type: "success",
          duration: 2000,
        });
      } else {
        this.$notify({
          title: "添加失败，请重试或刷新",
          message: "Add unsuccessful",
          type: "warning",
          duration: 2000,
        });
      }
    },

    editData() {
      if (!this.postList.name) {
        this.$message.warning("角色名称不能为空");
        return;
      } else if (!this.postList.label) {
        this.$message.warning("角色标识不能为空");
        return;
      }

      // 确保提交前过滤无效的菜单项
      if (this.postList.menuList) {
        this.postList.menuList = this.postList.menuList.filter(id => id !== null && id !== undefined);
      }

      // 从选中的权限菜单生成buttonList
      this.postList.buttonList = this.extractPermissionsFromMenuList();

      // 详细记录提交数据
      console.log('%c===== 角色编辑数据详情 =====', 'background:#1E1E1E; color:#00FF00; font-size:14px; font-weight:bold;');
      console.log('%c角色名称:', 'color:#409EFF; font-weight:bold;', this.postList.name);
      console.log('%c角色标识:', 'color:#409EFF; font-weight:bold;', this.postList.label);

      // 显示选中菜单的详细信息而不只是ID列表
      console.log('%cmenuList详细信息:', 'color:#409EFF; font-weight:bold;');
      this.logMenuDetails(this.postList.menuList);

      console.log('%cbuttonList(权限列表):', 'color:#409EFF; font-weight:bold;', JSON.parse(JSON.stringify(this.postList.buttonList)));

      console.log('根据菜单选择生成的按钮权限列表:', this.postList.buttonList);

      // 详细打印菜单权限数据
      console.log('===== 提交的菜单权限数据 =====');

      // 如果有optionsList，辅助查看菜单ID对应的菜单名称
      if (this.optionsList && this.optionsList.length) {
        // 创建ID到菜单信息的映射
        const menuMap = new Map();

        const collectMenuInfo = (menu, path = []) => {
          const currentPath = [...path, menu.menuName];
          menuMap.set(menu._id, {
            name: menu.menuName,
            path: currentPath.join(' > '),
            type: menu.type || '菜单'
          });

          if (menu.children && menu.children.length) {
            menu.children.forEach(child => collectMenuInfo(child, currentPath));
          }
        };

        // 构建菜单映射
        this.optionsList.forEach(menu => collectMenuInfo(menu));

        // 转换选中的菜单ID为可读信息
        const selectedMenus = this.postList.menuList
          .map(id => {
            const info = menuMap.get(id);
            return info ? info : { name: '未知菜单', path: `未知路径 (ID: ${id})`, type: '未知' };
          })
          .sort((a, b) => a.path.localeCompare(b.path));

        console.log('角色名称:', this.postList.name);
        console.log('角色标识:', this.postList.label);
        console.log('选中的菜单:');
        console.table(selectedMenus.map((menu, index) => ({
          '序号': index + 1,
          '菜单名称': menu.name,
          '菜单路径': menu.path,
          '类型': menu.type
        })));
      } else {
        console.log('无法解析菜单名称，未加载菜单列表');
      }

      // console.log(this.postList); return
      delete this.postList._id;
      var data = {
        query: { _id: this._id },
        update: {
          ...this.postList,
        },
      };

      let response = updateData("role", data);
      console.log(response);
      this.dialogFormVisible = false;
      this.$emit("custom-event");
      this.$notify({
        title: "修改成功",
        message: "edit Successfully",
        type: "success",
        duration: 2000,
      });
    },

    getParentId(item) {
      console.log(item);
      if (Array.isArray(item)) {
        this.postList.parentId = item[item.length - 1];
        console.log(this.postList.parentId);
      }
    },

    resetForm() {
      this.postList = {
        name: '',
        label: '',
        buttonList: [],
        menuList: [],
        remark: ''
      }
      this.menu = false
      this.isShow = false
    },

    handleDialogOpen() {
      if (!this.add && this._id) {
        // 编辑模式下，重新获取最新数据
        this.refreshRoleData()
      }
    },

    async refreshRoleData() {
      try {
        const { data } = await getData("role", {
          query: { _id: this._id }
        })
        if (data && data.length > 0) {
          const roleData = data[0];

          // 使用深拷贝避免引用问题
          this.postList = JSON.parse(JSON.stringify(roleData));

          // 确保按钮列表存在
          this.postList.buttonList = this.postList.buttonList || [];

          // 确保menuList是有效数组，并去除任何无效值
          if (Array.isArray(this.postList.menuList)) {
            this.postList.menuList = this.postList.menuList.filter(id => id != null);
          } else {
            this.postList.menuList = [];
          }

          // 记录菜单列表更新
          console.log('角色菜单列表已更新，总计菜单数:', this.postList.menuList.length);
        }
      } catch (error) {
        console.error('获取角色数据失败:', error);
        this.$message.error('获取角色数据失败');
      }
    },

    removePermission(value) {
      const index = this.postList.buttonList.indexOf(value);
      if (index !== -1) {
        this.postList.buttonList.splice(index, 1);
      }
    },

    checkPermission(permission) {
        try {
            // 获取用户角色信息
            const roles = this.$store.getters.roles || {};
            console.log("roles：",roles);

            // 超级管理员默认拥有所有权限
            if (roles.name === 'admin' || roles.name === '超级管理员' || roles.label === 'admin') {
                return true;
            }


            // 检查buttonList是否存在并包含特定权限
            if (roles.buttonList && Array.isArray(roles.buttonList)) {
                console.log("roles.buttonList：",roles.buttonList);
                return roles.buttonList.includes(permission);
            }

            // 如果找不到buttonList，默认显示
            return true;
        } catch (error) {
            console.error('权限检查出错:', error);
            return true; // 出错时默认显示按钮
        }
    },

    // 添加新方法，用于记录菜单详细信息
    logMenuDetails(menuIds) {
      if (!menuIds || !menuIds.length) {
        console.log('没有选中任何菜单');
        return;
      }

      // 先检查和打印原始menuList内容
      console.group('%c菜单列表原始数据分析', 'color:#FF9900; font-weight:bold;');
      console.log('menuList类型:', Object.prototype.toString.call(this.postList.menuList));
      console.log('menuList长度:', this.postList.menuList.length);
      console.log('menuList内容样本(前5项):', this.postList.menuList.slice(0, 5));

      // 检查是ID还是包含权限值的对象
      const firstItem = this.postList.menuList[0];
      if (firstItem) {
        console.log('第一项数据类型:', typeof firstItem);
        if (typeof firstItem === 'object') {
          console.log('第一项内容:', firstItem);
          console.log('可能包含权限值的完整对象');
        } else {
          console.log('第一项值:', firstItem);
          console.log('可能只是ID值');
        }
      }
      console.groupEnd();

      // 创建菜单ID到菜单信息的映射
      const menuMap = new Map();
      const buildMenuMap = (menus, path = []) => {
        if (!menus || !menus.length) return;

        menus.forEach(menu => {
          const currentPath = [...path, menu.menuName];
          menuMap.set(menu._id, {
            id: menu._id,
            name: menu.menuName,
            path: currentPath.join(' / '),
            type: menu.type || '菜单',
            perms: menu.perms,
            value: menu.value, // 添加value字段
            component: menu.component,
            icon: menu.icon,
            url: menu.url
          });

          if (menu.children && menu.children.length > 0) {
            buildMenuMap(menu.children, currentPath);
          }
        });
      };

      // 构建菜单映射
      buildMenuMap(this.optionsList);

      // 打印每个选中菜单的详细信息
      console.group('选中的菜单列表详情');

      const selectedMenuDetails = menuIds.map(id => {
        const menuInfo = menuMap.get(id);
        if (menuInfo) {
          return menuInfo;
        } else {
          return { id, name: '未知菜单', path: '未知路径', type: '未知' };
        }
      }).sort((a, b) => a.path.localeCompare(b.path));

      // 按类型分组
      const grouped = {};
      selectedMenuDetails.forEach(menu => {
        if (!grouped[menu.type]) {
          grouped[menu.type] = [];
        }
        grouped[menu.type].push(menu);
      });

      // 打印表格，添加value列
      Object.keys(grouped).forEach(type => {
        console.groupCollapsed(`%c${type} (${grouped[type].length}个)`, 'color:#67C23A; font-weight:bold;');
        console.table(grouped[type], ['name', 'path', 'perms', 'value', 'component']);
        console.groupEnd();
      });

      console.groupEnd();

      // 权限菜单特别分析
      const permTypeMenus = selectedMenuDetails.filter(menu => menu.type === '权限');
      if (permTypeMenus.length > 0) {
        console.group('%c权限类型菜单特别分析', 'color:#E6A23C; font-weight:bold;');
        console.log('权限菜单数量:', permTypeMenus.length);
        console.table(permTypeMenus, ['id', 'name', 'perms', 'value']);
        console.groupEnd();
      }

      // 查找原始的optionsList中的菜单对象，打印完整信息
      console.group('%c菜单对象原始结构样本', 'color:#409EFF; font-weight:bold;');
      const findMenu = (menus, targetId) => {
        if (!menus) return null;
        for (const menu of menus) {
          if (menu._id === targetId) return menu;
          if (menu.children) {
            const found = findMenu(menu.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      if (menuIds.length > 0) {
        const sampleMenuId = menuIds[0];
        const sampleMenu = findMenu(this.optionsList, sampleMenuId);
        if (sampleMenu) {
          console.log('样本菜单完整结构:', sampleMenu);
          console.log('菜单ID (_id):', sampleMenu._id);
          console.log('菜单名称 (menuName):', sampleMenu.menuName);
          console.log('权限标识 (perms):', sampleMenu.perms);
          console.log('菜单值 (value, 如果存在):', sampleMenu.value);
        }
      }
      console.groupEnd();
    },
  },
};
</script>
<style scoped>
.permission-select {
  width: 100%;
}

.permission-dropdown {
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.permission-option {
  display: flex;
  align-items: center;
}

.permission-icon {
  margin-right: 8px;
  color: #409EFF;
}

.selected-permissions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  margin-right: 5px;
  margin-bottom: 5px;
  cursor: default;
  transition: all 0.3s;
}

.permission-tag:hover {
  transform: translateY(-2px);
}

.permission-description {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.permission-description i {
  color: #409EFF;
  margin-right: 5px;
}
</style>
