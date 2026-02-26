// Inizializzazione icone Lucide
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  initChart();
});

// 1. Configurazione Chart.js per Affluenza
function initChart() {
  const ctx = document.getElementById("occupancyChart").getContext("2d");

  // Gradiente per l'area del grafico
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.5)");
  gradient.addColorStop(1, "rgba(15, 23, 42, 0)");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00"],
      datasets: [
        {
          data: [15, 65, 40, 55, 95, 70, 10],
          borderColor: "#a78bfa",
          borderWidth: 4,
          fill: true,
          backgroundColor: gradient,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
        y: { display: false, min: 0, max: 100 },
      },
    },
  });
}

// 2. Simulazione Chiamata AI (Claude API)
async function generateAIWorkout() {
  const btn = document.getElementById("aiBtn");
  const responseArea = document.getElementById("aiResponse");

  // Effetto Loading
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-2">◌</span> Analizzando Biometria...`;

  // Simulazione latenza API (1.5s)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  btn.innerHTML = `Genera Scheda Personalizzata`;
  btn.disabled = false;

  // Iniezione Risultato
  responseArea.classList.remove("hidden");
  responseArea.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-purple-400">
                <span>Focus: Ipertrofia</span>
                <span>Durata: 55 min</span>
            </div>
            <div class="space-y-3">
                <div class="flex justify-between p-3 bg-white/5 rounded-xl items-center">
                    <span class="text-sm">Panca Piana (Bilanciere)</span>
                    <span class="text-xs font-mono bg-purple-500/20 px-2 py-1 rounded">4 x 8</span>
                </div>
                <div class="flex justify-between p-3 bg-white/5 rounded-xl items-center">
                    <span class="text-sm">Trazioni alla Sbarra</span>
                    <span class="text-xs font-mono bg-purple-500/20 px-2 py-1 rounded">3 x MAX</span>
                </div>
                <div class="flex justify-between p-3 bg-white/5 rounded-xl items-center">
                    <span class="text-sm">Affondi Posteriori</span>
                    <span class="text-xs font-mono bg-purple-500/20 px-2 py-1 rounded">3 x 12</span>
                </div>
            </div>
            <p class="text-[10px] text-slate-500 italic">
                Nota Aura: Ho scelto esercizi con pesi liberi perché i macchinari risultano attualmente occupati al 85%.
            </p>
        </div>
    `;

  // Ricarica le icone se presenti nel nuovo HTML
  lucide.createIcons();
}
