// MongoDB Shell命令
// 第一步：切换到正确的数据库
use dechang_mes

// 第二步：执行更新命令
db.material_process_flow.updateMany(
  {
    barcode: {
      $in: [
        'V2513054TCN00111A8',
        'V2513054TCN00097A8',
        'V2513054TCN00096A8',
        'V2513054TCN00108A8',
        'V2513054TCN00107A8',
        'V2513054TCN00112A8',
        'V2513054TCN00103A8',
        'V2513054TCN00117A8',
        'V2513054TCN00106A8',
        'V2513054TCN00092A8',
        'V2513054TCN00104A8',
        'V2513054TCN00116A8',
        'V2513054TCN00094A8',
        'V2513054TCN00115A8',
        'V2513054TCN00098A8',
        'V2513054TCN00114A8',
        'V2513054TCN00095A8',
        'V2513054TCN00100A8',
        'V2513054TCN00099A8',
        'V2513054TCN00113A8',
        'V2513054TCN00110A8',
        'V2513054TCN00091A8',
        'V2513054TCN00105A8',
        'V2513054TCN00093A8',
        'V2513054RCN00006A8',
        'V2513054TCN00102A8',
        'V2513054TCN00101A8'
      ]
    },
    'processNodes.processStepId': ObjectId('67e3a5b93f35abd72ee066c6')
  },
  {
    $set: {
      'processNodes.$[elem].processStepId': ObjectId('680db7af08834dee14376167')
    }
  },
  {
    arrayFilters: [{ 'elem.processStepId': ObjectId('67e3a5b93f35abd72ee066c6') }]
  }
) 