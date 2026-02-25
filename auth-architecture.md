# Auth Architecture (E2E Oriented)

## What We Prove by E2E
この認証は「入口ガード + API最終防衛線」の二段構えです。  
E2Eでは、実装詳細よりも次のユーザー体験と安全性を検証します。

1. 未ログインは保護画面に入れない
2. ログイン入力は Identity Toolkit に正しく送られる
3. サーバーが 14 日の `session` Cookie を発行する
4. Cookie があっても不正なら API で必ず落ちる
5. `/` 画面は `auth/me` 失敗時にログインへ戻される

## E2E Scenarios (Given/When/Then)

### 1) Unauthenticated Guard
- Given: `session` Cookie なし
- When: ユーザーが `/` または `/dinner` にアクセス
- Then: `/login?next=...` にリダイレクト
- When: `/api/*` にアクセス
- Then: `401 Unauthorized`
- Spec: `tests/e2e/auth-guard.spec.ts`

### 2) Login Form -> Identity Toolkit
- Given: `/login` を表示
- When: email/password を入力して Sign in
- Then: `accounts:signInWithPassword` に
  - `email`
  - `password`
  - `returnSecureToken: true`
  が送信される
- And: 成功時に返された `idToken` が `/api/auth/login` に送られる
- Spec: `tests/e2e/login.spec.ts`

### 3) Session Cookie Issuance (14 days)
- Given: `/api/auth/login` に有効 `idToken`
- When: サーバーがログイン処理
- Then: `httpOnly` の `session` Cookie が `Set-Cookie` で返る
- And: `Max-Age=1209600`（14日）になっている
- Spec: `tests/e2e/session-cookie.spec.ts`

### 4) Cookie Exists, But Still Safe
- Given: `proxy` を通るだけの不正 `session` Cookie
- When: `/` にアクセス
- Then: クライアントの `/api/auth/me` チェックで失敗し、`/login?next=%2F` へ遷移
- Spec: `tests/e2e/auth-guard.spec.ts`

### 5) API Final Defense
- Given: 偽造/失効/期限切れ相当の `session` Cookie
- When: 保護 API（`/api/reservations` など）を呼ぶ
- Then: すべて `401`
- Why: API先頭で `requireSessionFromRequest` を通し、
  - `verifySessionCookie(session, true)`
  - `getUser(uid)`
  を毎回行っているため
- Spec: `tests/e2e/auth-guard.spec.ts`

### 6) UID Existence Check
- Given: `session` がある
- When: `/api/auth/me` を呼ぶ
- Then:
  - UID有効なら `200 authenticated:true`
  - UID不存在/無効化なら `401 authenticated:false`
- Spec: `tests/e2e/auth-me.spec.ts`

## Runtime Roles (for test reading)

- `src/proxy.ts`
  - Cookie有無のみ見る軽量ガード（Edge）
- `src/lib/server/auth.ts`
  - セッション検証本体（Node）
  - `verifySessionCookie(..., true)` + `getUser(uid)`
- `src/app/api/auth/login/route.ts`
  - `idToken` を `session` Cookie 化
- `src/app/api/auth/me/route.ts`
  - 現在セッションの正当性を返す
- `src/app/page.tsx`
  - 画面描画前に `/api/auth/me` 失敗ならログインへ遷移

## E2E Mock Safety

E2E用モック分岐は次の条件でのみ有効です。

- `E2E_AUTH_MOCK === "1"`
- `PLAYWRIGHT_TEST === "1"`

`playwright.config.ts` でのみ有効化し、通常の開発/本番では有効になりません。
