/**
 * 写入测试用接口配置数据
 * 运行方式：node scripts/seedTestApiConfigs.js
 *
 * 对应 routes/testMockApi.js 中的 Mock 接口，涵盖：
 *  - GET    无参数       - ping
 *  - GET    Query        - echo
 *  - POST   form-data    - echo-body
 *  - POST   urlencoded   - echo-urlencoded
 *  - POST   文件上传     - echo-file
 *  - GET    延迟响应     - delay/2000
 *  - GET    模拟失败     - error/500
 *  - POST   参数校验     - validate
 *  - PUT    Body 回显    - echo-put
 *  - PUT    资源更新     - update/:id
 *  - PUT    带校验更新   - update-validate
 *  - DELETE Path 删除    - delete/:id
 *  - DELETE Query 批删   - delete-query
 */

const mongoose = require("mongoose");
require("../db")();

const BASE = "http://127.0.0.1:2222/api/v1/mock";

const configs = [
  {
    name: "[测试] 心跳检测 Ping",
    url: `${BASE}/ping`,
    method: "GET",
    status: 1,
    description: "无需任何参数，测试接口是否可达。\n调用方式：自定义参数 → Query（参数列表留空）",
  },
  {
    name: "[测试] Query 参数回显",
    url: `${BASE}/echo`,
    method: "GET",
    status: 1,
    description: "将所有 Query 参数原样返回。\n调用方式：自定义参数 → Query\n示例参数：name=张三 / code=DC001",
  },
  {
    name: "[测试] Body form-data 参数回显",
    url: `${BASE}/echo-body`,
    method: "POST",
    status: 1,
    description: "接收 form-data 格式 Body，将参数原样返回。\n调用方式：自定义参数 → Body form-data\n示例参数：name=张三 / age=18",
  },
  {
    name: "[测试] Body urlencoded 参数回显",
    url: `${BASE}/echo-urlencoded`,
    method: "POST",
    status: 1,
    description: "接收 x-www-form-urlencoded 格式 Body，将参数原样返回。\n调用方式：自定义参数 → Body urlencoded\n示例参数：name=张三 / value=abc",
  },
  {
    name: "[测试] 文件上传回显",
    url: `${BASE}/echo-file`,
    method: "POST",
    status: 1,
    description: "接收 multipart/form-data 文件（字段名：file），返回文件名、大小等信息，不保存文件。\n调用方式：文件调用模式",
  },
  {
    name: "[测试] 延迟响应 2秒",
    url: `${BASE}/delay/2000`,
    method: "GET",
    status: 1,
    description: "延迟 2000ms 后返回，用于测试耗时展示。\n调用方式：自定义参数 → Query（参数列表留空）",
  },
  {
    name: "[测试] 模拟服务器错误 500",
    url: `${BASE}/error/500`,
    method: "GET",
    status: 1,
    description: "返回 HTTP 500 错误，用于测试失败重试功能。\n调用方式：自定义参数 → Query（参数列表留空）",
  },
  {
    name: "[测试] 参数校验接口",
    url: `${BASE}/validate`,
    method: "POST",
    status: 1,
    description: "name 和 value 为必填。\n- 两个字段均填写 → 返回成功\n- 缺少任意一个 → 返回 422 错误\n调用方式：自定义参数 → Body form-data\n示例参数：name=张三 / value=DC001",
  },
  {
    name: "[测试] PUT Body 参数回显",
    url: `${BASE}/echo-put`,
    method: "PUT",
    status: 1,
    description: "将 PUT 请求的 Body（form-data / urlencoded）参数原样返回。\n调用方式：自定义参数 → Body form-data\n示例参数：name=张三 / remark=更新测试",
  },
  {
    name: "[测试] PUT 按 ID 更新资源",
    url: `${BASE}/update/001`,
    method: "PUT",
    status: 1,
    description: "模拟按资源 ID 更新数据，Path 中的 id 与 Body 参数一并回显。\nURL 中的 001 可替换为任意 ID。\n调用方式：自定义参数 → Body form-data\n示例参数：name=产品A / status=active",
  },
  {
    name: "[测试] PUT 带校验的更新接口",
    url: `${BASE}/update-validate`,
    method: "PUT",
    status: 1,
    description: "id、name、value 均为必填。\n- 全部填写 → 返回成功\n- 缺少任意一个 → 返回 422 错误\n调用方式：自定义参数 → Body form-data\n示例参数：id=001 / name=产品A / value=DC-PROD-001",
  },
  {
    name: "[测试] DELETE 按 ID 删除资源",
    url: `${BASE}/delete/001`,
    method: "DELETE",
    status: 1,
    description: "模拟按资源 ID 删除，Path 中的 001 可替换为任意 ID，返回被删除资源信息。\n调用方式：自定义参数 → Query（参数列表留空，ID 已在 URL 中）",
  },
  {
    name: "[测试] DELETE 按 Query 批量删除",
    url: `${BASE}/delete-query`,
    method: "DELETE",
    status: 1,
    description: "按 Query 参数 ids（逗号分隔）批量删除，ids 为必填，缺少则返回 400。\n调用方式：自定义参数 → Query\n示例参数：ids=001,002,003",
  },
];

async function seed() {
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once("open", resolve);
  });

  const ThirdPartyApiConfig = require("../model/project/thirdPartyApiConfig");

  let created = 0;
  let skipped = 0;

  for (const cfg of configs) {
    const exists = await ThirdPartyApiConfig.findOne({ name: cfg.name, deleted: { $ne: true } });
    if (exists) {
      console.log(`⏭  已存在，跳过：${cfg.name}`);
      skipped++;
      continue;
    }
    await ThirdPartyApiConfig.create({
      ...cfg,
      createdBy: "system",
      createdName: "系统初始化",
      updatedBy: "system",
      updatedName: "系统初始化",
    });
    console.log(`✅ 已写入：${cfg.name}`);
    created++;
  }

  console.log(`\n🎉 完成！写入 ${created} 条，跳过 ${skipped} 条。`);
  console.log("刷新接口配置列表页即可看到测试数据。");
  mongoose.connection.close();
}

seed().catch((err) => {
  console.error("❌ 写入失败:", err.message);
  mongoose.connection.close();
  process.exit(1);
});
