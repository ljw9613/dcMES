// 工序更新脚本
// 绑定工序修改
db.getCollection("processsteps").updateMany(
  { processType: "BINDING_PROCESS" }, // 查询条件
  { $set: { processType: "D" } } // 更新操作
);

// 检测工序修改
db.getCollection("processsteps").updateMany(
  { processType: "P_INSPECTION" }, // 查询条件
  { $set: { processType: "C" } } // 更新操作
);

// 检测工序修改
db.getCollection("processsteps").updateMany(
  { processType: "INSPECTION_PROCESS" }, // 查询条件
  { $set: { processType: "C" } } // 更新操作
);

//业务类型修改
db.getCollection("processsteps").updateMany(
  { businessType: "0" }, // 查询条件
  { $set: { businessType: "TTI" } } // 更新操作
);
db.getCollection("processsteps").updateMany(
  { businessType: "1" }, // 查询条件
  { $set: { businessType: "SHARK" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "2" }, // 查询条件
  { $set: { businessType: "小家电" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "3" }, // 查询条件
  { $set: { businessType: "追觅" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "4" }, // 查询条件
  { $set: { businessType: "添可" } } // 更新操作
);

db.getCollection("crafts").updateMany(
  { businessType: "1" }, // 查询条件
  { $set: { businessType: "SHARK" } } // 更新操作
);

db.getCollection("crafts").updateMany(
    { craftType: "C_NORM" }, // 查询条件
    { $set: { craftType: "A" } } // 更新操作
  );

  db.getCollection("crafts").updateMany(
    { craftType: "C_JIG" }, // 查询条件
    { $set: { craftType: "B" } } // 更新操作
  );

  db.getCollection("crafts").updateMany(
    { craftType: "C_AUXILIARY" }, // 查询条件
    { $set: { craftType: "C" } } // 更新操作
  );

  db.getCollection("crafts").updateMany(
    { craftType: "AUXILIARY_MATERIAL_TECHNOLOGY" }, // 查询条件
    { $set: { craftType: "C" } } // 更新操作
  );
  db.getCollection("crafts").updateMany(
    { craftType: "STANDARD_PROCESS" }, // 查询条件
    { $set: { craftType: "A" } } // 更新操作
  );



//业务类型再修改回业务类型编码：0:电池包,1:小家电,2:SHARK，3:TTI 4:追觅 5:添可
db.getCollection("processsteps").updateMany(
  { businessType: "电池包" }, // 查询条件
  { $set: { businessType: "0" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "小家电" }, // 查询条件
  { $set: { businessType: "1" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "SHARK" }, // 查询条件
  { $set: { businessType: "2" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "TTI" }, // 查询条件
  { $set: { businessType: "3" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "追觅" }, // 查询条件
  { $set: { businessType: "4" } } // 更新操作
);

db.getCollection("processsteps").updateMany(
  { businessType: "添可" }, // 查询条件
  { $set: { businessType: "5" } } // 更新操作
);



//
db.getCollection("crafts").updateMany(
    { businessType: "电池包" }, // 查询条件
    { $set: { businessType: "0" } } // 更新操作
  );
  
  db.getCollection("crafts").updateMany(
    { businessType: "小家电" }, // 查询条件
    { $set: { businessType: "1" } } // 更新操作
  );
  
  db.getCollection("crafts").updateMany(
    { businessType: "SHARK" }, // 查询条件
    { $set: { businessType: "2" } } // 更新操作
  );
  
  db.getCollection("crafts").updateMany(
    { businessType: "TTI" }, // 查询条件
    { $set: { businessType: "3" } } // 更新操作
  );
  
  db.getCollection("crafts").updateMany(
    { businessType: "追觅" }, // 查询条件
    { $set: { businessType: "4" } } // 更新操作
  );
  
  db.getCollection("crafts").updateMany(
    { businessType: "添可" }, // 查询条件
    { $set: { businessType: "5" } } // 更新操作
  );
  