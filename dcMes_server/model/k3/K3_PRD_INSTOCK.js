var mongoose = require("mongoose");

// 明细表Schema
const entitySchema = new mongoose.Schema({
    FEntryID: { type: Number }, // 实体主键
    FMaterialId: { type: String, required: true }, // 物料编码
    FMaterialName: { type: String }, // 物料名称
    FSpecification: { type: String }, // 规格型号
    FProductType: { type: String }, // 产品类型
    FInStockType: { type: String, required: true }, // 入库类型
    FUnitID: { type: String, required: true }, // 单位
    FBaseUnitId: { type: String, required: true }, // 基本单位
    FMustQty: { type: Number }, // 应收数量
    FBaseMustQty: { type: Number }, // 基本单位应收数量
    FRealQty: { type: Number }, // 实收数量
    FBaseRealQty: { type: Number }, // 基本单位库存实收数量
    FOwnerTypeId: { type: String, required: true }, // 货主类型
    FOwnerId: { type: String, required: true }, // 货主
    FStockId: { type: String, required: true }, // 仓库
    FStockLocId: { type: String }, // 仓位
    FMoBillNo: { type: String, required: true }, // 生产订单编号
    FStockStatusId: { type: String, required: true }, // 库存状态
    FKeeperTypeId: { type: String, required: true }, // 保管者类型
    FKeeperId: { type: String, required: true }, // 保管者
    FProduceDate: { type: Date, default: "1900-01-01" }, // 生产日期
    FExpiryDate: { type: Date, default: "1900-01-01" }, // 过期日期
    FSelReStkQty: { type: Number, default: 0 }, // 选择入库数量
    FBaseSelReStkQty: { type: Number, default: 0 }, // 基本单位选择入库数量
    F_dcdj_cpwlmc: {
        FNUMBER: { type: String, default: "" } // 产品物料名称编号
    },
    FSrcBusinessType: { type: String, default: "" }, // 源业务类型
    FIsOverLegalOrg: { type: String, default: "false" }, // 是否超出法定机构
    F_dcdj_cpsl: { type: Number, default: 0 }, // 产品数量
    FSendRowId: { type: String, default: "" }, // 发送行ID
    F_VMKO_BWBDJ: { type: Number, default: 0 }, // 包装本地价
    F_VMKO_BWBJE: { type: Number, default: 0 }, // 包装本地价金额
    F_VMKO_JH: { type: String, default: "" }, // 计划号
    F_VMKO_DDH: { type: String, default: "" }, // 订单号
    F_VMKO_SJD: { type: String, default: "" }, // 送货单号
    F_VMKO_TH: { type: String, default: "" }, // 托运单号
    F_VMKO_SFGZ: { type: String, default: "" }, // 收发工资
    F_TFQJ_dbsl: { type: Number, default: 0 }, // 调拨数量
    F_TFQJ_tpbh1: { type: String, default: "" }, // 托盘编号1
    F_TFQJ_tmbh: { type: String, default: "" }, // 条码编号
    F_TFQJ_zjsl: { type: Number, default: 0 }, // 总计数量
    F_TFQJ_ynsl: { type: Number, default: 0 }, // 应纳数量
    F_TFQJ_smqbh: { type: String, default: "" }, // 司码前编号
    FSerialSubEntity: [{
        FDetailID: { type: Number, default: 0 }, // 明细ID
        FSerialNo: { type: String, default: "" }, // 序列号
        FSerialId: {
            FNumber: { type: String, default: "" } // 序列ID编号
        },
        FQty: { type: Number, default: 0 }, // 数量
        FBaseSNQty: { type: Number, default: 0 }, // 基本单位序列号数量
        FSerialNote: { type: String, default: "" } // 序列备注
    }]
});

// 主表Schema
const instockSchema = new mongoose.Schema({
    // 基本信息
    FID: { type: Number, required: true, unique: true }, // 实体主键
    FBillNo: { type: String }, // 单据编号
    FDocumentStatus: { type: String }, // 单据状态
    FDate: { type: Date, required: true }, // 日期
    FDescription: { type: String }, // 备注

    // 组织信息
    FPrdOrgId: { type: String, required: true }, // 生产组织
    FStockOrgId: { type: String, required: true }, // 入库组织
    FWorkShopId: { type: String }, // 车间
    FStockId0: { type: String }, // 仓库
    FOwnerTypeId0: { type: String }, // 货主类型
    FOwnerId0: { type: String, required: true }, // 货主

    // 单据类型
    FBillType: { type: String, required: true }, // 单据类型

    // 创建和修改信息
    FCreatorId: { type: String }, // 创建人
    FCreateDate: { type: Date }, // 创建日期
    FModifierId: { type: String }, // 修改人
    FModifyDate: { type: Date }, // 修改日期

    // 审核信息
    FApproverId: { type: String }, // 审核人
    FApproveDate: { type: Date }, // 审核日期

    // 作废信息
    FCancelStatus: { type: String }, // 作废状态
    FCanceler: { type: String }, // 作废人
    FCancelDate: { type: Date }, // 作废日期

    // 其他业务信息
    FCurrId: { type: String }, // 本位币
    FSTOCKERID: { type: String }, // 仓管员
    FIsEntrust: { type: Boolean }, // 组织委托加工
    FScanBox: { type: String }, // 序列号上传
    F_VMKO_RWDH: { type: String }, // 任务单号
    F_VMKO_GHDW: { type: String }, // 购货单位
    F_TFQJ_TPH: { type: String }, // 托盘号
    F_TFQJ_ERWM: { type: String }, // 二维码
    F_TFQJ_HGH: { type: String }, // 货柜号
    F_TFQJ_CheckBox: { type: Boolean }, // 是否自动生成卓捷/越南调拨单

    // 明细行
    FEntity: [entitySchema]
});

module.exports = mongoose.model("k3_PRD_INSTOCK", instockSchema);
