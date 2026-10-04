# UnintendedReply
A web page code for playing interactive movies and creating interactive storylines

## 局域网故事社区（多人分享 / 协作）

服务端是零依赖 Node 程序 `server/community.js`（默认端口 8787）。

### 开服务器（电脑端，三种都行，不用找项目文件）
1. 桌面双击 **Unintended Reply Community**（安装脚本生成的快捷方式）
2. 手机/任何设备的社区页里点 **▶ 一键启动本机服务器**（靠 `unintended-reply://` 自定义协议唤起）
3. 什么都不用做 —— **开机登录时会自动启动**（隐藏的计划任务 `UnintendedReplyCommunity`）

要停止：双击桌面的 **Stop Community Server**，或任务管理器结束 `community-guard.js` 那个进程。

### 首次安装（换电脑 / 重做系统后跑一次）
```
powershell -ExecutionPolicy Bypass -File server\install-one-click.ps1
```
它会创建：桌面快捷方式、开始菜单目录、`unintended-reply://` 协议、开机自启任务。
卸载：`server\install-one-click.ps1 -Uninstall`

### 关键文件
| 文件 | 作用 |
| --- | --- |
| `server/community.js` | REST + SSE + mDNS 的社区服务器 |
| `server/community-guard.js` | 守护进程：拉起服务器、崩溃自动重启、可开浏览器（跨平台，可用 node 直接跑） |
| `server/community-launcher.vbs` | 无黑窗启动入口（桌面快捷方式指向它） |
| `server/community-stop.vbs` | 一键停止服务器与守护进程 |
| `server/install-one-click.ps1` | 安装/卸载快捷方式、协议、自启 |

### 手机 / 平板
网页层 App 无法监听端口，**移动端不能当服务器**：让它和开着游戏的电脑连同一个 WiFi，
社区页会自动扫描到（`.local` 域名在安卓上通常解析不了，扫不到时手填 `http://<电脑IP>:8787`）。
