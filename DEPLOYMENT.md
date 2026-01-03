# Eco Empower Deployment Guide

## 1. Supabase Setup (Database)
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to **SQL Editor**.
3. Copy the contents of `database/schema.sql` and run it to create tables and policies.
4. Go to **Project Settings > API**.
5. Copy `Project URL` and `anon public` key.

## 2. Render Setup (Backend)
1. Push your code to GitHub.
2. Go to [Render](https://render.com/).
3. Create a **Web Service**.
4. Connect your GitHub repo.
5. Set Root Directory to `backend` (if possible, or just use build command).
6. **Build Command:** `cd backend && npm install`
7. **Start Command:** `cd backend && node server.js`
8. Add Environment Variables:
   - `SUPABASE_URL`: (from Supabase)
   - `SUPABASE_KEY`: (from Supabase)
   - `JWT_SECRET`: (generate a random string)
   - `FRONTEND_URL`: (Your Vercel URL, add later)

## 3. Vercel Setup (Frontend)
1. Go to [Vercel](https://vercel.com/).
2. Import your GitHub repo.
3. Configure settings:
   - Root Directory: `Eco Empower` (or root if whole repo)
4. Deploy.
5. **Update Config:**
   - Go to your deployed Vercel site.
   - Note the URL (e.g., `https://eco-empower.vercel.app`).
   - Update `js/config.js` or use Environment Variable substitution if building via Vercel implementation.
   - *Simpler:* Just update `config.js` in your code to point to the Render API URL and push again.

## 4. Final Connection
1. Go to Render Dashboard.
2. Copy the backend service URL (e.g., `https://eco-empower-api.onrender.com`).
3. Update `js/config.js`:
   ```javascript
   API_URL: 'https://eco-empower-api.onrender.com/api'
   ```
4. Commit and push to update Frontend.
5. Go to Render Environment Variables and update `FRONTEND_URL` to your Vercel URL (e.g., `https://eco-empower.vercel.app`).

## 5. Admin Access
- Default Admin:
  - Username: `admin`
  - Password: `admin123` (Set this manually in database or register normally and change role in Supabase table editor if needed)
