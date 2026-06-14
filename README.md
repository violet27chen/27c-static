# 27c.site 静态版

纯静态前端 + Supabase 云端数据库，部署到 Cloudflare Pages。

## 架构

```
前端 (Cloudflare Pages)  →  Supabase (数据库 + 认证 + 存储)
       ↓                          ↓
   HTML/CSS/JS              PostgreSQL + Auth + Storage
   零服务器                  全球边缘节点
```

## 部署步骤

### 1. 创建 Supabase 项目

1. 去 [supabase.com](https://supabase.com) 注册/登录
2. 创建新项目（选 Singapore 区域）
3. 进入 SQL Editor，依次执行：
   - `schema.sql`（products + reviews 表）
   - `schema-profiles.sql`（profiles 表 + 自动创建触发器）
4. 在 Storage 中创建 bucket `product-images`，设为 Public

### 2. 配置前端

编辑 `js/config.js`，填入你的 Supabase 凭据：

```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJxxxxx...';
```

### 3. 部署到 Cloudflare Pages

**方法 A：GitHub 集成（推荐）**

1. 推送到 GitHub 仓库
2. 在 Cloudflare Dashboard → Pages → Create a project
3. 连接 GitHub 仓库
4. 构建设置：Framework preset = None，Build output directory = `/`
5. 部署完成

**方法 B：直接上传**

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 部署
wrangler pages deploy ./27c-static --project-name=27c-site
```

### 4. 绑定域名

在 Cloudflare Pages 项目设置中添加自定义域名 `27c.site`

## 从现有 Flask 版迁移数据

```python
# 在 Python 中执行，需要 pymysql + supabase
import pymysql
from supabase import create_client

# 连接旧数据库
old_db = pymysql.connect(host='127.0.0.1', user='shopuser', password='...', db='software_shop')

# 连接 Supabase
sb = create_client('https://xxx.supabase.co', 'anon_key')

# 迁移商品
with old_db.cursor() as cur:
    cur.execute('SELECT * FROM products WHERE is_active=1')
    for row in cur.fetchall():
        sb.table('products').insert({
            'name': row['name'],
            'description': row['description'],
            'category': row['category'],
            'image_url': row['image_url'],
            'thumb_url': row['thumb_url'],
            'quark_link': row['quark_link'],
            'cloud_type': row['cloud_type'],
            'contact_tg': row['contact_tg'],
            'is_active': bool(row['is_active']),
            'user_id': 'YOUR_USER_UUID',  # 替换为你的 Supabase user_id
        }).execute()
```

## 文件结构

```
├── index.html          # 首页（商品列表）
├── product.html        # 商品详情
├── login.html          # 登录
├── register.html       # 注册
├── dashboard.html      # 管理后台（每用户自己的商品）
├── about.html          # 关于
├── privacy.html        # 隐私政策
├── schema.sql          # 数据库 schema（products + reviews）
├── schema-profiles.sql # profiles 表 + 触发器
├── _headers            # Cloudflare Pages 响应头
├── css/
│   └── style.css       # 样式（复用当前站黑白极简风格）
├── js/
│   ├── config.js       # Supabase 配置（需填写）
│   ├── i18n.js         # 中英文切换
│   ├── auth.js         # 登录注册
│   ├── db.js           # 商品 CRUD + 图片上传
│   └── app.js          # 导航栏 + 公共逻辑
└── README.md
```

## 功能对照

| 功能 | Flask 版 | 静态版 |
|------|---------|--------|
| 商品展示 | ✅ 服务端渲染 | ✅ 客户端渲染 |
| 中英文切换 | ✅ Cookie | ✅ Cookie |
| 登录注册 | ✅ Flask Session | ✅ Supabase Auth |
| 管理后台 | ✅ 每用户独立 | ✅ RLS 自动隔离 |
| 图片上传 | ✅ 本地存储 | ✅ Supabase Storage |
| 评论系统 | ✅ MySQL | ✅ Supabase PostgreSQL |
| 云盘类型检测 | ✅ Python | ✅ JavaScript |
| 服务器 | 需要 VPS | 零服务器 |
| 费用 | VPS 月费 | 免费额度内 $0 |
