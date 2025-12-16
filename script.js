document.getElementById('translateBtn').addEventListener('click', async () => {
    const text = document.getElementById('inputText').value;
    const lang = document.getElementById('languageSelect').value;

    if (!text) {
        alert("Merci d'écrire quelque chose !");
        return;
    }

    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang })
    });

    const data = await response.json();

    document.getElementById('result').innerText = data.translation || "Erreur de traduction";
});
