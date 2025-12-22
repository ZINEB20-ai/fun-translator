const API_URL = "https://funtranslatorapizineb.azurewebsites.net/api/translate";

const inputEl = document.getElementById("inputText");
const langEl = document.getElementById("languageSelect");
const resultEl = document.getElementById("result");
const statusEl = document.getElementById("status");

document.getElementById("translateBtn").addEventListener("click", translate);
document.getElementById("listenInputBtn").addEventListener("click", () => speak(inputEl.value, "input"));
document.getElementById("listenResultBtn").addEventListener("click", () => speak(resultEl.innerText, "result"));

async function translate() {
  const text = inputEl.value.trim();
  const lang = langEl.value;

  if (!text) return setStatus("Merci d’écrire quelque chose 🙂");

  setStatus("Traduction en cours…");
  resultEl.textContent = "…";

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang })
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(t || "Erreur API");
    }

    const data = await resp.json();
    resultEl.textContent = data.translation || "Erreur de traduction";
    setStatus("OK ✅ (enregistré dans Cosmos DB si configuré)");
  } catch (e) {
    console.error(e);
    resultEl.textContent = "Erreur : impossible de contacter l'API";
    setStatus("Erreur ❌");
  }
}

function speak(text, kind) {
  text = (text || "").trim();
  if (!text || text === "—" || text === "…") return setStatus("Rien à lire.");

  // stop previous
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);

  // Safari: laisse le navigateur choisir une voix disponible
  utter.rate = 1;
  utter.pitch = 1;

  utter.onstart = () => setStatus(kind === "input" ? "Lecture du texte…" : "Lecture de la traduction…");
  utter.onend = () => setStatus("Terminé ✅");
  utter.onerror = () => setStatus("Audio bloqué. Clique une fois sur la page puis réessaie.");

  window.speechSynthesis.speak(utter);
}

function setStatus(msg){ statusEl.textContent = msg; }
