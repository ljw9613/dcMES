var mongoose = require("mongoose");

var materialSchema = new mongoose.Schema({
    FMATERIALID: { type: Number }, // 实体主键
    FDocumentStatus: { type: String }, // 数据状态
    FForbidStatus: { type: String }, // 禁用状态
    FName: { type: String, required: true }, // 名称
    FNumber: { type: String }, // 编码
    FDescription: { type: String }, // 描述
    FCreateOrgId: { type: String, required: true }, // 创建组织
    FUseOrgId: { type: String, required: true }, // 使用组织
    
    // 基础信息
    FOldNumber: { type: String }, // 旧物料编码
    FMnemonicCode: { type: String }, // 助记码
    FSpecification: { type: String }, // 规格型号
    FMaterialGroup: { type: String }, // 物料分组
    FBaseProperty: { type: String }, // 物料分组编码
    FPLMMaterialId: { type: String }, // PLM物料内码
    FMaterialSRC: { type: String }, // 物料来源
    
    // 图片相关
    FImage1: { type: String }, // 图片(数据库)
    FImageFileServer: { type: String }, // 图片(文件服务器)
    FImgStorageType: { type: String }, // 图片存储类型
    
    // 业务属性
    FIsSalseByNet: { type: Boolean }, // 是否网销
    FIsAutoAllocate: { type: Boolean }, // 自动分配
    FSPUID: { type: String }, // SPU信息
    FPinYin: { type: String }, // 拼音
    FDSMatchByLot: { type: Boolean }, // 按批号匹配供需
    FRefStatus: { type: String }, // 已使用
    
    // 单位和仓库信息
    FBaseUnitId_FName: { type: String, required: true }, // 基本单位
    FBaseUnitId_FNumber: { type: String, required: true }, // 基本单位编码
    FStockId_FNumber: { type: String, required: true }, // 仓库编码
    FStockId_FName: { type: String, required: true }, // 仓库
    FPickStockId_FNumber: { type: String, required: true }, // 发料仓库编码
    FPickStockId_FName: { type: String, required: true }, // 发料仓库
    
    // 自定义字段
    F_TFQJ_TZBM1: { type: String }, // 图纸编码
    F_TFQJ_LLCJ: { type: String }, // 领料车间
    F_TFQJ_SFZDKZ: { type: String }, // 是否自动扣账
    F_TFQJ_SFZDLL: { type: String }, // 是否自动领料
    F_TFQJ_CheckBox: { type: String }, // 是否长新物料
    FNameEn: { type: String }, // 英文名称
    
    // 审核和状态信息
    FForbidReson: { type: String }, // 禁用原因
    FCreatorId: { type: String }, // 创建人
    FModifierId: { type: String }, // 修改人
    FCreateDate: { type: Date }, // 创建日期
    FModifyDate: { type: Date }, // 修改日期
    FForbidderId: { type: String }, // 禁用人
    FApproverId: { type: String }, // 审核人
    FForbidDate: { type: Date }, // 禁用日期
    FApproveDate: { type: Date } // 审核日期
});

module.exports = mongoose.model("k3_BD_MATERIAL", materialSchema);