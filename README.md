# 运势占卜网站 - 部署指南

## 项目简介
这是一个结合 AI 聊天、黄历运势和抽卡占卜功能的网站，使用 DeepSeek API 提供智能对话服务。

## 功能特点
- 🤖 DeepSeek AI 智能聊天（INFJ 温柔治愈玄学导师）
- 📅 黄历查询功能（今日宜忌、吉时、财神方位、运势分析）
- 🎴 每日运势抽卡（需登录）
- 🔐 用户注册/登录系统（含心理画像问卷）
- 💬 心理陪伴、决策建议、情绪疏导

## 部署到 GitHub Pages

### 步骤 1: 创建 GitHub 仓库
1. 登录 GitHub
2. 点击 "New repository"
3. 仓库名建议：`fortune-website` 或其他名称
4. 设置为 "Public"
5. **不要勾选** "Add a README file"
6. 点击 "Create repository"

### 步骤 2: 上传文件
在仓库页面点击 "uploading an existing file"，上传以下文件：
```
index.html
styles.css
script.js
.gitignore
```

### 步骤 3: 启用 GitHub Pages
1. 进入仓库的 "Settings"
2. 左侧菜单找到 "Pages"
3. 在 "Build and deployment" 下:
   - Source: 选择 `Deploy from a branch`
   - Branch: 选择 `main` 或 `master`，文件夹选 `/ (root)`
4. 点击 "Save"
5. 等待几分钟，你的网站将在 `https://你的用户名.github.io/仓库名/` 上线

## API 注意事项

### DeepSeek API Key
当前 API Key 已内置在代码中，如果需要更换，请修改 `script.js` 中的：
```javascript
const apiKey = '你的新API Key';
```

### CORS 问题解决
GitHub Pages 使用 HTTPS 协议，部署后 DeepSeek API 应该可以正常工作。

如果仍然遇到 CORS 问题，可以尝试以下方案：

#### 方案一：使用 CORS 代理（已内置）
当前代码已包含 `corsproxy.io` 代理支持。

#### 方案二：使用 Cloudflare Worker 代理
创建一个免费的 Cloudflare Worker，代码如下：
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetUrl = 'https://api.deepseek.com' + url.pathname + url.search;
    return fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
};
```

## 本地开发测试
直接在浏览器打开 `index.html` 即可预览，但 API 调用可能受 CORS 限制。建议使用以下方式本地测试：

```bash
# 方法 1: 使用 Python 启动本地服务器
python -m http.server 8000

# 方法 2: 使用 Node.js
npx serve .

# 方法 3: 使用 VS Code Live Server 插件
```

然后访问 `http://localhost:8000`

## 浏览器兼容性
- ✅ Chrome / Edge / Firefox / Safari（最新版本）
- ✅ 移动端浏览器
- ⚠️ 不支持 IE

## 问题排查

### API 调用失败？
1. 检查浏览器控制台（F12 -> Console）的错误信息
2. 确认 API Key 有效且有足够额度
3. 检查是否为 CORS 跨域问题
4. 部署到 HTTPS 服务器后重试

### DeepSeek API 额度查询
访问 [DeepSeek 控制台](https://platform.deepseek.com/) 查看 API Key 的使用情况。

## 许可证
仅供学习和个人使用。