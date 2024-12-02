const mongooseDeleteConfig = {
  overrideMethods: true, //覆盖所有方法
  deletedAt: true, //删除时间
  deletedBy: true, //删除用户(默认为ObjectId)
  deletedByType: String, //删除用户字段类型为String
};


module.exports = {
  mongooseDeleteConfig,
};
