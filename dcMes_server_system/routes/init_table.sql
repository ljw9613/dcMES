-- 如果表已存在则删除
IF OBJECT_ID('MaterialBarcodeBatch', 'U') IS NOT NULL
    DROP TABLE MaterialBarcodeBatch
GO

-- 创建 MaterialBarcodeBatch 表
CREATE TABLE MaterialBarcodeBatch (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BatchId VARCHAR(100) NOT NULL,
    MaterialCode VARCHAR(50) NOT NULL,
    IpAddress VARCHAR(50) NOT NULL,
    CreateBy VARCHAR(50) NOT NULL,
    CreateTime DATETIME NOT NULL DEFAULT GETDATE(),
    UpdateBy VARCHAR(50),
    UpdateTime DATETIME
)
GO

-- 创建索引
CREATE UNIQUE INDEX IX_MaterialBarcodeBatch_BatchId ON MaterialBarcodeBatch(BatchId)
CREATE INDEX IX_MaterialBarcodeBatch_IpAddress ON MaterialBarcodeBatch(IpAddress)
GO

-- 添加表说明
EXEC sp_addextendedproperty 
    @name = N'MS_Description',   
    @value = N'物料条码批次表',   
    @level0type = N'SCHEMA',  
    @level0name = N'dbo',  
    @level1type = N'TABLE',  
    @level1name = N'MaterialBarcodeBatch'
GO

-- 添加字段说明
EXEC sp_addextendedproperty 'MS_Description', '自增主键', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'Id'
EXEC sp_addextendedproperty 'MS_Description', '批次号', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'BatchId'
EXEC sp_addextendedproperty 'MS_Description', '物料编码', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'MaterialCode'
EXEC sp_addextendedproperty 'MS_Description', 'IP地址', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'IpAddress'
EXEC sp_addextendedproperty 'MS_Description', '创建人', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'CreateBy'
EXEC sp_addextendedproperty 'MS_Description', '创建时间', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'CreateTime'
EXEC sp_addextendedproperty 'MS_Description', '更新人', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'UpdateBy'
EXEC sp_addextendedproperty 'MS_Description', '更新时间', 'SCHEMA', 'dbo', 'TABLE', 'MaterialBarcodeBatch', 'COLUMN', 'UpdateTime'
GO 