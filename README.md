# Autoteam Hub Strumenti

Hub unico con tutti gli strumenti della suite Autoteam. I motori di calcolo
finanziario/fiscale dei simulatori girano lato server come Netlify Functions:
il browser non vede mai le formule, solo l'interfaccia.

## Struttura

- `public/index.html` — l'Hub (shell con tutti gli strumenti incorporati)
- `netlify/functions/` — un motore di calcolo per ciascuno strumento protetto:
  - `estinzione.js` — Calcolatore Estinzione (Easy Buy / Lineare / TCM)
  - `confronto_tco.js` — Confronto TCO 3 auto
  - `costo_possesso.js` — Simulatore costo di possesso — Premium
  - `forbice_easy.js` — Simulatore Forbice
  - `forbice_huge.js` — Simulatore Forbice — Tieni o Cambi l'auto?
  - `confronto_acquisto.js` — Confronto Sistemi di Acquisto (10 colonne)
  - `tasso_commerciale.js` — Libere Scelte Cliente
  - `calc_fiscale.js` — Deduzioni e Detrazioni Fiscali Auto 2026

## Pubblicazione su Netlify

1. Carica tutta questa cartella su GitHub (mantenendo la struttura di cartelle:
   `netlify.toml`, `package.json`, `netlify/functions/`, `public/`)
2. Su Netlify: **Import an existing project** → collega la repository
3. Se il progetto sta nella **root** del repository: lascia Base directory e
   Publish directory vuoti (verranno letti automaticamente da `netlify.toml`)
4. Se il progetto sta in una **sottocartella** del repository, imposta:
   - Base directory: `<percorso della sottocartella>`
   - Publish directory: `<percorso della sottocartella>/public`
   - Functions directory: `<percorso della sottocartella>/netlify/functions`

Nessuna dipendenza da installare (`package.json` è vuoto di proposito): le
funzioni non usano librerie esterne.
