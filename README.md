# Università — prospetto esborsi bachelor

Stima degli esborsi della famiglia per i bachelor di Francesca, Marco e Iacopo, con probabilità di ammissione calcolate dal profilo di ciascuno, cascate di preferenze modificabili, simulatore manuale e parametri di costo.

**Pagina pubblicata:** https://igorbonfanti.github.io/universita-prospetto/

## Come funziona
- `index.html` è l'intera applicazione: nessun server, nessuna dipendenza (solo i font Google, con fallback di sistema).
- Le modifiche fatte nella pagina (ordine delle cascate, profili, parametri) restano salvate nel browser di chi le fa; per renderle visibili a tutti si cambiano i valori iniziali in `index.html` (costanti `PROF_D`, `CASC_D`, `TUI_D`, `CITIES_D`, `PARAM_D`) e si fa commit: GitHub Pages ripubblica in un minuto.

## Pagine
- `index.html`: prospetto esborsi interattivo (probabilità, cascate, simulatore, parametri).
- `analisi.html`: analisi di orientamento per Francesca, Marco e Iacopo (tutor e ufficio ammissioni).

## Come modificare
1. Apri `index.html` su GitHub e premi la matita (Edit).
2. Cambia i valori nelle costanti in cima allo script (rette, mantenimento, profili, regole).
3. "Commit changes": la pagina si aggiorna da sola.

Fonti e metodo sono nella scheda "Metodo e fonti" della pagina.
