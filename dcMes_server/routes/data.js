const express = require(`express`);
const router = express.Router();
const mongoose = require("mongoose");
const _ = require("lodash");
router.post("/api/v1/getDataCount", async (req, res, next) => {
    try {
        // console.log("req.body", req.body);
        var Model = mongoose.model(req.body.schema);
        var datas = Model.count(req.body.query);
        var result = await datas.exec();
        res.jsonp(result);
    } catch (e) {
        console.error(e);
        res.status(501).send(e.message);
    }
});
router.post("/api/v1/getData", async (req, res, next) => {
    try {
        if (_.isEmpty(req.body.schema) && typeof req.body.schema !== "string") {
            throw "请求有误，请检查条件是否正常";
        }

        const Model = mongoose.model(req.body.schema);
        var query = Model.find(req.body.query);

        if (req.body.populate)
            req.body.populate.forEach((p) => {
                query.populate(p);
            });
        if (req.body.select) query.select(req.body.select);

        // 使用 pageNum 和 pageSize 进行分页
        const pageNum = req.body.pageNum || 1;
        const pageSize = req.body.pageSize || await Model.countDocuments(req.body.query);
        const skip = (pageNum - 1) * pageSize;
        query.skip(skip);
        query.limit(pageSize);

        if (req.body.sort) query.sort(req.body.sort);

        var data = await query.exec();
        var total = await Model.countDocuments(req.body.query);

        res.json({
            code: "OK",
            msg: "成功",
            data: data,
            total: total,
            pageNum: pageNum,
            pageSize: pageSize
        });
    } catch (e) {
        res.status(501).send({
            code: "Error",
            msg: e.message,
            data: [],
            total: 0,
            pageNum: req.body.pageNum || 1,
            pageSize: req.body.pageSize || 0
        });
    }
});
router.post("/api/v1/getRow", async (req, res, next) => {
    try {
        if (_.isEmpty(req.body.schema) && typeof req.body.schema !== "string") {
            throw "请求有误，请检查条件是否正常";
        }

        const Model = mongoose.model(req.body.schema);
        var query = Model.findOne(req.body.query);

        if (req.body.populate)
            req.body.populate.forEach((p) => {
                query.populate(p);
            });

        if (req.body.select) query.select(req.body.select);

        var data = await query.exec();

        if (!data) {
            throw "未找到匹配的数据";
        }

        res.json({
            code: "OK",
            msg: "成功",
            data: data
        });
    } catch (e) {
        res.status(501).send({
            code: "Error",
            msg: e.message,
            data: null
        });
    }
});


router.delete("/api/v1/data", async (req, res, next) => {
    try {
        if (JSON.stringify(req.body.query) == "{}" || !req.body.query) {
            throw "查询条件为空";
        }
        const Model = mongoose.model(req.body.schema);

        // 获取当前用户信息
        const number =
            req.session && req.session.number ? req.session.number : "null";
        console.log(req.body.query);
        const removeQuery = Model.deleteOne(req.body.query);
        var result = await removeQuery.exec();
        res.jsonp({
            code: "OK",
            msg: "成功",
            data: result
        });
    } catch (e) {
        console.error(e);
        res.status(501).send({
            code: "Error",
            msg: e.message,
            data: null
        });
    }
});

router.post("/api/v1/data", async (req, res, next) => {
    try {
        let results = null;
        const Model = mongoose.model(req.body.schema);
        // 获取当前用户信息
        const number =
            req.session && req.session.number ? req.session.number : "null"
        const userId =
            req.session && req.session.userId ? req.session.userId : undefined;
        console.log('createByUserId userId', userId);
        let createData = req.body.data
        if (Array.isArray(createData)) {
            createData = createData.map(item => {
                item['createBy'] = number
                item['createAt'] = new Date()
                if (userId) item['createByUserId'] = userId
                return item
            })

        } else {
            createData = {
                ...createData,
                createBy: number,
                createAt: new Date(),
            }
            if (userId) createData['createByUserId'] = userId
        }
        results = await Model.create(createData);
        res.jsonp({
            code: "OK",
            msg: "成功",
            data: results
        });
    } catch (e) {
        console.error(e);
        res.status(501).send({
            code: "Error",
            msg: e.message,
            data: null
        });
    }
});


router.put("/api/v1/data", async (req, res, next) => {
    try {
        const Model = mongoose.model(req.body.schema);

        // 获取当前用户信息
        const number =
            req.session && req.session.number ? req.session.number : "null";

        const updateQuery = Model.update(req.body.query, {
            ...req.body.update,
            updateBy: number,
            updateAt: Date.now(),
        }, {
            multi: true,
        });
        if (JSON.stringify(req.body.query) == "{}" || !req.body.query) {
            throw "查询条件为空";
        }
        if (JSON.stringify(req.body.update) == "{}" || !req.body.update) {
            throw "查询条件为空";
        }
        var result = await updateQuery.exec();
        res.jsonp({
            code: "OK",
            msg: "成功",
            data: result
        });
    } catch (e) {
        console.error(e);
        res.status(501).send({
            code: "Error",
            msg: e.message,
            data: null
        });
    }
});
module.exports = router;
