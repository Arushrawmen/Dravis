# ⚡ DRAVIS ASI — Autonomous Voice Operating System & AI Superintelligence

<div align="center">

![Dravis Banner](https://img.shields.io/badge/Dravis_ASI-v4.2.0_Stable-00E5FF?style=for-the-badge&logo=probot&logoColor=black)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-Flash_Latest-4285F4?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

<p align="center">
  <b>A next-generation, voice-first Artificial Super Intelligence (ASI) assistant and conversational operating system built for hyper-responsive desktop multitasking, autonomous tool execution, and zero-latency human-AI collaboration.</b>
</p>

[Live Web App](https://dravis.fun) • [Release Notes](RELEASE_NOTES.md) • [Report Issue](https://github.com/ArushRawat/dravis-asi/issues)

</div>

---

## 🌟 Overview

**Dravis ASI** is designed from the ground up to combine autonomous AI reasoning with an ultra-low latency acoustic interface. Powered by the **Google Gemini API**, Dravis bridges voice recognition, neural speech synthesis, interactive desktop automation, and multi-app orchestration into a unified browser and Android experience.

Whether taking complex voice commands in **Hindi, English, or Hinglish**, launching local desktop workflows, or synthesizing code directly into the Dravis Workspace, Dravis speaks and acts in real time with zero delay.

---

## 🚀 Key Features

### 🎙️ 1. Zero-Latency Voice Engine & Speech Recognition
- **Zero-Drop Continuous Listening:** Buffers both interim and final recognition tokens so no words are clipped during natural pauses.
- **Multilingual Support (`hi-IN`, `en-IN`, `en-US`):** Native Hindi and Indian English phonetic parsing for conversational accuracy.
- **Synchronous Speech & Text:** Instant speech synthesis triggers simultaneously with text rendering (<15ms latency).
- **Acoustic Personas:** Switch between distinct voice personalities (*Puck*, *Fenrir*, *Kore*, *Zephyr*, *Aoede*, *Charon*).

### ⚡ 2. Granular Profile Latency & Speed Customization
- **Speech Speed Rate Slider (`0.5x – 2.5x`):** Dynamically alters voice tempo in real time across HTML5 Audio and native Speech Synthesis.
- **Responding Speed & Deliberation Engine (`0.5x – 3.0x Multiplier`):**
  - **Instant / Turbo Mode:** 0ms instantaneous command execution.
  - **Balanced Mode:** Natural human conversational pacing (~600ms).
  - **Deep ASI / Reasoning Mode:** Deliberate multi-step cognitive calculation (~1.5s to 2.5s) for complex mathematical or architectural tasks.

### 🧠 3. Multi-Model Google Gemini Intelligence
- **Enterprise-Grade AI Architecture:** Cascading fail-safes across `gemini-2.5-flash`, `gemini-1.5-flash`, and direct client-side fallback bridges.
- **Autonomous Task Decomposition:** Automatically identifies user intent, extracts code artifacts, and updates persistent long-term memory.
- **3D Micro-Decision Graph:** Visualizes autonomous decisions and workflow trees in real-time 3D nodes.

### 🏝️ 4. Dynamic Island Notch HUD & Desktop OS Multitasking
- **Live Transcription Feedback:** Displays active speech recognition progress (`Listening: "..."`) directly inside the top notch.
- **Workspace File Sync:** Automatically extracts generated code blocks (`.tsx`, `.py`, `.sql`, `.html`) and writes them directly into the workspace file manager.
- **Cross-Platform Delivery:** Runs smoothly on Web (PWA), Android (APK/AAB via Capacitor/Gradle), and Desktop landscape views.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                      │
│   React 19 • TypeScript • Tailwind CSS • Motion        │
│   Dynamic Island HUD • 3D Canvas • Audio Visualizer    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   SPEECH & AUDIO CORE                  │
│   Web Speech API • Zero-Latency Speech Synthesis       │
│   Hardware Priming • Multi-Dialect Acoustic Ranker     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   SERVER / BACKEND                     │
│   Express.js • Node.js ES Modules • esbuild Runtime    │
│   Google Gemini API Core • Fail-Safe Key Pool          │
│   Supabase Postgres • Razorpay • Google Cloud Maps     │
└────────────────────────────────────────────────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion |
| **Audio / Speech** | Web Speech API, SpeechSynthesis, Web Audio Context, Neural Voice Ranker |
| **AI / LLM** | Google Gemini API (`@google/genai`), OpenRouter / OpenAI fallback |
| **Backend** | Node.js, Express, esbuild, Dotenv, CORS, Compression |
| **Database & Auth** | Supabase, PostgreSQL, LocalStorage Memory Bank |
| **Deployment** | Hostinger Cloud, Cloud Run, Docker, PWA manifest |

---

## 🏁 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Google Gemini API Key** ([Get one from Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/ArushRawat/dravis-asi.git
cd dravis-asi
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

# Google Gemini API Keys
GEMINI_API_KEY="your_primary_gemini_api_key"
GEMINI_API_KEY_FALLBACK="your_backup_gemini_api_key"
VITE_GEMINI_API_KEY="your_primary_gemini_api_key"

# Optional Integrations
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_key"
RAZORPAY_KEY_ID="your_razorpay_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
SUPABASE_URL="your_supabase_url"
SUPABASE_API_KEY="your_supabase_anon_key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [Dravis Website](https://dravis.fun/) in your browser.

---

## 📦 Production Build & Deployment

### Build the Application
```bash
npm run build
```
This bundles the client via Vite into `dist/` and transpiles `server.ts` into a lightweight, standalone `server.js` using esbuild.

### Start Production Server
```bash
npm start
```

### Deploying to Hostinger VPS / Cloud
1. Upload `Dravis.zip` or clone this repository onto your server.
2. Ensure `.env` is populated with your production keys.
3. Install dependencies and start with PM2:
   ```bash
   npm install --production
   pm2 start server.js --name "dravis-asi"
   ```
4. Verify server health:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## ⚙️ Configuration Reference

| Variable | Description | Required |
| :--- | :--- | :---: |
| `GEMINI_API_KEY` | Primary API key for Gemini Superintelligence reasoning | **Yes** |
| `GEMINI_API_KEY_FALLBACK` | Backup API key for high-availability failover | Optional |
| `PORT` | HTTP port for server (default: `3000`) | Optional |
| `NODE_ENV` | Runtime environment (`development` / `production`) | Optional |
| `SUPABASE_URL` | Cloud database URL for telemetry and memory storage | Optional |
| `RAZORPAY_KEY_ID` | Payment gateway key for Pro subscription tiers | Optional |

---

## 🔒 Security & Privacy

- **Client-Side Privacy:** Audio capture streams are processed locally and discarded immediately after transcription.
- **Credential Protection:** API keys and environment variables are strictly sanitized, and dummy placeholder strings are ignored at runtime.

---

## 📄 License & Credits

Developed with ❤️ by **Arush Rawat** & the Dravis ASI Engineering Team.  
Distributed under the **MIT License**.
