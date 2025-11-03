# 🚀 Deployment Guide for Silverline B2B

## Overview
This is a **Next.js 15** application with **Supabase** backend. Best deployment platforms:
1. **Vercel** (Recommended - easiest, free tier)
2. **Netlify** (Good alternative)
3. **Self-hosted** (VPS, Docker)

---

## ✅ Pre-Deployment Checklist

### 1. **Environment Variables**
Make sure you have these in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. **Remove Debug Logs**
Before deploying, remove console.logs from:
- `app/(admin)/admin/dashboard/page.tsx`
- `app/(reseller)/reseller/targets/actions.ts`
- Any other files with debugging

### 3. **Test Build Locally**
```bash
cd apps/web
npm run build
```
If this succeeds, you're ready to deploy!

---

## 🎯 Option 1: Deploy to Vercel (RECOMMENDED)

### **Why Vercel?**
- ✅ Made by Next.js creators
- ✅ Zero configuration needed
- ✅ Free tier (perfect for production)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy environment variables

### **Steps:**

#### **A. Install Vercel CLI**
```bash
npm install -g vercel
```

#### **B. Login to Vercel**
```bash
vercel login
```
(Opens browser to authenticate)

#### **C. Deploy**
```bash
# From project root
cd apps/web
vercel
```

Follow prompts:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Your account
3. **Link to existing project?** → No
4. **Project name?** → silverline-b2b (or your choice)
5. **Directory?** → `./` (current directory)
6. **Want to modify settings?** → No

#### **D. Add Environment Variables**
After first deploy:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or via Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add your Supabase credentials

#### **E. Deploy Production**
```bash
vercel --prod
```

**Done!** Your app will be live at: `https://your-project.vercel.app`

---

## 🎯 Option 2: Deploy to Netlify

### **Steps:**

#### **A. Install Netlify CLI**
```bash
npm install -g netlify-cli
```

#### **B. Login**
```bash
netlify login
```

#### **C. Initialize**
```bash
cd apps/web
netlify init
```

#### **D. Configure Build Settings**
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Functions directory:** (leave empty)

#### **E. Add Environment Variables**
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-url"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-key"
```

#### **F. Deploy**
```bash
netlify deploy --prod
```

---

## 🎯 Option 3: Self-Hosted (VPS/Docker)

### **Using PM2 (Simple)**

#### **A. On Your Server:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone your repo
git clone <your-repo>
cd apps/web

# Install dependencies
npm install

# Create .env.local with your variables
nano .env.local

# Build
npm run build

# Start with PM2
pm2 start npm --name "silverline-b2b" -- start
pm2 save
pm2 startup
```

#### **B. Set Up Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **C. Set Up SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 📋 Post-Deployment Tasks

### 1. **Update Supabase Settings**
Go to Supabase Dashboard → Settings → API:
- Add your production domain to **Site URL**
- Add to **Redirect URLs**

### 2. **Test All Features**
- ✅ Login (admin & reseller)
- ✅ Dashboard loads
- ✅ Orders display
- ✅ Payments work
- ✅ Targets calculate correctly
- ✅ Top products show data

### 3. **Set Up Monitoring**
- Vercel: Built-in analytics
- Self-hosted: Use PM2 monitoring

### 4. **Set Up Backups**
- Supabase: Auto-backups enabled
- Database: Schedule regular exports

---

## 🔒 Security Checklist

- ✅ Environment variables are set (not in code)
- ✅ Supabase RLS policies enabled
- ✅ HTTPS enabled (automatic on Vercel/Netlify)
- ✅ No console.logs with sensitive data
- ✅ Admin routes protected
- ✅ API routes verify authentication

---

## 🐛 Common Issues

### **Issue 1: Build Fails**
**Solution:**
```bash
# Clear cache
rm -rf .next
npm install
npm run build
```

### **Issue 2: Environment Variables Not Working**
**Solution:**
- Vercel/Netlify: Must redeploy after adding env vars
- Check variable names (must start with `NEXT_PUBLIC_` for client-side)

### **Issue 3: Supabase Connection Error**
**Solution:**
- Verify URL and key are correct
- Check Supabase dashboard for correct credentials
- Ensure domain is whitelisted in Supabase

### **Issue 4: 404 on Routes**
**Solution:**
- Ensure `next.config.js` is correct
- Check if trailing slashes cause issues
- Verify file-based routing structure

---

## 📊 Performance Tips

1. **Enable Image Optimization**
   - Use Next.js Image component
   - Configure `next.config.js` for your domain

2. **Enable Caching**
   - Vercel handles this automatically
   - Self-hosted: Configure CDN

3. **Database Optimization**
   - Ensure indexes on frequently queried columns
   - Use Supabase connection pooling

---

## 🎉 Quick Start Commands

**Vercel (Recommended):**
```bash
npm install -g vercel
cd apps/web
vercel login
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
cd apps/web
netlify login
netlify init
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-url"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-key"
netlify deploy --prod
```

---

## ✅ Deployment Complete!

Your app should now be live! 🎉

**Next Steps:**
1. Share the URL with your team
2. Test thoroughly in production
3. Monitor for any errors
4. Set up custom domain (optional)

Need help? Check the platform-specific docs:
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Next.js: https://nextjs.org/docs/deployment
