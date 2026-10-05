// Test rapido, senza dipendenze: node tests/verifica.js
// Carica dati.js, regole.js e modello.js come fa la pagina, controlla la sintassi degli script di index.html
// e verifica gli invarianti del catalogo e del modello. Esce con codice 1 se trova errori.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..');
let errori = 0;
const ko = msg => { errori++; console.log('ERRORE  ' + msg); };

// 1. sintassi degli script inline di index.html e report.html
for (const pagina of ['index.html', 'report.html']) {
  const f = path.join(dir, pagina);
  if (!fs.existsSync(f)) { if (pagina === 'index.html') ko('index.html mancante'); continue; }
  const html = fs.readFileSync(f, 'utf8');
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
    try { new vm.Script(m[1], {filename: `${pagina}#script${i}`}); } catch (e) { ko(`${pagina}, script ${i}: ${e.message}`); }
  });
}
for (const s of ['dati.js', 'regole.js', 'modello.js'])
  if (!fs.readFileSync(path.join(dir, 'index.html'), 'utf8').includes(`<script src="${s}">`)) ko(`index.html non carica ${s}`);

// 2. caricamento del modello (stesso ordine della pagina)
const ctx = {console, Math, JSON, Object, Array, Set, Map, Number, String, Date, Float64Array, Uint8Array, Infinity, isNaN};
vm.createContext(ctx);
for (const f of ['dati.js', 'regole.js', 'modello.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, {filename: f}); }
  catch (e) { console.log(`ERRORE  ${f}: ${e.message}`); process.exit(1); }
}
const M = vm.runInContext('({RAGAZZI,PROGRAMMI,CITTA,DOMANDE,GRUPPI,RULES,PROFILI,PREPARAZIONI,PREP_D,PREF_D,PARAM_D,EVENTI,CASC_V4,ANNI,ottimizza,valorePreparazioni,costoPercorso,probabilita,profiloEffettivo})', ctx);

// 3. invarianti del catalogo
for (const [id, P] of Object.entries(M.PROGRAMMI)) {
  if (!M.RULES[id]) ko(`${id}: manca la regola in RULES`);
  if (!M.CITTA[P.citta]) ko(`${id}: città inesistente "${P.citta}"`);
  if (P.domanda && !M.DOMANDE[P.domanda]) ko(`${id}: domanda "${P.domanda}" non definita in DOMANDE`);
  if (!P.en || !P.en.testo) ko(`${id}: requisito d'inglese mancante`);
  for (const g of P.gruppi || []) if (!M.GRUPPI[g]) ko(`${id}: gruppo "${g}" inesistente`);
  if (!(P.retta >= 0) || !(P.anni > 0)) ko(`${id}: retta o durata non valide`);
}
for (const id of Object.keys(M.RULES)) if (!M.PROGRAMMI[id]) ko(`regola "${id}" senza corso`);
for (const k of Object.keys(M.PREF_D)) {
  for (const id of Object.keys(M.PREF_D[k].voti)) if (!M.PROGRAMMI[id]) ko(`PREF_D.${k}: corso "${id}" inesistente`);
  if (!M.PROGRAMMI[M.PREF_D[k].ripiego]) ko(`PREF_D.${k}: ripiego inesistente`);
  for (const id of M.CASC_V4[k]) if (!M.PROGRAMMI[id]) ko(`CASC_V4.${k}: "${id}" inesistente`);
  for (const a of M.PREP_D[k]) if (!M.PREPARAZIONI[a]) ko(`PREP_D.${k}: preparazione "${a}" inesistente`);
}
for (const a of Object.values(M.PREPARAZIONI)) for (const id of a.corsi) if (!M.PROGRAMMI[id]) ko(`preparazione "${a.nome}": corso "${id}" inesistente`);
for (const e of M.EVENTI) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d) || (e.a && !/^\d{4}-\d{2}-\d{2}$/.test(e.a))) ko(`evento "${e.cosa}": data non valida`);
  for (const id of e.corsi || []) if (!M.PROGRAMMI[id]) ko(`evento "${e.cosa}": corso "${id}" inesistente`);
  if (e.prep && !M.PREPARAZIONI[e.prep]) ko(`evento "${e.cosa}": preparazione "${e.prep}" inesistente`);
}

// 4. modello: probabilità, vincoli, somma delle probabilità
const pct = p => (p * 100).toFixed(0).padStart(3) + '%';
const fmt = n => Math.round(n).toLocaleString('it-IT');
let fam = 0;
for (const k of M.RAGAZZI) {
  const r = M.ottimizza(k.id, M.PREF_D[k.id], Object.assign({}, M.PARAM_D), M.PREP_D[k.id]);
  for (const o of r.sim.info) if (!(o.p >= 0 && o.p <= 1)) ko(`${k.nome}: probabilità fuori da [0,1]`);
  const somma = r.val.pf.reduce((a, b) => a + b, 0) + r.val.pNessuno;
  if (Math.abs(somma - 1) > 1e-9) ko(`${k.nome}: somma delle probabilità = ${somma}`);
  const cnt = {};
  for (const id of r.scala) for (const g of M.PROGRAMMI[id].gruppi || []) cnt[g] = (cnt[g] || 0) + 1;
  for (const g in cnt) if (cnt[g] > M.GRUPPI[g].max) ko(`${k.nome}: vincolo "${g}" violato (${cnt[g]})`);
  fam += r.val.costo;
  console.log(`\n${k.nome}: preferito ${pct(r.val.pTop)}, gradito ${pct(r.val.pGood)}, nessuna ammissione ${(r.val.pNessuno * 100).toFixed(1)}%, costo atteso € ${fmt(r.val.costo)}, ${r.scala.length} domande, ${Math.round(r.ore)} ore`);
  r.scala.forEach((id, i) => console.log(`  ${String(i + 1).padStart(2)}. ${pct(r.sim.info[r.sim.idx[id]].p)} amm. ${(r.val.pf[i] * 100).toFixed(1).padStart(5)}% qui  ${id}`));
}
console.log(`\nFamiglia: costo atteso € ${fmt(fam)}`);
console.log(errori ? `\n${errori} errori` : '\nOK');
process.exit(errori ? 1 : 0);
