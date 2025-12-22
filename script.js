const API_BASE = "https://funtranslatorapizineb.azurewebsites.net";

document.addEventListener("DOMContentLoaded", () => {
  // Supporte 2 versions d'IDs (selon ton HTML)
  const btnTranslate =
    document.getElementById("btnTranslate") ||
    document.getElementById("translateBtn");

  const elText =
    document.getElementById("text") ||
    document.getElementById("inputText");

  const elLang =
    document.getElementById("lang") ||
    document.getElementById("languageSelect");

  const elOut =
    document.getElementById("output") ||
    document.getElementById("result");

  // Si un élément clé manque, on affiche une erreur claire
  if (!btnTranslate || !elText || !elLang || !elOut) {
    console.error("❌ IDs manquants dans le HTML.", {
      btnTranslate,
      elText,
      elLang,
      elOut,
    });
    alert(
      "Erreur: Le script ne trouve pas les éléments HTML (IDs). " +
        "Vérifie les id: btnTranslate/text/lang/output OU translateBtn/inputText/languageSelect/result."
    );
    return;
  }

  async function doTranslate() {
    const text = elText.value.trim();
    const lang = elLang.value;

    if (!text) {
      elOut.textContent = "Merci d’écrire un texte 🙂";
      return;
    }

    elOut.textContent = "Traduction en cours…";

    try {
      const response = await fetch(`${API_BASE}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("API error", response.status, data);
        elOut.textContent = `Erreur API (${response.status})`;
        return;
      }

      // Chemin correct Azure Translator
      const translation = data?.[0]?.translations?.[0]?.text;

      elOut.textContent = translation || "Erreur de traduction";
    } catch (err) {
      console.error("Fetch error:", err);
      elOut.textContent = "Erreur : impossible de contacter l'API";
    }
  }

  // ✅ Click
  btnTranslate.addEventListener("click", doTranslate);

  // ✅ Bonus : Entrée = traduire (si textarea/input)
  elText.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") doTranslate();
  });

  console.log("✅ Script chargé. Bouton OK:", btnTranslate.id);
});
