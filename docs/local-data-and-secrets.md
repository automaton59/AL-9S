# 本地数据与 API Key 安全说明

AL-1S 的运行数据不会放在仓库目录里。Electron 版本会写入 Electron 的 `userData` 目录：

- `data/config.json`：角色、当前角色、当前 API Profile id。这里不会保存明文 API Key。
- `data/chat-history.json`：聊天和会话记录。
- `data/api-profiles.json`：API Profile。API Key 使用 Electron `safeStorage` 加密后以 base64 保存。

浏览器开发模式没有 Electron `safeStorage`，会 fallback 到 localStorage，并用 `plain:fallback` 标记。真实长期使用建议跑 Electron 版本。

仓库已在 `.gitignore` 里兜底忽略：

- `data/`
- `secrets/`
- `*.local.json`
- `api-profiles*.json`
- `config.local.json`
- `chat-history.local.json`

提交前仍建议搜索一次自己的 Key 前缀，确认没有把真实 API Key 写进源码、文档或测试文件。
