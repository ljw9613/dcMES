# 德昌mes



#### 分支管理说明

项目包含以下分支：

1. **master** - 主分支，用于存放稳定版本的代码
2. **vietnam_production** - 越南生产分支，用于部署到越南生产环境
3. **local_test** - 本地测试分支，用于开发人员本地测试使用

##### 分支操作指南

###### 查看分支
```bash
# 查看本地所有分支
git branch

# 查看远程所有分支
git branch -r
```

###### 创建分支
```bash
# 基于当前分支创建新分支
git checkout -b 新分支名称

# 基于远程分支创建新分支
git checkout -b 新分支名称 origin/分支名称
```

###### 切换分支
```bash
# 切换到指定分支
git checkout 分支名称
```

###### 合并分支
```bash
# 将指定分支合并到当前分支
git merge 分支名称
```

###### 将本地分支或越南分支合并到主分支

以下是将本地测试分支或越南生产分支合并到主分支的详细步骤：

1. 确保当前工作区干净（无未提交的更改）
   ```bash
   git status
   ```

2. 切换到主分支并更新
   ```bash
   # 切换到主分支
   git checkout master
   
   # 拉取最新主分支代码
   git pull origin master
   ```

3. 合并分支（以合并本地测试分支为例）
   ```bash
   # 合并本地测试分支到主分支
   git merge local_test
   
   # 合并越南生产分支到主分支
   git merge vietnam_production
   ```

4. 解决可能的冲突
   - 如果出现冲突，Git会提示哪些文件存在冲突
   - 手动编辑冲突文件，解决冲突
   - 解决冲突后，使用以下命令标记冲突已解决
   ```bash
   git add 冲突文件路径
   ```

5. 完成合并并提交
   ```bash
   # 如果有冲突需要提交解决后的结果
   git commit -m "解决合并冲突，将XX分支合并到主分支"
   
   # 推送到远程主分支
   git push origin master
   ```

6. 验证合并结果
   - 检查代码是否按预期合并
   - 必要时进行测试，确保功能正常

###### 推送分支
```bash
# 首次推送到远程仓库
git push -u origin 分支名称

# 后续推送
git push
```

###### 删除分支
```bash
# 删除本地分支
git branch -d 分支名称

# 删除远程分支
git push origin --delete 分支名称
```

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


