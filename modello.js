// modello.js — motore di calcolo del piano di candidatura (nessuna dipendenza).
// Caricato da index.html con <script src="modello.js"> dopo dati.js; funziona anche aprendo il file in locale.
//
// Idee chiave
// 1. Probabilità marginali: ogni corso ha una regola RULES[id].fn(q) → {p, calc, f}; p deriva solo dal profilo
//    effettivo q (profilo + preparazioni pianificate). Non si imposta a mano.
// 2. Correlazione: gli esiti dei corsi che usano la stessa "leva" (test logico-matematici, test Bocconi, colloqui,
//    maturità, voti) sono correlati. Si usa una copula gaussiana a fattori: Z_i = Σ_f a_if·F_f + √(1−Σa²)·ε_i,
//    ammesso se Z_i < Φ⁻¹(p_i). Le probabilità marginali restano esattamente quelle delle regole.
// 3. Scala: l'ordine è dato dall'utilità (voto del ragazzo, città, costo). Si finisce nel primo corso della scala
//    in cui si è ammessi. Simulazione Monte Carlo con numeri casuali comuni per confronti stabili.
// 4. Portafoglio: si scelgono le domande da presentare (greedy + scambi) massimizzando
//    utilità attesa − valore del tempo × ore, nel rispetto dei vincoli di sistema (GRUPPI).
// 5. Preparazioni: valore = differenza di utilità attesa (con portafoglio riottimizzato) con e senza.
'use strict';

// profilo in uso: la pagina può sostituire profiloDi per applicare le modifiche dell'utente
var profiloDi=kid=>PROFILI[kid];

// ---------- numeri casuali riproducibili ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(rnd){let u=0,v=0;while(u===0)u=rnd();while(v===0)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
// inversa della normale standard (Acklam)
function invPhi(p){
  if(p<=0)return -Infinity; if(p>=1)return Infinity;
  const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.3577518672690,-30.66479806614716,2.506628277459239],
        b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],
        c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],
        d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
  const pl=0.02425; let q,r;
  if(p<pl){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
  if(p>1-pl){q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
  q=p-0.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

// ---------- utilità ----------
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const r2=x=>Math.round(x*100)/100;
const W=(m,lo,hi)=>clamp((m-lo)/(hi-lo));

// ---------- profilo effettivo ----------
// prof: profilo base del ragazzo (dati.js PROFILI) con eventuali modifiche dell'utente.
// prep: insieme degli id di PREPARAZIONI pianificate. Ogni preparazione ha .effetto(q, prof) che modifica q.
function profiloEffettivo(prof,prep){
  const q=Object.assign({},prof);
  // le rese hanno forma [senza preparazione mirata, con preparazione mirata]: di default si usa la prima
  for(const k of Object.keys(q)) if(Array.isArray(q[k])&&q[k].length===2&&typeof q[k][0]==='number') q[k]=q[k][0];
  q.cert=Object.assign({},prof.cert||{});
  q.prep=new Set(prep||[]);
  for(const id of q.prep){const a=PREPARAZIONI[id]; if(a&&a.effetto) a.effetto(q,prof);}
  return q;
}

// ---------- probabilità marginali ----------
// Ritorna {p, calc, f, gate} per ogni corso. gate = motivo di esclusione tecnica (requisito non soddisfatto).
function probabilita(q,id){
  const R=RULES[id], P=PROGRAMMI[id]; if(!R) return {p:0,calc:'regola non definita',f:{},gate:'regola mancante',flag:null,dati:''};
  const o=R.fn(q); const en=controlloInglese(P.en,q);
  const gate=o.gate||en.gate||null;
  const pRule=gate?0:clamp(o.p);
  // rischio comune: riconoscimento all'estero del diploma (liceo quadriennale), un solo evento per tutti gli atenei esteri
  const dip=(P.paese!=='IT'&&q.pDiploma!=null&&q.pDiploma<1)?q.pDiploma:1;
  const calc=o.calc+(dip<1?` × riconoscimento del diploma ${dip}`:'');
  return {p:pRule*dip,pRule,estero:dip<1,calc,f:o.f||{},gate,flag:en.flag,dati:R.dati};
}

// ---------- simulazione ----------
// FATTORI e RHO in dati.js: es. {logica:0.6, bocconi:0.85, colloquio:0.5, maturita:0.7, voti:0.3}
function preparaSimulazione(kid,q,ids,N,seed){
  const rnd=mulberry32(seed||12345);
  const fattori=Object.keys(RHO);
  const nF=fattori.length,nP=ids.length;
  const info=ids.map(id=>probabilita(q,id));
  // carichi: a_if = w_if·√ρ_f, con Σ w_if = 1 (normalizzati) → varianza comune ≤ max ρ
  const load=info.map(o=>{const w=o.f,s=Object.values(w).reduce((x,y)=>x+y,0)||1;
    const a=fattori.map(f=>(w[f]||0)/s*Math.sqrt(RHO[f]));const comm=a.reduce((x,y)=>x+y*y,0);return {a,res:Math.sqrt(Math.max(0,1-comm))}});
  const thr=info.map(o=>invPhi(o.pRule));
  const pDip=q.pDiploma!=null?q.pDiploma:1;
  // matrice di ammissione N × nP (Uint8Array)
  const adm=new Uint8Array(N*nP);
  const F=new Float64Array(nF);
  for(let n=0;n<N;n++){
    for(let f=0;f<nF;f++)F[f]=gauss(rnd);
    const dipOk=rnd()<pDip;
    for(let i=0;i<nP;i++){const L=load[i];let z=L.res*gauss(rnd);for(let f=0;f<nF;f++)z+=L.a[f]*F[f];adm[n*nP+i]=(z<thr[i]&&(dipOk||!info[i].estero))?1:0;}
  }
  const idx=Object.fromEntries(ids.map((id,i)=>[id,i]));
  return {kid,q,ids,idx,info,adm,N,nP};
}

// utilità di un corso per un ragazzo
function utilita(kid,id,pref,param){
  const v=pref.voti[id]||0; if(!v) return null;
  const P=PROGRAMMI[id]; const c=pref.citta[P.citta];
  if(c==='no') return null;
  const base=param.U[v];
  const costo=costoPercorso(id,kid,param).tot;
  return base-param.lambda*costo/10000;
}

// valuta una scala (array di id ordinati per preferenza) sulla simulazione
function valutaScala(sim,scala,u,kid,param,voti,costi){
  const {adm,N,nP,idx}=sim; const cols=scala.map(id=>idx[id]);
  const fin=new Float64Array(scala.length); let nessuno=0;
  for(let n=0;n<N;n++){let hit=-1;const base=n*nP;
    for(let k=0;k<cols.length;k++){if(adm[base+cols[k]]){hit=k;break;}}
    if(hit<0)nessuno++;else fin[hit]++;}
  const pf=Array.from(fin,x=>x/N);
  let EU=0,costo=0,pTop=0,pGood=0;
  scala.forEach((id,k)=>{EU+=pf[k]*u[id];costo+=pf[k]*(costi?costi[id]:costoPercorso(id,kid,param).tot);
    const v=(voti&&voti[id])||0; if(v>=3)pTop+=pf[k]; if(v>=2)pGood+=pf[k];});
  return {pf,pNessuno:nessuno/N,EU,costo,pTop,pGood};
}

// ore di lavoro e quote di candidatura di un insieme di domande: le parti comuni (DOMANDE) si contano una volta sola
function costoDomande(scala){
  const chiavi=new Set();let ore=0,fee=0;
  for(const id of scala){const P=PROGRAMMI[id];ore+=P.ore||0;fee+=P.fee||0;
    if(P.domanda&&!chiavi.has(P.domanda)){chiavi.add(P.domanda);const D=DOMANDE[P.domanda]||{};ore+=D.ore||0;fee+=D.fee||0;}}
  return {ore,fee,domande:chiavi.size};
}
function oreDomande(scala){return costoDomande(scala).ore}

// rispetto dei vincoli di sistema
function rispettaGruppi(scala,param){
  const cnt={};
  for(const id of scala){for(const g of (PROGRAMMI[id].gruppi||[])){cnt[g]=(cnt[g]||0)+1; if(GRUPPI[g]&&cnt[g]>GRUPPI[g].max) return false;}}
  return scala.length<=param.maxDomande+1; // +1: il ripiego non conta
}

// ottimizzazione del portafoglio di domande per un ragazzo
function ottimizza(kid,pref,param,prep,opts){
  opts=opts||{};
  const prof=profiloDi(kid);
  const q=profiloEffettivo(prof,prep);
  const ids=Object.keys(PROGRAMMI).filter(id=>PROGRAMMI[id].cicli.includes(prof.ciclo));
  const sim=preparaSimulazione(kid,q,ids,opts.N||param.N,param.seed+kid.charCodeAt(0));
  const u={},esclusi={},costi={};
  for(const id of ids)costi[id]=costoPercorso(id,kid,param).tot;
  for(const id of ids){
    const x=utilita(kid,id,pref,param);
    const pr=sim.info[sim.idx[id]];
    if(x==null){esclusi[id]=(pref.voti[id]||0)?'città esclusa':'non di interesse (voto 0)';continue;}
    if(pr.gate){esclusi[id]='requisito: '+pr.gate;continue;}
    if(pr.p<=0){esclusi[id]='probabilità nulla';continue;}
    u[id]=x;
  }
  const ord=s=>[...s].sort((a,b)=>u[b]-u[a]||sim.info[sim.idx[b]].p-sim.info[sim.idx[a]].p);
  const ripiego=pref.ripiego&&u[pref.ripiego]!=null?pref.ripiego:null;
  let S=ripiego?[ripiego]:[];
  const obj=s=>{const sc=ord(s);const v=valutaScala(sim,sc,u,kid,param,pref.voti,costi);return v.EU-param.mu*oreDomande(sc.filter(x=>x!==ripiego))};
  let best=obj(S);
  const cand=Object.keys(u).filter(id=>id!==ripiego);
  // forzature dell'utente: 'si' = sempre incluso, 'no' = mai
  const forz=pref.forza||{};
  for(const id of cand) if(forz[id]==='si'&&rispettaGruppi(ord([...S,id]),param)) S.push(id);
  best=obj(S);
  for(let it=0;it<40;it++){
    let mv=null,mvVal=best;
    for(const id of cand){if(S.includes(id)||forz[id]==='no')continue;
      const T=[...S,id]; if(!rispettaGruppi(T,param))continue; const v=obj(T); if(v>mvVal+1e-9){mvVal=v;mv={add:id};}}
    // scambi: togli uno (non forzato, non ripiego) e aggiungi un altro
    for(const out of S){if(out===ripiego||forz[out]==='si')continue;
      for(const id of cand){if(S.includes(id)||forz[id]==='no')continue;
        const T=[...S.filter(x=>x!==out),id]; if(!rispettaGruppi(T,param))continue; const v=obj(T); if(v>mvVal+1e-9){mvVal=v;mv={add:id,out};}}}
    // rimozioni che migliorano (domanda che costa più tempo di quanto rende)
    for(const out of S){if(out===ripiego||forz[out]==='si')continue;const T=S.filter(x=>x!==out);const v=obj(T);if(v>mvVal+1e-9){mvVal=v;mv={out};}}
    if(!mv)break;
    if(mv.out)S=S.filter(x=>x!==mv.out); if(mv.add)S.push(mv.add); best=mvVal;
  }
  const scala=ord(S);
  const val=valutaScala(sim,scala,u,kid,param,pref.voti,costi);
  // valore marginale di ogni domanda inclusa (cosa si perde togliendola) e di ogni esclusa (cosa si guadagnerebbe)
  const marg={};
  for(const id of Object.keys(u)){
    if(S.includes(id)){if(id===ripiego){marg[id]=null;continue;}const T=ord(S.filter(x=>x!==id));marg[id]=val.EU-valutaScala(sim,T,u,kid,param,pref.voti,costi).EU;}
    else {const T=ord([...S,id]);marg[id]=rispettaGruppi(T,param)?valutaScala(sim,T,u,kid,param,pref.voti,costi).EU-val.EU:null;}
  }
  const cd=costoDomande(scala);
  return {kid,q,sim,u,esclusi,scala,val,marg,ore:oreDomande(scala.filter(x=>x!==ripiego)),fee:cd.fee,nDomande:cd.domande,ripiego,obj:best};
}

// valore delle preparazioni: per ciascuna, differenza con e senza (portafoglio riottimizzato)
function valorePreparazioni(kid,pref,param,prep,opts){
  const base=ottimizza(kid,pref,param,prep,opts);
  const out=[];
  for(const id of Object.keys(PREPARAZIONI)){
    const A=PREPARAZIONI[id]; 
    if(A.solo&&!A.solo.includes(kid))continue;
    if(A.salta&&A.salta(profiloDi(kid)))continue;
    const has=prep.includes(id);
    const alt=ottimizza(kid,pref,param,has?prep.filter(x=>x!==id):[...prep,id],opts);
    const con=has?base:alt,senza=has?alt:base;
    const dEU=con.val.EU-senza.val.EU, dTop=con.val.pTop-senza.val.pTop, dGood=con.val.pGood-senza.val.pGood;
    const oreA=A.ore||0; const netto=dEU-param.mu*oreA-(con.ore-senza.ore)*param.mu;
    out.push({id,pianificata:has,dEU,dTop,dGood,ore:oreA,euro:A.euro||0,netto,perOra:oreA?dEU/oreA:null,
      corsi:con.scala.filter(x=>RULES[x]&&usaPreparazione(x,id)),scalaCon:con.scala,scalaSenza:senza.scala});
  }
  return {base,prep:out.sort((a,b)=>b.netto-a.netto)};
}
function usaPreparazione(idCorso,idPrep){const A=PREPARAZIONI[idPrep];return !!(A.corsi&&A.corsi.includes(idCorso))}

// ---------- costi ----------
function costoAnno(id,anno,inizio,anni,param){
  const P=PROGRAMMI[id]; if(!P||anno<inizio)return 0;
  const k=anno-inizio+1, frac=clamp(anni-k+1); if(frac<=0)return 0;
  const g=P.crescita==null?param.gRette:P.crescita;
  const retta=P.retta*Math.pow(1+g,anno-P.annoRetta);
  const mant=(param.citta[P.citta]!=null?param.citta[P.citta]:CITTA[P.citta].mant)*Math.pow(1+param.gMant,anno-param.annoMant);
  return frac*(retta+mant+(k===1?(P.unaTantum||0):0));
}
function costoPercorso(id,kid,param){
  const inizio=PROFILI[kid].ciclo, P=PROGRAMMI[id];
  const anni=P.anni+(P.annoExtra?P.annoExtra(param):0);
  const ser=ANNI.map(y=>costoAnno(id,y,inizio,anni,param));
  return {ser,tot:ser.reduce((a,b)=>a+b,0),anni};
}

if(typeof module!=='undefined')module.exports={costoDomande,mulberry32,gauss,invPhi,profiloEffettivo,probabilita,preparaSimulazione,valutaScala,ottimizza,valorePreparazioni,costoAnno,costoPercorso,W,clamp,r2};
