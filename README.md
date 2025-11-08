<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Foto Video Cerdas

Aplikasi AI untuk membuat konten foto, video, voice-over, dan copywriting menggunakan Google Gemini API.

## Features

- 🎨 Image Generation & Editing
- 🎬 Video Generation
- 🎙️ Voice Over Generation
- ✍️ Copywriting Assistant
- 📱 Responsive Design
- 🌙 Dark Mode

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini API

## Run Locally

**Prerequisites:** Node.js 18+

1. Clone repository:
   ```bash
   git clone https://github.com/hafarna03aja-droid/foto-video-cerdas.git
   cd foto-video-cerdas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   - Copy `.env.example` ke `.env.local`
   - Set `GEMINI_API_KEY` dengan API key Anda

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open browser di `http://localhost:3000`

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push code ke GitHub repository
2. Login ke [Vercel](https://vercel.com)
3. Click "New Project"
4. Import repository Anda
5. Tambahkan environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login ke Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Tambahkan environment variable:
   ```bash
   vercel env add GEMINI_API_KEY
   ```

5. Redeploy dengan env:
   ```bash
   vercel --prod
   ```

## Environment Variables

Buat file `.env.local` di root project:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Untuk mendapatkan API key, kunjungi: https://ai.google.dev/

## Build for Production

```bash
npm run build
```

Output akan berada di folder `dist/`

## Preview Production Build

```bash
npm run preview
```
