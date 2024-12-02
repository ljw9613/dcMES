const mongoose = require("mongoose");
const modelConfig = require("./model.json");

// 创建一个对象来存储所有生成的模型
const k3Models = {};

// 将JSON配置中的类型映射到Mongoose的Schema类型
const typeMapping = {
  string: String,
  number: Number,
  date: Date,
  boolean: Boolean,
};

// 遍历model.json中的每个模型配置并创建对应的Schema
modelConfig.forEach((model) => {
  // 创建Schema字段配置对象
  const schemaFields = {};

  // 处理header中定义的字段
  model.header.forEach((field) => {
    schemaFields[field.name] = {
      type: typeMapping[field.type],
      required: field.required || false,
      description: field.description,
    };
  });

  // 添加通用字段
  schemaFields.createBy = {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user_login",
  };
  schemaFields.createAt = {
    type: Date,
    default: Date.now,
  };
  schemaFields.updateAt = {
    type: Date,
    default: Date.now,
  };

  // 创建Schema
  const schema = new mongoose.Schema(schemaFields);

  // 创建并存储模型
  k3Models["k3_" + model.modelName] = mongoose.model(
    "k3_" + model.modelName,
    schema
  );
});

module.exports = k3Models;
