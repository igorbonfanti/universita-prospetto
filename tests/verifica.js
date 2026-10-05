// Test rapido di index.html, senza dipendenze: node tests/verifica.js
// Estrae lo script principale (il più lungo: in <head> c'è anche lo script del tema),
// controlla la sintassi, carica il modello con un DOM minimo e verifica gli invarianti.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const js = scripts.sort((a, b) => b.length - a.length)[0];
let errori = 0;
const ko = msg => { errori++; console.log('ERRORE  ' + msg); };

try { new vm.Script(js, { filename: 'index.html#script' }); }
catch (e) { console.log('ERRORE  sintassi: ' + e.message); process.exit(1); }

// DOM minimo: ogni elemento accetta qualsiasi proprietà e metodo
const el = () => new Proxy({}, {
  get: (t, k) => k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false }
    : k === 'dataset' ? {} : (k in t ? t[k] : (typeof k === 'string' ? () => el() : undefined)),
  set: (t, k, v) => (t[k] = v, true)
});
const ctx = {
  console, Math, JSON, Object, Array, Number, String, Date, Set, Map, Proxy, isNaN, parseFloat, setTimeout, clearTimeout,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  document: { documentElement: el(), body: el(), getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [] }
};
ctx.window = ctx;
vm.createContext(ctx);
try { vm.runInContext(js + ';globalThis.__M={cascadeCalc,CH,RULES,TUI_D,CITIES_D,YEARS};', ctx); }
catch (e) { console.log('ERRORE  caricamento: ' + e.message); process.exit(1); }
const { cascadeCalc, CH, RULES, TUI_D, CITIES_D, YEARS } = ctx.__M;

for (const k in TUI_D) {
  if (!RULES[k]) ko(`"${k}" senza regola in RULES`);
  if (!CITIES_D[TUI_D[k][6]]) ko(`"${k}" con città inesistente "${TUI_D[k][6]}"`);
}
for (const k in RULES) if (!TUI_D[k]) ko(`regola "${k}" senza voce in TUI_D`);

const fmt = n => Math.round(n).toLocaleString('it-IT');
const fam = YEARS.map(() => 0);
let tot = 0, eco = 0, caro = 0;
for (const c of CH) {
  const R = cascadeCalc(c.id);
  if (Math.abs(R.sumP - 1) > 1e-6) ko(`${c.name}: somma P(iscrizione) = ${R.sumP}`);
  R.expSer.forEach((v, i) => fam[i] += v);
  tot += R.exp; eco += R.eco.tot; caro += R.caro.tot;
  console.log(`${c.name.padEnd(10)} atteso € ${fmt(R.exp).padStart(8)}  più probabile: ${R.prob.key} (${(R.prob.pisc * 100).toFixed(1)}%)`);
}
const iPk = fam.indexOf(Math.max(...fam));
console.log(`Famiglia   atteso € ${fmt(tot).padStart(8)}  economico € ${fmt(eco)}  caro € ${fmt(caro)}`);
console.log(`Picco      ${YEARS[iPk]}/${String(YEARS[iPk] + 1).slice(2)} € ${fmt(fam[iPk])}`);
console.log(errori ? `\n${errori} errori` : '\nOK');
process.exit(errori ? 1 : 0);
