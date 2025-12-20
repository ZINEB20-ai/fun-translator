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
});
