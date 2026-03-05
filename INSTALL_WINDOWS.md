# FocusFlow - Windows Installation Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended): https://nodejs.org/
- **Git**: https://git-scm.com/download/win
- **Supabase** account: https://supabase.com

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/focusflow.git
cd focusflow

# 2. Install dependencies
npm install

# 3. Copy environment template
copy .env.example .env

# 4. Configure .env (see Environment Variables below)

# 5. Run Nuxt prepare (generates types)
npx nuxt prepare

# 6. Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

Edit `.env` with your values:

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter AI (optional - for AI features)
OPENROUTER_API_KEY=your-openrouter-key

# Google OAuth (optional - for Google login + Meet)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Amazon SES (optional - for email notifications)
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your-access-key
AWS_SES_SECRET_KEY=your-secret-key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Firebase (optional - for push notifications)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_VAPID_KEY=...

# Context7 (optional - for doc generation)
CONTEXT7_API_KEY=your-key
```

## Supabase Setup

### 1. Create Project

Go to https://supabase.com and create a new project. Copy the URL and keys from Settings > API.

### 2. Run Migrations

Migrations are in `supabase/migrations/`. You can apply them via:

**Option A: Supabase CLI**
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

**Option B: SQL Editor**
Run each migration file in order (001, 002, ...) in the Supabase SQL Editor.

### 3. Configure Auth

In Supabase Dashboard > Authentication > Providers:

- **Email**: Enable email/password sign-ups
- **Google** (optional): Add your Google OAuth client ID and secret
- Set the Site URL to `http://localhost:3000`
- Add `http://localhost:3000/auth/callback` to Redirect URLs

## Google OAuth + Meet Setup

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable **Google Calendar API**
4. Go to OAuth consent screen > Configure as External > Testing mode
5. Add test user emails
6. Create OAuth credentials (Web application)
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
7. Add scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/calendar.events`
8. Copy Client ID and Secret to your `.env` and Supabase Auth > Google provider

## Web3 Wallet Login

Web3 login works automatically when a user has MetaMask or a compatible EVM wallet installed. No additional configuration is needed.

The system uses:
- **ethers.js v6** for signature verification
- **SIWE-style messages** with nonce for replay protection
- Deterministic email mapping: `{wallet_address}@wallet.focusflow.app`

## Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Deploy Options

- **Vercel**: `npx vercel`
- **Netlify**: Set build command to `npm run build`, publish directory to `.output/public`
- **Node.js server**: Run `node .output/server/index.mjs` after build
- **Docker**: Use the provided Dockerfile (if available)

## Troubleshooting

### Common Windows Issues

**PowerShell execution policy**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Long path support** (Git)
```bash
git config --system core.longpaths true
```

**Node.js memory issues**
```bash
set NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

**Port already in use**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Supabase CLI .env Issues

If the Supabase CLI fails to parse `.env` (common with multiline values like Firebase service account JSON), temporarily rename `.env` before running CLI commands:

```bash
ren .env .env.bak
supabase db push
ren .env.bak .env
```

## RBAC Roles

| Role | Level | Description |
|------|-------|-------------|
| viewer | 0 | Read-only access to tasks and files |
| marketing | 1 | Limited task/file access for marketing teams |
| member | 1 | Standard team member with full task access |
| admin | 2 | Can manage members, sprints, goals, and workspace settings |
| owner | 3 | Full workspace control including role permissions |
| superadmin | 4 | Platform-wide access (hardcoded email list) |

Role permissions can be customized per workspace at **Settings > Roles**.
