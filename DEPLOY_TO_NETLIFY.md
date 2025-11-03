# 🚀 Deploy to Netlify - Complete Guide

## ✅ **What You Need:**

1. ✅ GitHub account
2. ✅ Netlify account (free)
3. ✅ Supabase project (already have)
4. ✅ Your code (ready)

---

## 📋 **Pre-Deployment Checklist:**

### **1. Environment Variables**

You need these from Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Where to find:**
```
1. Go to Supabase Dashboard
2. Click your project
3. Settings → API
4. Copy:
   - Project URL
   - anon/public key
```

---

## 🚀 **Deployment Steps:**

### **Step 1: Push to GitHub**

```bash
# If not already initialized
git init
git add .
git commit -m "Initial commit - Ready for Netlify"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Connect to Netlify**

1. **Go to Netlify:**
   - Visit: https://app.netlify.com
   - Click "Sign Up" or "Log In"
   - Use GitHub account

2. **Import Project:**
   - Click "Add new site"
   - Click "Import an existing project"
   - Choose "GitHub"
   - Authorize Netlify

3. **Select Repository:**
   - Find your repo
   - Click on it

---

### **Step 3: Configure Build Settings**

Netlify should auto-detect Next.js, but verify:

**Build command:**
```
cd apps/web && npm install && npm run build
```

**Publish directory:**
```
apps/web/.next
```

**Base directory:**
```
/
```

---

### **Step 4: Add Environment Variables**

1. Click "Site settings"
2. Go to "Environment variables"
3. Click "Add a variable"
4. Add these:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
```

---

### **Step 5: Deploy**

1. Click "Deploy site"
2. Wait 2-5 minutes
3. ✅ Done!

---

## 🌐 **Your Live URL:**

After deployment, you'll get:
```
https://your-site-name.netlify.app
```

**Custom domain (optional):**
- Go to "Domain settings"
- Add your domain
- Follow DNS instructions

---

## ⚙️ **Build Configuration (netlify.toml)**

Already created for you! Located at project root:

```toml
[build]
  command = "cd apps/web && npm install && npm run build"
  publish = "apps/web/.next"
  base = "/"

[build.environment]
  NODE_VERSION = "20"
```

---

## 🔧 **Post-Deployment Setup:**

### **1. Update Supabase URLs**

Add your Netlify URL to Supabase:

```
1. Supabase Dashboard
2. Authentication → URL Configuration
3. Add to "Site URL":
   https://your-site-name.netlify.app
4. Add to "Redirect URLs":
   https://your-site-name.netlify.app/**
```

---

### **2. Test Your Deployment**

1. ✅ Visit your Netlify URL
2. ✅ Try login as admin
3. ✅ Test creating order
4. ✅ Check all features work

---

## 🐛 **Common Issues & Fixes:**

### **Issue 1: Build Fails**

**Error:** `Cannot find module 'next'`

**Fix:**
```bash
# Make sure package.json is in apps/web/
# Build command should be:
cd apps/web && npm install && npm run build
```

---

### **Issue 2: Environment Variables Not Working**

**Error:** `Supabase client not initialized`

**Fix:**
1. Check variable names are exact:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Must start with `NEXT_PUBLIC_`
3. Redeploy after adding

---

### **Issue 3: 404 on Routes**

**Error:** Page not found on refresh

**Fix:**
- Already handled in `netlify.toml`
- Redirects configured
- Should work automatically

---

### **Issue 4: API Routes Failing**

**Error:** Server actions not working

**Fix:**
1. Next.js 15 uses server actions
2. Make sure `@netlify/plugin-nextjs` is installed
3. Netlify will auto-configure

---

## 📊 **Deployment Info:**

| Setting | Value |
|---------|-------|
| Platform | Netlify |
| Framework | Next.js 15 |
| Node Version | 20 |
| Database | Supabase |
| Build Time | 2-5 minutes |
| Cost | Free (hobby plan) |

---

## 🔄 **Continuous Deployment:**

Every time you push to GitHub:
1. Netlify detects changes
2. Automatically builds
3. Deploys new version
4. ✅ Live in minutes!

```bash
# Make changes
git add .
git commit -m "Updated feature"
git push

# Netlify auto-deploys!
```

---

## 📱 **Access Your App:**

### **Admin Panel:**
```
https://your-site-name.netlify.app/admin/login
```

### **Reseller Login:**
```
https://your-site-name.netlify.app/reseller/login
```

---

## 🎯 **Performance:**

### **Netlify Features You Get:**
- ✅ Global CDN
- ✅ SSL/HTTPS automatic
- ✅ Automatic builds
- ✅ Branch previews
- ✅ Analytics
- ✅ Edge functions

---

## 💡 **Pro Tips:**

### **1. Branch Previews**

```bash
# Create feature branch
git checkout -b feature/new-feature

# Push to GitHub
git push origin feature/new-feature

# Netlify creates preview URL!
# https://feature-new-feature--your-site.netlify.app
```

### **2. Environment-Specific Builds**

```toml
# In netlify.toml
[context.production.environment]
  NEXT_PUBLIC_ENV = "production"

[context.branch-deploy.environment]
  NEXT_PUBLIC_ENV = "staging"
```

### **3. Custom Domain**

```
1. Buy domain (GoDaddy, Namecheap, etc.)
2. Netlify → Domain settings
3. Add custom domain
4. Update DNS records:
   - A record: 75.2.60.5
   - CNAME: your-site.netlify.app
5. Wait 24-48 hours for propagation
```

---

## 🧪 **Testing Before Production:**

### **1. Local Test Build:**

```bash
cd apps/web
npm run build
npm start

# Visit: http://localhost:3000
```

### **2. Preview Deploy:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

## 📋 **Complete Deployment Checklist:**

- [ ] Push code to GitHub
- [ ] Create Netlify account
- [ ] Connect GitHub repo
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy site
- [ ] Test admin login
- [ ] Test reseller login
- [ ] Test orders
- [ ] Test payments
- [ ] Update Supabase URLs
- [ ] Test all features
- [ ] Add custom domain (optional)
- [ ] Setup continuous deployment

---

## 🚀 **Quick Start Commands:**

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for Netlify"
git push origin main

# 2. Go to Netlify
https://app.netlify.com

# 3. Import from GitHub

# 4. Add env variables:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 5. Click Deploy!
```

---

## 📞 **Need Help?**

### **Netlify Docs:**
https://docs.netlify.com/frameworks/next-js/overview/

### **Next.js Deployment:**
https://nextjs.org/docs/deployment

### **Supabase Auth:**
https://supabase.com/docs/guides/auth

---

## ✅ **Post-Deployment:**

After successful deployment:

1. ✅ Your app is LIVE!
2. ✅ SSL/HTTPS enabled
3. ✅ Global CDN active
4. ✅ Auto-deploys on push
5. ✅ Ready for production!

---

**Your app will be live at:** `https://your-site-name.netlify.app` 🎉

**Time to deploy:** ~5-10 minutes ⏱️

**Cost:** FREE! 💰

---

## 🎉 **Congratulations!**

Your SilverLine B2B app is now:
- ✅ Deployed to Netlify
- ✅ Backed by Supabase
- ✅ Accessible worldwide
- ✅ Production-ready!

**Start sharing your live URL with resellers!** 🚀
