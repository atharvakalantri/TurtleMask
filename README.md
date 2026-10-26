# TurtleMask Frontend 🐢🛡️🌿

A lavish emerald, classic, and serene web interface for **TurtleMask** — the zero-retention AI privacy gateway and neural firewall.

Built with pure standard Web technologies (HTML5, modern CSS3 glassmorphism, and vanilla JavaScript ES6+), requiring **zero external npm/node builds**. It runs immediately anywhere: served directly by FastAPI, launched with Python's HTTP server, or opened straight in any web browser.

---

## 🌿 Key Aesthetics & Features

### 1. Classic Serene Design (ChatGPT Inspired)
- **Deep Obsidian Emerald Palette**: Soothing forest tones (`#071510`, `#0a1f17`, `#0e2b20`) with luminous mint accents (`#10b981`, `#34d399`) and subtle gold luxury highlights (`#f59e0b`).
- **Collapsible Sidebar**: ChatGPT-style navigation with "New Protected Chat", session categorization ("Today" vs "Previous"), templates, and bottom user profile capsule.
- **Center Stage**: Serene conversational stream with distinct user message bubbles, AI bubbles with model headers, code block formatting with instant copy buttons, and floating composer dock.

### 2. Rich Toggles Galore
- **Security Policy Dual Slider Toggle**: Instant live switch between:
  - `NORMAL MASK`: Smart surrogate dummy token replacement (e.g., real names & emails swapped in volatile RAM, forwarded to LLMs, and restored on response).
  - `TECH STRICT`: Hard block enterprise defense (blocks prompt transmission and triggers red alert banner if confidential code, DB schemas, or API keys are spotted).
- **Auto-Unmask Response Toggle**: Switch between viewing the unmasked restored reply or the raw dummy surrogate reply.
- **DeBERTa Injection Guard Toggle**: Enable/disable strict prompt injection adversarial filtering.
- **Gemma Unstructured Secret Guard Toggle**: Check for proprietary code patterns and internal database URLs.
- **Typing Stream Simulation Toggle**: Smooth token-by-token text stream delivery.
- **Whisper-Quiet Auditory Feedback Toggle**: Pure Web Audio API synthesized soft clicks and alerts (zero external audio files).
- **Entity Diff Chips Toggle**: Toggle surrogate pill highlights.
- **Compact Density Toggle**: Instant switch between spacious and condensed conversation views.
- **Auto-Scroll Toggle**: Automatically follow generation flow.

### 3. Hovering Lists & Menus
- **Hovering Model Selection Menu**: Hovering over the active model reveals a frosted card with latency, provider icons (OpenAI GPT-4o-mini, Google Gemini 2.5 Flash, Anthropic Claude 3.5 Sonnet, Local Gemma 4), and context window info.
- **Hovering PII Entity Chips**: Hovering over any entity chip displays Presidio confidence score, entity type (`EMAIL_ADDRESS`, `PERSON`, `API_KEY`), and dummy replacement.
- **Hovering History Action Bar**: Hovering over any chat session reveals instant Rename and Delete actions.
- **Hovering Telemetry Shield**: Hovering over the Shield pill displays live pipeline metrics (DeBERTa score, PII counts, RAM Whiteboard ticket).
- **Hovering Slash (`/`) Commands**: Floating palette when typing `/` in the prompt composer (`/vault`, `/scan`, `/mode`, `/offline`, `/clear`).
- **Hovering User Popover Menu**: Account switching, local session wipe, and quick vault access.

---

## 🚀 Running the Frontend

### Option A: Direct FastAPI Gateway (Recommended)
When the FastAPI backend is running:
```bash
cd Backend
uvicorn app.main:app --reload
```
Navigate to:
```
http://127.0.0.1:8000/app
```
or
```
http://127.0.0.1:8000/ui
```
FastAPI automatically serves the `Frontend` directory through mounted static files!

### Option B: Python Simple HTTP Server
In the root or `Frontend` directory:
```powershell
python -m http.server 3000 --directory Frontend
```
Open your browser at:
```
http://localhost:3000
```

### Option C: Direct File Opening
Double click `Frontend/index.html` to open it in Chrome, Edge, Safari, or Firefox. The frontend features an intelligent zero-crash neural fallback engine, allowing full exploration of the UI, toggles, and inspector even when offline!

---

## 🛡️ Backend Endpoints Connected

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /` | GET | Health & version check |
| `POST /ai/chat` | POST | Secure chat proxy with prompt injection guard, Presidio NER, surrogate masking, and RAM unmasking |
| `POST /ml/analyze-prompt` | POST | Prompt sanitizer & DeBERTa injection score analysis |
| `POST /ml/extract-file` | POST | Document parsing (PDF, DOCX, TXT, OCR) & PII inspection |
| `POST /vault/connect` | POST | Encrypts API keys with Fernet in SQLite DB |
| `GET /vault/models/{user_id}` | GET | Queries connected models |
| `POST /user/mode` | POST | Updates active policy (`NORMAL_MASK` vs `TECH_STRICT`) |
| `POST /signup` & `/login` | POST | User authentication & JWT session management |
