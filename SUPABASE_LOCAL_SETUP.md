# Local Supabase Setup Guide

## 🚀 Quick Start

### 1. Start Local Supabase
```bash
npx supabase start
```

This will start:
- PostgreSQL database
- Auth server
- Storage server
- REST API

**Wait for it to complete** (takes ~2 minutes first time).

### 2. Copy the credentials
After starting, you'll see output like:
```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create `.env.local`
```bash
# Copy the keys from step 2
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 4. Apply Migrations
```bash
npx supabase db push
```

### 5. Start the App
```bash
npm run dev
```

### 6. Login
Visit `http://localhost:3000/login`

**Default Admin:**
- Email: `admin@planpm.local`
- Password: `Admin123*`

---

## 📋 Useful Commands

```bash
# Stop local Supabase
npx supabase stop

# View database in browser
npx supabase db reset
npx supabase studio

# Check status
npx supabase status

# View logs
npx supabase logs

# Reset database (WARNING: deletes all data)
npx supabase db reset
```

---

## 🔄 Switching Between Local and Cloud

**Local development:**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-key>
```

**Cloud deployment (Vercel):**
```bash
# Set in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cloud-key>
```

**Your code doesn't change** - just swap environment variables!

---

## 🛠️ Troubleshooting

### Port already in use
```bash
npx supabase stop
npx supabase start
```

### Database not accessible
```bash
npx supabase db reset
```

### Can't login
Make sure migrations ran:
```bash
npx supabase db push
```
