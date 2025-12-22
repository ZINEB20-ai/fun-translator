/* =========================
   CONFIG
   ========================= */

const API_BASE = "https://funtranslatorapizineb.azurewebsites.net";

/* =========================
   ELEMENTS DOM
   ========================= */

const elText = document.getElementById("text");
const elLang = document.getElementById("lang");
const elOut = document.getElementById("output");

const btnTranslate = document.getElementById("btnTranslate");
const btnSpeakText = document.getElementById("btnSpeakText");
const btnSpeakTranslation = document.getElementById("btnSpeakTranslation");
const btnCopy = document.getElementById("btnCopy");

const statusEl = document.getElementById("status");
const statusLabel = statusEl.querySelector(".label");
const statusDot = statusEl.querySelector(".dot");

const historyEl = document.getElementById("history");
const btnRefreshHistory = document.getElementById("btnRefreshHistory");
const btnClearHistory = document.getElementById("btnClearHistory");

let lastTranslationText = "";

/* =========================
   STATUS UI
   ========================= */

function setStatus(type, msg) {
  statusLabel.textContent = msg;

  if (type === "ok") {
    statusDot.style.background = "var(--accent2)";
    statusDot.style.boxShadow = "0 0 0 4px rgba(36,209,143,.15)";
  } else if (type === "loading") {
    statusDot.style.background = "var(--accent)";
    statusDot.style.boxShadow = "0 0 0 4px rgba(124,92,255,.15)";
  } else {
    statusDot.style.background = "var(--danger)";
    statusDot.style.boxShadow = "0 0 0 4px rgba(255,77,109,.15)";
  }
}

/* =========================
   TRANSLATION
   ========================= */

async function translate() {
  const text = elText.value.trim();
  const lang = elLang.value;

  if (!text) {
    setStatus("err", "Ajoute un texte");
    elOut.textContent = "—";
    return;
  }

  setStatus("loading", "Traduction...");
  elOut.textContent = "Traduction en cours…";

  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("err", `Erreur ${res.status}`);
      elOut.textContent = JSON.stringify(data, null, 2);
      return;
    }

    // Format Azure Translator
    const translated =
      data?.[0]?.translations?.[0]?.text ?? "(aucune traduction)";

    lastTranslationText = translated;
    elOut.textContent = translated;
    setStatus("ok", "Prêt");
  } catch (e) {
    setStatus("err", "Erreur réseau");
    elOut.textContent = String(e?.message || e);
  }
}

/* =========================
   SPEECH (TEXT TO SPEECH)
   ========================= */

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("La synthèse vocale n'est pas supportée.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

/* =========================
   EVENTS
   ========================= */

btnTranslate.addEventListener("click", translate);

btnSpeakText.addEventListener("click", () => {
  const t = elText.value.trim();
  if (t) speak(t);
});

btnSpeakTranslation.addEventListener("click", () => {
  if (lastTranslationText) speak(lastTranslationText);
});

btnCopy.addEventListener("click", async () => {
  if (!lastTranslationText) return;

  await navigator.clipboard.writeText(lastTranslationText);
  setStatus("ok", "Copié ✅");
  setTimeout(() => setStatus("ok", "Prêt"), 1200);
});

/* =========================
   HISTORIQUE (OPTIONNEL)
   ========================= */
/*
  ⚠️ Fonctionne uniquement si tu as
  un endpoint GET /api/history (Cosmos DB)
*/

async function loadHistory() {
  historyEl.innerHTML = "";
  historyEl.classList.remove("empty");

  try {
    const res = await fetch(`${API_BASE}/api/history`);
    if (!res.ok) throw new Error("Historique indisponible");

    const items = await res.json();

    if (!items.length) {
      historyEl.classList.add("empty");
      historyEl.innerHTML = "<p>Aucun historique.</p>";
      return;
    }

    items.slice(0, 10).forEach(item => {
      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <div class="meta">
          <span>${item.langFrom || "auto"} → ${item.langTo}</span>
          <span>${new Date(item.createdAt).toLocaleString()}</span>
        </div>
        <div class="pair">
          <div><b>Texte :</b> ${item.text}</div>
          <div><b>Traduction :</b> ${item.translation}</div>
        </div>
      `;

      historyEl.appendChild(div);
    });
  } catch {
    historyEl.classList.add("empty");
    historyEl.innerHTML = "<p>Historique indisponible.</p>";
  }
}

if (btnRefreshHistory) {
  btnRefreshHistory.addEventListener("click", loadHistory);
}

if (btnClearHistory) {
  btnClearHistory.addEventListener("click", () => {
    historyEl.innerHTML = "<p>Historique vidé (local).</p>";
    historyEl.classList.add("empty");
  });
}

/* =========================
   INIT
   ========================= */

setStatus("ok", "Prêt");
// loadHistory(); // Active seulement si l’API existe
