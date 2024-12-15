const mongooseDeleteConfig = {
  overrideMethods: true, //覆盖所有方法
  deletedAt: true, //删除时间
  deletedBy: true, //删除用户(默认为ObjectId)
  deletedByType: String, //删除用户字段类型为String
};


const sqlServerConfig = {
  server: '192.168.6.254',
  port: 1433,
  database: 'production_record',
  user: 'dev',
  password: 'DC@sqlServer230530$#1624',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

module.exports = {
  mongooseDeleteConfig,
  sqlServerConfig,
};
