
import sys
# 设置默认编码为UTF-8
sys.stdout.reconfigure(encoding='utf-8')
import json
import logging

from k3cloud_webapi_sdk.main import K3CloudApiSdk
import time
import unittest

# 首先构造一个SDK实例
api_sdk = K3CloudApiSdk()

# 初始化方案一：Init初始化方法，使用conf.ini配置文件
# config_path:配置文件的相对或绝对路径，建议使用绝对路径
# config_node:配置文件中的节点名称
api_sdk.Init(config_path='libs/conf.ini', config_node='config')

current_time = time.strftime('%Y%m%d%H%M%S', time.localtime())
save_data = {
    "FCreateOrgId": {"FNumber": 100},
    "FUserOrgId": {"FNumber": 100},
    "FNumber": "xtwl" + current_time + "10001",
    "FName": "物料名称" + current_time + "10001"
}
FNumber = "xtwl" + current_time + "10001"



def Check_response(res):
    res = json.loads(res)
    if res["Result"]["ResponseStatus"]["IsSuccess"]:
        return True
    else:
        logging.error(res)
        return False




def views_Method(method_FormId,method_Query):
    """
    本接口用于实现查看某个详情功能
    :return:{"CreateOrgId":0,"Number":"10347","Id":"","IsSortBySeq":"false"}
    """
    # para = {"CreateOrgId":0,"Number":"10347","Id":"","IsSortBySeq":"false"}
    response = api_sdk.View(method_FormId,json.loads(method_Query))
    # print(json.dumps(response, ensure_ascii=False))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False



def BillQuery_Method(method_FormId,method_Query):
    """
    本接口用于实现 单据查询(json)功能
    :param kwargs:  
    {
        "FieldKeys": "FName,FNumber,FCreateOrgId,FUseOrgId",
        "FilterString": [],
        "OrderString": "",
        "TopRowCount": 100,
        "StartRow": 0,
        "Limit": 2000,
        "SubSystemId": ""
    }
    :return:
    """
    para = {
        "FormId": method_FormId,
    }
    doct1 = para
    doct2 = json.loads(method_Query) 
    doct1.update(doct2)
    response = api_sdk.ExecuteBillQuery(doct1)
    
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False

def Delete_Method(method_FormId,method_Query):
    """
    本接口用于实现删除某数据功能
    :return:{"CreateOrgId":0,"Numbers":[],"Ids":"","NetworkCtrl":""}
    """
    response = api_sdk.Delete(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def Draft_Method(method_FormId,method_Query):
    """
    本接口用于实现暂存某数据功能
    :return:{"NeedUpDateFields":[],"NeedReturnFields":[],"IsDeleteEntry":"true","SubSystemId":"","IsVerifyBaseDataField":"false","IsEntryBatchFill":"true","ValidateFlag":"true","NumberSearch":"true","IsAutoAdjustField":"false","InterationFlags":"","IgnoreInterationFlag":"","IsControlPrecision":"false","ValidateRepeatJson":"false","Model":{"FID":0,"FName":"","FStaffNumber":"","FMobile":"","FTel":"","FEmail":"","FDescription":"","FAddress":"","FUseOrgId":{"FNumber":""},"FCreateOrgId":{"FNumber":""},"FBranchID":{"FNUMBER":""},"FCreateSaler":"false","FCreateUser":"false","FUserRole":[{"FNumber":""}],"FCreateCashier":"false","FCashierGrp":{"FNUMBER":""},"FSalerId":{"FNUMBER":""},"FCashierId":{"FNUMBER":""},"FUserId":{"FUSERACCOUNT":""},"FPostId":{"FNUMBER":""},"FJoinDate":"1900-01-01","FUniportalNo":"","FSHRMapEntity":{"FMAPID":0},"FPostEntity":[{"FENTRYID":0,"FWorkOrgId":{"FNumber":""},"FPostDept":{"FNumber":""},"FPost":{"FNumber":""},"FStaffStartDate":"1900-01-01","FIsFirstPost":"false","FStaffDetails":0,"FOperatorType":""}],"FBankInfo":[{"FBankId":0,"FBankCountry":{"FNumber":""},"FBankCode":"","FBankTypeRec":{"FNUMBER":""},"FBankHolder":"","FTextBankDetail":"","FBankDetail":{"FNUMBER":""},"FOpenBankName":"","FOpenAddressRec":"","FCNAPS":"","FBankCurrencyId":{"FNUMBER":""},"FBankIsDefault":"false","FBankDesc":"","FIsFromSHR":"false","FCertType":"","FCertNum":""}]}}
    """
    response = api_sdk.Draft(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def Save_Method(method_FormId,method_Query):
    """
    本接口用于实现保存某数据功能
    :return:"{\"NeedUpDateFields\":[],\"NeedReturnFields\":[],\"IsDeleteEntry\":\"true\",\"SubSystemId\":\"\",\"IsVerifyBaseDataField\":\"false\",\"IsEntryBatchFill\":\"true\",\"ValidateFlag\":\"true\",\"NumberSearch\":\"true\",\"IsAutoAdjustField\":\"false\",\"InterationFlags\":\"\",\"IgnoreInterationFlag\":\"\",\"IsControlPrecision\":\"false\",\"ValidateRepeatJson\":\"false\",\"Model\":{\"FID\":0,\"FName\":\"\",\"FStaffNumber\":\"\",\"FMobile\":\"\",\"FTel\":\"\",\"FEmail\":\"\",\"FDescription\":\"\",\"FAddress\":\"\",\"FUseOrgId\":{\"FNumber\":\"\"},\"FCreateOrgId\":{\"FNumber\":\"\"},\"FBranchID\":{\"FNUMBER\":\"\"},\"FCreateSaler\":\"false\",\"FCreateUser\":\"false\",\"FUserRole\":[{\"FNumber\":\"\"}],\"FCreateCashier\":\"false\",\"FCashierGrp\":{\"FNUMBER\":\"\"},\"FSalerId\":{\"FNUMBER\":\"\"},\"FCashierId\":{\"FNUMBER\":\"\"},\"FUserId\":{\"FUSERACCOUNT\":\"\"},\"FPostId\":{\"FNUMBER\":\"\"},\"FJoinDate\":\"1900-01-01\",\"FUniportalNo\":\"\",\"FSHRMapEntity\":{\"FMAPID\":0},\"FPostEntity\":[{\"FENTRYID\":0,\"FWorkOrgId\":{\"FNumber\":\"\"},\"FPostDept\":{\"FNumber\":\"\"},\"FPost\":{\"FNumber\":\"\"},\"FStaffStartDate\":\"1900-01-01\",\"FIsFirstPost\":\"false\",\"FStaffDetails\":0,\"FOperatorType\":\"\"}],\"FBankInfo\":[{\"FBankId\":0,\"FBankCountry\":{\"FNumber\":\"\"},\"FBankCode\":\"\",\"FBankTypeRec\":{\"FNUMBER\":\"\"},\"FBankHolder\":\"\",\"FTextBankDetail\":\"\",\"FBankDetail\":{\"FNUMBER\":\"\"},\"FOpenBankName\":\"\",\"FOpenAddressRec\":\"\",\"FCNAPS\":\"\",\"FBankCurrencyId\":{\"FNUMBER\":\"\"},\"FBankIsDefault\":\"false\",\"FBankDesc\":\"\",\"FIsFromSHR\":\"false\",\"FCertType\":\"\",\"FCertNum\":\"\"}]}}";
    """
    response = api_sdk.Save(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def Submit_Method(method_FormId,method_Query):
    """
    本接口用于实现提交某数据功能
    :return:"{\"CreateOrgId\":0,\"Numbers\":[],\"Ids\":\"\",\"SelectedPostId\":0,\"UseOrgId\":0,\"NetworkCtrl\":\"\",\"IgnoreInterationFlag\":\"\"}";
    """
    response = api_sdk.Submit(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def Audit_Method(method_FormId,method_Query):
    """
    本接口用于实现审核某数据功能
    :return: "{\"CreateOrgId\":0,\"Numbers\":[],\"Ids\":\"\",\"InterationFlags\":\"\",\"UseOrgId\":0,\"NetworkCtrl\":\"\",\"IsVerifyProcInst\":\"true\",\"IgnoreInterationFlag\":\"\",\"UseBatControlTimes\":\"false\"}";
    """
    response = api_sdk.Audit(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def UnAudit_Method(method_FormId,method_Query):
    """
    本接口用于实现反审核某数据功能
    :return: "{\"CreateOrgId\":0,\"Numbers\":[],\"Ids\":\"\",\"InterationFlags\":\"\",\"IgnoreInterationFlag\":\"\",\"UseOrgId\":0,\"NetworkCtrl\":\"\",\"IsVerifyProcInst\":\"true\"}";
    """
    response = api_sdk.unAudit(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def Forbid_Method(method_FormId,method_Query):
    """
    本接口用于实现禁用某数据功能
    :return: "{\"CreateOrgId\":0,\"Numbers\":[],\"Ids\":\"\",\"InterationFlags\":\"\",\"IgnoreInterationFlag\":\"\",\"UseOrgId\":0,\"NetworkCtrl\":\"\",\"IsVerifyProcInst\":\"true\"}";
    """
    response = api_sdk.excuteOperation(method_FormId,'Forbid',json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False


def Enable_Method(method_FormId,method_Query):
    """
    本接口用于实现反禁用某数据功能
    :return:{"CreateOrgId":0,"Numbers":[],"Ids":"","PkEntryIds":[],"UseOrgId":0,"NetworkCtrl":"","IgnoreInterationFlag":""}
    """
    response = api_sdk.excuteOperation(method_FormId,'Enable',json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False

def CancelAssign_Method(method_FormId,method_Query):
    """
    本接口用于实现撤销某数据功能
    :return:{"CreateOrgId":0,"Numbers":[],"Ids":"","PkEntryIds":[],"UseOrgId":0,"NetworkCtrl":"","IgnoreInterationFlag":""}
    """
    response = api_sdk.CancelAssign(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False

def CreateUser_Method(method_FormId,method_Query):
    """
    本接口用于实现创建账号功能
    :return:{"Parameters":"","Numbers":[],"Ids":"","Model":{"FID":0,"FName":"","FStaffNumber":"","FMobile":"","FTel":"","FEmail":"","FDescription":"","FAddress":"","FUseOrgId":{"FNumber":""},"FCreateOrgId":{"FNumber":""},"FBranchID":{"FNUMBER":""},"FCreateSaler":"false","FCreateUser":"false","FUserRole":[{"FNumber":""}],"FCreateCashier":"false","FCashierGrp":{"FNUMBER":""},"FSalerId":{"FNUMBER":""},"FCashierId":{"FNUMBER":""},"FUserId":{"FUSERACCOUNT":""},"FPostId":{"FNUMBER":""},"FJoinDate":"1900-01-01","FUniportalNo":"","FSHRMapEntity":{"FMAPID":0},"FPostEntity":[{"FENTRYID":0,"FWorkOrgId":{"FNumber":""},"FPostDept":{"FNumber":""},"FPost":{"FNumber":""},"FStaffStartDate":"1900-01-01","FIsFirstPost":"false","FStaffDetails":0,"FOperatorType":""}],"FBankInfo":[{"FBankId":0,"FBankCountry":{"FNumber":""},"FBankCode":"","FBankTypeRec":{"FNUMBER":""},"FBankHolder":"","FTextBankDetail":"","FBankDetail":{"FNUMBER":""},"FOpenBankName":"","FOpenAddressRec":"","FCNAPS":"","FBankCurrencyId":{"FNUMBER":""},"FBankIsDefault":"false","FBankDesc":"","FIsFromSHR":"false","FCertType":"","FCertNum":""}]}}
    """
    response = api_sdk.ExcuteOperation(method_FormId,'CreateUser',json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False


def CreateUser_Method(method_FormId,method_Query):
    """
    本接口用于实现创建账号功能
    :return:{"Parameters":"","Numbers":[],"Ids":"","Model":{"FID":0,"FName":"","FStaffNumber":"","FMobile":"","FTel":"","FEmail":"","FDescription":"","FAddress":"","FUseOrgId":{"FNumber":""},"FCreateOrgId":{"FNumber":""},"FBranchID":{"FNUMBER":""},"FCreateSaler":"false","FCreateUser":"false","FUserRole":[{"FNumber":""}],"FCreateCashier":"false","FCashierGrp":{"FNUMBER":""},"FSalerId":{"FNUMBER":""},"FCashierId":{"FNUMBER":""},"FUserId":{"FUSERACCOUNT":""},"FPostId":{"FNUMBER":""},"FJoinDate":"1900-01-01","FUniportalNo":"","FSHRMapEntity":{"FMAPID":0},"FPostEntity":[{"FENTRYID":0,"FWorkOrgId":{"FNumber":""},"FPostDept":{"FNumber":""},"FPost":{"FNumber":""},"FStaffStartDate":"1900-01-01","FIsFirstPost":"false","FStaffDetails":0,"FOperatorType":""}],"FBankInfo":[{"FBankId":0,"FBankCountry":{"FNumber":""},"FBankCode":"","FBankTypeRec":{"FNUMBER":""},"FBankHolder":"","FTextBankDetail":"","FBankDetail":{"FNUMBER":""},"FOpenBankName":"","FOpenAddressRec":"","FCNAPS":"","FBankCurrencyId":{"FNUMBER":""},"FBankIsDefault":"false","FBankDesc":"","FIsFromSHR":"false","FCertType":"","FCertNum":""}]}}
    """
    response = api_sdk.ExcuteOperation(method_FormId,'CreateUser',json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False


def Allocate_Method(method_FormId,method_Query):
    """
    本接口用于分配 数据功能
    :return:{"PkIds":0,"TOrgIds":""}
    """
    response = api_sdk.Allocate(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def CancelAllocate_Method(method_FormId,method_Query):
    """
    本接口用于取消分配 数据功能
    :return:{"PkIds":0,"TOrgIds":""}
    """
    response = api_sdk.CancelAllocate(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False
def BatchSave_Method(method_FormId,method_Query):
    """
    本接口用于批量保存 数据功能
    :return:{"NumberSearch":"true","ValidateFlag":"true","IsDeleteEntry":"true","IsEntryBatchFill":"true","NeedUpDateFields":[],"NeedReturnFields":[],"SubSystemId":"","InterationFlags":"","Model":[],"BatchCount":0,"IsVerifyBaseDataField":"false","IsAutoAdjustField":"false","IgnoreInterationFlag":"false","IsControlPrecision":"false","ValidateRepeatJson":"false"}
    """
    response = api_sdk.BatchSave(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False

def Push_Method(method_FormId,method_Query):
    """
    本接口用于下推功能
    """
    response = api_sdk.Push(method_FormId,json.loads(method_Query))
    print(json.dumps(response, ensure_ascii=False))
    res = json.loads(response)
    if len(res) > 0:
        return True
    return False


# 从命令行参数获取方法名
method_name = sys.argv[1]
method_FormId = sys.argv[2]
method_Query = sys.argv[3]
# 根据方法名调用相应的方法
if method_name == 'View':
    views_Method(method_FormId,method_Query) #查看
elif method_name == 'BillQuery':
    BillQuery_Method(method_FormId,method_Query)#单据查询（列表查询）
elif method_name == 'Delete':
    Delete_Method(method_FormId,method_Query)#删除
elif method_name == 'Draft':
    Draft_Method(method_FormId,method_Query)#暂存
elif method_name == 'Save':
    Save_Method(method_FormId,method_Query)#保存
elif method_name == 'Submit':
    Submit_Method(method_FormId,method_Query)#提交
elif method_name == 'Audit':
    Audit_Method(method_FormId,method_Query)#审核
elif method_name == 'UnAudit':
    UnAudit_Method(method_FormId,method_Query)#反审核
elif method_name == 'Forbid':
    Forbid_Method(method_FormId,method_Query)#禁用
elif method_name == 'Enable':
    Enable_Method(method_FormId,method_Query)#反禁用
elif method_name == 'CancelAssign':
    CancelAssign_Method(method_FormId,method_Query)#撤销
elif method_name == 'CancelAssign':
    CreateUser_Method(method_FormId,method_Query)#创建用户账号
elif method_name == 'Allocate':
    Allocate_Method(method_FormId,method_Query)#分配
elif method_name == 'CancelAllocate':
    CancelAllocate_Method(method_FormId,method_Query)#反分配
elif method_name == 'BatchSave':
    BatchSave_Method(method_FormId,method_Query)#批量保存
elif method_name == 'Push':
    Push_Method(method_FormId,method_Query)#批量保存



    
else:
    print(f"未知方法：{method_name}")