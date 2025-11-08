# 🚀 Quick Start - Deploy ke Vercel

## Langkah Cepat (5 menit)

### 1. Setup Environment Variable
Buat file `.env.local`:
```bash
GEMINI_API_KEY=your_api_key_here
```

### 2. Test Local
```bash
npm install
npm run build
npm run preview
```

### 3. Push ke GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 4. Deploy ke Vercel

#### Option A: Via Dashboard (Paling Mudah)
1. Buka https://vercel.com/new
2. Import repository ini
3. Di **Environment Variables**, tambahkan:
   - Name: `GEMINI_API_KEY`
   - Value: [Your API Key]
4. Click **Deploy**
5. Done! 🎉

#### Option B: Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add GEMINI_API_KEY

# Deploy to production
vercel --prod
```

## Troubleshooting

### Build gagal?
```bash
# Cek build lokal dulu
npm run build

# Kalau error, cek:
# 1. Node version >= 18
# 2. Dependencies terinstall semua
# 3. TypeScript tidak ada error
npm run lint
```

### Styling tidak muncul?
- Cek `index.css` sudah di-import di `index.tsx` ✅
- Cek `tailwind.config.js` content paths ✅
- Clear browser cache

### API tidak jalan?
- Pastikan `GEMINI_API_KEY` sudah di-set di Vercel dashboard
- Cek di Settings → Environment Variables
- Redeploy setelah menambahkan env

## Mendapatkan Gemini API Key

1. Buka https://ai.google.dev/
2. Click "Get API Key"
3. Login dengan Google account
4. Create new API key
5. Copy key-nya

## Support

- 📖 [Full Deployment Guide](./DEPLOYMENT.md)
- 🔄 [Migration Summary](./MIGRATION_SUMMARY.md)
- 📝 [README](./README.md)

---

**Ready to deploy! 🚀**
