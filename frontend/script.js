const API_BASE = "https://funtranslatorapizineb.azurewebsites.net";

const elText = document.getElementById("text");
const elLang = document.getElementById("lang");
const elOut = document.getElementById("output");
const LOCAL_HISTORY_KEY = "funtranslator_history_v1";

const btnTranslate = document.getElementById("btnTranslate");
const btnSpeakText = document.getElementById("btnSpeakText");
const btnSpeakTranslation = document.getElementById("btnSpeakTranslation");
const btnCopy = document.getElementById("btnCopy");

const statusEl = document.getElementById("status");
const statusLabel = statusEl?.querySelector(".label");
const statusDot = statusEl?.querySelector(".dot");

const historyEl = document.getElementById("history");
const btnRefreshHistory = document.getElementById("btnRefreshHistory");
const btnClearHistory = document.getElementById("btnClearHistory");

let lastTranslationText = "";

function setStatus(type, msg) {
  if (!statusLabel || !statusDot) return;

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

async function translate() {
  const text = (elText?.value || "").trim();
  const lang = elLang?.value;

  if (!text) {
    setStatus("err", "Ajoute un texte");
    if (elOut) elOut.textContent = "—";
    return;
  }

  setStatus("loading", "Traduction...");
  if (elOut) elOut.textContent = "Traduction en cours…";

  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus("err", `Erreur ${res.status}`);
      if (elOut) elOut.textContent = data ? JSON.stringify(data, null, 2) : "Erreur API";
      return;
    }

    const translated = data?.[0]?.translations?.[0]?.text ?? "(aucune traduction)";
    lastTranslationText = translated;
saveLocalHistory({
  text,
  translation: translated,
  langTo: lang,
  createdAt: new Date().toISOString()
});
renderLocalHistory();

    if (elOut) elOut.textContent = translated;
    setStatus("ok", "Prêt");
  } catch (e) {
    setStatus("err", "Erreur réseau");
    if (elOut) elOut.textContent = String(e?.message || e);
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("La synthèse vocale n'est pas supportée dans ce navigateur.");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

// Sécurité: si un ID manque, on log clairement
function assertEl(name, el) {
  if (!el) console.error(`❌ Élément manquant: #${name}`);
}
assertEl("text", elText);
assertEl("lang", elLang);
assertEl("output", elOut);
assertEl("btnTranslate", btnTranslate);

btnTranslate?.addEventListener("click", translate);

btnSpeakText?.addEventListener("click", () => {
  const t = (elText?.value || "").trim();
  if (t) speak(t);
});

btnSpeakTranslation?.addEventListener("click", () => {
  if (lastTranslationText) speak(lastTranslationText);
});

btnCopy?.addEventListener("click", async () => {
  if (!lastTranslationText) return;
  try {
    await navigator.clipboard.writeText(lastTranslationText);
    setStatus("ok", "Copié ✅");
    setTimeout(() => setStatus("ok", "Prêt"), 1200);
  } catch {
    // fallback si clipboard bloqué
    alert("Impossible de copier automatiquement. Sélectionne le texte et copie-le manuellement.");
  }
});

/* =========================
   HISTORIQUE (OPTIONNEL)
   ========================= */

async function loadHistory() {
  if (!historyEl) return;

  historyEl.innerHTML = "";
  historyEl.classList.remove("empty");

  try {
    const res = await fetch(`${API_BASE}/api/history`);
    if (!res.ok) throw new Error("Impossible de charger l'historique");

    const items = await res.json();

    if (!items || !items.length) {
      historyEl.classList.add("empty");
      historyEl.innerHTML = "<p>Aucun historique.</p>";
      return;
    }

    items.slice(0, 10).forEach((item) => {
      const div = document.createElement("div");
      div.className = "item";

      const created = item.createdAt ? new Date(item.createdAt).toLocaleString() : "—";
      const from = item.langFrom || "auto";
      const to = item.langTo || item.lang || "—";

      div.innerHTML = `
        <div class="meta">
          <span>${from} → ${to}</span>
          <span>${created}</span>
        </div>
        <div class="pair">
          <div><b>Texte :</b> ${escapeHtml(item.text || "")}</div>
          <div><b>Traduction :</b> ${escapeHtml(item.translation || "")}</div>
        </div>
      `;

      historyEl.appendChild(div);
    });
  } catch (e) {
    historyEl.classList.add("empty");
    historyEl.innerHTML = "<p>Historique indisponible.</p>";
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

btnRefreshHistory?.addEventListener("click", renderLocalHistory);

btnClearHistory?.addEventListener("click", () => {
  localStorage.removeItem(LOCAL_HISTORY_KEY);
  renderLocalHistory();
  setStatus("ok", "Historique vidé");
  setTimeout(() => setStatus("ok", "Prêt"), 1200);
});


setStatus("ok", "Prêt");
console.log("✅ script.js chargé");
// loadHistory(); // décommente seulement si ton endpoint /api/history existe
function readLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalHistory(item) {
  const items = readLocalHistory();
  items.unshift(item);
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

function renderLocalHistory() {
  if (!historyEl) return;

  const items = readLocalHistory();
  historyEl.innerHTML = "";

  if (!items.length) {
    historyEl.classList.add("empty");
    historyEl.innerHTML = "<p>Aucun historique.</p>";
    return;
  }

  historyEl.classList.remove("empty");

  items.slice(0, 10).forEach((it) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="meta">
        <span>auto → ${escapeHtml(it.langTo || "—")}</span>
        <span>${new Date(it.createdAt).toLocaleString()}</span>
      </div>
      <div class="pair">
        <div><b>Texte :</b> ${escapeHtml(it.text || "")}</div>
        <div><b>Traduction :</b> ${escapeHtml(it.translation || "")}</div>
      </div>
    `;
    historyEl.appendChild(div);
  });
  renderLocalHistory();

}
