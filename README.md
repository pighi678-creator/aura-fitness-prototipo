# 🚀 Aura Fitness – AI Coach & Smart Gym

> **MVP production-ready** | Progetto studente ITS Digital Academy 2026  
> Un'app web PWA ultra-moderna per coaching fitness personalizzato con AI, affluenza live palestra e tracking progressi.

---

## ✨ Features MVP

| Feature | Stato |
|---|---|
| 🎬 Splash screen con logo animato | ✅ |
| 🔐 Login/Registrazione modale (email + Google OAuth simulato) | ✅ |
| 👤 Profilo utente persistente (età, peso, obiettivi) | ✅ |
| 📊 Chart affluenza live con tooltip persone esatte | ✅ |
| 🤖 AI Workout Generator (ipertrofia / forza / endurance) | ✅ |
| 📄 Download scheda PDF (jsPDF) | ✅ |
| ⏱ Timer fullscreen con audio beep e anello SVG | ✅ |
| 📈 Tracker grafici settimanali + calorie (Chart.js) | ✅ |
| 📅 Calendario workout mensile SPA | ✅ |
| 🏋️ Lista esercizi con filtro e timer integrato | ✅ |
| 🌙 Dark mode + system preference detection | ✅ |
| 📤 Export tracker CSV | ✅ |
| 🎉 Confetti su workout completato | ✅ |
| 💾 Auto-save localStorage + `beforeunload` sync | ✅ |
| 📡 Simulazione WebSocket occupancy real-time | ✅ |
| 📱 PWA installabile (manifest + Service Worker) | ✅ |
| 🔄 SPA navigation con History API (no reload) | ✅ |
| ♿ ARIA labels + keyboard navigation | ✅ |
| 📊 Google Analytics 4 (placeholder) | ✅ |

---

## 📁 Struttura File

```
aura-fitness-prototipo/
├── index.html        # SPA principale (Dashboard/Calendar/Exercises/Settings)
├── style.css         # Design system glassmorphism ultra-moderno
├── script.js         # Logica modulare ES6 (auth, AI, timer, charts…)
├── manifest.json     # PWA manifest installabile
├── sw.js             # Service Worker offline-first
├── api-mock.json     # Dati mock (gyms, workouts, exercises, trainers)
└── README.md
```

---

## 🛠 Stack Tecnico

**Frontend**
- HTML5 semantico + CSS custom properties (dark glassmorphism)
- Vanilla JavaScript ES6+ (moduli, async/await, history API)
- Tailwind CSS (utility classes via CDN)
- Chart.js (occupancy chart, weekly progress, calories)
- Lucide Icons (lazy render via CDN)
- jsPDF (generazione PDF lato client)

**PWA**
- `manifest.json` – install prompt, shortcuts
- `sw.js` – offline cache, stale-while-revalidate

**Data**
- `api-mock.json` – dati locali (gyms, workouts, exercises, trainers)
- `localStorage` – profilo utente, preferenze, storico workout
- Simulated WebSocket per aggiornamento occupancy ogni 30s

---

## 🚀 Setup & Avvio

### Metodo 1 – Apri direttamente (zero setup)
```bash
# Clona il repo
git clone https://github.com/pighi678-creator/aura-fitness-prototipo.git
cd aura-fitness-prototipo

# Apri index.html in un browser moderno
# (Chrome, Edge, Firefox, Safari)
```

> ⚠️ **Il PWA Service Worker richiede un server HTTP** (non funziona su `file://`).

### Metodo 2 – Live Server locale (consigliato per sviluppo)
```bash
# Con VS Code: installa estensione "Live Server" e clicca "Go Live"

# oppure con npx
npx serve .

# oppure con Python
python -m http.server 8080
```

### Metodo 3 – Build con Vite (per produzione)
```bash
npm create vite@latest aura-fitness -- --template vanilla
# Copia i file nel progetto Vite, poi:
npm install
npm run dev    # sviluppo locale
npm run build  # build produzione in /dist
```

---

## 📱 Installazione PWA

1. Apri l'app in Chrome/Edge su mobile
2. Tocca **"Aggiungi a schermata Home"** dal menu browser
3. L'app si installa come applicazione nativa standalone

---

## 🔧 Configurazione

### Google Analytics 4
Nel file `index.html`, sostituisci `G-XXXXXXXXXX` con il tuo **Measurement ID**:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-IL-TUO-ID"></script>
```

### Dati palestra reali
Modifica `api-mock.json` con i dati della tua palestra:
- Nome, indirizzo, capienza
- Orari affluenza reale
- Lista trainer

### Backend (fase futura)
```
POST /api/auth       → Login/registrazione
GET  /api/occupancy  → Affluenza real-time (WebSocket)
GET  /api/workouts   → Schede workout
POST /api/progress   → Salva progressi
```

---

## 🧑‍🎓 Team

**ITS Digital Academy – Progetto Aura Fitness 2026**

---

## 📄 TODO (v2)

- [ ] Backend Node.js/Flask con autenticazione JWT reale
- [ ] Firebase Firestore per sync multi-device
- [ ] Integrazione OpenAI/Claude API per workout AI vero
- [ ] Wearable integration (Apple Health / Google Fit)
- [ ] Video esercizi (embedded YouTube)
- [ ] Classifica amici & social features
- [ ] Apple Watch companion app
