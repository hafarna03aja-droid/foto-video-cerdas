# Deployment Checklist untuk Vercel

## Persiapan

- [x] CDN Tailwind diganti dengan SDK (package)
- [x] Import map dihapus, menggunakan npm packages
- [x] Tailwind CSS dikonfigurasi dengan PostCSS
- [x] Vite config dioptimasi untuk production build
- [x] vercel.json dibuat untuk konfigurasi deployment

## File Penting

1. **tailwind.config.js** - Konfigurasi Tailwind CSS
2. **postcss.config.js** - Konfigurasi PostCSS
3. **vercel.json** - Konfigurasi deployment Vercel
4. **index.css** - Import Tailwind directives
5. **.env.example** - Template environment variables

## Langkah Deploy ke Vercel

### Via Dashboard (Recommended)

1. Push code ke GitHub:
   ```bash
   git add .
   git commit -m "Setup for Vercel deployment"
   git push origin main
   ```

2. Buka https://vercel.com/new

3. Import repository `foto-video-cerdas`

4. Framework Preset: **Vite** (auto-detected)

5. Build Settings (default sudah benar):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Environment Variables** - Tambahkan:
   ```
   GEMINI_API_KEY = your_api_key_here
   ```

7. Click **Deploy**

### Via CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```
   
4. Ikuti prompts, lalu tambahkan env variable:
   ```bash
   vercel env add GEMINI_API_KEY production
   ```

5. Production deploy:
   ```bash
   vercel --prod
   ```

## Verifikasi Deployment

Setelah deploy, cek:
- ✅ Aplikasi terbuka tanpa error
- ✅ Styling Tailwind ter-apply dengan benar
- ✅ Dark mode berfungsi
- ✅ API Gemini bisa diakses
- ✅ Semua fitur berfungsi normal

## Troubleshooting

### Build Error
- Cek `npm run build` lokal terlebih dahulu
- Pastikan semua dependencies ada di `package.json`

### Environment Variable Error
- Pastikan `GEMINI_API_KEY` sudah di-set di Vercel dashboard
- Vercel menggunakan `process.env.GEMINI_API_KEY`

### Styling Tidak Muncul
- Cek `index.css` ter-import di `index.tsx`
- Pastikan `tailwind.config.js` content paths benar

## Performance Optimization

Project ini sudah include:
- Code splitting (react-vendor, markdown-vendor chunks)
- Minification dengan esbuild
- Tree shaking otomatis
- CSS optimization via PostCSS

## Custom Domain (Optional)

Di Vercel Dashboard:
1. Settings → Domains
2. Add domain Anda
3. Configure DNS sesuai instruksi Vercel

## Analytics (Optional)

Aktifkan Vercel Analytics:
1. Project Settings → Analytics
2. Enable Analytics
3. Redeploy jika diperlukan
