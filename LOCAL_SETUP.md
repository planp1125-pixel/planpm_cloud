# Local PostgreSQL Setup - Quick Start Guide

## ✅ What's Been Created:

1. **Database Setup**
   - PostgreSQL migration script (`database/migrations/001_initial_setup.sql`)
   - Docker Compose configuration (`database/docker-compose.yml`)
   - Prisma schema (`prisma/schema.prisma`)

2. **Authentication System**
   - Local auth (replaces Supabase Auth)
   - Password hashing with bcrypt
   - JWT-based sessions
   - API routes: `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/auth/me`
   - Middleware for route protection

3. **Default Admin**
   - Email: `admin@planpm.local`
   - Password: `Admin123*`

4. **User Limits**
   - Maximum 50 users enforced in signup

---

## 🚀 Getting Started:

### Step 1: Set up Environment Variables
Create `.env.local` file:
```bash
DATABASE_URL="postgresql://admin:Admin123*@localhost:5432/planpm"
JWT_SECRET="your-secret-key-change-this"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 2: Start PostgreSQL
```bash
cd database
docker-compose up -d
cd ..
```

### Step 3: Generate Prisma Client & Push Schema
```bash
npx prisma generate
npx prisma db push
```

### Step 4: Start the App
```bash
npm run dev
```

### Step 5: Login
Visit `http://localhost:3000/login` and use:
- Email: `admin@planpm.local`
- Password: `Admin123*`

---

## 📌 Helpful Commands:

```bash
# View database in browser
npx prisma studio

# Stop PostgreSQL
cd database && docker-compose down

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# View PostgreSQL logs
cd database && docker-compose logs -f
```

---

## 🔧 Next Steps:

1. ✅ Database & Auth setup complete
2. ⏳ Update frontend to use new auth system
3. ⏳ Remove Firebase code
4. ⏳ Implement user management UI
5. ⏳ Add email notifications
6. ⏳ Remove Google OAuth buttons

---

## 📝 Notes:

- Default admin password can be changed after first login
- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- Database runs on port 5432
- App runs on port 3000
