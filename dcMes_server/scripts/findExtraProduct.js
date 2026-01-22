/**
 * 查找多余的产品条码
 * @description 精确定位哪个托盘的哪个产品是多余的
 */

const mongoose = require("mongoose");
const wareHouseOntry = require("../model/warehouse/warehouseOntry");
const MaterialPallet = require("../model/project/materialPalletizing");

// 数据库连接配置
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 27017,
  database: process.env.DB_NAME || "dcmes",
  username: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
};

// 构建数据库连接字符串
function getConnectionString() {
  if (DB_CONFIG.username && DB_CONFIG.password) {
    return `mongodb://${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
  }
  return `mongodb://${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
}

async function findExtraProduct() {
  try {
    console.log("========================================");
    console.log("查找多余的产品条码");
    console.log("========================================\n");

    // 连接数据库
    console.log("正在连接数据库...");
    await mongoose.connect(getConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("数据库连接成功\n");

    // 1. 获取出库单
    const entry = await wareHouseOntry.findOne({
      entryNo: "SCCK-MES-20251102-0001",
    });

    if (!entry) {
      console.error("❌ 未找到出库单");
      return;
    }

    console.log(`出库单号: ${entry.entryNo}`);
    console.log(`应出库数量: ${entry.outboundQuantity}`);
    console.log(`实际出库数量: ${entry.outNumber}`);
    console.log(`超出数量: ${entry.outNumber - entry.outboundQuantity}\n`);

    // 2. 分析可疑托盘
    console.log("分析可疑托盘...\n");

    const suspiciousPallets = [];

    for (const item of entry.entryItems) {
      // 获取托盘信息
      const pallet = await MaterialPallet.findById(item.palletId);

      if (!pallet) {
        console.log(`⚠️  托盘 ${item.palletCode} 在数据库中不存在`);
        continue;
      }

      // 检查托盘中已出库的条码数量
      const outWarehouseBarcodes = pallet.palletBarcodes.filter(
        (b) => b.outWarehouseStatus === "COMPLETED"
      );

      const entryBarcodesCount = item.palletBarcodes
        ? item.palletBarcodes.length
        : 0;

      // 如果托盘中已出库的数量大于出库单中记录的数量，说明有问题
      if (outWarehouseBarcodes.length > entryBarcodesCount) {
        console.log(`🔍 发现可疑托盘: ${item.palletCode}`);
        console.log(`   托盘ID: ${item.palletId}`);
        console.log(`   出库单中记录: ${entryBarcodesCount} 个产品`);
        console.log(
          `   托盘中已出库: ${outWarehouseBarcodes.length} 个产品`
        );
        console.log(
          `   差异: ${outWarehouseBarcodes.length - entryBarcodesCount} 个\n`
        );

        // 找出哪些条码在托盘中已出库，但不在出库单中
        const entryBarcodes = item.palletBarcodes
          ? item.palletBarcodes.map((b) => b.barcode)
          : [];
        const extraBarcodes = outWarehouseBarcodes.filter(
          (b) => !entryBarcodes.includes(b.barcode)
        );

        suspiciousPallets.push({
          palletCode: item.palletCode,
          palletId: item.palletId,
          entryBarcodesCount,
          palletOutWarehouseCount: outWarehouseBarcodes.length,
          difference: outWarehouseBarcodes.length - entryBarcodesCount,
          extraBarcodes: extraBarcodes.map((b) => ({
            barcode: b.barcode,
            barcodeType: b.barcodeType,
            outWarehouseStatus: b.outWarehouseStatus,
            outWarehouseTime: b.outWarehouseTime,
            outWarehouseBy: b.outWarehouseBy,
          })),
        });
      }
    }

    // 3. 输出结果
    console.log("========================================");
    console.log("分析结果");
    console.log("========================================\n");

    if (suspiciousPallets.length === 0) {
      console.log("✅ 未找到可疑托盘（数据可能已修复）");
    } else {
      console.log(`找到 ${suspiciousPallets.length} 个可疑托盘：\n`);

      suspiciousPallets.forEach((pallet, index) => {
        console.log(`${index + 1}. 托盘: ${pallet.palletCode}`);
        console.log(`   托盘ID: ${pallet.palletId}`);
        console.log(`   出库单记录: ${pallet.entryBarcodesCount} 个产品`);
        console.log(
          `   托盘已出库: ${pallet.palletOutWarehouseCount} 个产品`
        );
        console.log(`   多余: ${pallet.difference} 个产品\n`);

        if (pallet.extraBarcodes.length > 0) {
          console.log(`   多余的产品条码:`);
          pallet.extraBarcodes.forEach((barcode, i) => {
            console.log(`   ${i + 1}. 条码: ${barcode.barcode}`);
            console.log(`      类型: ${barcode.barcodeType}`);
            console.log(
              `      出库状态: ${barcode.outWarehouseStatus || "PENDING"}`
            );
            console.log(
              `      出库时间: ${
                barcode.outWarehouseTime
                  ? new Date(barcode.outWarehouseTime).toLocaleString("zh-CN")
                  : "未设置"
              }`
            );
            console.log(`      操作人: ${barcode.outWarehouseBy || "未设置"}`);
            console.log("");
          });
        }
      });

      // 4. 生成修复建议
      console.log("========================================");
      console.log("修复建议");
      console.log("========================================\n");

      console.log("方案1: 调整应出库数量（推荐）");
      console.log(
        `  将应出库数量从 ${entry.outboundQuantity} 调整为 ${entry.outNumber}`
      );
      console.log("  命令:");
      console.log(
        `  mongo dcmes --eval 'db.warehouseontries.updateOne({entryNo:"${entry.entryNo}"},{$set:{outboundQuantity:${entry.outNumber},updateAt:new Date()}})'`
      );
      console.log("");

      console.log("方案2: 删除多余的产品（严格控制数量）");
      suspiciousPallets.forEach((pallet) => {
        if (pallet.extraBarcodes.length > 0) {
          pallet.extraBarcodes.forEach((barcode) => {
            console.log(`  删除条码: ${barcode.barcode}`);
            console.log(`  从托盘: ${pallet.palletCode}`);
            console.log("");
            console.log("  步骤1: 从出库单中删除（如果存在）");
            console.log(
              `  mongo dcmes --eval 'db.warehouseontries.updateOne({entryNo:"${entry.entryNo}","entryItems.palletCode":"${pallet.palletCode}"},{$pull:{"entryItems.$.palletBarcodes":{barcode:"${barcode.barcode}"}}})'`
            );
            console.log("");
            console.log("  步骤2: 恢复托盘中条码的状态");
            console.log(
              `  mongo dcmes --eval 'db.materialpalletizings.updateOne({palletCode:"${pallet.palletCode}"},{$set:{"palletBarcodes.$[elem].outWarehouseStatus":"PENDING","palletBarcodes.$[elem].outWarehouseTime":null,"palletBarcodes.$[elem].outWarehouseBy":null}},{arrayFilters:[{"elem.barcode":"${barcode.barcode}"}]})'`
            );
            console.log("");
            console.log(
              "  步骤3: 更新托盘状态为 PART_OUT_WAREHOUSE"
            );
            console.log(
              `  mongo dcmes --eval 'db.materialpalletizings.updateOne({palletCode:"${pallet.palletCode}"},{$set:{inWarehouseStatus:"PART_OUT_WAREHOUSE",updateAt:new Date()}})'`
            );
            console.log("");
            console.log("  步骤4: 运行修复脚本重新计算数量");
            console.log(
              `  node scripts/fixWarehouseEntryQuantity.js --entryNo ${entry.entryNo}`
            );
            console.log("");
          });
        }
      });
    }

    // 保存结果到文件
    const fs = require("fs");
    const reportPath = `./extra_product_report_${Date.now()}.json`;
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          checkTime: new Date(),
          entryNo: entry.entryNo,
          outboundQuantity: entry.outboundQuantity,
          outNumber: entry.outNumber,
          exceeded: entry.outNumber - entry.outboundQuantity,
          suspiciousPallets,
        },
        null,
        2
      )
    );

    console.log(`\n详细报告已保存到: ${reportPath}`);
  } catch (error) {
    console.error("查找过程中发生错误:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n数据库连接已关闭");
  }
}

// 运行
findExtraProduct().catch(console.error);










