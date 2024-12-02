module.exports = function (app, biaoMing, schemaModel) {
  app
    .route(`/api/v1/${biaoMing}`)
    .get(async (req, res, next) => {
      try {
        var queryData = {};
        var findData = {};
        var selectData = {};
        if (req.query) {
          queryData = req.query;
          console.log(typeof (queryData), 'queryData')
        }
        if (queryData.query) {
          if (typeof (queryData.query) == 'string') {
            findData = JSON.parse(queryData.query);
          } else {
            findData = (queryData.query);
          }
        }
        if (req.select) {
          selectData = JSON.parse(req.select);
        }
        var model = schemaModel.find(findData, selectData);

        if (queryData.populate) {
          var populates = JSON.parse(queryData.populate);
          populates.forEach((p) => {
            model.populate(p);
          });
        }
        if (queryData.sort) {
          model.sort(JSON.parse(queryData.sort));
        }

        if (queryData.skip) {
          model.skip(JSON.parse(queryData.skip));
        }

        if (queryData.limit) {
          model.limit(JSON.parse(queryData.limit));
        }
        var result = await model.exec();
        var resdata = {
          code: 200,
          data: result,
        };
        if (queryData.count) {
          var countnum = await schemaModel.find(findData).count();
          resdata = {
            code: 200,
            data: result,
            countnum: countnum,
          };
        }
        res.json(resdata);
      } catch (e) {
        console.log(e);
        res.status(500).send(e);
      }
    })
    .delete(async (req, res, next) => {
      try {
        console.log(req.body);
        if (!req.body.query) {
          res.status(500).send("禁止参数为空的删除");
        }
        var model = schemaModel.deleteMany(req.body.query);

        var result = await model.exec();
        res.json({
          code: 200,
          data: result,
        });
      } catch (e) {
        res.status(500).send(e);
      }
    })
    .post(async (req, res, next) => {
      try {
        var result = null;
        console.log('req.body: ', req.body);
        result = await schemaModel.create(req.body);
        res.json({
          code: 200,
          data: result,
        });
      } catch (e) {
        console.log(e);
        res.status(500).send(e);
      }
    })
    .put(async (req, res, next) => {
      try {
        var updateQuery = schemaModel.updateMany(
          req.body.query,
          req.body.update
        );

        var result = await updateQuery.exec();
        res.json({
          code: 200,
          data: result,
        });
      } catch (e) {
        res.status(500).send(e);
      }
    });
};
