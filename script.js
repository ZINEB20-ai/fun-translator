document.getElementById('translateBtn').addEventListener('click', async () => {
  const text = document.getElementById('inputText').value.trim();
  const lang = document.getElementById('languageSelect').value;

  if (!text) {
    alert("Merci d'écrire quelque chose !");
    return;
  }

  try {
    const response = await fetch(
      'https://funtranslatorapizineb.azurewebsites.net/api/translate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang })
      }
    );

    if (!response.ok) {
      throw new Error("Erreur HTTP " + response.status);
    }

    const data = await response.json();

    // ✅ BON CHEMIN DANS LA RÉPONSE
    const translation = data[0]?.translations[0]?.text;

    document.getElementById('result').innerText =
      translation || "Erreur de traduction";

  } catch (err) {
    console.error(err);
    document.getElementById('result').innerText =
      "Erreur : impossible de contacter l'API";
  }
  let VOICES = [];

function loadVoices() {
  VOICES = window.speechSynthesis.getVoices();
  // Debug utile
  console.log("Voices loaded:", VOICES.length);
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(langCode) {
  if (!VOICES || VOICES.length === 0) return null;

  // 1) match exact (ex: fr-FR)
  let v = VOICES.find(x => x.lang === langCode);
  if (v) return v;

  // 2) match par langue (ex: "fr" dans "fr-FR")
  const short = langCode.split("-")[0];
  v = VOICES.find(x => x.lang && x.lang.startsWith(short));
  if (v) return v;

  // 3) fallback: première voix
  return VOICES[0];
}

function speak(text, langCode) {
  if (!text) {
    alert("Rien à lire.");
    return;
  }
  if (!("speechSynthesis" in window)) {
    alert("Ton navigateur ne supporte pas la lecture audio.");
    return;
  }

  // Annule toute lecture en cours
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode;

  // Choisir une voix réellement dispo
  const voice = pickVoice(langCode);
  if (voice) utter.voice = voice;

  // Debug
  console.log("Speaking:", { text, langCode, voice: utter.voice?.name, voiceLang: utter.voice?.lang });

  utter.onerror = (e) => console.error("Speech error:", e);

  window.speechSynthesis.speak(utter);

  // Hack Safari: parfois il faut "resume"
  setTimeout(() => {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  }, 250);
}

// Bouton écouter texte saisi
document.getElementById("speakInputBtn")?.addEventListener("click", () => {
  const text = document.getElementById("inputText").value.trim();
  speak(text, "fr-FR"); // on suppose que tu écris en français
});

// Bouton écouter traduction
document.getElementById("speakResultBtn")?.addEventListener("click", () => {
  const translated = document.getElementById("result").innerText.trim();
  const lang = document.getElementById("languageSelect").value;

  const map = {
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
    de: "de-DE",
    it: "it-IT",
    ar: "ar-SA",
    tr: "tr-TR",
    hi: "hi-IN",
    id: "id-ID",
    "zh-Hans": "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    pt: "pt-PT"
  };

  speak(translated, map[lang] || "en-US");
});

});
