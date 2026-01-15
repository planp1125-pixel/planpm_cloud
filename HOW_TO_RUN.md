# 🚀 How to Run Plan-PM Locally

## Step 1: Start Local Supabase

```bash
# Start all Supabase services (PostgreSQL, Auth, Storage, API)
npx supabase start
```

**⏱️ First time takes ~2 minutes.** You'll see output like:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Step 2: Create `.env.local`

```bash
# Copy the keys from above and create .env.local:
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
EOF
```

## Step 3: Apply Database Migrations

```bash
# Apply the profiles table and RBAC setup
npx supabase db push
```

## Step 4: Start the Next.js App

```bash
npm run dev
```

## Step 5: Open in Browser

Visit: **http://localhost:3000**

**Login:**
- Email: `admin@planpm.local`
- Password: `Admin123*`

---

## 🛠️ Useful Commands

```bash
# Check Supabase status
npx supabase status

# View database in browser UI
npx supabase studio

# Stop Supabase
npx supabase stop

# View logs
npx supabase logs

# Reset database (WARNING: deletes all data)
npx supabase db reset
```

---

## ⚠️ Troubleshooting

### "Port already in use"
```bash
npx supabase stop
npx supabase start
```

### "Can't connect to database"
Make sure Supabase is running:
```bash
npx supabase status
```

### "Login doesn't work"
Check if migrations ran:
```bash
npx supabase db push
```

---

## 🔄 Switching to Cloud (Future)

Just change `.env.local` to `.env.production` with cloud URLs:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-cloud-anon-key
```

**Same code works for both!** ✅
