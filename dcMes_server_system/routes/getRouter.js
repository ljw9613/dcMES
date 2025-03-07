const express = require(`express`);
const router = express.Router();
const mongoose = require("mongoose");
const Menu = mongoose.model("menu");

router.post("/api/v1/getRouters", async (req, res, next) => {
    try {
        let menuList = await Menu.find({status: 1})
            .exec();
        const modifiedMenuList = menuList
            .filter(menuItem => menuItem.parentId === undefined || menuItem.parentId === null)  // 只处理没有parentId的项
            .map(menuItem => {
                // 找到parentId与当前menuItem的_id匹配的子项
                const children = menuList
                    .filter(childItem => String(childItem.parentId) === String(menuItem._id))
                    .map(childItem => {
                        return {
                            name: '/' + childItem.path.charAt(0).toUpperCase() + childItem.path.slice(1),
                            path: '/' + childItem.path,
                            hidden: childItem.visible === '0' ? false : true,
                            component: childItem.component,
                            meta: {
                                title: childItem.name,
                                icon: childItem.icon,
                                noCache: false,
                                link: null,
                            },
                            children: []
                        }
                    });

                return {
                    // 名字首字母大写并在前面添加"/"
                    name: menuItem.path.charAt(0).toUpperCase() + menuItem.path.slice(1),
                    // 在路径前添加斜杠"/"
                    path: '/' + menuItem.path,
                    // 如果visible等于'0'，hidden为false，否则为true
                    hidden: menuItem.visible === '0' ? false : true,
                    redirect: 'noRedirect',
                    component: 'Layout',
                    alwaysShow: true,
                    meta: {
                        title: menuItem.name,
                        icon: menuItem.icon,
                        noCache: false,
                        link: null,
                    },
                    // 添加子元素
                    children: children
                };
            });
        res.jsonp({
            code: 200,
            msg: "操作成功",
            data: modifiedMenuList
        });
    } catch (e) {
        // console.error(e);
        res.status(501).send(e.message);
    }
    //
});

module.exports = router;
