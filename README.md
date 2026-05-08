# 🌌 STUDIO SERIES | 2D AI Virtual Try-On

![Platform Version](https://img.shields.io/badge/Version-3.1.0-43A1D5?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/FastAPI-Secure-009688?style=for-the-badge&logo=fastapi)
![License](https://img.shields.io/badge/License-CC--BY--NC--SA-orange?style=for-the-badge)

**STUDIO SERIES** is a high-fidelity virtual try-on engine engineered for the modern web. It enables seamless garment simulation on user-uploaded photos using advanced diffusion models, wrapped in a high-impact **Vibrant Brutalist** interface.

---

## 🛠️ System Architecture & Features

### 🎨 Frontend (Vibrant Brutalism)
- **Design Archetype**: High-contrast Argentina Blue (`#43A1D5`) and Cyber Lime (`#BCFE2F`) on a Pure Obsidian base.
- **Performance**: Optimized canvas containers for Zero Layout Shift (CLS) and asset lazy-loading.
- **Responsive**: Fully distinct Desktop and Mobile UX modules for premium interaction.

### 🛡️ Backend (Security & Privacy)
- **Metadata Scrubbing**: Automatic stripping of GPS and EXIF data from user photos.
- **Access Control**: Production-hardened `X-API-Key` middleware.
- **Orchestration**: Asynchronous background job processing to prevent request timeouts.

---

## 🚀 Getting Started

Follow these steps to set up the full stack locally.

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Hugging Face API Token** (Read permissions)

### 2. Installation & Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/AmanTShekar/Virtual-Trialroom-2D.git
cd Virtual-Trialroom-2D
```

#### Step 2: Backend Configuration (API)
1. Navigate to `backend/`.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows: .\venv\Scripts\activate
   # Mac/Linux: source venv/bin/activate
   ```
3. Install dependencies: `pip install -r requirements.txt`
4. Create a `.env` file in `backend/` and configure your keys:
   ```env
   API_KEY=your_secret_key_here
   HF_TOKEN=your_huggingface_token
   ```
5. Launch the API server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
   ```

#### Step 3: Frontend Configuration (UI)
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file in `frontend/` to connect to your local backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8081
   VITE_API_KEY=your_secret_key_here  # Must match backend API_KEY
   ```
4. Launch the interface:
   ```bash
   npm run dev
   ```
   *The UI will typically be available at `http://localhost:5173`.*

---

## 📦 Deployment Playbook

### Backend (Hugging Face Spaces)
1. Create a new **Space** on Hugging Face using the **Docker SDK**.
2. Upload the `backend/` directory contents to your own Space (e.g., `[YOUR_USERNAME]/[YOUR_SPACE_NAME]`).
3. Configure **Secrets**: `API_KEY`, `HF_TOKEN`.
4. Configure **Variables**: `ALLOWED_ORIGINS` (your frontend URL).

### Frontend (Cloudflare Pages)
1. Build the project: `npm run build`.
2. Deploy the `dist/` folder.
3. Set `VITE_API_BASE_URL` to your HF Space URL.

---

## 🧠 System Mechanics
STUDIO SERIES utilizes the **IDM-VTON** architecture. The pipeline executes in three stages:
1. **Skeletal Analysis**: Detects human pose keypoints for garment alignment.
2. **Dense Mapping**: Maps texture and flow onto body geometry.
3. **Diffusion Refinement**: Uses U-Net to harmonize lighting and fabric wrinkles.

---

## 📜 License & Acknowledgments
- **Code**: Licensed under the **MIT License**.
- **AI Model (IDM-VTON)**: Subject to the **CC-BY-NC-SA 4.0** license (Non-Commercial Research Use Only).
- **Credits**: Built upon the work of the IDM-VTON research team ([Academic Paper](https://idm-vton.github.io/)).

---
© 2024 Studio Series Engineering.
