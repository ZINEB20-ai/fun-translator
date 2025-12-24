const res = await fetch(`${API_BASE}/api/translate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text, lang }),
});

const raw = await res.text();
let data = null;
try { data = JSON.parse(raw); } catch { data = null; }

if (!res.ok) {
  setStatus("err", `Erreur ${res.status}`);
  if (elOut) elOut.textContent = data ? JSON.stringify(data, null, 2) : raw || "Erreur API";
  return;
}

const translated = data?.[0]?.translations?.[0]?.text ?? "(aucune traduction)";
lastTranslationText = translated;

if (elOut) elOut.textContent = translated;
setStatus("ok", "Prêt");
