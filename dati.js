// dati.js — catalogo, profili, preferenze di partenza, preparazioni, calendario (nessuna dipendenza).
// Fonti: docs/ricerche/2026-10-06-*.md (ogni cifra ha l'URL ufficiale lì) e docs/CONTESTO.md.
// Convenzioni: [F] fatto da fonte ufficiale; [S] stima/valutazione; "da verificare" = non confermato.
'use strict';

const OGGI = '2026-10-06';
const ANNI = [2027, 2028, 2029, 2030, 2031, 2032];

const RAGAZZI = [
  {id: 'fra', nome: 'Francesca', cls: '--fra'},
  {id: 'mar', nome: 'Marco', cls: '--mar'},
  {id: 'iac', nome: 'Iacopo', cls: '--iac'}
];

// ---------- città: mantenimento annuo base 2026 (12 mesi, escluse rette) ----------
// tipo: 'casa' (Milano), 'grande', 'media', 'piccola' — la scelta sì/no la fanno i ragazzi (Preferenze).
const CITTA = {
  'Milano (a casa)': {mant: 2800, tipo: 'casa', nota: 'ATM under 27 ~200, libri 400-700, pasti fuori 1.000-1.400, telefono, svago (Federconsumatori 2025)'},
  'Rotterdam': {mant: 26000, tipo: 'grande', nota: 'Camera 700-790, studio 1.250+ (Kamernet, kamer.nl); EUR indica 1.150 €/mese'},
  'Amsterdam': {mant: 30000, tipo: 'grande', nota: 'Studio ~1.400/mese (kamer.nl 1.408; camera 850-990)'},
  'Delft': {mant: 22500, tipo: 'media', nota: 'Camera mediana 650, studentato ~800/mese; L\'Aia e Rotterdam a 10-15 minuti; laptop CSE a parte'},
  'Eindhoven': {mant: 23000, tipo: 'media', nota: 'Camera mediana 567, studio 900-1.100'},
  'Tilburg': {mant: 23000, tipo: 'piccola', nota: 'Studio ~850/mese; solo il 30% delle matricole internazionali trova stanza dai fornitori convenzionati'},
  'Maastricht': {mant: 23500, tipo: 'piccola', nota: 'Studio ~900/mese (camera 565-625)'},
  'Reims': {mant: 16000, tipo: 'media', nota: 'Campus Sciences Po (Nord America/Africa); studio 500-600/mese. Parigi non è accessibile ai candidati con diploma estero'},
  'PEM (Reims → Londra → UE)': {mant: 21000, tipo: 'media', nota: 'Anni 1-2 Reims (~16k), anno 3 Londra (~29k), anno 4 Berlino/Madrid/Torino (~18k): media'},
  'ESCP (media 3 campus)': {mant: 23000, tipo: 'grande', nota: 'Anno 1 Berlino/Londra/Parigi/Torino; media Parigi 24k, Londra ~29k, Torino/Madrid/Berlino 16-20k'},
  'Madrid': {mant: 26000, tipo: 'grande', nota: 'Tra camera (~24k) e studio (~28k); Idealista 2026 camera 550, studio 976. IE: scegliere il campus di Madrid, non Segovia'},
  'Barcellona': {mant: 27000, tipo: 'grande', nota: 'ESADE ha sede a Sant Cugat, fuori dal centro; camera 600, studio 960 (Idealista 2026)'},
  'Bruxelles': {mant: 21000, tipo: 'grande', nota: 'Camera mediana 590, studio ~750-950'},
  'Lovanio': {mant: 19000, tipo: 'piccola', nota: 'Stima 16-22k (nota del 5/10); 25 minuti da Bruxelles'},
  'Vienna': {mant: 19000, tipo: 'grande', nota: 'WG mediana 605/mese o studio 750-920; Jahreskarte 300/anno; stima 16-22k'},
  'Copenhagen': {mant: 24000, tipo: 'grande', nota: 'Studio/kollegium ~900/mese; con SU (lavoro 10-12 h/sett.) ~14-15k'},
  'Aarhus': {mant: 19500, tipo: 'media', nota: 'Stima 19-20k (nota del 5/10)'},
  'Dublino': {mant: 30000, tipo: 'grande', nota: 'Alloggio 1.200/mese (UCD; Daft Q1 2026 camera 874-1.007)'},
  'Jouy-en-Josas / Milano (HEC–Bocconi)': {mant: 11500, tipo: 'casa', nota: '1,5 anni a Milano (2.800) + 1,5 anni a Jouy-en-Josas (~20.000)'}
};

// ---------- vincoli di sistema ----------
const GRUPPI = {
  'nl-fixus': {max: 2, nome: 'Olanda: corsi a numerus fixus (max 2 per anno, Studielink)'},
  'studielink': {max: 4, nome: 'Olanda: domande di bachelor su Studielink (max 4 per anno)'},
  'bocconi': {max: 4, nome: 'Bocconi: preferenze nella stessa domanda (max 4, graduatoria unica)'},
  'sciencespo': {max: 1, nome: 'Sciences Po: una sola candidatura nella vita (Collège oppure doppio titolo)'},
  'polimi': {max: 5, nome: 'Politecnico: preferenze in graduatoria (max 5)'},
  'cao': {max: 10, nome: 'Irlanda CAO: 10 scelte Level 8'},
  'dk': {max: 8, nome: 'Danimarca optagelse.dk: 8 priorità'}
};

// correlazione fra esiti che dipendono dalla stessa leva (0 = indipendenti, 1 = stesso esito)
const RHO = {logica: 0.6, bocconi: 0.85, colloquio: 0.5, voti: 0.3, maturita: 0.7};

// ---------- requisiti di inglese ----------
// Tutto su scala Cambridge English (CES): IELTS 6.0 ≈ 169, 6.5 ≈ 176, 7.0 ≈ 185, 7.5 ≈ 191.
// ces = minimo complessivo, sez = minimo per abilità, recente = test non più vecchio di 2 anni alla scadenza,
// entro = quando va presentato; esente = il diploma italiano basta.
const EN = {
  ibeb: {ces: 170, recente: true, entro: '15/1', testo: 'IELTS 6.0 o C1 Advanced 170, ≤2 anni, entro il 15/1'},
  iba: {ces: 170, sez: 170, recente: true, entro: '15/3', testo: 'IELTS 6.5 (6.0) o Cambridge ≥170 in ogni abilità, entro il 15/3'},
  uva: {ces: 180, sez: 180, recente: true, entro: '15/1', testo: 'IELTS 6.5 (6.0) o Cambridge 180 in ogni abilità; test sostenuto prima del 15/1'},
  pple: {ces: 185, sez: 180, recente: true, entro: '1/2', testo: 'IELTS 7.0 o Cambridge 185 (180 per abilità); in alternativa 10 in inglese in pagella'},
  vu: {ces: 180, entro: '31/8', testo: 'IELTS 6.5 o Cambridge 180 (Cambridge senza scadenza), entro il 31/8'},
  mst: {esente: true, testo: 'Esonero: diploma UE con inglese fino all\'ultimo anno'},
  til: {ces: 173, recente: true, entro: '1/5', testo: 'IELTS 6.0 o Cambridge 173 (W,S ≥160), già in mano alla domanda'},
  delft: {ces: 176, recente: true, entro: '15/1', testo: 'IELTS 6.5 o C1 Advanced ≥176, ≤2 anni all\'upload, entro il 15/1'},
  tue: {ces: 176, sez: 169, recente: true, entro: '15/1 (CSE) / 1/5', testo: 'IELTS 6.5 (6.0) o C1 Advanced 176 (169), ≤2 anni'},
  kul: {ces: 176, sez: 169, entro: '1/7', testo: 'IELTS 6.5 (6.0), TOEFL 90 o CAE/CPE; il diploma italiano non esonera'},
  boc: {esente: true, testo: 'B2 (Cambridge 173 / IELTS 6.5) solo entro l\'immatricolazione, anche con il test Bocconi di inglese entro il 30/6'},
  polimiEn: {esente: true, testo: 'B2 First grade C / IELTS 5 entro l\'immatricolazione'},
  scpo: {esente: true, testo: 'C1 valutato al colloquio; certificato facoltativo'},
  escp: {ces: 180, testo: 'IELTS 6.5 o CAE 180'},
  ie: {ces: 185, recente: true, testo: 'IELTS 7 o C1 Advanced (punteggio non indicato), ≤2 anni'},
  esade: {ces: 180, testo: 'CAE 190, oppure 180-189 con validazione del dipartimento linguistico, o IELTS 7; altrimenti test d\'inglese ESADE'},
  uc3m: {esente: true, testo: 'B2 d\'inglese, anche autodichiarato'},
  cbs: {ces: 185, testo: 'CAE grade C ≥185, oppure inglese ≥8 in pagella + IELTS 7.0; entro il 5/7'},
  aarhus: {ces: 180, testo: 'IELTS 6.5 o Cambridge ≥180'},
  cao: {ces: 176, sez: 169, recente: true, testo: 'Cambridge 176 (169) o IELTS 6.5, ≤2 anni; oppure 80% in inglese all\'ultimo anno (dipende dall\'ateneo)'},
  tcd: {ces: 180, sez: 170, recente: true, testo: 'Cambridge 180 (170) o IELTS 6.5; l\'inglese della maturità non basta'},
  wu: {esente: true, testo: 'B2: basta il voto positivo di inglese sul diploma UE'},
  ita: {esente: true, testo: 'B1 (anche con dichiarazione della scuola o SAT)'}
};

// ---------- catalogo ----------
// retta = retta annua base nell'anno annoRetta (fascia massima); crescita null = default; unaTantum = spese del 1° anno
// oltre alla retta; fee = quote di candidatura (pagate comunque); ore = ore di lavoro della domanda [S];
// domanda = chiave condivisa (le ore e la fee si contano una volta sola per domanda); gruppi = vincoli di sistema;
// en = requisito di inglese; aree = interessi; cicli = anni di ingresso in cui il corso è disponibile.
const AREE = {eco: 'Economia', man: 'Management', fin: 'Finanza', quant: 'Econometria e dati', pol: 'Politica / PPE', ing: 'Ingegneria', inf: 'Informatica'};
const C2 = [2027, 2028];

const PROGRAMMI = {
  // --- Milano: Bocconi (nomi 2027/28) ---
  'boc-man': {ateneo: 'Bocconi', corso: 'Management (EN, 690 posti)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.boc, aree: ['man'], cicli: C2,
    nota: 'Ex BIEM. 55% test (Bocconi/SAT/ACT) + 45% media di terzultimo e penultimo anno; graduatoria unica d\'area; fino al 50-55% dei posti EN agli internazionali'},
  'boc-ea': {ateneo: 'Bocconi', corso: 'Economia aziendale (IT, 690 posti)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.ita, aree: ['man'], cicli: C2,
    nota: 'Ex CLEAM. Unico corso economico-aziendale in italiano dal 2027/28 (non esiste più Finance in italiano)'},
  'boc-fin': {ateneo: 'Bocconi', corso: 'Finance (EN, 460 posti)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.boc, aree: ['fin'], cicli: C2, nota: 'Ex BIEF/CLEF'},
  'boc-eco': {ateneo: 'Bocconi', corso: 'Economics (EN, 115 posti)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.boc, aree: ['eco', 'quant'], cicli: C2, nota: 'Ex BESS; track Economic Sciences / Economic and Data Sciences'},
  'boc-ipg': {ateneo: 'Bocconi', corso: 'International Politics and Government (EN, 115)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.boc, aree: ['pol'], cicli: C2, nota: ''},
  'boc-mcs': {ateneo: 'Bocconi', corso: 'Management and Computer Science (EN, 230)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.boc, aree: ['man', 'inf'], cicli: C2, nota: 'Ex BEMACS'},
  'boc-ai': {ateneo: 'Bocconi', corso: 'Math. & Computing Sciences for AI (EN, 115)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 17000, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0.5, domanda: 'bocconi', gruppi: ['bocconi'], en: EN.boc, aree: ['quant', 'inf'], cicli: C2, nota: 'Ex BAI; serve anche ≥11/24 in matematica al test (o SAT Math ≥600)'},
  'hec-boc': {ateneo: 'HEC–Bocconi', corso: 'Doppia laurea IPG – Data, Society & Organisations (110)', citta: 'Jouy-en-Josas / Milano (HEC–Bocconi)', paese: 'IT', anni: 3, retta: 25083, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'hec', gruppi: [], en: EN.boc, aree: ['pol', 'quant'], cicli: C2,
    nota: 'Domanda separata (100 €): media + test + CV, lettera e video-colloquio obbligatorio con 4 domande; pesi non pubblicati. Rette 23.000 + 25.750 + 26.500'},
  // --- Milano: Politecnico, ripieghi ---
  'polimi-ges': {ateneo: 'Politecnico di Milano', corso: 'Ingegneria Gestionale (IT, Bovisa, 680)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 3943, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'polimi', gruppi: ['polimi'], en: EN.ita, aree: ['ing', 'man'], cicli: C2,
    nota: '100% test (TOL o TOLC-I/CEnT-S/SAT), voti irrilevanti; ultimo ammesso 1ª graduatoria 2026: 59,9/100. TOL anticipato in 4ª ≥75 = posto garantito (solo corsi in italiano)'},
  'polimi-inf': {ateneo: 'Politecnico di Milano', corso: 'Ingegneria Informatica (IT, 720)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 3943, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'polimi', gruppi: ['polimi'], en: EN.ita, aree: ['ing', 'inf'], cicli: C2, nota: 'Ultimo ammesso 1ª graduatoria 2026: 53,1/100'},
  'polimi-mat': {ateneo: 'Politecnico di Milano', corso: 'Ingegneria Matematica (IT, 340)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 3943, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'polimi', gruppi: ['polimi'], en: EN.ita, aree: ['ing', 'quant'], cicli: C2, nota: 'Ultimo ammesso 1ª graduatoria 2026: 64,8/100'},
  'polimi-es': {ateneo: 'Politecnico di Milano', corso: 'Engineering Science (EN, 145)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 3943, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'polimi', gruppi: ['polimi'], en: EN.polimiEn, aree: ['ing', 'quant'], cicli: C2,
    nota: 'Nuovo dal 2026/27, interamente in inglese; graduatoria specifica, ultimo ammesso 2026: 86,04/100; il TOL anticipato ≥75 NON vale'},
  'cattolica': {ateneo: 'Cattolica Milano', corso: 'Economia e gestione aziendale (IT, 840)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 11500, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'cattolica', gruppi: [], en: EN.ita, aree: ['man'], cicli: C2,
    nota: 'Test TIEC (idoneità ≥25); nel 2026/27 posti esauriti: serve la sessione di febbraio e la prenotazione con 1.500 € (−750 € dopo 14 giorni)'},
  'statale-ema': {ateneo: 'Statale Milano', corso: 'Economia e management EMA (IT, 250)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 3410, annoRetta: 2026, fee: 0, unaTantum: 146, ore: 0, domanda: 'statale', gruppi: [], en: EN.ita, aree: ['eco', 'man'], cicli: C2,
    nota: 'Graduatoria solo TOLC-E; sessione anticipata (marzo-maggio dell\'anno del diploma) con 150 posti; prenotazione 146 € non rimborsabili'},
  'bicocca': {ateneo: 'Milano-Bicocca', corso: 'Economia (area economica, TOLC-E)', citta: 'Milano (a casa)', paese: 'IT', anni: 3, retta: 3635, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'bicocca', gruppi: [], en: EN.ita, aree: ['eco', 'man'], cicli: C2,
    nota: 'TOLC-E ≥13 (mate ≥4); i gemelli possono candidarsi già in 4ª (ammissione anticipata, bando atteso ~marzo 2027): ripiego garantito un anno prima'},
  // --- Olanda: economia ---
  'eur-ibeb': {ateneo: 'Erasmus Rotterdam (ESE)', corso: 'IBEB (500 posti nel 2027/28)', citta: 'Rotterdam', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 8, domanda: 'eur', gruppi: ['nl-fixus', 'studielink'], en: EN.ibeb, aree: ['eco', 'quant'], cicli: C2,
    nota: 'Regolamento 2027/28 (22/9/2026): 500 posti; attività online pass/fail (22/2-15/3/2027); numeri 1-250 per media del penultimo anno, poi 50% media + 50% sorteggio. Mate ≥7 o OMPT. BSA: tutti i 60 crediti'},
  'eur-bsc2': {ateneo: 'Erasmus Rotterdam (ESE)', corso: 'BSc² Econometrics & Economics (4 anni)', citta: 'Rotterdam', paese: 'NL', anni: 4, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 6, domanda: 'eur', gruppi: ['studielink'], en: EN.ibeb, aree: ['eco', 'quant'], cicli: C2,
    nota: 'Non fixus, rolling da novembre, scadenza 1/5; voti (mate e inglese), 3 domande di motivazione, CV; ~100 iscritti'},
  'rsm-iba': {ateneo: 'Erasmus Rotterdam (RSM)', corso: 'IBA (650 posti)', citta: 'Rotterdam', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 6, domanda: 'rsm', gruppi: ['nl-fixus', 'studielink'], en: EN.iba, aree: ['man'], cicli: C2,
    nota: '75% media del penultimo anno + 25% motivazione (2 risposte da 1.500 caratteri). Diploma italiano: punti voto SOLO con media ≥8 (scheda Italia RSM, 30/9/2026). Ultimo offerto 2026: 1206'},
  'uva-ebe': {ateneo: 'UvA Amsterdam', corso: 'Economics & Business Economics EN (550)', citta: 'Amsterdam', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 22, domanda: 'uva', gruppi: ['nl-fixus', 'studielink'], en: EN.uva, aree: ['eco'], cicli: C2,
    nota: 'Solo test online 2,5 h (voti irrilevanti); top 300 per punteggio, 2/3 dei restanti a sorteggio; 2026: ~1.500 partecipanti, offerte fino al 1.487° ma con 850 posti. Diploma italiano: serve anche un certificato di matematica (es. OMPT-F ≥60%)'},
  'uva-eds': {ateneo: 'UvA Amsterdam', corso: 'Econometrics & Data Science', citta: 'Amsterdam', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 1, domanda: 'uva', gruppi: ['studielink'], en: EN.uva, aree: ['quant'], cicli: C2,
    nota: 'Non fixus; per l\'Italia OMPT-D ≥70% obbligatorio; scadenza 1/4 (con alloggio) o 1/5'},
  'uva-pple': {ateneo: 'UvA Amsterdam', corso: 'PPLE (~250 iscritti)', citta: 'Amsterdam', paese: 'NL', anni: 3, retta: 5660, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 28, domanda: 'uva', gruppi: ['studielink'], en: EN.pple, aree: ['pol', 'eco'], cicli: C2,
    nota: 'Selettivo non fixus: dossier (domanda entro l\'1/2), esame online 27/3, colloquio 10-27/4. Diploma italiano: media minima 85/100, esame di matematica (OMPT-A ≥70% o SAT Math ≥600)'},
  'vu-ebe': {ateneo: 'VU Amsterdam', corso: 'Economics & Business Economics / IBA (EN)', citta: 'Amsterdam', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 1, domanda: 'vu', gruppi: ['studielink'], en: EN.vu, aree: ['eco', 'man'], cicli: C2,
    nota: 'Nessun fixus nel 2027/28 (rischio per il 2028/29); requisiti + study choice check; scadenza 1/5'},
  'vu-cs': {ateneo: 'VU Amsterdam', corso: 'Computer Science / AI (EN)', citta: 'Amsterdam', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 1, domanda: 'vu', gruppi: ['studielink'], en: EN.vu, aree: ['inf'], cicli: C2,
    nota: 'Accesso aperto; matematica livello Wiskunde B (decide l\'International Office) o OMPT-D ≥60%'},
  'mst-ib': {ateneo: 'Maastricht SBE', corso: 'International Business (fixus)', citta: 'Maastricht', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 4, domanda: 'mst', gruppi: ['nl-fixus', 'studielink'], en: EN.mst, aree: ['man'], cicli: C2,
    nota: 'Essay obbligatorio (pass/fail, vale anche per EBE) + graduatoria su voti del penultimo anno (mate 50%, inglese e italiano 50%) e CV; pesi 2027/28 da confermare (fino al 2026/27 1/3 ciascuno). ~875 posti, 1.300+ domande (2025)'},
  'mst-ebe': {ateneo: 'Maastricht SBE', corso: 'Economics & Business Economics', citta: 'Maastricht', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 0, domanda: 'mst', gruppi: ['studielink'], en: EN.mst, aree: ['eco'], cicli: C2, nota: 'Selettivo non fixus: solo l\'essay pass/fail, lo stesso dell\'IB'},
  'mst-eor': {ateneo: 'Maastricht SBE', corso: 'Econometrics & Operations Research', citta: 'Maastricht', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 0, domanda: 'mst-eor', gruppi: ['studielink'], en: EN.mst, aree: ['quant'], cicli: C2, nota: 'Accesso libero (Math B); scadenza 1/5'},
  'til-eco': {ateneo: 'Tilburg', corso: 'Economics / IBA (EN)', citta: 'Tilburg', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 1, domanda: 'til', gruppi: ['studielink'], en: EN.til, aree: ['eco', 'man'], cicli: C2, nota: 'Requisiti + matching obbligatorio (chatbot); scadenza 1/5; BSA 42'},
  'til-eor': {ateneo: 'Tilburg', corso: 'Econometrics & Operations Research', citta: 'Tilburg', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 1, domanda: 'til', gruppi: ['studielink'], en: EN.til, aree: ['quant'], cicli: C2, nota: 'Valutazione individuale della matematica; BSA non vincolante in sperimentazione'},
  // --- Olanda, Belgio: ingegneria ---
  'delft-cse': {ateneo: 'TU Delft', corso: 'Computer Science & Engineering (345 posti EN)', citta: 'Delft', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 1350, ore: 25, domanda: 'delft', gruppi: ['nl-fixus', 'studielink'], en: EN.delft, aree: ['inf', 'ing'], cicli: C2,
    nota: 'Cognitive Skills Test (50% mate + 50% logica, senza calcolatrice), voti ignorati; fasce: 1-210 offerta certa, 211-750 sorteggio. Liceo scientifico = Math B. Laptop ~1.350'},
  'delft-ae': {ateneo: 'TU Delft', corso: 'Aerospace Engineering (440)', citta: 'Delft', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 1350, ore: 27, domanda: 'delft', gruppi: ['nl-fixus', 'studielink'], en: EN.delft, aree: ['ing'], cicli: C2,
    nota: '60% esame (mate, fisica, argomenti AE) + 40% questionario di personalità; graduatoria pura; ~4.300 domande per 2026/27'},
  'tue-cse': {ateneo: 'TU Eindhoven', corso: 'Computer Science & Engineering (375)', citta: 'Eindhoven', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 22, domanda: 'tue', gruppi: ['nl-fixus', 'studielink'], en: EN.tue, aree: ['inf', 'ing'], cicli: C2,
    nota: '90% test (logica 40, algoritmi 40, mate 10) + 10% media del penultimo anno; selection day 6/3/2027; 2025: 1.249 candidati, offerte fino al ~800° (semi-ufficiale)'},
  'tue-ie': {ateneo: 'TU Eindhoven', corso: 'Industrial Engineering (EN)', citta: 'Eindhoven', paese: 'NL', anni: 3, retta: 2771, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 0, domanda: 'tue', gruppi: ['studielink'], en: EN.tue, aree: ['ing', 'man'], cicli: C2, nota: 'Nessun fixus; Math B + inglese; scadenza 1/5 (da riconfermare)'},
  'kul-bbe': {ateneo: 'KU Leuven + UCLouvain', corso: 'Business Engineering (Bruxelles, EN)', citta: 'Bruxelles', paese: 'BE', anni: 3, retta: 1194, annoRetta: 2026, fee: 0, unaTantum: 400, ore: 3, domanda: 'kul', gruppi: [], en: EN.kul, aree: ['ing', 'man', 'quant'], cicli: C2,
    nota: 'Non fixus ma ammissione a discrezione della facoltà: test di matematica online gratuito obbligatorio, lettera, CV; equivalenza FWB del diploma (400 €); scadenza UE 2026/27: 1/7'},
  'kul-bet': {ateneo: 'KU Leuven (Group T)', corso: 'Engineering Technology (Lovanio, EN)', citta: 'Lovanio', paese: 'BE', anni: 3, retta: 1181, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 2, domanda: 'kul', gruppi: [], en: EN.kul, aree: ['ing'], cicli: C2,
    nota: 'Accesso con requisiti: dal 2027/28 OMPT-G ≥60% oppure starting test in campus a inizio luglio; scadenza UE ~1/6'},
  // --- Francia ---
  'scpo': {ateneo: 'Sciences Po', corso: 'Bachelor (Collège universitaire), campus Reims/Le Havre/Menton', citta: 'Reims', paese: 'FR', anni: 3, retta: 14900, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'scpo', gruppi: ['sciencespo'], en: EN.scpo, aree: ['pol', 'eco'], cicli: C2,
    nota: 'Procedura internazionale: dossier 20+20+10 (voti, percorso, 3 testi), colloquio /50; finestre 4/11/2026, 13/1 e 1/3/2027; ~12-13% (stima da stampa). Parigi escluso per diploma estero. Retta 0-14.900 sul reddito N-2 (massimo se non documentato); 3° anno all\'estero'},
  'scpo-pem': {ateneo: 'Sciences Po + ESCP', corso: 'PEM: Politics, Economics & Management (4 anni, ~40 posti)', citta: 'PEM (Reims → Londra → UE)', paese: 'FR', anni: 4, retta: 17850, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 3, domanda: 'scpo', gruppi: ['sciencespo'], en: EN.scpo, aree: ['pol', 'eco', 'man'], cicli: C2,
    nota: 'Prima coorte 2027/28; stessa domanda Sciences Po con il PEM come prima scelta; anni 1-2 Reims, 3 Londra, 4 Berlino/Madrid/Torino; colloquio congiunto apr-mag, esiti giugno. Retta media (14.900 × 2 + 20.800 × 2)/4'},
  'escp': {ateneo: 'ESCP', corso: 'Bachelor in Management (3 campus)', citta: 'ESCP (media 3 campus)', paese: 'FR', anni: 3, retta: 20800, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 0, domanda: 'escp', gruppi: [], en: EN.escp, aree: ['man'], cicli: C2,
    nota: 'Rolling in 6 round (Torino dal 27/10/2026, altri dal 18/11/2026): dossier + colloquio online; nessun test; deposito 3.500 € scalato dalla retta (rimborsabilità da verificare)'},
  // --- Spagna ---
  'ie-bba': {ateneo: 'IE University', corso: 'BBA (Madrid; Economics e PPLE 27.300 €)', citta: 'Madrid', paese: 'ES', anni: 4, retta: 29880, annoRetta: 2027, crescita: 0.029, fee: 0, unaTantum: 1200, ore: 0, domanda: 'ie', gruppi: [], en: EN.ie, aree: ['man', 'eco'], cicli: C2,
    nota: 'IE Admissions Test (una volta sola) o SAT ≥1300, Kira, colloquio, essay; maturità ≥75 e media ≥7; Round 1 6/11/2026, R2 15/1, R3 5/3; prenotazione 5.000 € non rimborsabile (scalata dalla retta); il 1° anno può essere a Segovia'},
  'esade': {ateneo: 'ESADE', corso: 'BBA / GGELO (Sant Cugat, 475 / 130)', citta: 'Barcellona', paese: 'ES', anni: 4, retta: 21300, annoRetta: 2027, fee: 0, unaTantum: 0, ore: 0, domanda: 'esade', gruppi: [], en: EN.esade, aree: ['man', 'pol'], cicli: C2,
    nota: '5 elementi a pari peso (domanda, voti, test ESADE o SAT ~1320, inglese, colloquio); media attesa ≥8 e maturità ≥80; prenotazione 25% della retta'},
  'uc3m': {ateneo: 'UC3M Madrid', corso: 'Economía / ADE in inglese — Early Admission', citta: 'Madrid', paese: 'ES', anni: 4, retta: 1045, annoRetta: 2026, fee: 0, unaTantum: 300, ore: 0, domanda: 'uc3m', gruppi: [], en: EN.uc3m, aree: ['eco', 'man'], cicli: C2,
    nota: 'Early Admission per internazionali: 8% dei posti, voti degli ultimi due anni + lettera, nessuna PCE; rolling 5/10/2026-2/4/2027. La via ordinaria (UNEDasiss + PCE in spagnolo) richiede maturità ~90+ (conversione BOE: 90 → 8,75)'},
  // --- Austria, Danimarca, Irlanda ---
  'wu-bbe': {ateneo: 'WU Vienna', corso: 'Business and Economics BBE (240)', citta: 'Vienna', paese: 'AT', anni: 3, retta: 52, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 22, domanda: 'wu', gruppi: [], en: EN.wu, aree: ['eco', 'man'], cicli: C2,
    nota: 'Solo esame scritto in presenza a Vienna (fine giugno; 2026: 30/6), voti irrilevanti; ~8% dei presenti nel 2026; nessuna data alternativa: rischio di sovrapposizione con gli orali di maturità. Procedura 2027/28 a metà novembre 2026'},
  'cbs': {ateneo: 'Copenhagen Business School', corso: 'BSc in inglese (IB, IBP, BADM, BASM, BASoc)', citta: 'Copenhagen', paese: 'DK', anni: 3, retta: 0, annoRetta: 2026, fee: 0, unaTantum: 500, ore: 0, domanda: 'dk', gruppi: ['dk'], en: EN.cbs, aree: ['man', 'pol'], cicli: C2,
    nota: 'Quota 1 sulla maturità convertita (tabella ufficiale: 90 → 8,5; 95 → 9,3; 100 → 11,3). Soglie 2026: IB 11,1 e IBP 10,7 (= 100), BADM 9,8 (~98), BASM 9,4 (~96). Diploma entro il 5/7 ore 12'},
  'aarhus': {ateneo: 'Aarhus University (BSS)', corso: 'Economics and Business Administration (EN)', citta: 'Aarhus', paese: 'DK', anni: 3, retta: 0, annoRetta: 2026, fee: 0, unaTantum: 500, ore: 0, domanda: 'dk', gruppi: ['dk'], en: EN.aarhus, aree: ['eco', 'man'], cicli: C2,
    nota: 'Soglia Quota 1: 8,2 → 8,8 → 9,2 (2024-2026), cioè maturità ~88 → 92 → 95; diploma entro il 5/7'},
  'ucd': {ateneo: 'UCD Dublino', corso: 'Commerce (554) / Economics (544)', citta: 'Dublino', paese: 'IE', anni: 3, retta: 2754, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'cao', gruppi: ['cao'], en: EN.cao, aree: ['man', 'eco'], cicli: C2,
    nota: 'Punti CAO dalla maturità (100L 600, 100 553, 95 527, 90 501) + 25 se mate ≥7 da liceo scientifico (novità 2026, da verificare per il 2027); Economics ≈ 95 + bonus, Commerce ≈ 100 + bonus; mate ≥8'},
  'tcd': {ateneo: 'Trinity College Dublin', corso: 'BESS (567) / PPES (591), 4 anni', citta: 'Dublino', paese: 'IE', anni: 4, retta: 2713, annoRetta: 2026, fee: 0, unaTantum: 0, ore: 0, domanda: 'cao', gruppi: ['cao'], en: EN.tcd, aree: ['eco', 'pol'], cicli: C2,
    nota: 'BESS ≈ 100 + bonus o 100 e lode; PPES solo 100 e lode; test d\'inglese obbligatorio'}
};


// parti comuni delle domande: ore [S] e quote di candidatura [F], contate una volta sola per domanda
const DOMANDE = {
  'bocconi': {ore: 3, fee: 100, nome: 'Bocconi (fino a 4 preferenze)'}, 'hec': {ore: 10, fee: 100, nome: 'HEC–Bocconi (CV, lettera, video)'},
  'polimi': {ore: 2, fee: 35, nome: 'Politecnico (TOL 35 € a tentativo)'}, 'cattolica': {ore: 3, fee: 60, nome: 'Cattolica (TIEC)'},
  'statale': {ore: 3, fee: 35, nome: 'Statale (TOLC-E)'}, 'bicocca': {ore: 3, fee: 35, nome: 'Bicocca (TOLC-E)'},
  'eur': {ore: 2, fee: 100, nome: 'Erasmus School of Economics'}, 'rsm': {ore: 2, fee: 100, nome: 'RSM'},
  'uva': {ore: 2, fee: 100, nome: 'UvA (una fee per anno)'}, 'vu': {ore: 2, fee: 100, nome: 'VU'},
  'mst': {ore: 12, fee: 0, nome: 'Maastricht (essay comune a IB ed EBE)'}, 'mst-eor': {ore: 2, fee: 0, nome: 'Maastricht EOR'},
  'til': {ore: 3, fee: 100, nome: 'Tilburg (matching)'}, 'delft': {ore: 3, fee: 100, nome: 'TU Delft'}, 'tue': {ore: 3, fee: 100, nome: 'TU Eindhoven'},
  'kul': {ore: 5, fee: 90, nome: 'KU Leuven (lettera, CV, test di matematica)'},
  'scpo': {ore: 40, fee: 150, nome: 'Sciences Po (3 testi, 2 referenze, traduzioni, colloquio)'}, 'escp': {ore: 15, fee: 80, nome: 'ESCP (dossier, colloquio)'},
  'ie': {ore: 20, fee: 150, nome: 'IE (essay, Kira, colloquio)'}, 'esade': {ore: 15, fee: 150, nome: 'ESADE (test ESADE, dossier)'},
  'uc3m': {ore: 6, fee: 150, nome: 'UC3M Early Admission'}, 'wu': {ore: 3, fee: 50, nome: 'WU Vienna (registrazione, OSA)'},
  'dk': {ore: 3, fee: 0, nome: 'optagelse.dk'}, 'cao': {ore: 3, fee: 50, nome: 'CAO'}
};

// ---------- profili (input editabili) ----------
// Le coppie [a, b] sono [senza preparazione mirata, con preparazione mirata]; tutte le rese sono VALUTAZIONI del
// consulente, non dati. mediaPen = media del penultimo anno (Olanda, Maastricht, TU/e); mediaBoc = media di
// terzultimo e penultimo anno (Bocconi); matur = maturità stimata /100 (CAO, Danimarca, Spagna).
const PROFILI = {
  fra: {ciclo: 2027, mediaPen: [8.4, 8.4], mediaBoc: [8.4, 8.4], mate: 8, matur: 90,
    pLog: [0.65, 0.75], pBoc: [0.45, 0.65], pSat: 0.55, pCol: [0.6, 0.7], ompt: [0.6, 0.75],
    en: {ces: 180, sez: null, recente: true, tipo: 'Cambridge C1 Advanced (2026)'}, enOk: true, enObiettivo: {ces: 185, sez: 180, recente: true},
    pDiploma: 0.9,
    note: 'Liceo scientifico bilingue quadriennale, diploma luglio 2027. Media 8,4-8,5 dichiarata: il penultimo anno è la 3ª (2025/26, già chiusa) e per Bocconi contano verosimilmente 2ª e 3ª (da confermare). Cambridge C1 Advanced del 2026 (punteggi per abilità non noti): inglese considerato soddisfatto (decisione della famiglia, 6/10/2026). Test Bocconi del 24/9/2026: 25/50. pDiploma = probabilità che gli atenei esteri accettino il diploma quadriennale (nessuno lo menziona: valutazione 0,9 finché non arrivano conferme scritte).'},
  mar: {ciclo: 2028, mediaPen: [7.3, 8.0], mediaBoc: [7.1, 7.45], mate: 7.5, matur: 78,
    pLog: [0.5, 0.6], pBoc: [0.4, 0.55], pSat: 0.45, pCol: [0.45, 0.55], ompt: [0.45, 0.6],
    en: {ces: 170, sez: null, recente: true, tipo: 'Cambridge B2 First (2026); IELTS Academic a breve'}, enOk: true, enObiettivo: {ces: 180, sez: 176, recente: true},
    pDiploma: 1,
    note: 'Liceo scientifico, 4ª nel 2026/27 (= penultimo anno per l\'Olanda). 3ª poco sotto il 7, obiettivo 7,5 in 4ª. La media di 4ª "con preparazione" (8,0) è la soglia RSM per i punti voto IBA: è un obiettivo, non una previsione.'},
  iac: {ciclo: 2028, mediaPen: [6.6, 7.3], mediaBoc: [6.5, 6.85], mate: 7, matur: 72,
    pLog: [0.75, 0.85], pBoc: [0.55, 0.7], pSat: 0.65, pCol: [0.7, 0.75], ompt: [0.65, 0.8],
    en: {ces: 170, sez: null, recente: true, tipo: 'Cambridge B2 First (2026); IELTS Academic a breve'}, enOk: true, enObiettivo: {ces: 180, sez: 176, recente: true},
    pDiploma: 1,
    note: 'Liceo scientifico, 4ª nel 2026/27. Media sotto il 7; forte attitudine logico-matematica e per la fisica, brillante in test e colloqui (dichiarato): rese alte nei test.'}
};

// ---------- preparazioni (investimenti di tempo e denaro) ----------
// effetto(q, prof): modifica il profilo effettivo q. ore ed euro sono STIME [S]. corsi = dove la preparazione serve.
const PREPARAZIONI = {
  logica: {nome: 'Allenamento matematica e logica a tempo', ore: 50, euro: 0,
    descr: 'Politest e test di autovalutazione Politecnico, simulazioni TOLC-I/CEnT-S, materiali Delft (MOOC Pre-University Calculus) e TU/e; senza calcolatrice. Nucleo comune a TOL, test UvA, CST Delft, TU/e, WU, IE, ESADE, OMPT.',
    effetto: (q, p) => { q.pLog = p.pLog[1]; q.ompt = p.ompt[1]; },
    corsi: ['polimi-ges', 'polimi-inf', 'polimi-mat', 'polimi-es', 'uva-ebe', 'uva-eds', 'delft-cse', 'delft-ae', 'tue-cse', 'wu-bbe', 'ie-bba', 'esade', 'statale-ema', 'bicocca', 'uva-pple', 'kul-bbe', 'kul-bet']},
  boc: {nome: 'Preparazione specifica test Bocconi', ore: 30, euro: 180,
    descr: 'Simulazione ufficiale e app The Faculty, gestione del tempo (1,5 min a domanda, penalità −0,2), critical thinking; fino a 4 tentativi a 60 €. Francesca: 3 tentativi tra il 14/10/2026 e il 21/1/2027. Gemelli: dal ~luglio 2027.',
    effetto: (q, p) => { q.pBoc = p.pBoc[1]; },
    corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai', 'hec-boc']},
  sat: {nome: 'SAT (1-2 tentativi)', ore: 35, euro: 200,
    descr: 'Vale per Bocconi (equivalente al test, conta il migliore), Politecnico (alternativa al TOL, anche anticipato), IE (≥1300), ESADE, PPLE (Math ≥600), Sciences Po (facoltativo). Calcolatrice ammessa, nessuna penalità: utile a chi soffre il tempo. Date: 7/11 e 5/12/2026; 6/3, 1/5, 5/6/2027; 111 $.',
    effetto: (q, p) => { q.sat = true; q.pSat = p.pSat; },
    corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai', 'hec-boc', 'ie-bba', 'esade', 'uva-pple', 'polimi-ges', 'polimi-inf', 'polimi-mat']},
  cert_en: {nome: 'Certificazione d\'inglese (IELTS Academic / C1 Advanced)', ore: 25, euro: 290, salta: p => p.enOk,
    descr: 'Un solo certificato recente copre quasi tutto: IELTS 7.0 senza parti sotto 6.5 copre anche PPLE; C1 Advanced ≥180 in ogni abilità copre UvA, VU, Delft, TU/e, KU Leuven. Validità di 2 anni per molti atenei: gemelli tra primavera e autunno 2027; Francesca entro il 15/1/2027 se il suo certificato è precedente a settembre 2025.',
    effetto: (q, p) => { q.en = Object.assign({}, p.enObiettivo); },
    corsi: ['eur-ibeb', 'eur-bsc2', 'rsm-iba', 'uva-ebe', 'uva-eds', 'uva-pple', 'vu-ebe', 'vu-cs', 'til-eco', 'til-eor', 'delft-cse', 'delft-ae', 'tue-cse', 'tue-ie', 'kul-bbe', 'kul-bet', 'escp', 'ie-bba', 'esade', 'cbs', 'aarhus', 'ucd', 'tcd']},
  ompt: {nome: 'OMPT (test di matematica olandese)', ore: 20, euro: 270,
    descr: 'omptest.org, online con proctoring, 240-270 € a tentativo. Serve con il diploma italiano per UvA EBE (OMPT-F ≥60%, un tentativo), UvA EDS (OMPT-D ≥70%), PPLE (OMPT-A ≥70% o SAT). Non serve a Delft, TU/e, KU Leuven BE.',
    effetto: (q, p) => { q.omptFatto = true; },
    corsi: ['uva-ebe', 'uva-eds', 'uva-pple']},
  colloqui: {nome: 'Preparazione colloqui, essay e motivazioni', ore: 20, euro: 0,
    descr: 'Testi di motivazione (IBA, Maastricht, Sciences Po, IE, ESCP, PPLE, HEC) e simulazioni di colloquio; riuso dello stesso materiale.',
    effetto: (q, p) => { q.pCol = p.pCol[1]; },
    corsi: ['rsm-iba', 'mst-ib', 'mst-ebe', 'scpo', 'scpo-pem', 'escp', 'ie-bba', 'uva-pple', 'hec-boc', 'kul-bbe', 'esade', 'uc3m', 'eur-bsc2']},
  voti4: {nome: 'Alzare la media di 4ª (anno in corso)', ore: 120, euro: 0, solo: ['mar', 'iac'],
    descr: 'La 4ª è il penultimo anno: entra nel 75% dell\'IBA (diploma italiano: punti solo con media ≥8), nell\'IBEB, in Maastricht IB, nel 10% di TU/e e in metà del 45% Bocconi. Ore indicative distribuite sull\'anno.',
    effetto: (q, p) => { q.mediaPen = p.mediaPen[1]; q.mediaBoc = p.mediaBoc[1]; },
    corsi: ['rsm-iba', 'eur-ibeb', 'mst-ib', 'tue-cse', 'boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai', 'hec-boc', 'eur-bsc2', 'esade', 'uc3m', 'ie-bba', 'escp']}
};

// preparazioni pianificate di default (modificabili nella scheda Preparazione)
const PREP_D = {fra: ['logica', 'boc', 'colloqui'], mar: ['logica', 'colloqui'], iac: ['logica']};

// ---------- preferenze di partenza (IPOTESI da confermare con i ragazzi) ----------
// voto: 0 = escluso, 1 = accettabile, 2 = gradito, 3 = preferito. citta: 'si' | 'no' | 'dd' (da decidere).
const CITTA_D = () => Object.fromEntries(Object.keys(CITTA).map(c => [c, ['Delft', 'Eindhoven', 'Tilburg', 'Maastricht', 'Lovanio', 'Reims', 'PEM (Reims → Londra → UE)'].includes(c) ? 'dd' : 'si']));
const PREF_D = {
  fra: {voti: {'scpo': 3, 'scpo-pem': 3, 'eur-ibeb': 2, 'eur-bsc2': 2, 'rsm-iba': 2, 'uva-ebe': 2, 'uva-eds': 2, 'uva-pple': 2, 'vu-ebe': 1, 'mst-ib': 1, 'mst-ebe': 1, 'til-eco': 1,
    'escp': 1, 'ie-bba': 1, 'esade': 1, 'uc3m': 1, 'cbs': 2, 'aarhus': 1, 'ucd': 2, 'tcd': 2, 'wu-bbe': 2, 'hec-boc': 2,
    'boc-man': 1, 'boc-eco': 1, 'boc-fin': 1, 'boc-ipg': 1, 'boc-ea': 1, 'kul-bbe': 1, 'cattolica': 1, 'statale-ema': 1, 'bicocca': 1}, citta: CITTA_D(), ripiego: 'cattolica', forza: {}},
  mar: {voti: {'rsm-iba': 3, 'eur-ibeb': 2, 'boc-ea': 2, 'boc-man': 2, 'wu-bbe': 2, 'esade': 2, 'mst-ib': 2, 'mst-ebe': 2, 'til-eco': 1, 'vu-ebe': 2, 'uva-ebe': 2,
    'ie-bba': 1, 'escp': 1, 'kul-bbe': 1, 'uc3m': 1, 'cattolica': 1, 'bicocca': 1, 'statale-ema': 1}, citta: CITTA_D(), ripiego: 'bicocca', forza: {}},
  iac: {voti: {'delft-cse': 3, 'polimi-ges': 2, 'polimi-inf': 2, 'polimi-es': 2, 'tue-cse': 2, 'tue-ie': 2, 'uva-ebe': 2, 'uva-eds': 2, 'wu-bbe': 2, 'kul-bbe': 2, 'kul-bet': 1,
    'vu-cs': 2, 'ie-bba': 1, 'boc-mcs': 1, 'boc-ea': 1, 'delft-ae': 1, 'til-eor': 1, 'mst-eor': 1, 'cattolica': 1, 'bicocca': 1}, citta: CITTA_D(), ripiego: 'bicocca', forza: {}}
};

// cascate della rev. 4b (5/10/2026), tradotte nei nuovi id, per mostrare inclusioni, esclusioni e spostamenti
const CASC_V4 = {
  fra: ['scpo', 'eur-ibeb', 'cbs', 'wu-bbe', 'hec-boc', 'boc-ea', 'ucd', 'uva-eds', 'ie-bba', 'escp', 'cattolica'],
  mar: ['rsm-iba', 'boc-ea', 'wu-bbe', 'esade', 'mst-ib', 'mst-ebe', 'til-eco', 'cattolica'],
  iac: ['delft-cse', 'wu-bbe', 'uva-ebe', 'uva-eds', 'polimi-ges', 'ie-bba', 'kul-bbe', 'boc-ea', 'til-eco', 'cattolica']
};

// ---------- parametri ----------
const PARAM_D = {
  U: {1: 30, 2: 65, 3: 100},  // utilità per voto (punti)
  lambda: 1,                  // sensibilità al costo: punti persi ogni 10.000 € di costo del percorso
  mu: 0.04,                   // valore del tempo: punti per ora di lavoro (0,04 = 25 ore valgono 1 punto)
  maxDomande: 14,             // tetto di domande per ragazzo (ripiego escluso)
  gRette: 0.025, gMant: 0.03, annoMant: 2026,
  qBsc2: 0.35,                // se Francesca entra a Rotterdam ESE: probabilità che scelga il BSc² (non più usata in scala: il BSc² è un'opzione a sé)
  N: 3000, seed: 20261006,
  citta: {}                   // override del mantenimento per città
};

// ---------- calendario ----------
// chi: 'fra' | 'mar' | 'iac' | 'gem' (gemelli) | 'tutti'; corsi: id del catalogo (l'evento compare se il corso è nella
// scala consigliata); prep: id preparazione; stato: 'F' (fatto, data ufficiale) | 'S' (stima per analogia).
const EVENTI = [
  // ---- Francesca, ciclo 2027 ----
  {d: '2026-10-14', a: '2027-01-21', chi: 'fra', prep: 'boc', cosa: 'Test Bocconi: restano 3 tentativi (piattaforma chiusa 7-8/12 e 17/12-1/1)', stato: 'F'},
  {d: '2026-10-23', chi: 'fra', prep: 'sat', cosa: 'Iscrizione SAT del 7/11 (poi 20/11 per il 5/12)', stato: 'F'},
  {d: '2026-10-27', chi: 'fra', corsi: ['escp'], cosa: 'ESCP Torino: scadenza round 1 (altri campus 18/11)', stato: 'F'},
  {d: '2026-11-04', chi: 'fra', corsi: ['scpo', 'scpo-pem'], cosa: 'Sciences Po: 1ª finestra (2 referenze, pagelle tradotte, 3 testi); colloqui 8-18/12', stato: 'F'},
  {d: '2026-11-05', chi: 'fra', corsi: ['ucd', 'tcd'], cosa: 'Apertura CAO', stato: 'F'},
  {d: '2026-11-06', chi: 'fra', corsi: ['ie-bba'], cosa: 'IE Round 1 (esito entro 11/12); R2 15/1, R3 5/3', stato: 'F'},
  {d: '2026-11-07', chi: 'fra', prep: 'sat', cosa: 'SAT (anche 5/12/2026)', stato: 'F'},
  {d: '2026-11-15', chi: 'tutti', corsi: ['wu-bbe'], cosa: 'WU pubblica la procedura BBE 2027/28 (data esame)', stato: 'S'},
  {d: '2026-11-25', a: '2027-01-26', chi: 'fra', corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai', 'hec-boc'], cosa: 'Bocconi Winter e HEC round II: domande (ultimo test 21/1)', stato: 'F'},
  {d: '2026-12-01', chi: 'tutti', corsi: ['polimi-ges', 'polimi-inf', 'polimi-mat', 'polimi-es'], cosa: 'Bando Politecnico 2027/28 e fase anticipata 2028/29 (atteso nov-dic)', stato: 'S'},
  {d: '2027-01-15', chi: 'fra', corsi: ['eur-ibeb', 'rsm-iba', 'uva-ebe', 'mst-ib', 'delft-cse', 'delft-ae', 'tue-cse'], cosa: 'Studielink: scadenza numerus fixus (ESE: dossier completo con inglese e matematica)', stato: 'F'},
  {d: '2027-01-15', chi: 'fra', corsi: ['mst-ebe'], cosa: 'Maastricht EBE: scadenza "early" per l\'essay (ultima 15/3)', stato: 'F'},
  {d: '2027-01-20', chi: 'fra', corsi: ['ucd', 'tcd'], cosa: 'CAO early (normale 1/2)', stato: 'F'},
  {d: '2027-01-31', chi: 'fra', corsi: ['rsm-iba'], cosa: 'RSM IBA: domanda completa in OLAF con le 2 risposte di motivazione', stato: 'F'},
  {d: '2027-02-01', chi: 'fra', corsi: ['uva-pple'], cosa: 'PPLE: domanda completa (round 1)', stato: 'F'},
  {d: '2027-02-01', chi: 'fra', corsi: ['cattolica'], cosa: 'Cattolica: prova TIEC di febbraio (iscrizioni ~nov-gen); prenotazione 1.500 €', stato: 'S'},
  {d: '2027-02-22', a: '2027-03-15', chi: 'fra', corsi: ['eur-ibeb'], cosa: 'ESE IBEB: attività online obbligatoria (pass/fail)', stato: 'F'},
  {d: '2027-02-20', chi: 'fra', corsi: ['uva-ebe'], cosa: 'UvA EBE: test online (20/2 o 3/3)', stato: 'F'},
  {d: '2027-03-01', chi: 'fra', corsi: ['scpo', 'scpo-pem'], cosa: 'Sciences Po: chiusura definitiva (anche PEM)', stato: 'F'},
  {d: '2027-03-01', a: '2027-05-31', chi: 'fra', corsi: ['statale-ema'], cosa: 'Statale EMA: sessione anticipata TOLC-E (150 posti; 146 € non rimborsabili)', stato: 'S'},
  {d: '2027-03-15', chi: 'fra', corsi: ['rsm-iba'], cosa: 'RSM IBA: risultati di matematica e inglese', stato: 'F'},
  {d: '2027-03-15', chi: 'fra', corsi: ['cbs', 'aarhus'], cosa: 'optagelse.dk: scadenza ore 12 (fino a 8 priorità)', stato: 'F'},
  {d: '2027-03-15', chi: 'fra', corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai'], cosa: 'Esiti Bocconi Winter; immatricolazione entro ~fine marzo con 3.400 € (rimborsabili −250 € entro ~22/4)', stato: 'S'},
  {d: '2027-03-27', chi: 'fra', corsi: ['uva-pple'], cosa: 'PPLE: esame online (colloqui 10-27/4)', stato: 'F'},
  {d: '2027-04-02', chi: 'fra', corsi: ['uc3m'], cosa: 'UC3M Early Admission: chiusura (rolling dal 5/10/2026)', stato: 'F'},
  {d: '2027-04-15', chi: 'fra', corsi: ['eur-ibeb', 'rsm-iba', 'uva-ebe', 'mst-ib', 'mst-ebe', 'delft-cse', 'tue-cse'], cosa: 'Olanda: graduatorie numerus fixus; 14 giorni per accettare', stato: 'F'},
  {d: '2027-04-22', chi: 'fra', corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai'], cosa: 'Bocconi: termine rimborso prima rata Winter (regola 2026/27)', stato: 'S'},
  {d: '2027-05-01', chi: 'fra', corsi: ['eur-bsc2', 'uva-eds', 'vu-ebe', 'vu-cs', 'til-eco', 'til-eor', 'mst-eor', 'tue-ie'], cosa: 'Olanda: scadenza corsi senza fixus (UvA EDS 1/4 se si chiede alloggio)', stato: 'F'},
  {d: '2027-06-16', chi: 'fra', cosa: 'Maturità: prima prova (orali a seguire)', stato: 'F'},
  {d: '2027-06-25', chi: 'fra', corsi: ['wu-bbe'], cosa: 'WU: esame BBE in presenza a Vienna (2026: 30/6), nessuna data alternativa', stato: 'S'},
  {d: '2027-07-01', chi: 'fra', corsi: ['kul-bbe'], cosa: 'KU Leuven Business Engineering: scadenza UE (regola 2026/27)', stato: 'S'},
  {d: '2027-07-05', chi: 'fra', corsi: ['cbs', 'aarhus'], cosa: 'Danimarca: diploma e voto entro le 12 (rischio se la commissione chiude dopo)', stato: 'F'},
  {d: '2027-08-01', chi: 'fra', corsi: ['ucd', 'tcd'], cosa: 'CAO: risultati della maturità entro il 1/8', stato: 'F'},
  // ---- gemelli, 2027 (anno di 4ª) ----
  {d: '2027-01-15', a: '2027-06-10', chi: 'gem', prep: 'voti4', cosa: 'Secondo quadrimestre di 4ª: la media finale è il "penultimo anno" per Olanda e metà della media Bocconi', stato: 'F'},
  {d: '2027-03-06', chi: 'gem', prep: 'sat', cosa: 'SAT in 4ª (anche 1/5 e 5/6/2027): unico test Bocconi-valido sostenibile prima del ciclo 2028/29', stato: 'F'},
  {d: '2027-03-11', a: '2027-07-16', chi: 'gem', corsi: ['polimi-ges', 'polimi-inf', 'polimi-mat'], cosa: 'TOL anticipato (2 finestre, 1 tentativo ciascuna): ≥75 = posto garantito nei corsi in italiano per il 2028/29', stato: 'S'},
  {d: '2027-04-15', a: '2027-07-06', chi: 'gem', corsi: ['bicocca'], cosa: 'Bicocca: ammissione anticipata dal penultimo anno (TOLC-E + domanda; bando atteso ~marzo 2027)', stato: 'S'},
  {d: '2026-11-01', a: '2027-12-31', chi: 'gem', cosa: 'IELTS Academic (previsto a breve): ≤2 anni alle scadenze (15/1/2028 per i fixus; per VU sostenuto dopo l\'1/9/2026); 7.0 senza parti sotto 6.5 copre anche PPLE, IE, ESADE, CBS', stato: 'S'},
  {d: '2027-07-15', chi: 'gem', prep: 'boc', cosa: 'Apre il test Bocconi del ciclo 2028/29 (4 tentativi)', stato: 'S'},
  {d: '2027-09-17', chi: 'gem', corsi: ['ie-bba'], cosa: 'IE: Early Round 2028/29', stato: 'F'},
  {d: '2027-09-01', a: '2027-09-29', chi: 'gem', corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai', 'hec-boc'], cosa: 'Bocconi Early 2028/29 (servono i voti finali di 4ª)', stato: 'S'},
  {d: '2027-11-01', chi: 'gem', corsi: ['scpo', 'scpo-pem'], cosa: 'Sciences Po: 1ª finestra 2028 (circa)', stato: 'S'},
  {d: '2027-11-25', a: '2028-01-26', chi: 'gem', corsi: ['boc-man', 'boc-ea', 'boc-fin', 'boc-eco', 'boc-ipg', 'boc-mcs', 'boc-ai', 'hec-boc'], cosa: 'Bocconi Winter 2028/29', stato: 'S'},
  {d: '2028-01-15', chi: 'gem', corsi: ['eur-ibeb', 'rsm-iba', 'uva-ebe', 'mst-ib', 'delft-cse', 'delft-ae', 'tue-cse'], cosa: 'Studielink: scadenza numerus fixus (inglese già certificato per Delft, TU/e, UvA, ESE)', stato: 'S'},
  {d: '2028-01-31', chi: 'gem', corsi: ['rsm-iba'], cosa: 'RSM IBA: domanda completa in OLAF', stato: 'S'},
  {d: '2028-02-01', chi: 'gem', corsi: ['ucd', 'tcd', 'uva-pple', 'cattolica'], cosa: 'CAO normale; PPLE round 1; Cattolica TIEC di febbraio', stato: 'S'},
  {d: '2028-02-20', chi: 'gem', corsi: ['delft-cse', 'uva-ebe'], cosa: 'Test di selezione Delft CST / UvA EBE (circa)', stato: 'S'},
  {d: '2028-03-04', chi: 'gem', corsi: ['tue-cse'], cosa: 'TU/e CSE: selection day online (circa)', stato: 'S'},
  {d: '2028-03-15', chi: 'gem', corsi: ['cbs', 'aarhus'], cosa: 'optagelse.dk: scadenza', stato: 'S'},
  {d: '2028-04-15', chi: 'gem', corsi: ['eur-ibeb', 'rsm-iba', 'uva-ebe', 'mst-ib', 'delft-cse', 'delft-ae', 'tue-cse'], cosa: 'Olanda: graduatorie numerus fixus', stato: 'S'},
  {d: '2028-05-01', chi: 'gem', corsi: ['eur-bsc2', 'uva-eds', 'vu-ebe', 'vu-cs', 'til-eco', 'til-eor', 'mst-eor', 'tue-ie'], cosa: 'Olanda: scadenza corsi senza fixus (VU: 15/1 se diventa fixus)', stato: 'S'},
  {d: '2028-06-15', chi: 'gem', cosa: 'Maturità 2028 (circa); poi graduatorie Politecnico da fine giugno', stato: 'S'},
  {d: '2028-06-25', chi: 'gem', corsi: ['wu-bbe'], cosa: 'WU: esame BBE in presenza a Vienna (circa)', stato: 'S'},
  {d: '2028-07-01', chi: 'gem', corsi: ['kul-bbe', 'kul-bet'], cosa: 'KU Leuven: scadenze UE (~1/6 Group T, ~1/7 Business Engineering); starting test inizio luglio', stato: 'S'}
];

if (typeof module !== 'undefined') module.exports = {OGGI, ANNI, RAGAZZI, CITTA, GRUPPI, RHO, EN, AREE, PROGRAMMI, DOMANDE, PROFILI, PREPARAZIONI, PREP_D, PREF_D, PARAM_D, EVENTI, CASC_V4};
