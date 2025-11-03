# ✅ Netlify Deployment Checklist

## 📋 **Before You Start:**

### **1. Get Supabase Credentials**

```
[ ] Go to Supabase Dashboard
[ ] Settings → API
[ ] Copy Project URL
[ ] Copy anon/public key
```

**Save these:**
```
URL: https://xxxxxxxxxxxxx.supabase.co
KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 **5-Minute Deployment:**

### **Step 1: GitHub (2 min)**

```bash
[ ] git add .
[ ] git commit -m "Deploy to Netlify"
[ ] git push origin main
```

**Don't have GitHub repo?**
```bash
[ ] Create repo on github.com
[ ] git remote add origin https://github.com/YOUR_USERNAME/REPO.git
[ ] git push -u origin main
```

---

### **Step 2: Netlify Setup (2 min)**

```
[ ] Go to: https://app.netlify.com
[ ] Click "Add new site"
[ ] Click "Import an existing project"
[ ] Choose "GitHub"
[ ] Select your repository
```

---

### **Step 3: Build Settings (1 min)**

**Verify these settings:**

```
Build command:
[ ] cd apps/web && npm install && npm run build

Publish directory:
[ ] apps/web/.next

Base directory:
[ ] /
```

---

### **Step 4: Environment Variables (1 min)**

```
[ ] Click "Site settings"
[ ] Go to "Environment variables"
[ ] Add:

Name: NEXT_PUBLIC_SUPABASE_URL
Value: [your-supabase-url]

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [your-anon-key]
```

---

### **Step 5: Deploy! (0 min)**

```
[ ] Click "Deploy site"
[ ] Wait 2-5 minutes ☕
[ ] ✅ DONE!
```

---

## 🧪 **Post-Deployment Testing:**

### **1. Test Admin Access**

```
[ ] Visit: https://your-site.netlify.app/admin/login
[ ] Login with admin credentials
[ ] Check dashboard loads
[ ] Check orders page works
[ ] Check payments page works
```

### **2. Test Reseller Access**

```
[ ] Visit: https://your-site.netlify.app/reseller/login
[ ] Login with reseller account
[ ] Check dashboard loads
[ ] Try creating an order
[ ] Check order appears in admin
```

### **3. Test All Features**

```
[ ] Silver rate updates
[ ] Product management
[ ] Order creation
[ ] Payment recording
[ ] Target tracking
[ ] Rewards system
[ ] Settings page
[ ] Reports
```

---

## 🔧 **Update Supabase (IMPORTANT)**

After deployment, update Supabase:

```
[ ] Go to Supabase Dashboard
[ ] Authentication → URL Configuration
[ ] Add Site URL: https://your-site.netlify.app
[ ] Add Redirect URL: https://your-site.netlify.app/**
[ ] Click "Save"
```

---

## ✅ **Success Criteria:**

Your deployment is successful if:

- ✅ Site loads without errors
- ✅ Admin can login
- ✅ Reseller can login
- ✅ Orders can be created
- ✅ Payments can be recorded
- ✅ All pages load correctly

---

## 🐛 **Quick Fixes:**

### **Build Failed?**

```
[ ] Check build command is correct
[ ] Check publish directory is correct
[ ] Check Node version is 20
[ ] Retry deployment
```

### **Login Not Working?**

```
[ ] Check environment variables are set
[ ] Check Supabase redirect URLs
[ ] Hard refresh browser (Ctrl+Shift+R)
```

### **Pages Not Loading?**

```
[ ] Check netlify.toml exists
[ ] Check redirects are configured
[ ] Redeploy site
```

---

## 📞 **Your Live URLs:**

After deployment, save these:

```
Main Site:
https://your-site-name.netlify.app

Admin Login:
https://your-site-name.netlify.app/admin/login

Reseller Login:
https://your-site-name.netlify.app/reseller/login
```

---

## 🔄 **Future Updates:**

To update your site:

```bash
# 1. Make changes
# 2. Commit
git add .
git commit -m "Update feature"

# 3. Push
git push origin main

# 4. Netlify auto-deploys! ✅
# 5. Wait 2-3 minutes
# 6. Changes live!
```

---

## 📊 **Deployment Summary:**

| Item | Status | Time |
|------|--------|------|
| GitHub Push | ⏳ | 2 min |
| Netlify Setup | ⏳ | 2 min |
| Build Config | ⏳ | 1 min |
| Env Variables | ⏳ | 1 min |
| Deploy | ⏳ | 3 min |
| **Total** | | **~10 min** |

---

## 🎉 **You're Done When:**

```
✅ Site deployed
✅ Admin login works
✅ Reseller login works
✅ Orders working
✅ Payments working
✅ All features tested
✅ Supabase URLs updated
```

---

**Follow the guide and you'll be live in 10 minutes!** 🚀

**See DEPLOY_TO_NETLIFY.md for detailed instructions!** 📖
