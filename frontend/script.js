const API_BASE = "https://funtranslatorapizineb.azurewebsites.net";

const elText = document.getElementById("text");
const elLang = document.getElementById("lang");
const elOut = document.getElementById("output");

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

/* =========================
   UTILS
   ========================= */

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

function speak(text) {
  if (!text) return;
  if (!("speechSynthesis" in window)) {
    alert("La synthèse vocale n'est pas supportée dans ce navigateur.");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

/* =========================
   TRANSLATE
   ========================= */

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

    // même si erreur, Azure peut renvoyer du json
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      setStatus("err", `Erreur API (${res.status})`);
      if (elOut) elOut.textContent = data ? JSON.stringify(data, null, 2) : "(pas de réponse JSON)";
      return;
    }

    const translated = data?.[0]?.translations?.[0]?.text ?? "(aucune traduction)";
    lastTranslationText = translated;

    if (elOut) elOut.textContent = translated;
    setStatus("ok", "Prêt");
  } catch (e) {
    setStatus("err", "Erreur réseau");
    if (elOut) elOut.textContent = String(e?.message || e);
  }
}

/* =========================
   BUTTONS
   ========================= */

btnTranslate?.addEventListener("click", translate);

// Enter pour traduire
elText?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) translate();
});

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
    // fallback
    const ta = document.createElement("textarea");
    ta.value = lastTranslationText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    setStatus("ok", "Copié ✅");
    setTimeout(() => setStatus("ok", "Prêt"), 1200);
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

    if (!Array.isArray(items) || items.length === 0) {
      historyEl.classList.add("empty");
      historyEl.innerHTML = "<p>Aucun historique.</p>";
      return;
    }

    items.slice(0, 10).forEach((item) => {
      const div = document.createElement("div");
      div.className = "item";

      const from = item.langFrom || "auto";
      const to = item.langTo || item.lang || "—";
      const when = item.createdAt ? new Date(item.createdAt).toLocaleString() : "";

      div.innerHTML = `
        <div class="meta">
          <span>${from} → ${to}</span>
          <span>${when}</span>
        </div>
        <div class="pair">
          <div><b>Texte :</b> ${item.text ?? ""}</div>
          <div><b>Traduction :</b> ${item.translation ?? ""}</div>
        </div>
      `;

      historyEl.appendChild(div);
    });
  } catch (e) {
    historyEl.classList.add("empty");
    historyEl.innerHTML = "<p>Historique indisponible.</p>";
  }
}

btnRefreshHistory?.addEventListener("click", loadHistory);

btnClearHistory?.addEventListener("click", () => {
  if (!historyEl) return;
  historyEl.innerHTML = "<p>Historique vidé (local).</p>";
  historyEl.classList.add("empty");
});

/* =========================
   INIT
   ========================= */

setStatus("ok", "Prêt");
// loadHistory(); // décommente seulement si ton endpoint /api/history existe
