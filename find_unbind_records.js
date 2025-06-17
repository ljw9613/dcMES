#!/usr/bin/env node
const mongoose = require('./dcMes_server/node_modules/mongoose');
const UnbindRecord = require('./dcMes_server/model/project/unbindRecord');

mongoose.connect('mongodb://dcMes:dcMes123.@47.115.19.76:27017/dcMes', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('数据库连接成功');
  
  // 查找最近的解绑记录
  const records = await UnbindRecord.find({
    'unbindMaterials.0': { $exists: true }
  }).sort({ operateTime: -1 }).limit(5);
  
  console.log('最近的解绑记录:');
  records.forEach((record, idx) => {
    console.log(`${idx + 1}. 条码: ${record.mainBarcode}`);
    console.log(`   工序: ${record.processName}`);
    console.log(`   解绑物料数量: ${record.unbindMaterials?.length || 0}`);
    if (record.unbindMaterials && record.unbindMaterials.length > 0) {
      record.unbindMaterials.forEach(m => {
        console.log(`     - ${m.materialCode}: ${m.originalBarcode}`);
      });
    }
    console.log(`   解绑时间: ${record.operateTime}`);
    console.log('');
  });
  
  mongoose.connection.close();
}).catch(console.error); 