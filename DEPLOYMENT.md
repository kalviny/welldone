# 远程预览

- 主机：`zhanghong@10.4.20.16`
- 项目目录：`/home/zhanghong/workspace/reports/interactive-3d`
- 访问地址：<http://10.4.20.16:8173/>
- 服务：用户级 systemd `interactive-3d.service`
- HTTP：Python 3 标准库，监听 `0.0.0.0:8173`，无额外运行依赖。

远程账号已开启 linger；服务启用后可脱离 SSH 会话运行，并在系统启动后恢复。

## 更新项目

在本地项目根目录执行，复制 Git 已跟踪文件（包括暂存区新增文件）。不复制 `.git`、参考图、Skills checkout 或临时截图；不删除远程已有文件。

```sh
git ls-files -z | rsync -az --from0 --files-from=- ./ \
  zhanghong@10.4.20.16:/home/zhanghong/workspace/reports/interactive-3d/
```

静态文件更新无需重启服务，浏览器刷新即可。远端副本不单独初始化 Git，以本地仓库为版本来源。

## 服务管理

```sh
ssh zhanghong@10.4.20.16 'systemctl --user status interactive-3d --no-pager'
ssh zhanghong@10.4.20.16 'systemctl --user restart interactive-3d'
ssh zhanghong@10.4.20.16 'journalctl --user -u interactive-3d -n 50 --no-pager'
ssh zhanghong@10.4.20.16 'systemctl --user disable --now interactive-3d'
```

首次安装或修改服务配置：

```sh
ssh zhanghong@10.4.20.16 'mkdir -p ~/.config/systemd/user && cp /home/zhanghong/workspace/reports/interactive-3d/deploy/interactive-3d.service ~/.config/systemd/user/interactive-3d.service && systemctl --user daemon-reload && systemctl --user enable --now interactive-3d'
```
