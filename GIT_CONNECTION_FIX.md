# Git 连接 GitHub 问题解决方案

## 问题描述
无法通过 HTTPS (443端口) 连接到 GitHub，错误信息：
```
Failed to connect to github.com port 443 after 21101 ms: Couldn't connect to server
```

## ✅ 已完成的修复步骤

1. ✅ 检测到 SSH 端口 (22) 可用
2. ✅ 已生成 SSH 密钥：`C:\Users\Administrator\.ssh\id_ed25519`
3. ✅ 已切换远程仓库为 SSH 协议：`git@github.com:ljw9613/dcMES.git`
4. ✅ 已修复 SSH 配置文件权限问题

## 解决方案

### 方案 1: 使用代理（推荐，如果您有代理服务器）

如果您有可用的 HTTP/HTTPS 代理，可以配置 Git 使用代理：

```powershell
# 设置 HTTP 代理（替换为您的代理地址和端口）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 如果代理需要认证
git config --global http.proxy http://username:password@127.0.0.1:7890

# 取消代理设置（如果需要）
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 方案 2: 使用 GitHub 镜像/加速服务

使用第三方镜像服务来加速访问：

```powershell
# 使用 ghproxy.com 镜像（推荐）
git remote set-url origin https://ghproxy.com/https://github.com/ljw9613/dcMES.git

# 或者使用其他镜像
# git remote set-url origin https://mirror.ghproxy.com/https://github.com/ljw9613/dcMES.git
```

### 方案 3: 切换到 SSH 协议 ✅ **已应用此方案**

SSH 协议通常更稳定，但需要先配置 SSH 密钥：

1. ✅ **已生成 SSH 密钥**：
   - 密钥位置：`C:\Users\Administrator\.ssh\id_ed25519`
   - 公钥内容：
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIb6yWbdmp0fN4TqE1CX9SCBcJlVMzES2TXvlJsmJ44b dcMES@github
   ```

2. ⚠️ **需要将公钥添加到 GitHub**（重要！）：
   - 打开：https://github.com/settings/keys
   - 点击 "New SSH key"
   - Title: `dcMES Windows`
   - Key: 粘贴上面的公钥内容
   - 点击 "Add SSH key"

3. **测试 SSH 连接**（添加密钥后执行）：
```powershell
ssh -T git@github.com
# 应该看到：Hi ljw9613! You've successfully authenticated...
```

4. ✅ **已切换远程仓库为 SSH**：
   - 当前远程地址：`git@github.com:ljw9613/dcMES.git`

### 方案 4: 使用 GitHub CLI (gh)

如果安装了 GitHub CLI，可以使用它来推送：
```powershell
gh auth login
gh repo sync
```

## 快速修复命令

**如果您有代理（如 Clash、V2Ray 等，通常监听 127.0.0.1:7890）：**
```powershell
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
git push origin main
```

**如果使用镜像服务：**
```powershell
git remote set-url origin https://ghproxy.com/https://github.com/ljw9613/dcMES.git
git push origin main
```

## 验证配置

检查当前配置：
```powershell
git remote -v
git config --global --get http.proxy
git config --global --get https.proxy
```
