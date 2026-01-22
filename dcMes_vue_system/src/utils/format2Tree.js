  export function formatMenu2Tree (menus,parentId,keyPath){
    return menus
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const _keyPath = keyPath.concat(parentId || []);
        const arr = formatMenu2Tree(menus, item._id, _keyPath);
        return mergeObjects(item, {
          keyPath: _keyPath,
          menuName: item.menuName,
          key: item._id,
          _id: item._id,
          formData: item,
          children: arr.length ? arr : null,
        });
      });
  }
  function mergeObjects (obj1, obj2) {
 const result = {};
 for (const key in obj1) {
   result[key] = obj1[key];
 }
 for (const key in obj2) {
   result[key] = obj2[key];
 }
 return result;
}

export function formatRole2Auth (menus){
  console.log('menus: ', menus);
  return menus
    .filter((item) => item.type == '权限')
    .map((auth)=>{
      return auth.perms;
    })
}