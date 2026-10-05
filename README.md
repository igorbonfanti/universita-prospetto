# Università — piano di candidatura bachelor

Piano di candidatura per i bachelor di Francesca (ingresso 2027), Marco e Iacopo (ingresso 2028): preferenze dei ragazzi, probabilità di ammissione calcolate dal profilo con le regole ufficiali di ciascun ateneo, scala di candidature consigliata, valore delle preparazioni (test, SAT, certificazioni), calendario delle scadenze ed esborsi attesi.

**Pagina pubblicata:** https://igorbonfanti.github.io/universita-prospetto/ · **Report del 6/10/2026:** https://igorbonfanti.github.io/universita-prospetto/report.html

## Pagine
- `index.html`: piano di candidatura interattivo (In breve, Preferenze, Profili e probabilità, Scala consigliata, Preparazione, Calendario con export .ics, Esborsi, Metodo e fonti).
- `report.html`: report finale del 6 ottobre 2026, con fatti e valutazioni distinti.
- `analisi.html`: analisi del 5 ottobre (superata dal report, conservata per storia).

## Come funziona
- Nessun server e nessuna dipendenza: `index.html` carica `dati.js` (catalogo, profili, preferenze, calendario), `regole.js` (regole di ammissione) e `modello.js` (calcolo). Si apre anche come file locale.
- Le scelte fatte nella pagina restano nel browser di chi le fa; si possono esportare e importare come file dalla scheda Metodo. Per cambiare i valori iniziali per tutti si modificano `PREF_D`, `PROFILI`, `PREP_D` in `dati.js` e si fa commit: GitHub Pages ripubblica in un minuto.

## Documentazione per chi lavora sul repository (anche con Claude Code)
- `CLAUDE.md`: punto di ingresso — struttura, modello di calcolo, test (`node tests/verifica.js`), regole di contenuto.
- `docs/CONTESTO.md`: tutti i fatti sulla famiglia, i vincoli, le decisioni e le correzioni.
- `docs/ricerche/`: cifre e URL raccolti sui siti ufficiali (5 e 6 ottobre 2026).
- `docs/progetto/`: i documenti delle fasi precedenti, compreso il prospetto esborsi rev. 4b (archivio).
