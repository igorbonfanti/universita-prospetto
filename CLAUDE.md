# Università — piano di candidatura, esborsi e orientamento (famiglia Bonfanti)

Questo repository contiene il lavoro di pianificazione universitaria per i tre figli di Igor Bonfanti (Milano): **Francesca** (ingresso settembre 2027) e i gemelli **Marco** e **Iacopo** (ingresso settembre 2028). È pubblicato su GitHub Pages: https://igorbonfanti.github.io/universita-prospetto/

Lingua di lavoro: **italiano**. Igor usa Claude come consulente professionale di ammissioni universitarie: vuole correzioni dirette, valutazioni realistiche, tabelle e criteri espliciti, non conferme. Nelle procedure tecniche preferisce essere guidato un comando alla volta.

## Struttura del repository

| Percorso | Cosa è |
|---|---|
| `index.html` | **Piano di candidatura** (app, vanilla JS, nessuna dipendenza oltre ai font Google con fallback). Carica `dati.js`, `regole.js`, `modello.js` con `<script src>` (funziona anche aperta come file locale). Schede: In breve, Preferenze, Profili e probabilità, Scala consigliata, Preparazione, Calendario (con export .ics), Esborsi, Metodo e fonti (export/import delle impostazioni). Stato utente in `localStorage` (chiave `piano-v5`, scheda in `piano-vista`, tema in `tema`). |
| `dati.js` | Catalogo e dati: `CITTA`, `GRUPPI` (vincoli di sistema), `RHO` (correlazioni), `EN` (requisiti d'inglese su scala Cambridge), `PROGRAMMI` (45 corsi), `DOMANDE` (parti comuni delle domande: ore e quote contate una volta), `PROFILI`, `PREPARAZIONI`, `PREP_D`, `PREF_D` (preferenze iniziali = ipotesi), `CASC_V4` (cascate rev. 4b per il confronto), `PARAM_D`, `EVENTI` (calendario). |
| `regole.js` | `RULES`: per ogni corso `fn(q) → {p, calc, f, gate}` costruita sui criteri ufficiali; `controlloInglese`; `pMatur` (incertezza ±4 sulla maturità). |
| `modello.js` | Motore: profilo effettivo, simulazione Monte Carlo con copula gaussiana a fattori, ottimizzazione della scala (greedy + scambi sotto vincoli), valore delle preparazioni, costi. |
| `report.html` | **Report finale** del 6/10/2026 (statico, fatto/valutazione marcati): sintesi, correzioni, scala per ragazzo, preparazioni, calendario, verifiche da fare. |
| `analisi.html` | Analisi di orientamento del 5/10/2026, **superata** dal report (nota in testa). |
| `tests/verifica.js` | Test rapido senza dipendenze (vedi sotto). |
| `docs/progetto/` | I documenti HTML prodotti nelle fasi precedenti, copiati integralmente dal Project claude.ai con una "nota di archivio" in testa dove i dati sono stati poi corretti. In ordine cronologico: `mappa-candidature-economia-2027.html`, `scala-ponderata-atenei-2027.html`, `marco-iacopo-ingresso-2028.html` (22/8/2026); `Piano_Universita_Bonfanti_Master.html` (13/9/2026, il master che li supera); `Marco_Universita_2028_Book_Completo.html`; `amsterdam-uva.html`, `copenhagen-cbs.html` (schede ateneo); `screening-corsi-atenei-rev2.html` (screening corsi). Riferimento storico: dove contraddicono `index.html`/`report.html` vale la versione più recente. C'è anche `prospetto-esborsi-rev4b.html`, l'app precedente (5/10/2026). |
| `docs/ricerche/` | Note di ricerca con cifre e URL. Quelle del **6/10/2026** (Olanda economia; Bocconi e Milano; ingegneria e Politecnico; Delft-TU/e-Leuven-TUM; Francia e Spagna; Vienna-Danimarca-Irlanda; test e certificazioni) sono la base del catalogo e prevalgono su quelle del 5/10. |
| `docs/CONTESTO.md` | Tutti i fatti sulla famiglia, i vincoli, le decisioni e le correzioni, in ordine cronologico. **Leggerlo prima di qualsiasi modifica di contenuto.** |

## Come è fatto il modello

1. **Probabilità** (`regole.js`): ogni corso ha una regola sul profilo effettivo `q` = profilo (`PROFILI`, modificabile nella pagina) + preparazioni pianificate. **Le probabilità non si impostano a mano**: si cambiano gli input del profilo o le preparazioni. Le coppie `[a, b]` del profilo sono "senza / con preparazione mirata". Requisiti mancanti (inglese sotto soglia, OMPT non pianificato, matematica) danno `gate` → probabilità 0 con il motivo. Per Francesca `pDiploma` (riconoscimento del quadriennale all'estero, 0,9 finché non ci sono conferme scritte) è un evento unico comune a tutti gli atenei esteri.
2. **Simulazione** (`modello.js`): 3.000 scenari con numeri casuali riproducibili; esiti correlati tramite le leve `f` di ogni regola (`RHO`: logica, bocconi, colloquio, voti, maturita); le probabilità marginali restano quelle delle regole.
3. **Scala**: utilità = `U[voto]` (1 = 30, 2 = 65, 3 = 100) − `lambda` × costo del percorso / 10.000 €; ordine per utilità; si sceglie l'insieme di domande che massimizza utilità attesa − `mu` × ore, rispettando `GRUPPI` (2 fixus e 4 domande Studielink, 4 preferenze Bocconi, Sciences Po una volta, CAO 10, optagelse 8) e `maxDomande`. Il ripiego (`pref.ripiego`) è sempre incluso.
4. **Preparazioni**: valore = differenza di utilità attesa con e senza (scala riottimizzata); "netto" sottrae `mu` × ore.
5. **Costi**: retta × (1+g)^(anno − anno base) + mantenimento × 1,03^(anno − 2026) + una tantum nel primo anno, pesati con P(finire qui).
- Inglese: `enOk: true` nei profili (decisione della famiglia del 6/10/2026) → i requisiti d'inglese non escludono corsi; restano segnalate le soglie ≥185 o ≥180 per abilità.
- Risultati al 6/10/2026 con le impostazioni iniziali: Francesca preferito 15% / gradito 90% (IBEB 58% di finirci), costo ≈ 86k; Marco 7% / 99% (con media di 4ª a 8: 56%), ≈ 84k; Iacopo 59% / 100% (Delft CSE 59%), ≈ 61k; famiglia ≈ 231k, picco 2029/30 ≈ 77k.

### Test rapido dopo ogni modifica

```bash
node tests/verifica.js
```

Lo script (solo Node, nessuna dipendenza) controlla la sintassi degli script inline di `index.html` e `report.html`, carica `dati.js`, `regole.js` e `modello.js` come la pagina e verifica: regola, città, domanda e requisito d'inglese per ogni corso; preferenze, cascate, preparazioni ed eventi riferiti a corsi esistenti; probabilità in [0,1]; somma di P(finire qui) + P(nessuna ammissione) = 1; vincoli di sistema rispettati. Stampa la scala di ciascun ragazzo; esce con codice 1 se trova errori. Per vedere la pagina in anteprima con i file `.js` serve un server locale (`python -m http.server`): l'anteprima "file statico" del riquadro browser non carica gli script esterni.

## Pubblicazione

GitHub Pages dal branch `main`, cartella radice; ogni push ripubblica in ~1 minuto. Commit in italiano. Non introdurre build step, bundler o dipendenze esterne: le pagine devono restare apribili come file locali.

Le regolazioni fatte dentro la pagina restano nel browser di chi le fa (localStorage), esportabili e importabili come file JSON dalla scheda Metodo: per cambiare i valori iniziali per tutti si modificano `PREF_D`, `PROFILI`, `PREP_D`, `PARAM_D` in `dati.js` e si fa commit. Un backend condiviso (es. JSON via API GitHub o Firebase) è stato ipotizzato ma non realizzato.

## Regole di contenuto (importanti)

1. **Fatti solo da Igor o dai documenti del repository.** Non inventare né presumere nulla sui ragazzi; se un dato manca, chiederlo o marcarlo "da verificare". Esempio di errore già commesso e corretto: era comparso "Forward College" con una candidatura mai inviata — **Forward College non interessa e non va reinserito**.
2. Distinguere sempre **fatto** (fonte ufficiale o dichiarazione della famiglia) da **valutazione** (giudizio professionale).
3. Le percentuali di ammissione sono stime da regole dichiarate, non dati degli atenei; vanno aggiornate cambiando gli input del profilo o le regole (con fonte), non ritoccando i numeri.
4. Le preferenze in `PREF_D` sono **ipotesi di partenza** finché i ragazzi non le confermano: dirlo sempre quando si riportano risultati.
5. Rispettare le inclinazioni dichiarate dei ragazzi (vedi `docs/CONTESTO.md`), senza interpretarle.
6. Citare le fonti (URL) per ogni cifra nuova; le pagine ufficiali degli atenei vincono sui siti di preparazione.
