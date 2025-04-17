// 1
db.material_process_flows.updateMany(
  {
    barcode: {
      $in: [
        'WA2012DTJ0423',
        'WA2012DTJ0415',
        'WA2012DTJ0427',
        'WA2012DTJ0408',
        'WA2012DTJ0392',
        'WA2012DTJ0296',
        'WA2012DTJ0410',
        'WA2012H3J0403',
        'WA2012H3J0397',
        'WA2012DTJ0384'
      ]
    }
  },
  {
    $set: {
      productionPlanWorkOrderId: ObjectId('67bbd80b11efd297f6b13dea'),
      updateAt: new Date()
    }
  }
)

// 2
db.material_process_flows.updateMany(
  {
    barcode: {
      $in: [
        "WA2012H3J0139",
        "WA2012H3J0003",
        "WA2012H3J0012",
        "WA2012H3J0008",
        "WA2012DTJ0414",
        "WA2012DTJ0420",
        "WA2012DTJ0425",
        "WA2012DTJ0411",
        "WA2012DTJ0413",
        "WA2012DTJ0379",
        "WA2012DTJ0377",
        "WA2012DTJ0382",
        "WA2012DTJ0298",
        "WA2012DTJ0370",
        "WA2012DTJ0401",
        "WA2012H3J0092",
        "WA2012DTJ0391",
        "WA2012H3J0061",
        "WA2012H3J0020",
      ]
    }
  },
  {
    $set: {
      productionPlanWorkOrderId: ObjectId('67bbd84611efd297f6b13e53'),
      updateAt: new Date()
    }
  }
)


// 3
db.material_process_flows.updateMany(
  {
    barcode: {
      $in: [
        "WA2012DTJ0205",
        "WA2012DTJ0105",
        "WA2012DTJ0215",
        "WA2012DTJ0208",
        "WA2012DTJ0175",
        "WA2012DTJ0221",
        "WA2012H3J0429",
      ]
    }
  },
  {
    $set: {
      productionPlanWorkOrderId: ObjectId('67bbd87e11efd297f6b13f09'),
      updateAt: new Date()
    }
  }
)


// 4
db.material_process_flows.updateMany(
  {
    barcode: {
      $in: [
        "WA2012DTJ0394",
        "WA2012DTJ0385",
        "WA2012DTJ0289",
        "WA2012DTJ0475",
        "WA2012DTJ0043",
        "WA2012DTJ0429",
        "WA2012DTJ0350",
        "WA2012DTJ0431",
        "WA2012DTJ0430",
        "WA2012DTJ0497",
        "WA2012DTJ0428",
        "WA2012DTJ0070",
        "WA2012H3J0392",
      ]
    }
  },
  {
    $set: {
      productionPlanWorkOrderId: ObjectId('67bbd8af11efd297f6b13f4d'),
      updateAt: new Date()
    }
  }
)


// 5
db.material_process_flows.updateMany(
  {
    barcode: {
      $in: [
        "WA2012H3J0375",
      ]
    }
  },
  {
    $set: {
      productionPlanWorkOrderId: ObjectId('67bbd8cf11efd297f6b13f66'),
      updateAt: new Date()
    }
  }
)


// 6
db.material_process_flows.updateMany(
  {
    barcode: {
      $in: [
        "WA2028J2J0790",
        "WA2028J2J0794",
        "WA2028J2J0804",
        "WA2028J2J0818",
        "WA2028J2J0823",
        "WA2028J2J0814",
        "WA2028J2J0820",
        "WA2028J2J0786",
        "WA2028J2J0821",
        "WA2028J2J0815",
        "WA2028J2J0827",
        "WA2028J2J0850",
        "WA2028J2J0864",
        "WA2028J2J0871",
        "WA2028J2J0866",
        "WA2028J2J0865",
        "WA2028J2J0872",
        "WA2028J2J0859",
        "WA2028J2J0840",
        "WA2028J2J0854",
        "WA2028J2J0857",
        "WA2028J2J0845",
        "WA2028J2J0838",
        "WA2028J2J0839",
        "WA2028J2J0858",
        "WA2028J2J0860",
        "WA2028J2J0849",
        "WA2028J2J0847",
        "WA2028J2J0832",
        "WA2028J2J0841",
        "WA2028J2J0828",
        "WA2028HWJ2978",
        "WA2028J2J0853",
        "WA2028J2J0732",
        "WA2028J2J0743",
        "WA2028J2J0793",
        "WA2028J2J0835",
        "WA2028J2J0829",
        "WA2028J2J0831",
        "WA2028J2J0736",
      ]
    }
  },
  {
    $set: {
      productionPlanWorkOrderId: ObjectId('67da6aa3993f563407e06fc5'),
      updateAt: new Date()
    }
  }
)
