/**
 * 权限检查工具类
 * 用于统一处理按钮权限控制
 */
import store from '@/store'; // 直接导入store实例

/**
 * 检查当前用户是否拥有指定权限
 * @param {string} permission 权限标识
 * @returns {boolean} 是否有权限
 */
export function checkPermission(permission) {
  try {
    // 使用导入的store实例
    // 尝试多种方式获取角色信息
    let roles = {};
    if (store.getters && store.getters.roles) {
      roles = store.getters.roles;
    } else if (store.state && store.state.user && store.state.user.roles) {
      roles = store.state.user.roles;
    } else if (store.state && store.state.user && store.state.user.role) {
      roles = store.state.user.role;
    }
    
    // 详细的调试信息
    // console.log('检查权限:', permission);
    // console.log('store是否存在:', !!store);
    // console.log('store.getters是否存在:', !!store.getters);
    // console.log('用户角色信息:', roles);
    // console.log('buttonList:', roles.buttonList);
    
    // 超级管理员默认拥有所有权限
    if (roles.name === 'admin' || roles.name === '超级管理员' || roles.label === 'admin') {
      // console.log('用户是超级管理员，默认拥有所有权限');
      return true;
    }
    
    // 确保buttonList存在
    if (!roles.buttonList) {
      roles.buttonList = [];
      console.warn('buttonList不存在，已初始化为空数组');
    }
    
    // 检查buttonList是否存在并包含特定权限
    if (Array.isArray(roles.buttonList)) {
      // 支持两种形式的buttonList:
      // 1. 字符串数组形式: ['物料信息DI码管理', ...]
      // 2. 新的键值对数组: [{key: 'material:di:manage', value: '物料信息DI码管理'}, ...]
      
      // 情况1: 直接检查权限标识
      if (roles.buttonList.includes(permission)) {
        console.log(`权限检查结果: 有权限 (字符串匹配: ${permission})`);
        return true;
      }
      
      // 情况2: 键值对形式检查
      // 检查是否有满足条件的键值对
      const hasKeyValuePermission = roles.buttonList.some(item => {
        // 检查是否为对象且包含key属性或value属性
        if (item && typeof item === 'object') {
          return (item.key === permission || item.value === permission);
        }
        return false;
      });
      
      if (hasKeyValuePermission) {
        console.log(`权限检查结果: 有权限 (键值对匹配)`);
        return true;
      }
      
      console.log(`权限检查结果: 无权限`);
      return false;
    }
    
    // 如果找不到buttonList，尝试从permissions字段获取
    if (roles.permissions && Array.isArray(roles.permissions)) {
      const hasPermission = roles.permissions.includes(permission);
      console.log(`从permissions检查结果: ${hasPermission ? '有权限' : '无权限'}`);
      return hasPermission;
    }
    
    // 开发模式下默认返回true
    console.warn('未找到权限列表(buttonList或permissions)，默认返回true');
    return true;
  } catch (error) {
    console.error('权限检查出错:', error);
    return false; // 出错时默认隐藏按钮
  }
}

/**
 * 检查当前用户是否拥有指定权限中的任意一个
 * @param {Array<string>} permissions 权限标识数组
 * @returns {boolean} 是否有权限
 */
export function hasAnyPermission(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  
  return permissions.some(permission => checkPermission(permission));
}

/**
 * 检查当前用户是否拥有指定的所有权限
 * @param {Array<string>} permissions 权限标识数组
 * @returns {boolean} 是否有权限
 */
export function hasAllPermissions(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return true;
  }
  
  return permissions.every(permission => checkPermission(permission));
}

export default {
  checkPermission,
  hasAnyPermission,
  hasAllPermissions
}; 