# Università — prospetto esborsi e orientamento (famiglia Bonfanti)

Questo repository contiene il lavoro di pianificazione universitaria per i tre figli di Igor Bonfanti (Milano): **Francesca** (ingresso settembre 2027) e i gemelli **Marco** e **Iacopo** (ingresso settembre 2028). È pubblicato su GitHub Pages: https://igorbonfanti.github.io/universita-prospetto/

Lingua di lavoro: **italiano**. Igor usa Claude come consulente professionale di ammissioni universitarie: vuole correzioni dirette, valutazioni realistiche, tabelle e criteri espliciti, non conferme. Nelle procedure tecniche preferisce essere guidato un comando alla volta.

## Struttura del repository

| Percorso | Cosa è |
|---|---|
| `index.html` | **Prospetto esborsi bachelor** (app single-file, vanilla JS, nessuna dipendenza oltre ai font Google con fallback). Schede: Prospetto ponderato, Probabilità, Simulatore, Parametri, Metodo e fonti. Interruttore tema chiaro/sistema/scuro. Lo stato dell'utente è in `localStorage` (chiave `prospetto-v4`, tema in `tema`). |
| `analisi.html` | **Analisi di orientamento** (5/10/2026): per ciascun ragazzo i fatti dichiarati, la lettura dell'ufficio ammissioni ateneo per ateneo con stima %, il consiglio da tutor, verifiche aperte, fonti. Ogni affermazione è marcata "fatto" o "valutazione". |
| `docs/progetto/` | I documenti HTML prodotti nelle fasi precedenti, copiati integralmente dal Project claude.ai con una "nota di archivio" in testa dove i dati sono stati poi corretti. In ordine cronologico: `mappa-candidature-economia-2027.html`, `scala-ponderata-atenei-2027.html`, `marco-iacopo-ingresso-2028.html` (22/8/2026); `Piano_Universita_Bonfanti_Master.html` (13/9/2026, il master che li supera); `Marco_Universita_2028_Book_Completo.html`; `amsterdam-uva.html`, `copenhagen-cbs.html` (schede ateneo); `screening-corsi-atenei-rev2.html` (screening corsi). Riferimento storico: dove contraddicono `index.html`/`analisi.html` vale la versione più recente. |
| `docs/ricerche/` | Note di ricerca con cifre e URL (rette, costo della vita, selettività, ingegneria, Vienna e verifiche di ottobre 2026). |
| `docs/CONTESTO.md` | Tutti i fatti sulla famiglia, i vincoli, le decisioni e le correzioni, in ordine cronologico. **Leggerlo prima di qualsiasi modifica di contenuto.** |

## Come è fatto il modello (`index.html`)

Tutto è in costanti JS in cima allo `<script>`:

- `CITIES_D` — mantenimento annuo per città (base 2026, 12 mesi, escluse rette) con nota di composizione.
- `TUI_D` — catalogo ateneo/corso: `[area, retta base, anno base, anni, crescita (null = default), una tantum, città, nota]`.
- `RULES` — per ogni chiave di `TUI_D` una regola `fn(profilo) → {p, calc}` con i `dati` di selettività: **le probabilità di ammissione non si impostano a mano, derivano dal profilo**. Ogni chiave di `TUI_D` deve avere una regola e una città esistente (c'è un check nei test manuali, vedi sotto).
- `PROF_D` — profilo per ragazzo: `media` (3ª-4ª / candidatura), `mate`, `matur` (maturità stimata /100), `c1` (0/1), `pLog` (resa attesa test logico-matematici 0-1), `pBoc` (resa test Bocconi), `pCol` (resa colloqui/essay). Francesca 8,4/8/90/1/0,75/0,65/0,70; Marco 7,3/7,5/78/0/0,60/0,55/0,50; Iacopo 6,6/7/72/0/0,85/0,70/0,75.
- `CASC_D` — cascata di preferenze per ragazzo: riga 1 = dove andrebbe se ammesso ovunque; P(iscrizione) = P(ammesso qui) × Π(1 − P righe sopra); l'ultima riga è il ripiego (Cattolica Milano, P = 1). Le cascate rispettano la regola olandese di **max 2 domande a numerus fixus** (Francesca: IBEB; Marco: IBA + Maastricht IB; Iacopo: Delft CSE + UvA EBE).
- `PARAM_D` — crescita rette 2,5%/anno (IE 2,9% dichiarato), mantenimento +3%/anno dal 2026, anni di ingresso, quota BSc² (35%: se Francesca entra a Rotterdam, probabilità che scelga il doppio bachelor a 4 anni), soglia 5% per gli scenari economico/caro.
- Costo annuo = retta × (1+g)^(anno − anno base) + mantenimento città × 1,03^(anno − 2026) + una tantum nel primo anno; durate frazionarie pesano l'anno extra per la frazione. Orizzonte 2027/28 → 2032/33.
- Risultati al 5/10/2026 (rev. 4b): atteso Francesca ≈ 102k (Rotterdam IBEB 74%), Marco ≈ 103k (IBA 45%), Iacopo ≈ 86k (Delft 51%), famiglia ≈ 292k; intervallo economico/caro ≈ 225-440k; picco 2029/30 ≈ 95k.

### Test rapido dopo ogni modifica

```bash
python3 -c "import re;h=open('index.html').read();open('/tmp/p.js','w').write(re.search(r'<script>(.*)</script>',h,re.S).group(1))" && node --check /tmp/p.js
# con jsdom (npm i jsdom) si può caricare la pagina e verificare che non ci siano errori, che ogni TUI_D abbia RULES e città, e che la somma delle P(iscrizione) sia 1 per ogni ragazzo
```

Pattern usato finora: in Node, stub minimale di `document`/`localStorage`, `new Function('module', js + ';module.exports={cascadeCalc,CH,RULES,TUI_D,CITIES_D}')`, poi `cascadeCalc('fra'|'mar'|'iac')`.

## Pubblicazione

GitHub Pages dal branch `main`, cartella radice; ogni push ripubblica in ~1 minuto. Commit in italiano. Non introdurre build step, bundler o dipendenze esterne: le pagine devono restare apribili come file locali.

Le regolazioni fatte dentro la pagina restano nel browser di chi le fa (localStorage): per cambiare i valori iniziali per tutti si modificano le costanti e si fa commit. Un backend condiviso (es. JSON via API GitHub o Firebase) è stato ipotizzato ma non realizzato.

## Regole di contenuto (importanti)

1. **Fatti solo da Igor o dai documenti del repository.** Non inventare né presumere nulla sui ragazzi; se un dato manca, chiederlo o marcarlo "da verificare". Esempio di errore già commesso e corretto: era comparso "Forward College" con una candidatura mai inviata — **Forward College non interessa e non va reinserito**.
2. Distinguere sempre **fatto** (fonte ufficiale o dichiarazione della famiglia) da **valutazione** (giudizio professionale).
3. Le percentuali di ammissione sono stime da regole dichiarate, non dati degli atenei; vanno aggiornate cambiando gli input del profilo, non ritoccando i numeri.
4. Rispettare le inclinazioni dichiarate dei ragazzi (vedi `docs/CONTESTO.md`), senza interpretarle.
5. Citare le fonti (URL) per ogni cifra nuova; le pagine ufficiali degli atenei vincono sui siti di preparazione.
