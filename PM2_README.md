# PM2 服务管理说明

本项目使用PM2来管理Node.js应用进程，确保服务持续运行并在崩溃时自动重启。

## 文件说明

- `ecosystem.config.js`: PM2配置文件（JS格式），定义了应用的运行参数
- `ecosystem.json`: PM2配置文件（JSON格式），与JS格式功能相同，同时配置了多个服务
- `restart.sh`: Linux/Mac环境下的重启脚本
- `restart.bat`: Windows环境下的重启脚本（使用JS配置）
- `start_pm2.bat`: Windows环境下的启动脚本（使用JSON配置，支持多服务）

## 服务说明

当前系统包含以下三个服务：

1. **主服务 (dcMes-server)**：主应用服务器
   - 脚本路径：`./dcMes_server/bin/www`
   - 默认端口：2222
   - 负载均衡：启用集群模式，10个并行进程
   - 自动负载分配：PM2会自动在多个进程间分配请求

2. **WebSocket服务 (dcMes-server-ws)**：处理实时通信
   - 脚本路径：`./dcMes_server_ws/wsServer.js`

3. **系统服务 (dcMes-server-system)**：系统后台服务
   - 脚本路径：`./dcMes_server_system/bin/www`

## 前置要求

确保已全局安装PM2：

```bash
npm install pm2 -g
```

## 使用方法

### 启动所有服务

**使用JSON配置启动（推荐）：**
```
start_pm2.bat
```

这将同时启动所有服务，其中主服务(dcMes-server)将以负载均衡模式启动10个实例。

### 其他启动方式

启动单个服务：
```
pm2 start ecosystem.json --only dcMes-server --env production
```

Windows (使用JS配置，仅主服务)：
```
restart.bat
```

Linux/Mac：
```bash
chmod +x restart.sh  # 添加执行权限
./restart.sh
```

### 修改配置

根据使用的启动脚本，编辑对应的配置文件：
- 使用`start_pm2.bat`时，编辑`ecosystem.json`
- 使用`restart.bat`或`restart.sh`时，编辑`ecosystem.config.js`

配置修改后，重新运行相应的启动脚本即可。

### 负载均衡配置

主服务(dcMes-server)配置了负载均衡，关键参数：
- `instances`: 10 (启动10个进程实例)
- `exec_mode`: "cluster" (使用Node.js的集群模式)

如需调整并发进程数，可以修改`instances`值：
- 设为具体数字：启动指定数量的进程
- 设为"max"：根据CPU核心数自动使用最佳进程数
- 设为0：禁用自动扩展，只启动1个进程

### 常用PM2命令

- 查看所有应用状态：`pm2 status`
- 查看特定应用日志：
  - `pm2 logs dcMes-server` (主服务)
  - `pm2 logs dcMes-server-ws` (WebSocket服务)
  - `pm2 logs dcMes-server-system` (系统服务)
- 停止特定应用：`pm2 stop 应用名称`
- 重启特定应用：`pm2 restart 应用名称`
- 停止所有应用：`pm2 stop all`
- 重启所有应用：`pm2 restart all`
- 设置开机自启：`pm2 startup`（首次运行后按提示执行命令）
- 手动启动：`pm2 start ecosystem.json --env production`
- 查看集群状态：`pm2 monit` (可查看负载均衡各进程状态)

### 日志位置

所有日志文件将保存在项目根目录的`logs/pm2/`文件夹下，按服务分开存储：
- `dcMes-server-err.log`：主服务错误日志
- `dcMes-server-out.log`：主服务标准输出日志
- `dcMes-server-combined.log`：主服务合并日志
- `dcMes-server-ws-*.log`：WebSocket服务日志
- `dcMes-server-system-*.log`：系统服务日志

## 注意事项

1. 生产环境使用时，建议配置环境变量（在配置文件中修改）
2. 如需修改端口，请在配置文件的env_production部分修改PORT值
3. JSON格式和JS格式的配置文件功能完全相同，可以根据个人偏好选择使用
4. Windows环境下推荐使用`start_pm2.bat`脚本，它支持同时启动所有服务
5. 每个服务都有自己独立的日志文件，便于分开查看和排查问题
6. 负载均衡模式下，建议定期查看`pm2 monit`来监控各进程状态
7. 如系统内存有限，可适当减少实例数量