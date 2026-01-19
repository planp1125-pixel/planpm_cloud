# Docker Windows Deployment Guide

This guide explains how to deploy Plan-PM locally on Windows using Docker.

## 📋 Prerequisites (Factory Server)

To run this application on the factory server, you **ONLY** need:

1.  **Docker Desktop** (latest version recommended)
    *   Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
    *   *Note:* Enable "WSL 2" during installation if asked.

**You do NOT need:**
*   ❌ Node.js / npm (The Docker container handles this internally)
*   ❌ Python, PHP, or other runtimes

**Internet Access:**
*   The server needs internet access **only for the first run** to download the Docker images (approx. 1-2 GB).
*   After the first run, it can operate completely offline.

---

## 🚀 Quick Start (Recommended)

We have created verified one-click deployment scripts that handle everything for you: starting containers, waiting for services, and creating the admin user.

### 1. Run the Deployment Script
Double-click **`deploy.bat`** in the project root folder.

*Alternatively, running from PowerShell:*
```powershell
.\deploy.ps1
```

### 2. Login
The script will automatically open the app in your browser.
*   **URL:** [http://localhost:9002](http://localhost:9002)
*   **Username:** `admin`
*   **Password:** `Admin@123*`

---

## 🛠 Manual Deployment (Advanced)

If you prefer to run the steps manually, here is what the script does:

1.  **Start Services**:
    ```powershell
    docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
    ```

2.  **Initialize Admin User**:
    You must run the initialization script to properly create the admin user with the correct password hash:
    ```powershell
    # PowerShell
    .\scripts\init-admin.sh
    ```

---

## 🔍 Service Ports

| Service | Port | URL |
|---------|------|-----|
| **Next.js App** | 9002 | http://localhost:9002 |
| **Supabase API (Kong)** | 54321 | http://localhost:54321 |
| **Supabase Auth (GoTrue)** | 9999 | http://localhost:9999 |
| **Supabase REST (PostgREST)** | 54323 | http://localhost:54323 |
| **PostgreSQL Database** | 54322 | localhost:54322 |

## ❓ Troubleshooting

### Login Fails with "Invalid credentials"
If the default `Admin@123*` password doesn't work, the admin user might have been created with an incorrect hash.
**Fix:** Run the following command to reset the database and try again:
```powershell
docker-compose -f docker-compose.prod.yml --env-file .env.docker down -v
.\deploy.bat
```

### Port 9002 Already in Use
If the app fails to start because port 9002 is busy:
```powershell
# Find the process ID
netstat -ano | findstr :9002
# Kill the process
taskkill /PID <PID> /F
```
