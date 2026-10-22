#!/usr/bin/env python3
"""Applica il tema Carta e l'interruttore chiaro/scuro a guida.html (idempotente).

La guida è generata dai sorgenti nel Project claude.ai (claude/guida-sorgenti/). Dopo averla ricopiata qui
si lancia `python3 strumenti/applica_tema.py` e il tema torna uguale a quello di home e mappa.
Il tema scelto si ricorda nel browser (localStorage "tema": light, dark o assente = automatico) per tutte le pagine.
"""
import os, re

QUI = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(QUI, "..", "guida.html")
INIZIO, FINE = "<!-- tema:inizio -->", "<!-- tema:fine -->"

TESTA = '''<!-- tema:inizio -->
<script>try{var t=localStorage.getItem("tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap">
<style>
:root{
  --paper:#F2F4F1; --card:#FFFFFF; --ink:#152230; --soft:#4F5D6B; --faint:#7F8B97; --rule:#DCE1E3; --tint:#EEF2F2;
  --sans:"Schibsted Grotesk","Segoe UI",system-ui,-apple-system,Roboto,sans-serif; --serif:var(--sans);
  --sub:#FAFBFA; --bg-a:#E7F2EC; --bg-m:#F7F0E1; --bg-b:#F7E6E3; --bg-n:#F0F1F3; --bg-mis:#ECEAF6; --bg-esa:#E6EEF8;
  --ink-m:#8A5E0B; --ink-warn:#6E2219; --onfill:#FFFFFF; --thead:#F5F7F4; --uniopen:#B9C0CC;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --paper:#0F1A22; --card:#16222B; --ink:#E7EDF0; --soft:#A9B6BF; --faint:#7D8B95; --rule:#2A3841; --tint:#1A2731;
  --req:#4FB08A; --esa:#7FB0E6; --mis:#A68BDB; --vot:#D9973F; --oli:#DA7398; --a:#4DB583; --m:#DDA742; --b:#E2685A; --n:#5E6B75;
  --sub:#131F27; --bg-a:#16342A; --bg-m:#33290F; --bg-b:#3A1E1A; --bg-n:#1E2A33; --bg-mis:#2A2340; --bg-esa:#1B2B44;
  --ink-m:#E8C27C; --ink-warn:#F0A79C; --onfill:#0F1A22; --thead:#16222B; --uniopen:#3B4D57; color-scheme:dark;
}}
:root[data-theme="dark"]{
  --paper:#0F1A22; --card:#16222B; --ink:#E7EDF0; --soft:#A9B6BF; --faint:#7D8B95; --rule:#2A3841; --tint:#1A2731;
  --req:#4FB08A; --esa:#7FB0E6; --mis:#A68BDB; --vot:#D9973F; --oli:#DA7398; --a:#4DB583; --m:#DDA742; --b:#E2685A; --n:#5E6B75;
  --sub:#131F27; --bg-a:#16342A; --bg-m:#33290F; --bg-b:#3A1E1A; --bg-n:#1E2A33; --bg-mis:#2A2340; --bg-esa:#1B2B44;
  --ink-m:#E8C27C; --ink-warn:#F0A79C; --onfill:#0F1A22; --thead:#16222B; --uniopen:#3B4D57; color-scheme:dark;
}
.filters input:checked + label{color:var(--card)}
.uni[open]{border-color:var(--uniopen)}
.md,.kd{color:var(--onfill)}
.f.lv-a{background:var(--bg-a)} .f.lv-m{background:var(--bg-m)} .f.lv-b{background:var(--bg-b)} .f.lv-n{background:var(--bg-n)}
.f.lv-m b{color:var(--ink-m)}
.corso,.calb,.rep li,.test{background:var(--sub)}
.kv .warn dd{color:var(--ink-warn)}
.st-o{background:var(--bg-a)} .st-s{background:var(--bg-m);color:var(--ink-m)}
.ru-ambiziosa{background:var(--bg-b)} .ru-realistica,.ru-possibile{background:var(--bg-m);color:var(--ink-m)} .ru-sicura{background:var(--bg-a)}
.ru-biglietto{background:var(--bg-mis)} .ru-rete{background:var(--bg-esa)}
table.t thead th{background:var(--thead)}
.temabtn{font:inherit;font-size:13.5px;color:var(--ink);background:var(--card);border:1px solid var(--rule);border-radius:999px;padding:5px 12px;cursor:pointer}
.temabtn:hover{border-color:var(--ink)}
</style>
<!-- tema:fine -->'''

BOTTONE = '<button type="button" class="temabtn" id="temabtn">◐ Auto</button>'
SCRIPT = '''<script>(function(){var b=document.getElementById("temabtn");if(!b)return;var L={system:"Auto",light:"Chiaro",dark:"Scuro"},N={system:"light",light:"dark",dark:"system"};
function cur(){try{var t=localStorage.getItem("tema");return t==="light"||t==="dark"?t:"system"}catch(e){return "system"}}
function show(){b.textContent="◐ "+L[cur()];b.title="Tema: "+L[cur()]+" · tocca per cambiare"}
b.addEventListener("click",function(){var n=N[cur()];try{n==="system"?localStorage.removeItem("tema"):localStorage.setItem("tema",n)}catch(e){}
if(n==="system")document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme",n);show()});show()})();</script>'''

s = open(F, encoding="utf-8").read()
s = re.sub(re.escape(INIZIO) + ".*?" + re.escape(FINE) + "\n?", "", s, flags=re.S)
s = s.replace('<meta name="color-scheme" content="light">', '<meta name="color-scheme" content="light dark">')
s = s.replace("</head>", TESTA + "\n</head>", 1)
if 'id="temabtn"' not in s:
    s = s.replace('    <a href="mappa.html">Mappa</a>\n', '    <a href="mappa.html">Mappa</a>\n    ' + BOTTONE + "\n", 1)
if "temabtn\");if(!b)" not in s:
    s = s.replace("</body>", SCRIPT + "\n</body>", 1)
open(F, "w", encoding="utf-8").write(s)
print("tema applicato a guida.html")
