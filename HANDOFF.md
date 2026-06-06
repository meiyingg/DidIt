# 交接说明（Handoff）

> 这份文档给你看，告诉你：项目现在到哪了、怎么推到 GitHub、怎么配 Supabase 跑起来、
> 以及接下来还要做什么。代码 UI 全英文，这份交接文档用中文方便你看。

---

## 一、项目名

- **产品名（UI 显示）**：**Grind Bank** 🪙
- **建议的 GitHub 仓库名**：`grind-bank`
- 本地 package 名：`improvement-system`（不影响，可保持）

> 如果你想换名字，告诉我即可，我改 `index.html`、`README.md`、`package.json`。

---

## 二、现在的状态 ✅

- 代码已写完 **Phase 1（MVP 第一阶段）**，并已 **本地 git 提交**（分支 `main`，1 个 commit）。
- `pnpm build` 通过：TypeScript 编译无错、Vite 打包成功。
- **还没推到 GitHub**（之前两个 token 都被 GitHub 拒了 `Bad credentials`）。

### Phase 1 包含的功能
- 账号密码注册 / 登录（Supabase Auth）
- 每日任务清单：必做模板（自己定义、每天自动生成）+ 临时自定义任务
- 完成任务加钱（走数据库安全函数 `complete_task`，规则不可被前端绕过）
- 当天必做全部完成 → 自动 +1 张兑换券
- 每天凌晨 00:00 自动扣 300（pg_cron 定时任务）
- 财富余额 + 流水记录
- 手机优先的响应式 UI（全英文）

---

## 三、⚠️ 安全：先做这件事

你在聊天里发过两个 token（`ghp_QjMw...` 和 `tVXq...`）。**请去把它们作废**：
- GitHub → Settings → Developer settings → Personal access tokens → 找到对应 token → **Revoke / Delete**
- 凡是在聊天/截图里出现过的密钥，一律当成已泄露，重置掉。

另外那个**通义 DashScope Key**（之前也发过）同样建议去通义后台**重置一把新的**，将来只放 Supabase 后端环境变量，不进前端、不进 git。

---

## 四、推送到 GitHub（你来做）

代码已经本地提交好了，你只需要建个空仓库再推上去。

### 方式 A：用 GitHub 网页建仓（最简单，不用装 gh）
1. 打开 https://github.com/new
2. Repository name 填 `grind-bank`，**不要**勾选 "Add a README"（保持空仓库）
3. 建好后，在项目目录执行（把 `你的用户名` 换成你的 GitHub 用户名）：
   ```bash
   git remote add origin https://github.com/你的用户名/grind-bank.git
   git push -u origin main
   ```
4. 第一次 push 会弹出 GitHub 登录窗口，用浏览器授权一下即可（这是最安全的方式，不用手动复制 token）。

### 方式 B：用 GitHub CLI（gh）
1. 安装：`winget install --id GitHub.cli`（装完重开一个终端）
2. 登录：`gh auth login` → 选 GitHub.com → HTTPS → Login with a web browser，按提示在浏览器里授权
3. 一键建仓并推送：
   ```bash
   gh repo create grind-bank --private --source=. --push
   ```

> 关于 token：有效的 GitHub classic token 长这样 `ghp_` + 约 36 位字符；
> fine-grained 的是 `github_pat_...`。如果你坚持用 token，确保格式对、且勾了 `repo` 权限。
> 但更推荐上面的浏览器登录，省去复制粘贴密钥的风险。

---

## 五、让它真正跑起来（配 Supabase）

代码需要一个 Supabase 后端才能登录和存数据。

1. **建项目**：去 https://supabase.com 注册并新建一个免费 project。
2. **建表**：打开 Supabase 的 **SQL Editor**，把
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 全部内容贴进去运行。
   （建好所有表、RLS 权限、注册触发器、`complete_task`/`ensure_today_tasks` 函数、扣款任务）
3. **开定时扣款**：Database → Extensions → 启用 **pg_cron**，然后把迁移文件最底部的
   `cron.schedule(...)` 那段再单独跑一次。
   （没开 pg_cron 也能用，只是不会自动扣款；可手动 `select public.apply_daily_deduction();` 测试）
4. **拿密钥**：Project Settings → API，复制 `URL` 和 `anon public` key。
5. **配环境变量**：把项目里的 `.env.example` 复制成 `.env`，填进去：
   ```
   VITE_SUPABASE_URL=https://你的项目ref.supabase.co
   VITE_SUPABASE_ANON_KEY=你的anon-key
   ```
   （anon key 是设计上可公开的，放前端没问题；`.env` 已被 git 忽略）
6. **关掉邮箱验证**（小圈子省事）：Authentication → Providers → Email → 关掉 "Confirm email"。
7. **跑起来**：
   ```bash
   pnpm install   # 如果还没装过依赖
   pnpm dev
   ```
   打开终端里给的地址（默认 http://localhost:5173），注册个号就能用。

---

## 六、接下来的工作（路线图）

> 这些我都还没做，等你发话。

### Phase 2 — 核心激励闭环（建议下一步做）
- **学习计时器**：选已有待办 / 输文本新建；锁屏继续计时（存开始时间戳算差值）；
  结束后 **AI 严格结算收益**、标记任务完成、存档。
- **AI 自动定价**：接 **通义千问 DashScope**，在 Supabase **Edge Function** 里调
  （Key 走后端环境变量，前端不碰）。定价基准：认真一天 ≈ 赚 500。
  AI 不可用时给默认金额兜底。
- **兑换券 UI**：查看数量、获取记录、手动"使用"一张。
- **个人数据面板**：学习时长（今日/本周/累计）+ 收益趋势图 + 任务完成率。

### Phase 3 — 社交
- 多人**共用一个总榜**：财富 / 完成任务数 / 累计学习时长 三个维度排名。

### 部署上线（任意阶段）
- 前端挂 **Vercel**（连 GitHub 仓库，填上 `VITE_` 环境变量，自动部署）。
- 后端就是 Supabase 托管，不用额外操作。

---

## 七、给我下任务时怎么说

- 想继续开发：直接说「**做 Phase 2**」或「**先做学习计时器**」「**先接 AI 定价**」等。
- 想改名 / 改规则 / 改配色：直接说，我去改对应文件。
- 想部署：说「**帮我部署到 Vercel**」，我给你一步步指引。

代码结构、规则细节见 [README.md](README.md) 和 [需求文档.md](需求文档.md)。
