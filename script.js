/* ============================================================
   AURA FITNESS – script.js (MVP Edition 2026)
   Modular ES6 | PWA | AI Coach | SPA Navigation
   ============================================================ */

"use strict";

/* ============================================================
   SECTION 1: APP STATE & CONSTANTS
   ============================================================ */

const APP_VERSION = "1.0.0";
const DB_KEY = {
  USER: "aura_user",
  PROFILE: "aura_profile",
  WORKOUTS: "aura_workouts",
  SETTINGS: "aura_settings",
};

const CONFETTI_COLORS = [
  "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#f472b6", "#a78bfa"
];

let appState = {
  user: null,
  profile: null,
  currentView: "dashboard",
  chartInstance: null,
  trackerChart: null,
  timerInterval: null,
  timerRunning: false,
  timerSeconds: 0,
  timerTotal: 0,
  timerExercise: "",
  occupancy: [],
  workouts: [],
  settings: {
    darkMode: true,
    notifications: false,
    autoSave: true,
  },
};

/* ============================================================
   SECTION 2: UTILITIES
   ============================================================ */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Load from localStorage safely */
function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

/** Save to localStorage safely */
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn("LS error:", e); }
}

/** Show a bottom toast notification */
function showToast(message, icon = "✅") {
  const existing = document.getElementById("aura-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "aura-toast";
  toast.className = "toast";
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/** Format seconds as MM:SS */
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Trigger confetti burst 🎉 */
function launchConfetti() {
  const count = 80;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = Math.random() * 100;
    const dur = 1.5 + Math.random() * 2;
    const size = 6 + Math.random() * 10;
    piece.style.cssText = `
      left:${left}vw; background:${color}; width:${size}px; height:${size}px;
      animation-duration:${dur}s; animation-delay:${Math.random() * 0.5}s;
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + 0.5) * 1000);
  }
}

/* ============================================================
   SECTION 3: SERVICE WORKER & PWA
   ============================================================ */

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => console.log("[PWA] SW registered:", reg.scope))
        .catch(err => console.warn("[PWA] SW failed:", err));
    });
  }
}

/* ============================================================
   SECTION 4: SPLASH SCREEN
   ============================================================ */

function initSplash() {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;

  // Simulate app init: load data then hide splash
  setTimeout(() => {
    loadAppData();
    splash.classList.add("hidden");
    document.body.style.overflow = "";
  }, 2000);
}

/* ============================================================
   SECTION 5: AUTH MODULE
   ============================================================ */

function initAuth() {
  const savedUser = loadLS(DB_KEY.USER);
  if (savedUser) {
    appState.user = savedUser;
    updateHeaderUser(savedUser);
  } else {
    // Show login modal if no user
    setTimeout(() => showAuthModal("login"), 2200);
  }
}

function showAuthModal(mode = "login") {
  const overlay = document.getElementById("auth-modal");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  renderAuthForm(mode);
}

function hideAuthModal() {
  const overlay = document.getElementById("auth-modal");
  if (overlay) overlay.classList.add("hidden");
}

function renderAuthForm(mode) {
  const container = document.getElementById("auth-form-container");
  if (!container) return;

  const isLogin = mode === "login";
  container.innerHTML = `
    <div class="modal-handle"></div>
    <h2 class="font-black text-2xl text-center mb-1 gradient-text">
      ${isLogin ? "Bentornato 👋" : "Crea Account"}
    </h2>
    <p class="text-center text-sm text-slate-400 mb-6">
      ${isLogin ? "Accedi al tuo profilo Aura" : "Inizia il tuo percorso fitness"}
    </p>

    <!-- Google -->
    <button onclick="handleGoogleAuth()" class="google-btn" aria-label="Continua con Google">
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continua con Google
    </button>

    <div class="auth-divider">oppure</div>

    ${!isLogin ? `
    <input type="text" id="auth-name" class="modal-input" placeholder="Nome completo" autocomplete="name" />
    ` : ""}
    <input type="email" id="auth-email" class="modal-input" placeholder="Email" autocomplete="email" />
    <input type="password" id="auth-password" class="modal-input" placeholder="Password (min. 6 caratteri)" autocomplete="${isLogin ? "current-password" : "new-password"}" />

    <button onclick="handleEmailAuth('${mode}')" class="btn-primary">
      ${isLogin ? "Accedi" : "Crea Account"}
    </button>

    <p class="text-center text-sm text-slate-500 mt-4">
      ${isLogin
      ? `Non hai un account? <button onclick="renderAuthForm('register')" class="text-purple-400 font-bold underline">Registrati</button>`
      : `Hai già un account? <button onclick="renderAuthForm('login')" class="text-purple-400 font-bold underline">Accedi</button>`
    }
    </p>
  `;
}

function handleGoogleAuth() {
  // Simulated Google OAuth
  const fakeUser = {
    id: "google_" + Date.now(),
    name: "Alex Google",
    email: "alex@gmail.com",
    avatar: "🧑",
    provider: "google",
    createdAt: new Date().toISOString(),
  };
  loginUser(fakeUser);
}

function handleEmailAuth(mode) {
  const email = document.getElementById("auth-email")?.value.trim();
  const password = document.getElementById("auth-password")?.value;
  const name = document.getElementById("auth-name")?.value.trim();

  if (!email || !password) { showToast("Compila tutti i campi", "⚠️"); return; }
  if (password.length < 6) { showToast("Password min. 6 caratteri", "⚠️"); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { showToast("Email non valida", "⚠️"); return; }

  const user = {
    id: "email_" + Date.now(),
    name: name || email.split("@")[0],
    email,
    avatar: "🧑",
    provider: "email",
    createdAt: new Date().toISOString(),
  };

  loginUser(user);
}

function loginUser(user) {
  appState.user = user;
  saveLS(DB_KEY.USER, user);
  hideAuthModal();
  updateHeaderUser(user);
  loadUserProfile();
  showToast(`Ciao, ${user.name}! 💪`);

  // Render welcome name in dashboard
  const wName = document.getElementById("welcome-name");
  if (wName) wName.textContent = user.name.split(" ")[0];
}

function logoutUser() {
  appState.user = null;
  appState.profile = null;
  localStorage.removeItem(DB_KEY.USER);
  localStorage.removeItem(DB_KEY.PROFILE);
  updateHeaderUser(null);
  showToast("Disconnessione effettuata", "👋");
  setTimeout(() => showAuthModal("login"), 800);
}

function updateHeaderUser(user) {
  const avatarEl = document.getElementById("header-avatar");
  if (!avatarEl) return;
  if (user) {
    avatarEl.textContent = user.avatar || user.name?.[0]?.toUpperCase() || "U";
    avatarEl.style.fontSize = "1.25rem";
  } else {
    avatarEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }
}

/* ============================================================
   SECTION 6: USER PROFILE
   ============================================================ */

function loadUserProfile() {
  const saved = loadLS(DB_KEY.PROFILE);
  if (saved) {
    appState.profile = saved;
    populateProfileForm(saved);
  }
}

function populateProfileForm(profile) {
  if (!profile) return;
  const fields = ["profile-age", "profile-weight", "profile-height", "profile-goal"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = profile[id.replace("profile-", "")] || "";
  });
}

function saveUserProfile() {
  const profile = {
    age: document.getElementById("profile-age")?.value,
    weight: document.getElementById("profile-weight")?.value,
    height: document.getElementById("profile-height")?.value,
    goal: document.getElementById("profile-goal")?.value || "ipertrofia",
    updatedAt: new Date().toISOString(),
  };
  appState.profile = profile;
  saveLS(DB_KEY.PROFILE, profile);
  showToast("Profilo salvato! ✨");
  launchConfetti();
}

/* ============================================================
   SECTION 7: LOAD APP DATA (api-mock.json)
   ============================================================ */

async function loadAppData() {
  try {
    const res = await fetch("./api-mock.json");
    const data = await res.json();

    appState.occupancy = data.occupancy.hourly;
    appState.workouts = data.workouts;

    // Store for later use
    window._apiData = data;

    initOccupancyChart(data.occupancy.hourly);
    renderTrainers(data.trainers);
    renderExerciseList(data.exercises);
    renderCalendar();
    initTrackerCharts();
    updateOccupancyStats(data.occupancy.hourly);

    // Simulated WebSocket: update occupancy every 30s
    simulateRealtimeOccupancy(data.occupancy.hourly);

  } catch (err) {
    console.warn("[Aura] api-mock.json not reachable, using fallback data:", err);
    const fallback = getFallbackOccupancy();
    initOccupancyChart(fallback);
    renderTrainers(getFallbackTrainers());
    renderCalendar();
    initTrackerCharts();
  }
}

function getFallbackOccupancy() {
  return [
    { time: "06:00", percent: 15, people: 22 },
    { time: "09:00", percent: 65, people: 97 },
    { time: "12:00", percent: 40, people: 60 },
    { time: "15:00", percent: 30, people: 45 },
    { time: "18:00", percent: 95, people: 142 },
    { time: "21:00", percent: 50, people: 75 },
    { time: "23:00", percent: 5, people: 7 },
  ];
}

function getFallbackTrainers() {
  return [
    { id: 1, name: "Sara K.", specialty: "HIIT Specialist", rating: 4.9, emoji: "👩‍🏫", featured: true },
    { id: 2, name: "Marco V.", specialty: "Powerlifting", rating: 4.8, emoji: "🏋️", featured: false },
    { id: 3, name: "Luca B.", specialty: "Calisthenics", rating: 4.7, emoji: "🤸", featured: false },
  ];
}

/* ============================================================
   SECTION 8: OCCUPANCY CHART (Chart.js with tooltip)
   ============================================================ */

function initOccupancyChart(hourlyData) {
  const canvas = document.getElementById("occupancyChart");
  if (!canvas) return;

  if (appState.chartInstance) {
    appState.chartInstance.destroy();
  }

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.45)");
  gradient.addColorStop(0.6, "rgba(236, 72, 153, 0.15)");
  gradient.addColorStop(1, "rgba(11, 15, 26, 0)");

  const labels = hourlyData.map(d => d.time);
  const percents = hourlyData.map(d => d.percent);
  const people = hourlyData.map(d => d.people);

  appState.chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: percents,
        borderColor: "#a78bfa",
        borderWidth: 3,
        fill: true,
        backgroundColor: gradient,
        tension: 0.45,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#8b5cf6",
        pointHoverBorderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(15, 20, 35, 0.95)",
          borderColor: "rgba(139, 92, 246, 0.4)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          titleColor: "#c4b5fd",
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: "700", size: 12 },
          bodyColor: "#f1f5f9",
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
          callbacks: {
            title: (items) => `🕐 ${items[0].label}`,
            label: (item) => {
              const p = people[item.dataIndex];
              const pct = item.raw;
              const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
              return [`${pct}% · ${p} persone`, bar];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#475569",
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: "600" },
            maxTicksLimit: 7,
          },
          border: { display: false },
        },
        y: {
          display: false,
          min: 0,
          max: 105,
        },
      },
    },
  });
}

function updateOccupancyStats(hourlyData) {
  const nowHour = new Date().getHours();
  const current = hourlyData.find(d => parseInt(d.time) === nowHour)
    || hourlyData[Math.floor(hourlyData.length / 2)];

  const peak = hourlyData.reduce((max, d) => d.people > max.people ? d : max, hourlyData[0]);

  const currentEl = document.getElementById("stat-current");
  const peakEl = document.getElementById("stat-peak");
  const waitEl = document.getElementById("stat-wait");

  if (currentEl) currentEl.textContent = current.people;
  if (peakEl) peakEl.textContent = `${peak.percent}%`;
  if (waitEl) waitEl.textContent = current.percent > 75 ? "~10m" : "< 2m";
}

/** Simulated WebSocket: nudge occupancy every 30 seconds */
function simulateRealtimeOccupancy(hourlyData) {
  setInterval(() => {
    if (!appState.chartInstance) return;
    const chart = appState.chartInstance;
    const data = chart.data.datasets[0].data;
    const newData = data.map(v => Math.max(0, Math.min(100, v + (Math.random() * 6 - 3))));
    chart.data.datasets[0].data = newData;
    chart.update("none"); // no animation for subtle effect
  }, 30000);
}

/* ============================================================
   SECTION 9: AI WORKOUT GENERATOR
   ============================================================ */

const WORKOUT_TYPES = {
  forza: {
    label: "Forza Massimale",
    duration: "60 min",
    color: "#6366f1",
    icon: "🏋️",
    exercises: [
      { name: "Squat (Bilanciere)", sets: 5, reps: "5", rest: 180, note: "RPE 8-9, pausa completa" },
      { name: "Stacco da Terra", sets: 3, reps: "5", rest: 180, note: "Focus catena posteriore" },
      { name: "Panca Piana", sets: 4, reps: "6", rest: 150, note: "Pausa sul petto 1 sec" },
      { name: "Military Press", sets: 3, reps: "6", rest: 120, note: "" },
      { name: "Chin-Up Zavorra", sets: 3, reps: "5", rest: 120, note: "Presa supina" },
    ],
  },
  ipertrofia: {
    label: "Ipertrofia Muscolare",
    duration: "55 min",
    color: "#8b5cf6",
    icon: "💪",
    exercises: [
      { name: "Panca Piana (Bilanciere)", sets: 4, reps: "10", rest: 90, note: "Contrazione al top" },
      { name: "Trazioni alla Sbarra", sets: 3, reps: "MAX", rest: 90, note: "" },
      { name: "Affondi Posteriori", sets: 3, reps: "12", rest: 75, note: "Ogni gamba" },
      { name: "Croci ai Cavi (basso)", sets: 3, reps: "14", rest: 60, note: "" },
      { name: "Curl Bilanciere", sets: 3, reps: "12", rest: 60, note: "" },
    ],
  },
  endurance: {
    label: "Resistenza Aerobica",
    duration: "45 min",
    color: "#06b6d4",
    icon: "🏃",
    exercises: [
      { name: "Running (tapis roulant)", sets: 1, reps: "20min", rest: 0, note: "Zona 2, 65% FC max" },
      { name: "Burpees", sets: 4, reps: "15", rest: 45, note: "" },
      { name: "Salto con la Corda", sets: 5, reps: "1min", rest: 30, note: "" },
      { name: "Mountain Climbers", sets: 3, reps: "30s", rest: 30, note: "" },
      { name: "Plank", sets: 3, reps: "45s", rest: 30, note: "Addome contratto" },
    ],
  },
};

let _lastWorkout = null;

async function generateAIWorkout() {
  const btn = document.getElementById("aiBtn");
  const responseArea = document.getElementById("aiResponse");
  if (!btn) return;

  // Read biometric inputs
  const age = document.getElementById("bio-age")?.value || appState.profile?.age || "25";
  const weight = document.getElementById("bio-weight")?.value || appState.profile?.weight || "75";
  const goal = document.getElementById("bio-goal")?.value || appState.profile?.goal || "ipertrofia";

  // Loading state
  btn.disabled = true;
  btn.innerHTML = `
    <div class="ai-loading-dots">
      <span></span><span></span><span></span>
    </div>
    <span>Analisi biometria...</span>
  `;

  // Simulate API latency (1.2 – 2.0s)
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const workout = window._apiData?.workouts?.[goal] || WORKOUT_TYPES[goal] || WORKOUT_TYPES.ipertrofia;
  _lastWorkout = { ...workout, age, weight, goal, generatedAt: new Date().toISOString() };

  // Save to localStorage
  const saved = loadLS(DB_KEY.WORKOUTS) || [];
  saved.unshift(_lastWorkout);
  if (saved.length > 20) saved.pop();
  saveLS(DB_KEY.WORKOUTS, saved);

  const exercises = workout.exercises || WORKOUT_TYPES.ipertrofia.exercises;
  const occupancyNote = appState.occupancy.length > 0
    ? `Ho ottimizzato gli esercizi in base all'affluenza attuale (macchinari ${Math.floor(60 + Math.random() * 30)}% occupati).`
    : "Scheda ottimizzata per raggiungere i tuoi obiettivi di " + workout.label + ".";

  btn.innerHTML = `✨ Genera Nuova Scheda`;
  btn.disabled = false;

  responseArea.classList.remove("hidden");
  responseArea.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest" style="color:${workout.color || "#a78bfa"}">
        <span>${workout.icon || "💪"} Focus: ${workout.label}</span>
        <span>⏱ ${workout.duration}</span>
      </div>

      <div class="space-y-2" id="exercise-list-ai">
        ${exercises.map((ex, i) => `
          <div class="exercise-row" onclick="openTimer(${ex.rest || 60}, '${ex.name.replace(/'/g, "\\'")}')">
            <div>
              <span class="text-sm font-semibold block">${ex.name}</span>
              ${ex.note ? `<span class="text-xs text-slate-500">${ex.note}</span>` : ""}
            </div>
            <div class="flex items-center gap-2">
              <span class="exercise-badge">${ex.sets}×${ex.reps}</span>
              ${ex.rest > 0 ? `<span class="text-[10px] text-slate-500">${ex.rest}s</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>

      <p class="text-[11px] text-slate-500 italic mt-2">
        🤖 Nota Aura: ${occupancyNote}
      </p>

      <div class="flex gap-2 mt-3">
        <button onclick="downloadWorkoutPDF()" class="btn-secondary flex-1" aria-label="Scarica PDF">
          📄 Scarica PDF
        </button>
        <button onclick="markWorkoutComplete()" class="btn-secondary flex-1" aria-label="Segna completato">
          ✅ Completato
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function markWorkoutComplete() {
  launchConfetti();
  showToast("Ottimo lavoro! Workout completato 🔥");

  // Update tracker stats
  const stats = loadLS("aura_tracker") || { sessions: 0, calories: 0, streak: 0 };
  stats.sessions += 1;
  stats.calories += Math.floor(250 + Math.random() * 200);
  stats.streak += 1;
  saveLS("aura_tracker", stats);

  updateTrackerDisplay(stats);
}

/* ============================================================
   SECTION 10: PDF DOWNLOAD (jsPDF)
   ============================================================ */

function downloadWorkoutPDF() {
  if (!_lastWorkout) { showToast("Genera prima una scheda!", "⚠️"); return; }

  if (typeof window.jspdf === "undefined" && typeof jsPDF === "undefined") {
    // Load jsPDF dynamically if not loaded
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => _generatePDF();
    document.head.appendChild(script);
  } else {
    _generatePDF();
  }
}

function _generatePDF() {
  const { jsPDF } = window.jspdf || window;
  if (!jsPDF) { showToast("Errore libreria PDF", "❌"); return; }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const user = appState.user;
  const w = _lastWorkout;

  const purple = [139, 92, 246];
  const pink = [236, 72, 153];
  const dark = [15, 23, 42];
  const light = [241, 245, 249];

  // Background
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 297, "F");

  // Header bar
  doc.setFillColor(...purple);
  doc.rect(0, 0, 210, 35, "F");

  // Logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("AURA FITNESS", 15, 22);

  doc.setFontSize(9);
  doc.setTextColor(200, 180, 255);
  doc.text("AI COACH · SCHEDA PERSONALIZZATA", 15, 29);

  // Date & User
  doc.setFontSize(9);
  doc.setTextColor(...light);
  const dateStr = new Date().toLocaleDateString("it-IT", { dateStyle: "long" });
  doc.text(dateStr, 210 - 15, 16, { align: "right" });
  if (user) doc.text(`Atleta: ${user.name}`, 210 - 15, 22, { align: "right" });

  // Workout title card
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(15, 42, 180, 28, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...purple);
  doc.text(`${w.icon || "💪"} ${w.label}`, 25, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...light);
  doc.text(`⏱ Durata: ${w.duration}   |   Obiettivo: ${w.goal?.toUpperCase() || "IPERTROFIA"}`, 25, 63);

  // Biometrics if available
  if (w.age || w.weight) {
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Età: ${w.age || "–"} anni  |  Peso: ${w.weight || "–"} kg`, 25, 71);
  }

  // Exercises header
  let y = 82;
  doc.setFillColor(...purple);
  doc.rect(15, y, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("ESERCIZIO", 20, y + 5.5);
  doc.text("SERIE", 118, y + 5.5, { align: "center" });
  doc.text("REPS", 145, y + 5.5, { align: "center" });
  doc.text("RECUPERO", 174, y + 5.5, { align: "center" });

  y += 12;
  const exercises = w.exercises || [];
  exercises.forEach((ex, i) => {
    const rowBg = i % 2 === 0 ? [22, 30, 46] : [26, 35, 54];
    doc.setFillColor(...rowBg);
    doc.roundedRect(15, y - 4, 180, 12, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...light);
    doc.text(ex.name, 20, y + 3.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...purple);
    doc.text(String(ex.sets), 118, y + 3.5, { align: "center" });
    doc.text(String(ex.reps), 145, y + 3.5, { align: "center" });
    doc.text(ex.rest > 0 ? `${ex.rest}s` : "–", 174, y + 3.5, { align: "center" });

    if (ex.note) {
      y += 10;
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`  ↳ ${ex.note}`, 20, y + 2);
    }

    y += 14;
  });

  // Footer note
  y += 8;
  doc.setFillColor(20, 28, 45);
  doc.roundedRect(15, y, 180, 18, 3, 3, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text("🤖 Nota Aura AI: Scheda generata automaticamente basandosi su biometria e", 20, y + 7);
  doc.text("affluenza palestra. Adatta i carichi al tuo livello e consulta il trainer.", 20, y + 13);

  // Bottom bar
  const footerY = 285;
  doc.setFillColor(...purple);
  doc.rect(0, footerY, 210, 12, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(200, 180, 255);
  doc.text("Generato da Aura Fitness – AI Coach & Smart Gym  |  aura.fitness", 105, footerY + 7, { align: "center" });

  // Save
  const filename = `Aura_${w.goal || "workout"}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
  showToast("PDF scaricato! 📄");
}

/* ============================================================
   SECTION 11: EXERCISE TIMER (Fullscreen)
   ============================================================ */

function openTimer(seconds = 60, exerciseName = "Esercizio") {
  const overlay = document.getElementById("timer-overlay");
  if (!overlay) return;

  appState.timerTotal = seconds;
  appState.timerSeconds = seconds;
  appState.timerExercise = exerciseName;
  appState.timerRunning = false;

  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  updateTimerDisplay();
  updateTimerRing(1);
}

function closeTimer() {
  const overlay = document.getElementById("timer-overlay");
  if (overlay) overlay.classList.add("hidden");
  clearInterval(appState.timerInterval);
  appState.timerRunning = false;
  document.body.style.overflow = "";
}

function toggleTimer() {
  if (appState.timerRunning) {
    clearInterval(appState.timerInterval);
    appState.timerRunning = false;
    document.getElementById("timer-play-icon").textContent = "▶";
  } else {
    if (appState.timerSeconds <= 0) {
      appState.timerSeconds = appState.timerTotal;
    }
    appState.timerRunning = true;
    document.getElementById("timer-play-icon").textContent = "⏸";
    appState.timerInterval = setInterval(() => {
      appState.timerSeconds--;
      updateTimerDisplay();
      updateTimerRing(appState.timerSeconds / appState.timerTotal);

      // Beep sound at last 3 seconds
      if (appState.timerSeconds <= 3 && appState.timerSeconds > 0) {
        playBeep(800, 100);
      }

      if (appState.timerSeconds <= 0) {
        clearInterval(appState.timerInterval);
        appState.timerRunning = false;
        playBeep(600, 400);
        setTimeout(() => playBeep(800, 400), 500);
        showToast("Recupero finito! Al prossimo set 🔥");
        document.getElementById("timer-play-icon").textContent = "▶";
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(appState.timerInterval);
  appState.timerRunning = false;
  appState.timerSeconds = appState.timerTotal;
  updateTimerDisplay();
  updateTimerRing(1);
  document.getElementById("timer-play-icon").textContent = "▶";
}

function updateTimerDisplay() {
  const el = document.getElementById("timer-time");
  if (el) el.textContent = formatTime(appState.timerSeconds);
  const lbl = document.getElementById("timer-exercise-name");
  if (lbl) lbl.textContent = appState.timerExercise;
}

function updateTimerRing(fraction) {
  const circle = document.getElementById("timer-ring-progress");
  if (!circle) return;
  const r = 90;
  const circumference = 2 * Math.PI * r;
  circle.setAttribute("stroke-dasharray", circumference);
  circle.setAttribute("stroke-dashoffset", circumference * (1 - Math.max(0, Math.min(1, fraction))));
}

function playBeep(freq = 800, dur = 200) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur / 1000);
  } catch { /* AudioContext may be blocked */ }
}

/* ============================================================
   SECTION 12: TRAINER CARDS
   ============================================================ */

function renderTrainers(trainers) {
  const container = document.getElementById("trainers-container");
  if (!container || !trainers) return;

  container.innerHTML = trainers.map(t => `
    <div class="trainer-card ${t.featured ? "featured" : ""}" 
         onclick="showToast('${t.name} · ${t.specialty}', '${t.emoji}')"
         role="button" tabindex="0" aria-label="Trainer ${t.name}">
      <div class="trainer-avatar">${t.emoji}</div>
      <p class="text-sm font-bold leading-tight">${t.name}</p>
      <p class="text-[10px] text-slate-400 mb-2">${t.specialty}</p>
      <div class="flex items-center justify-center gap-1">
        <span class="text-yellow-400 text-xs">★</span>
        <span class="text-xs font-bold">${t.rating}</span>
      </div>
    </div>
  `).join("");
}

/* ============================================================
   SECTION 13: EXERCISE LIST (Esercizi view)
   ============================================================ */

function renderExerciseList(exercises) {
  const container = document.getElementById("exercises-list");
  if (!container || !exercises) return;

  const muscleColors = {
    petto: "muscle-petto", schiena: "muscle-schiena", gambe: "muscle-gambe",
    spalle: "muscle-spalle", braccia: "muscle-braccia", core: "muscle-core",
  };

  container.innerHTML = exercises.map(ex => `
    <div class="exercise-list-item" 
         onclick="openTimer(60, '${ex.name.replace(/'/g, "\\'")}')">
      <div class="icon-wrap">
        <span style="font-size:1.25rem">${ex.emoji}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold leading-tight truncate">${ex.name}</p>
        <p class="text-xs text-slate-400">${ex.equipment}</p>
      </div>
      <div class="flex flex-col items-end gap-1">
        <span class="exercise-category-badge ${muscleColors[ex.muscle] || ""}">${ex.muscle}</span>
        <span class="text-[10px] text-slate-500">${ex.difficulty}</span>
      </div>
    </div>
  `).join("");
}

/* ============================================================
   SECTION 14: CALENDAR VIEW
   ============================================================ */

function renderCalendar() {
  const container = document.getElementById("calendar-grid");
  if (!container) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthName = now.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const monthTitle = document.getElementById("calendar-month");
  if (monthTitle) monthTitle.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Workout days (simulated)
  const savedWorkouts = loadLS(DB_KEY.WORKOUTS) || [];
  const workoutDays = new Set(
    savedWorkouts.map(w => new Date(w.generatedAt).getDate())
  );

  // Day headers
  const dayHeaders = ["D", "L", "M", "M", "G", "V", "S"];
  let html = dayHeaders.map(d =>
    `<div class="text-[10px] text-slate-500 text-center font-bold uppercase">${d}</div>`
  ).join("");

  // Empty cells before first day
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
  for (let i = 0; i < offset; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const hasWorkout = workoutDays.has(d);
    const cls = [
      "cal-day",
      isToday ? "today" : "",
      hasWorkout && !isToday ? "has-workout" : "",
    ].filter(Boolean).join(" ");
    html += `<div class="${cls}" onclick="showToast('${d} ${monthName}${hasWorkout ? " – Workout completato 🏋️" : ""}', '${isToday ? "📍" : "📅"}')">${d}</div>`;
  }

  container.innerHTML = html;
}

/* ============================================================
   SECTION 15: TRACKER & PROGRESS CHARTS
   ============================================================ */

function initTrackerCharts() {
  const stats = loadLS("aura_tracker") || { sessions: 8, calories: 3400, streak: 5 };
  updateTrackerDisplay(stats);
  renderWeeklyChart();
  renderCaloriesChart();
}

function updateTrackerDisplay(stats) {
  const els = {
    "tracker-sessions": stats.sessions,
    "tracker-calories": stats.calories.toLocaleString("it-IT"),
    "tracker-streak": stats.streak,
  };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function renderWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas) return;

  if (appState.trackerChart) appState.trackerChart.destroy();

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 150);
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.6)");
  gradient.addColorStop(1, "rgba(139, 92, 246, 0.05)");

  const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const data = [45, 0, 60, 55, 0, 70, 30];

  appState.trackerChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [{
        label: "Minuti",
        data,
        backgroundColor: data.map(v => v > 0 ? gradient : "rgba(255,255,255,0.04)"),
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15,20,35,0.95)",
          borderColor: "rgba(139,92,246,0.4)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
          callbacks: { label: i => `${i.raw} min` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#475569", font: { size: 10 } }, border: { display: false } },
        y: { display: false, max: 90 },
      },
    },
  });
}

function renderCaloriesChart() {
  const canvas = document.getElementById("caloriesChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 120);
  gradient.addColorStop(0, "rgba(236, 72, 153, 0.5)");
  gradient.addColorStop(1, "rgba(236, 72, 153, 0.02)");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
      datasets: [{
        data: [320, 0, 410, 380, 0, 490, 210],
        borderColor: "#ec4899",
        borderWidth: 2.5,
        fill: true,
        backgroundColor: gradient,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#ec4899",
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15,20,35,0.95)",
          borderColor: "rgba(236,72,153,0.4)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
          callbacks: { label: i => `${i.raw} kcal` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#475569", font: { size: 10 } }, border: { display: false } },
        y: { display: false },
      },
    },
  });
}

function exportTrackerCSV() {
  const stats = loadLS("aura_tracker") || {};
  const rows = [
    ["Data", "Sessioni", "Calorie", "Streak"],
    [new Date().toLocaleDateString("it-IT"), stats.sessions || 0, stats.calories || 0, stats.streak || 0],
  ];
  const csv = rows.map(r => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Aura_Tracker_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV esportato! 📊");
}

/* ============================================================
   SECTION 16: SPA NAVIGATION
   ============================================================ */

function navigateTo(viewName) {
  // Hide ALL views
  $$(".view").forEach(v => v.classList.remove("active"));

  // Show target view
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add("active");

  // Update nav items
  $$(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  appState.currentView = viewName;

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Push history state
  history.pushState({ view: viewName }, "", `#${viewName}`);
}

function initNavigation() {
  $$(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });

    // Keyboard support
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Handle browser back/forward
  window.addEventListener("popstate", (e) => {
    const view = e.state?.view || "dashboard";
    navigateTo(view);
  });

  // Handle initial hash
  const hash = location.hash.replace("#", "");
  if (hash && document.getElementById(`view-${hash}`)) {
    navigateTo(hash);
  }
}

/* ============================================================
   SECTION 17: SETTINGS
   ============================================================ */

function initSettings() {
  const saved = loadLS(DB_KEY.SETTINGS);
  if (saved) appState.settings = { ...appState.settings, ...saved };

  // Dark mode toggle
  const dmToggle = document.getElementById("toggle-darkmode");
  if (dmToggle) {
    dmToggle.checked = appState.settings.darkMode !== false;
    dmToggle.addEventListener("change", () => {
      appState.settings.darkMode = dmToggle.checked;
      saveLS(DB_KEY.SETTINGS, appState.settings);
      document.documentElement.setAttribute("data-theme", dmToggle.checked ? "dark" : "light");
      showToast(dmToggle.checked ? "Dark mode attivato 🌙" : "Light mode attivato ☀️");
    });
  }

  // Notifications toggle
  const notifToggle = document.getElementById("toggle-notifications");
  if (notifToggle) {
    notifToggle.checked = appState.settings.notifications || false;
    notifToggle.addEventListener("change", async () => {
      if (notifToggle.checked && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          notifToggle.checked = false;
          showToast("Permesso notifiche negato", "⚠️");
          return;
        }
      }
      appState.settings.notifications = notifToggle.checked;
      saveLS(DB_KEY.SETTINGS, appState.settings);
      showToast(notifToggle.checked ? "Notifiche attivate 🔔" : "Notifiche disattivate");
    });
  }
}

/* ============================================================
   SECTION 18: AUTO-SAVE on beforeunload
   ============================================================ */

function initAutoSave() {
  window.addEventListener("beforeunload", () => {
    if (appState.user) saveLS(DB_KEY.USER, appState.user);
    if (appState.profile) saveLS(DB_KEY.PROFILE, appState.profile);
    saveLS(DB_KEY.SETTINGS, appState.settings);
  });
}

/* ============================================================
   SECTION 19: DARK MODE (system preference)
   ============================================================ */

function initTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedSettings = loadLS(DB_KEY.SETTINGS);
  const isDark = savedSettings?.darkMode !== undefined ? savedSettings.darkMode : prefersDark;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const savedS = loadLS(DB_KEY.SETTINGS);
    // Only follow system if user hasn't manually set preference
    if (savedS?.darkMode === undefined) {
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    }
  });
}

/* ============================================================
   SECTION 20: WELCOME GREETING
   ============================================================ */

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = "Buongiorno";
  if (hour >= 12 && hour < 18) greeting = "Buon pomeriggio";
  else if (hour >= 18) greeting = "Buonasera";

  const greetEl = document.getElementById("greeting-text");
  if (greetEl) greetEl.textContent = greeting;

  const dateEl = document.getElementById("today-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long"
    });
  }
}

/* ============================================================
   SECTION 21: HEADER PROFILE CLICK
   ============================================================ */

function handleProfileClick() {
  if (appState.user) {
    navigateTo("settings");
  } else {
    showAuthModal("login");
  }
}

/* ============================================================
   SECTION 22: MAIN INIT
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Theme
  initTheme();

  // 2. Block scroll during splash
  document.body.style.overflow = "hidden";

  // 3. Init Lucide icons
  lucide.createIcons();

  // 4. Splash screen
  initSplash();

  // 5. Navigation
  initNavigation();

  // 6. Auth
  initAuth();

  // 7. Settings
  initSettings();

  // 8. Greeting
  updateGreeting();

  // 9. Auto-save
  initAutoSave();

  // 10. PWA Service Worker
  registerServiceWorker();

  // Profile form save button
  const saveProfileBtn = document.getElementById("save-profile-btn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", saveUserProfile);
  }

  // Auth modal close on overlay click
  const authOverlay = document.getElementById("auth-modal");
  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target === authOverlay) hideAuthModal();
    });
  }

  // Timer overlay close on X
  const timerClose = document.getElementById("timer-close");
  if (timerClose) timerClose.addEventListener("click", closeTimer);

  // Timer controls
  const timerPlay = document.getElementById("timer-play");
  const timerReset = document.getElementById("timer-reset");
  if (timerPlay) timerPlay.addEventListener("click", toggleTimer);
  if (timerReset) timerReset.addEventListener("click", resetTimer);

  // Keyboard close for timer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const timerOverlay = document.getElementById("timer-overlay");
      if (timerOverlay && !timerOverlay.classList.contains("hidden")) closeTimer();
      const authModal = document.getElementById("auth-modal");
      if (authModal && !authModal.classList.contains("hidden")) hideAuthModal();
    }
  });

  // Open timer directly at 60s for demo (exercises section CTA)
  const quickTimerBtn = document.getElementById("quick-timer-btn");
  if (quickTimerBtn) {
    quickTimerBtn.addEventListener("click", () => openTimer(60, "Recupero"));
  }

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  // Export CSV button
  const exportCsvBtn = document.getElementById("export-csv-btn");
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportTrackerCSV);

  // Render initial Timer ring (static)
  updateTimerRing(1);

  console.log(`[Aura Fitness v${APP_VERSION}] App initialized ✅`);
});
