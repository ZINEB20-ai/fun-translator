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
  function speak(text, langCode) {
  if (!text) return;

  if (!("speechSynthesis" in window)) {
    alert("Ton navigateur ne supporte pas la lecture audio.");
    return;
  }

  // stop si déjà en train de parler
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);

  // Langue pour la voix (codes navigateur)
  // ex: fr-FR, en-US, tr-TR, hi-IN, id-ID
  utter.lang = langCode || "en-US";

  window.speechSynthesis.speak(utter);
}

// Écouter le texte saisi
document.getElementById("speakInputBtn").addEventListener("click", () => {
  const text = document.getElementById("inputText").value.trim();

  // Ici on suppose que l'utilisateur écrit en français
  // Si tu veux détecter automatiquement, on peut faire mieux.
  speak(text, "fr-FR");
});

// Écouter la traduction
document.getElementById("speakResultBtn").addEventListener("click", () => {
  const translated = document.getElementById("result").innerText.trim();
  const lang = document.getElementById("languageSelect").value;

  // Mapping simple vers des locales TTS
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
