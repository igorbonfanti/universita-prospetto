// regole.js — regole di stima della probabilità di ammissione (nessuna dipendenza).
// Ogni regola: dati (fatti di selettività, con fonte nei file docs/ricerche/2026-10-06-*.md) e
// fn(q) → {p, calc, f, gate?}. q è il profilo effettivo (profilo + preparazioni pianificate).
// f = pesi delle leve (logica, bocconi, colloquio, voti, maturita) usati per correlare gli esiti.
// I coefficienti sono VALUTAZIONI del consulente costruite sui pesi ufficiali; le probabilità NON si impostano a mano:
// si cambiano gli input del profilo o le preparazioni.
'use strict';

const cl_ = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const W_ = (m, lo, hi) => cl_((m - lo) / (hi - lo));
const r_ = x => Math.round(x * 100) / 100;
// funzione di ripartizione normale (Abramowitz-Stegun)
function Phi(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
// probabilità che la maturità effettiva sia ≥ soglia, con incertezza σ = 4 punti sulla stima [S]
const SIGMA_MATUR = 4;
const pMatur = (stima, soglia) => soglia > 100 ? 0 : 1 - Phi((soglia - 0.5 - stima) / SIGMA_MATUR);

// resa nei test logico-matematici, con il SAT come seconda possibilità dove è accettato
const pTestLog = q => q.sat ? 1 - (1 - q.pLog) * (1 - 0.6 * q.pSat) : q.pLog;
// test Bocconi: vale il migliore tra test Bocconi e SAT (fonte Bocconi)
const pTestBoc = q => q.sat ? 1 - (1 - q.pBoc) * (1 - q.pSat) : q.pBoc;

// requisito di inglese del corso contro il certificato del ragazzo: null se ok, altrimenti il motivo
function controlloInglese(req, q) {
  if (!req || req.esente) return {gate: null, flag: null};
  const c = q.en || {};
  if (!c.ces) return {gate: `certificazione d'inglese mancante (${req.testo})`, flag: null};
  if (c.ces < req.ces) return {gate: `certificazione sotto il minimo (${req.testo})`, flag: null};
  if (req.sez && c.sez != null && c.sez < req.sez) return {gate: `abilità sotto il minimo per sezione (${req.testo})`, flag: null};
  if (req.recente && c.recente === false) return {gate: `certificazione più vecchia di 2 anni (${req.testo})`, flag: null};
  const dubbi = [];
  if (req.sez && c.sez == null) dubbi.push('punteggi per abilità');
  if (req.recente && c.recente == null) dubbi.push('data del test (≤2 anni)');
  return {gate: null, flag: dubbi.length ? 'inglese da verificare: ' + dubbi.join(', ') : null};
}

// ---------- Bocconi ----------
const regolaBocconi = (fattore, nota) => ({
  dati: '55% test (Bocconi, SAT o ACT: conta il migliore) + 45% media di terzultimo e penultimo anno; graduatoria unica d\'area, fino a 4 preferenze (l\'ordine non penalizza); soglie non pubblicate. ' + nota,
  fn: q => { const t = pTestBoc(q), w = W_(q.mediaBoc, 6, 9);
    return {p: cl_(t * w * fattore), f: {bocconi: 0.55, voti: 0.45},
      calc: `resa test ${r_(t)}${q.sat ? ' (Bocconi o SAT)' : ''} × W(media ${q.mediaBoc} su 6→9)=${r_(w)} × ${fattore} (selettività del corso)`}; }
});

const RULES = {
  'boc-ea': regolaBocconi(1.0, 'Economia aziendale (IT): corso più ampio, nessuna riserva internazionali.'),
  'boc-man': regolaBocconi(0.85, 'Management (EN): fino al 50-55% dei posti agli internazionali.'),
  'boc-fin': regolaBocconi(0.75, 'Finance (EN, 460 posti).'),
  'boc-mcs': regolaBocconi(0.65, 'Management and Computer Science (230 posti).'),
  'boc-ipg': regolaBocconi(0.6, 'IPG (115 posti).'),
  'boc-eco': regolaBocconi(0.55, 'Economics (115 posti).'),
  'boc-ai': regolaBocconi(0.45, 'MCS for AI (115 posti) + ≥11/24 in matematica al test o SAT Math ≥600.'),
  'hec-boc': {dati: '110 posti; domanda separata; media + test + CV, lettera e video-colloquio obbligatorio; pesi non pubblicati',
    fn: q => { const t = pTestBoc(q), w = W_(q.mediaBoc, 7, 9.5), c = 0.6 + 0.4 * q.pCol;
      return {p: cl_(t * w * c * 0.75), f: {bocconi: 0.45, voti: 0.35, colloquio: 0.2},
        calc: `resa test ${r_(t)} × W(media ${q.mediaBoc} su 7→9,5)=${r_(w)} × (0,6 + 0,4 × colloquio ${q.pCol}) × 0,75`}; }},
  // ---------- Politecnico e Milano ----------
  'polimi-ges': {dati: '100% test (TOL o TOLC-I/CEnT-S/SAT convertito), voti irrilevanti; ultimo ammesso 1ª graduatoria 2026: 59,9 (mediana dei candidati 62,9)',
    fn: q => { const t = pTestLog(q); return {p: cl_(0.1 + 0.9 * t), f: {logica: 1}, calc: `0,1 + 0,9 × resa test ${r_(t)}`}; }},
  'polimi-inf': {dati: 'Stesso test; ultimo ammesso 1ª graduatoria 2026: 53,1',
    fn: q => { const t = pTestLog(q); return {p: cl_(0.13 + 0.9 * t), f: {logica: 1}, calc: `0,13 + 0,9 × resa test ${r_(t)}`}; }},
  'polimi-mat': {dati: 'Stesso test; ultimo ammesso 1ª graduatoria 2026: 64,8',
    fn: q => { const t = pTestLog(q); return {p: cl_(0.9 * t - 0.05), f: {logica: 1}, calc: `0,9 × resa test ${r_(t)} − 0,05`}; }},
  'polimi-es': {dati: 'Engineering Science (EN, 145 posti): graduatoria specifica, ultimo ammesso 2026: 86,04 (1.361 candidati su 6.885 sopra 75)',
    fn: q => { const t = pTestLog(q); return {p: cl_(1.1 * t - 0.55), f: {logica: 1}, calc: `1,1 × resa test ${r_(t)} − 0,55 (soglia ~86/100)`}; }},
  'cattolica': {dati: 'TIEC: idoneità ≥25 punti; posti 2026/27 esauriti, quindi conta la prova di febbraio e la prenotazione',
    fn: q => ({p: 0.9, f: {logica: 0.3}, calc: '0,9 se si sostiene la prova di febbraio e si prenota subito il posto'})},
  'statale-ema': {dati: 'Graduatoria solo TOLC-E; 150 posti nella sessione anticipata',
    fn: q => ({p: cl_(0.25 + 0.6 * q.pLog), f: {logica: 1}, calc: `0,25 + 0,6 × resa test ${q.pLog}`})},
  'bicocca': {dati: 'TOLC-E ≥13 (mate ≥4); per i gemelli ammissione anticipata dal penultimo anno',
    fn: q => ({p: q.ciclo === 2028 ? 0.95 : 0.9, f: {logica: 0.3}, calc: q.ciclo === 2028 ? '0,95: ammissione anticipata in 4ª, soglia bassa' : '0,9: prima sessione (feb-mar)'})},
  // ---------- Olanda: economia ----------
  'eur-ibeb': {dati: '500 posti 2027/28; attività online pass/fail; 1-250 per media del penultimo anno, poi 50% media + 50% sorteggio; mate ≥7 (liceo scientifico) o OMPT',
    fn: q => { if (q.mate < 7 && !q.omptFatto) return {p: 0, gate: 'matematica sotto 7: serve OMPT-A ≥70% o B ≥60% entro il 15/1', f: {}, calc: ''};
      const s = W_(q.mediaPen, 6.5, 8.5); return {p: cl_(0.87 * (0.2 + 0.8 * s)), f: {voti: 0.5},
        calc: `0,87 (attività e rinunce) × (0,2 sorteggio + 0,8 × W(media penultimo anno ${q.mediaPen} su 6,5→8,5)=${r_(s)})`}; }},
  'eur-bsc2': {dati: 'Non fixus: voti (soprattutto matematica e inglese), 3 domande di motivazione, CV; ~100 iscritti; corso molto quantitativo',
    fn: q => { const s = W_(q.mediaPen, 7, 9), m = q.mate >= 8 ? 1 : 0.6; return {p: cl_(0.05 + 0.85 * s * m), f: {voti: 0.7, colloquio: 0.3},
      calc: `0,05 + 0,85 × W(media ${q.mediaPen} su 7→9)=${r_(s)} × mate ≥8? ${m}`}; }},
  'rsm-iba': {dati: '650 posti; 75% media del penultimo anno + 25% motivazione; con diploma italiano punti voto solo con media ≥8; ultimo offerto 2026: 1206',
    fn: q => { const m = q.mate >= 7 || q.omptFatto ? 1 : 0.6;
      if (q.mediaPen >= 8) { const s = W_(q.mediaPen, 8, 9); return {p: cl_((0.5 + 0.35 * s + 0.12 * q.pCol) * m), f: {voti: 0.75, colloquio: 0.25},
        calc: `media ${q.mediaPen} ≥ 8: 0,5 + 0,35 × W(8→9)=${r_(s)} + 0,12 × motivazione ${q.pCol}${m < 1 ? ' × 0,6 (mate <7)' : ''}`}; }
      return {p: cl_((0.03 + 0.07 * q.pCol) * m), f: {colloquio: 1}, calc: `media ${q.mediaPen} < 8: zero punti voto, resta solo la motivazione (0,03 + 0,07 × ${q.pCol})`}; }},
  'uva-ebe': {dati: '550 posti; solo test online (2026: ~1.500 partecipanti); top 300 per punteggio, 2/3 dei restanti a sorteggio; diploma italiano: certificato di matematica (OMPT-F ≥60%, un tentativo)',
    fn: q => { if (!q.omptFatto) return {p: 0, gate: 'serve un certificato di matematica (OMPT-F ≥60%) iscritto entro il 15/1', f: {}, calc: ''};
      const pass = cl_(q.ompt + 0.15), t = 0.25 + 0.45 * q.pLog; return {p: cl_(t * pass), f: {logica: 0.9},
        calc: `(0,25 + 0,45 × resa test ${q.pLog}) × OMPT-F superato ${r_(pass)}`}; }},
  'uva-eds': {dati: 'Non fixus; per il diploma italiano OMPT-D ≥70% obbligatorio',
    fn: q => { if (!q.omptFatto) return {p: 0, gate: 'serve l\'OMPT-D ≥70%', f: {}, calc: ''};
      return {p: cl_(0.95 * q.ompt), f: {logica: 1}, calc: `0,95 × probabilità OMPT-D ≥70% (${q.ompt})`}; }},
  'uva-pple': {dati: '~250 iscritti; dossier, esame online, colloquio; diploma italiano: media minima 85/100 ed esame di matematica (OMPT-A ≥70% o SAT Math ≥600)',
    fn: q => { if (!q.omptFatto && !q.sat) return {p: 0, gate: 'serve un esame di matematica (OMPT-A ≥70% o SAT Math ≥600)', f: {}, calc: ''};
      const base = q.mediaPen >= 8.5 ? 0.3 + 0.35 * W_(q.mediaPen, 8.5, 9.5) : 0.06, mt = q.sat ? Math.max(q.pSat, q.ompt) : q.ompt;
      return {p: cl_(base * (0.5 + 0.5 * q.pCol) * (0.6 + 0.4 * mt)), f: {colloquio: 0.5, voti: 0.5},
        calc: `${q.mediaPen >= 8.5 ? 'media ≥8,5' : 'media sotto il minimo 8,5 (85/100): 0,06'} × (0,5 + 0,5 × colloquio ${q.pCol}) × esame mate`}; }},
  'vu-ebe': {dati: 'Nessun fixus nel 2027/28; requisiti (matematica A) + study choice check',
    fn: q => { const m = q.mate >= 6 ? 1 : 0.7; return {p: 0.95 * m, f: {}, calc: `0,95 × requisito matematica ${m}`}; }},
  'vu-cs': {dati: 'Accesso aperto; matematica Wiskunde B (decide l\'International Office) o OMPT-D ≥60%',
    fn: q => { const m = q.mate >= 7 ? 1 : 0.8; return {p: 0.9 * m, f: {}, calc: `0,9 × matematica ${m}`}; }},
  'mst-ib': {dati: 'Essay pass/fail obbligatorio + graduatoria su voti del penultimo anno (mate 50%, lingue 50%) e CV; ~875 posti e 1.300+ domande (2025)',
    fn: q => { const e = 0.6 + 0.35 * q.pCol, s = W_(q.mediaPen, 6.5, 9), r = cl_(0.25 + 0.4 * s + 0.25 * q.pCol);
      return {p: cl_(e * r), f: {colloquio: 0.6, voti: 0.4}, calc: `essay superato (0,6 + 0,35 × ${q.pCol}) × graduatoria (0,25 + 0,4 × W(media ${q.mediaPen})=${r_(s)} + 0,25 × CV/essay)`}; }},
  'mst-ebe': {dati: 'Selettivo non fixus: essay pass/fail (lo stesso dell\'IB)',
    fn: q => { const e = 0.6 + 0.35 * q.pCol; return {p: cl_(0.97 * e), f: {colloquio: 1}, calc: `0,97 × essay superato (0,6 + 0,35 × ${q.pCol})`}; }},
  'mst-eor': {dati: 'Accesso libero; Math B (liceo scientifico + matematica nell\'esame finale)',
    fn: q => { const m = q.mate >= 7 ? 1 : 0.7; return {p: 0.92 * m, f: {}, calc: `0,92 × matematica ${m}`}; }},
  'til-eco': {dati: 'Requisiti + matching obbligatorio', fn: q => ({p: 0.93, f: {}, calc: '0,93: requisiti (matematica nell\'esame finale)'})},
  'til-eor': {dati: 'Valutazione individuale della matematica',
    fn: q => { const m = q.mate >= 7.5 ? 1 : 0.75; return {p: 0.85 * m, f: {}, calc: `0,85 × matematica ${m}`}; }},
  // ---------- ingegneria ----------
  'delft-cse': {dati: '345 posti track inglese; CST 50% mate + 50% logica, voti ignorati; fasce 1-210 offerta certa, 211-750 sorteggio',
    fn: q => ({p: cl_(0.7 * q.pLog), f: {logica: 1}, calc: `0,7 × resa test ${q.pLog}`})},
  'delft-ae': {dati: '440 posti, ~4.300 domande; 60% esame (mate, fisica, AE) + 40% questionario di personalità',
    fn: q => ({p: cl_(0.3 * q.pLog), f: {logica: 1}, calc: `0,3 × resa test ${q.pLog}`})},
  'tue-cse': {dati: '375 posti; 90% test + 10% media del penultimo anno; 2025: 1.249 candidati, offerte fino al ~800°',
    fn: q => { const w = W_(q.mediaPen, 6, 9); return {p: cl_(0.72 * q.pLog + 0.1 * w), f: {logica: 0.9, voti: 0.1}, calc: `0,72 × resa test ${q.pLog} + 0,1 × W(media ${q.mediaPen})=${r_(w)}`}; }},
  'tue-ie': {dati: 'Nessun fixus; Math B + inglese', fn: q => ({p: 0.93, f: {}, calc: '0,93: requisiti'})},
  'kul-bbe': {dati: 'Non fixus, ammissione a discrezione della facoltà; test di matematica online, lettera, CV',
    fn: q => { const t = 0.8 + 0.2 * q.pLog; return {p: cl_(0.85 * t), f: {logica: 0.5}, calc: `0,85 × (0,8 + 0,2 × resa test ${q.pLog})`}; }},
  'kul-bet': {dati: 'Requisiti: OMPT-G ≥60% o starting test di luglio',
    fn: q => { const t = 0.8 + 0.2 * q.pLog; return {p: cl_(0.9 * t), f: {logica: 0.5}, calc: `0,9 × (0,8 + 0,2 × resa test ${q.pLog})`}; }},
  // ---------- Francia ----------
  'scpo': {dati: 'Dossier 50 (voti, percorso, 3 testi) + colloquio 50; ~12-13% degli internazionali (stima da stampa); C1 atteso',
    fn: q => { const w = W_(q.mediaPen, 7.5, 9.2), e = (q.en && q.en.ces >= 180) ? 1 : 0.75;
      return {p: cl_(0.45 * q.pCol * w * e), f: {colloquio: 0.6, voti: 0.4}, calc: `0,45 × colloquio/testi ${q.pCol} × W(media ${q.mediaPen} su 7,5→9,2)=${r_(w)} × C1 ${e}`}; }},
  'scpo-pem': {dati: '~40 posti, colloquio congiunto Sciences Po–ESCP in inglese',
    fn: q => { const w = W_(q.mediaPen, 7.5, 9.2), e = (q.en && q.en.ces >= 180) ? 1 : 0.75;
      return {p: cl_(0.45 * q.pCol * w * e * 0.4), f: {colloquio: 0.6, voti: 0.4}, calc: `regola Sciences Po × 0,4 (40 posti)`}; }},
  'escp': {dati: 'Rolling: dossier (voti ultimi 3 anni, statement, CV) + colloquio; nessun test',
    fn: q => { const w = W_(q.mediaPen, 6, 9); return {p: cl_(0.15 + 0.35 * q.pCol + 0.3 * w), f: {colloquio: 0.6, voti: 0.4},
      calc: `0,15 + 0,35 × colloquio ${q.pCol} + 0,3 × W(media ${q.mediaPen})=${r_(w)}`}; }},
  // ---------- Spagna ----------
  'ie-bba': {dati: 'Test IE (una volta) o SAT ≥1300, Kira, colloquio, voti; maturità ≥75 e media ≥7 richieste',
    fn: q => { const t = q.sat ? Math.max(q.pLog, q.pSat) : q.pLog, w = W_(q.mediaPen, 6.5, 9), req = q.matur >= 75 ? 1 : 0.3;
      return {p: cl_((0.15 + 0.3 * t + 0.25 * q.pCol + 0.25 * w) * req), f: {logica: 0.4, colloquio: 0.3, voti: 0.3},
        calc: `(0,15 + 0,3 × test ${r_(t)} + 0,25 × colloquio ${q.pCol} + 0,25 × W(media)=${r_(w)})${req < 1 ? ' × 0,3 (maturità stimata sotto 75)' : ''}`}; }},
  'esade': {dati: '5 elementi a pari peso (domanda, voti, test ESADE o SAT, inglese, colloquio); attesi media ≥8 e maturità ≥80',
    fn: q => { const t = q.sat ? Math.max(q.pLog, q.pSat) : q.pLog, w = W_(q.mediaPen, 7, 9), req = q.mediaPen >= 8 && q.matur >= 80 ? 1 : 0.6;
      return {p: cl_((0.2 + 0.2 * t + 0.2 * w + 0.2 * q.pCol) * req), f: {logica: 0.4, voti: 0.3, colloquio: 0.3},
        calc: `(0,2 + 0,2 × test ${r_(t)} + 0,2 × W(media)=${r_(w)} + 0,2 × colloquio ${q.pCol})${req < 1 ? ' × 0,6 (sotto media 8 / maturità 80 attese)' : ''}`}; }},
  'uc3m': {dati: 'Early Admission: 8% dei posti, voti degli ultimi due anni + lettera; criteri di soglia non pubblicati',
    fn: q => { const w = W_(q.mediaPen, 7, 9.5); return {p: cl_((0.1 + 0.5 * w) * (0.8 + 0.2 * q.pCol)), f: {voti: 0.8, colloquio: 0.2},
      calc: `(0,1 + 0,5 × W(media ${q.mediaPen} su 7→9,5)=${r_(w)}) × (0,8 + 0,2 × lettera ${q.pCol})`}; }},
  // ---------- Austria, Danimarca, Irlanda ----------
  'wu-bbe': {dati: '240 posti; esame scritto in presenza (inglese B2, matematica, economia da Fuhrmann cap. 1-6); 2026: 2.872 presenti (~8,4%); nessuna data alternativa',
    fn: q => ({p: cl_(0.38 * q.pLog * 0.85), f: {logica: 1}, calc: `0,38 (esame allenabile, ~8% dei presenti ma molti impreparati) × resa test ${q.pLog} × 0,85 (rischio sovrapposizione con la maturità)`})},
  'cbs': {dati: 'Quota 1 sulla maturità convertita (tabella ufficiale): BASM 9,4 ≈ 96, BADM 9,8 ≈ 98, IB/IBP = 100; diploma entro il 5/7',
    fn: q => { const pm = pMatur(q.matur, 96); return {p: cl_(pm * 0.7), f: {maturita: 1},
      calc: `P(maturità ≥ 96 | stima ${q.matur} ± ${SIGMA_MATUR})=${r_(pm)} × 0,7 (rischio diploma dopo il 5/7)`}; }},
  'aarhus': {dati: 'Soglia Quota 1 2026: 9,2 ≈ maturità 95 (in salita: 88 → 92 → 95); diploma entro il 5/7',
    fn: q => { const pm = pMatur(q.matur, 95); return {p: cl_(pm * 0.75), f: {maturita: 1}, calc: `P(maturità ≥ 95)=${r_(pm)} × 0,75 (5/7)`}; }},
  'ucd': {dati: 'CAO: 100L 600, 100 553, 95 527, 90 501 + 25 se mate ≥7 (bonus 2026, incerto per il 2027); Economics 544 ≈ 95 + bonus o 100; mate ≥8',
    fn: q => { if (q.mate < 8) return {p: 0, gate: 'matematica ≥8 all\'ultimo anno richiesta', f: {}, calc: ''};
      const a = pMatur(q.matur, 94), b = pMatur(q.matur, 99); return {p: cl_(0.5 * a + 0.5 * b), f: {maturita: 1},
        calc: `0,5 × P(maturità ≥ 94, con bonus)=${r_(a)} + 0,5 × P(≥ 99, senza bonus)=${r_(b)}`}; }},
  'tcd': {dati: 'CAO: BESS 567 ≈ 100 + bonus o 100 e lode; PPES 591 solo 100 e lode; mate ≥8',
    fn: q => { if (q.mate < 8) return {p: 0, gate: 'matematica ≥8 all\'ultimo anno richiesta', f: {}, calc: ''};
      const a = pMatur(q.matur, 99.5); return {p: cl_(0.6 * a), f: {maturita: 1}, calc: `0,6 × P(maturità 100)=${r_(a)}`}; }}
};

if (typeof module !== 'undefined') module.exports = {RULES, controlloInglese, pMatur, Phi};
