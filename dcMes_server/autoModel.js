const path = require("path");
const {autoLoadFile} = require("./utils/autoLoadFile");
const baseFilePath = "./model";
const baseFilePath1 = "./model/audit";
const fileList = autoLoadFile(path.join(__dirname, baseFilePath));
const fileList1 = autoLoadFile(path.join(__dirname, baseFilePath1));

function importModel() {
    fileList.forEach((item) => {
        require(`${baseFilePath}/${item.base}`);
    });
    fileList1.forEach((item) => {
        require(`${baseFilePath1}/${item.base}`);
    });
    console.log("finish import model");
}

importModel();
