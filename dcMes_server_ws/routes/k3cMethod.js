const { spawn } = require("child_process");
const path = require("path");

async function k3cMethod(method_Name, method_FormId, method_Query) {
  try {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("methodName: ", method_Name);
        console.log("methodQuery: ", JSON.stringify(method_Query));
        //methodName方法名，View
        //methodQuery 请求参数
        // 指定要调用的Python文件和方法
        const pythonScript = path.join(__dirname, "k3request.py");
        console.log("Python script path:", pythonScript);

        // 指定Python脚本、方法和参数
        // 指定Python脚本、方法和参数
        const pythonProcess = spawn("python", [
          pythonScript,
          method_Name,
          method_FormId,
          JSON.stringify(method_Query),
        ], { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8' });

        let pythonOutput = ""; // 用于缓存 Python 输出数据

        // 监听Python进程的输出
        pythonProcess.stdout.on("data", (data) => {
          // console.log(`Python输出： ${data}`);
          pythonOutput += data; // 将数据追加到缓存中
          // resolve(JSON.parse(data));
        });

        let pythonErrOutput = ""; // 用于缓存 Python 输出数据

        // 监听Python进程的错误输出
        pythonProcess.stderr.on("data", (data) => {
          console.log(`Python错误输出： ${data}`);
          pythonErrOutput += data; // 将数据追加到缓存中
          // resolve(JSON.parse(data));
        });
        console.error(`Python错误输出： ${pythonErrOutput}`);

        // 监听Python进程的关闭事件
        pythonProcess.on("close", (code) => {
          console.log(`Python进程关闭，退出码 ${code}`);
          try {
            // 移除可能的前后空白字符
            pythonOutput = pythonOutput.trim();
            
            let parsedOutput;
            // 检查是否是JSON对象格式
            if (pythonOutput.startsWith('{') && pythonOutput.endsWith('}')) {
              parsedOutput = JSON.parse(pythonOutput);
            } 
            // 检查是否是JSON数组格式
            else if (pythonOutput.startsWith('[') && pythonOutput.endsWith(']')) {
              parsedOutput = JSON.parse(pythonOutput);
            }
            // 如果不是标准JSON格式，则尝试处理特殊字符串
            else {
              // 移除多余的引号和反斜杠
              const cleanedOutput = pythonOutput.replace(/\\/g, '');
              try {
                parsedOutput = JSON.parse(cleanedOutput);
              } catch (e) {
                // 如果还是无法解析，则返回原始字符串
                parsedOutput = pythonOutput;
              }
            }
            
            console.log("🚀 ~ pythonProcess.on ~ parsedOutput:", parsedOutput);
            resolve(parsedOutput);
          } catch (error) {
            console.error(`解析Python输出时发生错误: ${error}`);
            console.error(`原始输出: ${pythonOutput}`);
            reject(error);
          }
        });
      } catch (error) {
        console.log("🚀 ~ returnnewPromise ~ error:", error);
      }
    });
  } catch (error) {
    return error;
  }
}

module.exports = {
  k3cMethod,
};
