from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, Reference
from openpyxl.comments import Comment

wb = Workbook()
ARIAL = "Arial"
BLUE = Font(name=ARIAL, color="0000FF", size=10)
BLACK = Font(name=ARIAL, size=10)
GREEN = Font(name=ARIAL, color="008000", size=10)
BOLD = Font(name=ARIAL, bold=True, size=10)
H1 = Font(name=ARIAL, bold=True, size=14)
H2 = Font(name=ARIAL, bold=True, size=11)
YELLOW = PatternFill("solid", fgColor="FFFF00")
GREY = PatternFill("solid", fgColor="D9D9D9")
LIGHT = PatternFill("solid", fgColor="F2F2F2")
thin = Side(style="thin", color="999999")
BOX = Border(top=thin, bottom=thin, left=thin, right=thin)
EUR = '€ #,##0;(€ #,##0);-'
PCT = '0.0%'
WRAP = Alignment(wrap_text=True, vertical="top")

YEARS = [2027, 2028, 2029, 2030, 2031, 2032]  # a.a. 2027/28 ... 2032/33


def setw(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def style_range(ws, rng, font=None, fill=None, fmt=None, border=True, align=None):
    for row in ws[rng]:
        for c in row:
            if font: c.font = font
            if fill: c.fill = fill
            if fmt: c.number_format = fmt
            if border: c.border = BOX
            if align: c.alignment = align


# ---------------------------------------------------------------- Leggimi
ws = wb.active
ws.title = "Leggimi"
setw(ws, [110])
lines = [
    ("Prospetto esborsi Bachelor — Francesca, Marco, Iacopo (stima ponderata per probabilità)", H1),
    ("Aggiornato al 5 ottobre 2026. Valori in euro nominali (indicizzati). Solo bachelor: i master verranno trattati separatamente.", BLACK),
    ("", BLACK),
    ("COME LEGGERE IL FILE", H2),
    ("1. 'Parametri': tassi di crescita, costo del mantenimento per città e rette per ateneo. Le celle in BLU su sfondo giallo sono gli input: cambiandole si ricalcola tutto.", BLACK),
    ("2. 'Francesca', 'Marco', 'Iacopo': per ciascuno una CASCATA di opzioni in ordine di preferenza (riga 1 = dove andrebbe se ammesso ovunque). P(ammissione) è l'input; P(iscrizione) è calcolata: P(ammesso qui) × P(non ammesso in tutte le righe sopra). L'ultima riga è il ripiego a Milano (P=100%), così le probabilità di iscrizione sommano sempre a 100%.", BLACK),
    ("3. Per ogni opzione: costo annuo nominale per anno accademico (retta indicizzata + mantenimento indicizzato + una tantum 1° anno) e costo atteso = P(iscrizione) × costo totale del percorso.", BLACK),
    ("4. 'Cumulativo': esborso atteso per anno accademico dei tre ragazzi, cumulato, con tre scenari di confronto (più probabile, economico, caro).", BLACK),
    ("5. 'Fonti': link alle pagine ufficiali usate per rette e costi (ottobre 2026).", BLACK),
    ("", BLACK),
    ("IPOTESI PRINCIPALI", H2),
    ("• Famiglia in fascia contributiva massima ovunque (nessuna borsa/ISEE); sussidi come la SU danese o le borse SUSI irlandesi esclusi.", BLACK),
    ("• Mantenimento fuori sede = 12 mesi, alloggio di buona qualità (studio o camera in studentato/privato), vitto e tempo libero senza economie estreme, 4-5 rientri a Milano l'anno, polizza integrativa, libri, arredo/depositi del 1° anno. Studente che vive a casa a Milano: solo spese aggiuntive (ATM, libri, pasti fuori, telefono).", BLACK),
    ("• Rette: base 2026/27 (o 2027/28 dove già pubblicata) indicizzata al 2,5%/anno (Forward College 5%, IE 2,9% come dichiarato). Mantenimento indicizzato al 3%/anno dal 2026.", BLACK),
    ("• Francesca entra nel 2027/28 (3 anni; 4 se BSc² Rotterdam). Marco e Iacopo entrano nel 2028/29. Nessun anno fuori corso, nessun gap year, nessun cambio di ateneo in corsa.", BLACK),
    ("• Le probabilità di ammissione sono stime professionali basate su dati ufficiali (posti, candidati, soglie, tabelle di conversione) e sui profili descritti: Francesca media 8,5 / C1 / test Bocconi da ripetere; Marco media 7-7,5 / B2; Iacopo media <7 ma forte a test attitudinali e colloqui. Sono giudizi, non dati: vanno aggiornate a fine quarta (giugno 2027) per i gemelli e dopo il nuovo test Bocconi per Francesca.", BLACK),
    ("• L'ordine di preferenza è un'ipotesi di lavoro: Francesca estero > Bocconi; Marco estero ma Bocconi gradita; Iacopo atenei dove contano test e colloquio. Per cambiare l'ordine basta spostare intere righe (le formule della cascata sono relative).", BLACK),
    ("", BLACK),
    ("LIMITI", H2),
    ("• Il valore atteso è una media ponderata: nessuno pagherà esattamente quella cifra. Guardare anche gli scenari 'economico' e 'caro' per il range reale.", BLACK),
    ("• Esclusi: master, eventuale anno di studio all'estero con costi diversi (Sciences Po 3° anno, ESCP Londra), tasse di candidatura minori, auto/moto, spese sanitarie straordinarie, inflazione oltre i tassi ipotizzati.", BLACK),
]
for i, (t, f) in enumerate(lines, 1):
    c = ws.cell(row=i, column=1, value=t)
    c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")

# ---------------------------------------------------------------- Parametri
p = wb.create_sheet("Parametri")
setw(p, [34, 16, 14, 12, 16, 14, 12, 60])
p["A1"] = "PARAMETRI GENERALI"; p["A1"].font = H1
params = [
    ("Crescita annua rette (default)", 0.025, PCT, "Storico Bocconi +1,8% 2025→26; Sciences Po +2-3%/anno; NL indicizzata inflazione"),
    ("Crescita annua mantenimento", 0.03, PCT, "Affitti studenteschi +3-7%/anno nelle grandi città NL/ES/IE"),
    ("Anno base mantenimento", 2026, "0", "Le stime di costo della vita sono 2026"),
    ("Anno di ingresso Francesca", 2027, "0", "a.a. 2027/28"),
    ("Anno di ingresso Marco e Iacopo", 2028, "0", "a.a. 2028/29"),
    ("Quota BSc² (4 anni) se Rotterdam — Francesca", 0.35, PCT, "Se ammessa a Rotterdam: 35% che scelga il doppio bachelor Econometrics & Economics (4 anni) invece di IBEB (3)"),
    ("Soglia P(iscrizione) per scenari econ./caro", 0.05, PCT, "Negli scenari si considerano solo le opzioni con almeno questa probabilità di iscrizione"),
]
p["A3"] = "Parametro"; p["B3"] = "Valore"; p["C3"] = ""; p["D3"] = "Nota"
style_range(p, "A3:D3", font=BOLD, fill=GREY)
for i, (n, v, fmt, note) in enumerate(params, 4):
    p.cell(row=i, column=1, value=n).font = BLACK
    c = p.cell(row=i, column=2, value=v); c.font = BLUE; c.fill = YELLOW; c.number_format = fmt
    p.cell(row=i, column=4, value=note).font = BLACK
    for col in (1, 2, 3, 4):
        p.cell(row=i, column=col).border = BOX
G_RETTE = "Parametri!$B$4"; G_MANT = "Parametri!$B$5"; Y_BASE_M = "Parametri!$B$6"
Y_FRA = "Parametri!$B$7"; Y_BOYS = "Parametri!$B$8"; Q_BSC2 = "Parametri!$B$9"; SOGLIA = "Parametri!$B$10"

# Living cost table
r0 = 13
p.cell(row=r0 - 1, column=1, value="MANTENIMENTO ANNUO PER CITTÀ (base 2026, 12 mesi, escluse rette)").font = H2
hdr = ["Città", "€/anno base 2026", "", "", "", "", "", "Composizione / fonte"]
for j, h in enumerate(hdr, 1):
    p.cell(row=r0, column=j, value=h)
style_range(p, f"A{r0}:H{r0}", font=BOLD, fill=GREY)
living = [
    ("Milano (a casa)", 2800, "Studente che vive in famiglia: ATM under 27 ~200, libri 400-700, pasti fuori 1.000-1.400, telefono, svago extra (Federconsumatori 2025)"),
    ("Rotterdam", 26000, "Studio/camera di qualità ~1.050/mese (Kamernet/kamer.nl 2025-26: camera 700-790, studio 1.250+), vitto e svago 750/mese, libri/assic./bici 2.000, voli 900, extra 1.500 (EUR: 1.000-1.800/mese)"),
    ("Amsterdam", 30000, "Studio ~1.400/mese (kamer.nl 1.408; camera 850-990), vitto e svago 800/mese, 2.000 libri/assic./bici, voli 900, extra 1.500 (AUAS: 1.200-1.800/mese)"),
    ("Tilburg", 23000, "Studio ~850/mese (camera 535-592), vitto 700/mese, 2.000, voli 900, extra 1.500 (Tilburg: 1.000-1.200/mese)"),
    ("Maastricht", 23500, "Studio ~900/mese (camera 565-625), vitto 700/mese, 2.000, voli 900, extra 1.500"),
    ("Delft", 22500, "Camera/studio studentato ~800/mese, vitto 700, 2.000, voli 900, extra 1.500 (TU Delft: ~909/mese medio)"),
    ("Parigi", 24000, "Studio 1.000-1.100/mese (LocService 2025-26: studio 917-962), vitto/trasporti/svago 900-1.000/mese, voli 700-900 (UNEF: budget 1.627/mese)"),
    ("Reims", 16000, "Studio 500-600/mese (LocService 2026: T1 461), resto 750-850/mese — campus Sciences Po / PEM anni 1-2"),
    ("ESCP (media 3 campus)", 23000, "Media di Parigi 24.000, Londra ~29.000 (£25k), Torino/Madrid/Berlino ~16-20.000 — un anno per campus"),
    ("Forward College (Lisbona/Parigi/Berlino)", 21700, "Media dei tre anni: Lisbona ~20.000, Parigi ~24.000, Berlino ~21.000 (stime Forward: alloggio 7.150-15.600/anno + vitto)"),
    ("Madrid", 26000, "Tra scenario camera (750/mese, 24.000) e studio (1.100/mese, 28.000); Idealista Q2-Q3 2026 camera 550, studio 976; IE: camera 600-1.100, studio 800-1.600"),
    ("Barcellona", 27000, "Tra camera (800/mese, 25.000) e studio (1.150/mese, 29.000); Idealista 2026 camera 600, studio 960"),
    ("Copenhagen", 24000, "Studio/kollegium ~900/mese incl. utenze (6.500-7.000 DKK), vitto e svago 970/mese, voli 1.000, arredo/bici 500 (cauzione 3 mesi restituita). Con SU (lavoro 10-12 h/sett.) scenderebbe a ~14-15.000"),
    ("Dublino", 30000, "Alloggio 1.200/mese (mediana UCD; Daft Q1 2026 camera 874-1.007, monolocale 1.966), vitto/utenze/svago 1.275/mese, voli 1.000 (UCD stima 2.445/mese)"),
]
LIV_FIRST = r0 + 1
for i, (city, v, note) in enumerate(living, LIV_FIRST):
    p.cell(row=i, column=1, value=city).font = BLACK
    c = p.cell(row=i, column=2, value=v); c.font = BLUE; c.fill = YELLOW; c.number_format = EUR
    n = p.cell(row=i, column=8, value=note); n.font = BLACK; n.alignment = WRAP
    for col in (1, 2, 8):
        p.cell(row=i, column=col).border = BOX
LIV_LAST = LIV_FIRST + len(living) - 1
LIV_CITY = f"Parametri!$A${LIV_FIRST}:$A${LIV_LAST}"
LIV_VAL = f"Parametri!$B${LIV_FIRST}:$B${LIV_LAST}"

# Tuition table
t0 = LIV_LAST + 3
p.cell(row=t0 - 1, column=1, value="RETTE PER ATENEO/CORSO (fascia massima, studente UE)").font = H2
hdr = ["Opzione (chiave)", "Retta annua base €", "Anno base retta", "Anni", "Crescita retta", "Una tantum 1° anno €", "Città", "Note / fonte"]
for j, h in enumerate(hdr, 1):
    p.cell(row=t0, column=j, value=h)
style_range(p, f"A{t0}:H{t0}", font=BOLD, fill=GREY, align=WRAP)
# key, retta, anno base, anni, growth(None=default), una tantum, città, note
tuition = [
    ("Bocconi — CLEAM/Management/BIEM", 17000, 2026, 3, None, 0, "Milano (a casa)", "2026/27: 17.000 tutto compreso (tassa regionale e bolli inclusi), uguale per tutti i bachelor; 2025/26 era 16.700"),
    ("Cattolica Milano — Economia", 11500, 2026, 3, None, 0, "Milano (a casa)", "Fascia massima 2026/27 ricostruita dalla normativa: ~11.440-11.790 (Economia / Economics and Management). Usata come ripiego milanese"),
    ("Statale Milano — Economia/Scienze politiche", 3410, 2026, 3, None, 0, "Milano (a casa)", "ISEE >80.000: 3.204 + tassa regionale 190 + bollo 16 (2026/27). Per riferimento"),
    ("Rotterdam EUR — IBEB", 2771, 2027, 3, None, 0, "Rotterdam", "Retta statutaria NL 2027/28 già fissata: 2.771 (2026/27: 2.694). Numerus fixus 700 posti"),
    ("Rotterdam EUR — BSc² Econometrics & Economics", 2771, 2027, 4, None, 0, "Rotterdam", "4 anni (264 ECTS), retta statutaria anche il 4° anno (da confermare con ESSC)"),
    ("Rotterdam RSM — IBA", 2771, 2027, 3, None, 0, "Rotterdam", "Numerus fixus 650 posti; 75% media + 25% motivazione; study trips 300-500/anno inclusi nel mantenimento"),
    ("UvA Amsterdam — Economics & Business Economics", 2771, 2027, 3, None, 0, "Amsterdam", "Numerus fixus 550 posti, selezione solo con test online (2026: offerte fino al 1.487° su ~1.500)"),
    ("VU Amsterdam — Economics & Business Economics", 2771, 2027, 3, None, 0, "Amsterdam", "Solo requisiti (matematica livello A / OMPT-A)"),
    ("Tilburg — Economics / IBA", 2771, 2027, 3, None, 0, "Tilburg", "Solo requisiti + matching; housing garantito 1° anno"),
    ("Maastricht SBE — International Business", 2771, 2027, 3, None, 0, "Maastricht", "Numerus fixus con selezione: essay 1/3, CV 1/3, voti penultimo anno 1/3"),
    ("Maastricht SBE — Economics & Business Economics", 2771, 2027, 3, None, 0, "Maastricht", "Solo requisiti + matching"),
    ("TU Delft — Computer Science & Engineering", 2771, 2027, 3, None, 1350, "Delft", "Per riferimento (Iacopo): numerus fixus con test mate/fisica; laptop obbligatorio ~1.350"),
    ("Sciences Po — Bachelor Collège universitaire", 14900, 2026, 3, None, 0, "Parigi", "Fascia massima 2026/27 (reddito >95.000 €/parte); 3° anno all'estero si paga la retta Sciences Po. Campus Reims costerebbe ~8.000/anno in meno di mantenimento"),
    ("ESCP — Bachelor in Management", 20800, 2027, 3, None, 80, "ESCP (media 3 campus)", "Intake 2027: 17.900 + 2.900 fees = 20.800, uguale per tutti i campus; application fee 80"),
    ("Forward College — Business & Management", 21850, 2027, 3, 0.05, 70, "Forward College (Lisbona/Parigi/Berlino)", "2027/28 UE: 21.850, +5%/anno dichiarato; early bird -10% sul 1° anno entro 31/12/2026 non considerato; UoL enrolment ~70"),
    ("IE University Madrid — BBA", 29000, 2026, 4, 0.029, 6350, "Madrid", "2026/27: 29.000 (Economics 26.500), +2,9%/anno fisso; una tantum: admission 150 + reservation 5.000 + IE Foundation 1.200"),
    ("ESADE Barcellona — BBA / GGELO", 21300, 2027, 4, None, 0, "Barcellona", "Prezzo 2027/28 già pubblicato: 21.300; aumenti ≤ inflazione; scambi e lingue inclusi"),
    ("UC3M Madrid — Economics/ADE (inglese)", 1045, 2026, 4, None, 250, "Madrid", "Pubblica: 16,92 €/credito × 60 + tasse fisse; una tantum = accreditamento UNEDasiss + PCE"),
    ("UPF Barcellona — Economia / IBE", 1202, 2026, 4, None, 250, "Barcellona", "Pubblica catalana: 17,69 €/credito × 60 + tasse fisse"),
    ("CBS Copenhagen — BSc (IB / BADM / BASM)", 0, 2026, 3, None, 500, "Copenhagen", "Studenti UE: nessuna retta né application fee; una tantum arredo/bici"),
    ("UCD Dublino — Commerce / Economics", 2754, 2026, 3, None, 0, "Dublino", "Free Fees Initiative + Student Contribution 2.500 + levy 254 (2026/27); BComm 3 anni (4 con internship)"),
    ("Trinity Dublino — BESS / PPES", 2713, 2026, 4, None, 0, "Dublino", "Student Contribution 2.500 + levies 212,75; 4 anni; richiede ~100 e lode (565 punti)"),
]
TU_FIRST = t0 + 1
for i, (k, retta, yb, anni, g, once, city, note) in enumerate(tuition, TU_FIRST):
    p.cell(row=i, column=1, value=k).font = BLACK
    c = p.cell(row=i, column=2, value=retta); c.font = BLUE; c.fill = YELLOW; c.number_format = EUR
    c = p.cell(row=i, column=3, value=yb); c.font = BLUE; c.number_format = "0"
    c = p.cell(row=i, column=4, value=anni); c.font = BLUE; c.number_format = "0"
    if g is None:
        c = p.cell(row=i, column=5, value=f"={G_RETTE}"); c.font = BLACK
    else:
        c = p.cell(row=i, column=5, value=g); c.font = BLUE; c.fill = YELLOW
    c.number_format = PCT
    c = p.cell(row=i, column=6, value=once); c.font = BLUE; c.number_format = EUR
    p.cell(row=i, column=7, value=city).font = BLUE
    n = p.cell(row=i, column=8, value=note); n.font = BLACK; n.alignment = WRAP
    for col in range(1, 9):
        p.cell(row=i, column=col).border = BOX
TU_LAST = TU_FIRST + len(tuition) - 1
TU_KEY = f"Parametri!$A${TU_FIRST}:$A${TU_LAST}"
def tu_col(letter):
    return f"Parametri!${letter}${TU_FIRST}:${letter}${TU_LAST}"
p.cell(row=TU_LAST + 2, column=1, value="Legenda: blu su giallo = input modificabile; blu = input; nero = formula; verde = collegamento ad altro foglio.").font = BLACK

# ---------------------------------------------------------------- child sheets
def child_sheet(name, start_ref, profile, cascade, bsc2_row=None):
    ws = wb.create_sheet(name)
    setw(ws, [5, 44, 16, 7, 11, 11, 12, 9, 12, 11, 12, 13, 13] + [12] * 12 + [50])
    ws["A1"] = f"{name.upper()} — cascata di opzioni, probabilità e costi (ingresso a.a. {{}})"; ws["A1"].font = H1
    ws["A1"] = f"{name.upper()} — cascata di opzioni, probabilità e costi"
    ws["A2"] = profile; ws["A2"].font = BLACK; ws["A2"].alignment = Alignment(wrap_text=False)
    ws["A3"] = "Anno di ingresso (a.a. che inizia a settembre):"; ws["A3"].font = BLACK
    ws["F3"] = f"={start_ref}"; ws["F3"].font = GREEN; ws["F3"].number_format = "0"
    ws["G3"] = "← da Parametri"; ws["G3"].font = BLACK
    H = 5
    headers = ["#", "Opzione (chiave in Parametri)", "Città", "Anni", "P(ammiss.)", "P(iscriz.)",
               "Retta base €", "Anno base", "Mantenim. base €", "Una tantum €",
               "Costo 1° anno €", "Costo totale percorso €", "Costo atteso €"]
    yh_cost = [f"Costo {y}/{str(y+1)[2:]}" for y in YEARS]
    yh_exp = [f"Atteso {y}/{str(y+1)[2:]}" for y in YEARS]
    headers += yh_cost + yh_exp + ["Motivazione della probabilità"]
    for j, h in enumerate(headers, 1):
        ws.cell(row=H, column=j, value=h)
    style_range(ws, f"A{H}:{get_column_letter(len(headers))}{H}", font=BOLD, fill=GREY, align=WRAP)
    ws.row_dimensions[H].height = 42
    # year numbers in row 4 above year columns
    for k, y in enumerate(YEARS):
        ws.cell(row=4, column=14 + k, value=y).number_format = "0"
        ws.cell(row=4, column=20 + k, value=y).number_format = "0"
    ws["N3"] = "Costo annuo nominale dell'opzione (non ponderato)"; ws["N3"].font = BOLD
    ws["T3"] = "Esborso atteso = P(iscrizione) × costo"; ws["T3"].font = BOLD
    first = H + 1
    for i, (key, padm, why) in enumerate(cascade):
        r = first + i
        ws.cell(row=r, column=1, value=i + 1).font = BLACK
        ws.cell(row=r, column=2, value=key).font = BLUE
        ws.cell(row=r, column=3, value=f"=INDEX({tu_col('G')},MATCH($B{r},{TU_KEY},0))").font = GREEN
        if bsc2_row is not None and i == bsc2_row:
            ws.cell(row=r, column=4, value=f"=INDEX({tu_col('D')},MATCH($B{r},{TU_KEY},0))+{Q_BSC2}").font = GREEN
            ws.cell(row=r, column=4).comment = Comment("3 anni IBEB + quota BSc² (Parametri) × 1 anno extra", "Claude")
        else:
            ws.cell(row=r, column=4, value=f"=INDEX({tu_col('D')},MATCH($B{r},{TU_KEY},0))").font = GREEN
        ws.cell(row=r, column=4).number_format = "0.00"
        c = ws.cell(row=r, column=5, value=padm); c.font = BLUE; c.fill = YELLOW; c.number_format = PCT
        if i == 0:
            f = f"=E{r}"
        else:
            f = f"=E{r}*EXP(SUMPRODUCT(LN(1-$E${first}:E{r-1}+($E${first}:E{r-1}=1)*1E-12)))"
        c = ws.cell(row=r, column=6, value=f); c.font = BLACK; c.number_format = PCT
        ws.cell(row=r, column=7, value=f"=INDEX({tu_col('B')},MATCH($B{r},{TU_KEY},0))").font = GREEN
        ws.cell(row=r, column=7).number_format = EUR
        ws.cell(row=r, column=8, value=f"=INDEX({tu_col('C')},MATCH($B{r},{TU_KEY},0))").font = GREEN
        ws.cell(row=r, column=8).number_format = "0"
        ws.cell(row=r, column=9, value=f"=INDEX({LIV_VAL},MATCH($C{r},{LIV_CITY},0))").font = GREEN
        ws.cell(row=r, column=9).number_format = EUR
        ws.cell(row=r, column=10, value=f"=INDEX({tu_col('F')},MATCH($B{r},{TU_KEY},0))").font = GREEN
        ws.cell(row=r, column=10).number_format = EUR
        ws.cell(row=r, column=11, value=f"=N{r}+O{r}+P{r}+Q{r}+R{r}+S{r}-SUMPRODUCT((N$4:S$4<>$F$3)*N{r}:S{r})").font = BLACK
        # simpler: first-year cost = INDEX over years where year = start
        ws.cell(row=r, column=11, value=f"=INDEX(N{r}:S{r},MATCH($F$3,$N$4:$S$4,0))").font = BLACK
        ws.cell(row=r, column=11).number_format = EUR
        ws.cell(row=r, column=12, value=f"=SUM(N{r}:S{r})").font = BLACK
        ws.cell(row=r, column=12).number_format = EUR
        ws.cell(row=r, column=13, value=f"=F{r}*L{r}").font = BLACK
        ws.cell(row=r, column=13).number_format = EUR
        growth_ref = f"INDEX({tu_col('E')},MATCH($B{r},{TU_KEY},0))"
        for k, y in enumerate(YEARS):
            col = 14 + k
            yl = get_column_letter(col)
            # k-th year of study: kk = year - start + 1 ; fraction = MAX(0,MIN(1, anni-kk+1))
            frac = f"MAX(0,MIN(1,$D{r}-({yl}$4-$F$3+1)+1))"
            cost = (f"($G{r}*(1+{growth_ref})^({yl}$4-$H{r})"
                    f"+$I{r}*(1+{G_MANT})^({yl}$4-{Y_BASE_M})"
                    f"+IF({yl}$4=$F$3,$J{r},0))")
            c = ws.cell(row=r, column=col, value=f"=IF({yl}$4<$F$3,0,{frac}*{cost})")
            c.font = BLACK; c.number_format = EUR
            e = ws.cell(row=r, column=20 + k, value=f"=$F{r}*{yl}{r}")
            e.font = BLACK; e.number_format = EUR
        w = ws.cell(row=r, column=26, value=why); w.font = BLACK; w.alignment = WRAP
        for col in range(1, 27):
            ws.cell(row=r, column=col).border = BOX
    last = first + len(cascade) - 1
    tot = last + 1
    ws.cell(row=tot, column=2, value="TOTALE / ATTESO").font = BOLD
    ws.cell(row=tot, column=6, value=f"=SUM(F{first}:F{last})").number_format = PCT
    ws.cell(row=tot, column=6).font = BOLD
    ws.cell(row=tot, column=13, value=f"=SUM(M{first}:M{last})").number_format = EUR
    ws.cell(row=tot, column=13).font = BOLD
    for k in range(len(YEARS)):
        col = 20 + k; yl = get_column_letter(col)
        c = ws.cell(row=tot, column=col, value=f"=SUM({yl}{first}:{yl}{last})"); c.font = BOLD; c.number_format = EUR
    style_range(ws, f"A{tot}:Z{tot}", fill=LIGHT)
    ws.cell(row=tot, column=26, value="P(iscrizione) deve sommare a 100%").font = BLACK
    # scenario rows
    s = tot + 2
    ws.cell(row=s, column=2, value="Scenario più probabile (max P(iscrizione))").font = BOLD
    ws.cell(row=s + 1, column=2, value="Scenario economico (min costo tra opzioni con P ≥ soglia)").font = BOLD
    ws.cell(row=s + 2, column=2, value="Scenario caro (max costo tra opzioni con P ≥ soglia)").font = BOLD
    rngF = f"$F${first}:$F${last}"; rngL = f"$L${first}:$L${last}"; rngB = f"$B${first}:$B${last}"
    ws.cell(row=s, column=3, value=f"=INDEX({rngB},MATCH(MAX({rngF}),{rngF},0))").font = BLACK
    ws.cell(row=s + 1, column=3, value=f"=INDEX({rngB},MATCH(_xlfn.MINIFS({rngL},{rngF},\">=\"&{SOGLIA}),{rngL},0))").font = BLACK
    ws.cell(row=s + 2, column=3, value=f"=INDEX({rngB},MATCH(_xlfn.MAXIFS({rngL},{rngF},\">=\"&{SOGLIA}),{rngL},0))").font = BLACK
    for rr, matchexpr in [(s, f"MATCH(MAX({rngF}),{rngF},0)"),
                          (s + 1, f"MATCH(_xlfn.MINIFS({rngL},{rngF},\">=\"&{SOGLIA}),{rngL},0)"),
                          (s + 2, f"MATCH(_xlfn.MAXIFS({rngL},{rngF},\">=\"&{SOGLIA}),{rngL},0)")]:
        ws.cell(row=rr, column=12, value=f"=INDEX({rngL},{matchexpr})").number_format = EUR
        ws.cell(row=rr, column=12).font = BOLD
        for k in range(len(YEARS)):
            col = 14 + k; yl = get_column_letter(col)
            c = ws.cell(row=rr, column=col, value=f"=INDEX(${yl}${first}:${yl}${last},{matchexpr})")
            c.font = BLACK; c.number_format = EUR
        style_range(ws, f"B{rr}:S{rr}", fill=LIGHT)
    ws.freeze_panes = "C6"
    return ws, first, last, tot, s


FRA_PROFILE = ("Profilo: liceo scientifico bilingue quadriennale, media 8,4-8,5, inglese C1, test Bocconi settembre 2026 andato male (da ripetere). "
               "Preferisce l'estero; Bocconi non è la prima scelta ma resta davanti alle opzioni più care/meno prestigiose.")
fra = [
    ("Sciences Po — Bachelor Collège universitaire", 0.15, "Parcoursup 2025: ~10% ammessi, 92% con media >16/20; procedura internazionale <200 posti. Media 8,5 è sotto la mediana; C1 e dossier aiutano."),
    ("Rotterdam EUR — IBEB", 0.85, "Numerus fixus 700 posti: i primi 350 per pura media (mate ≥7 e inglese ok). Con 8,5 è nella fascia alta; rischio residuo diploma quadriennale e sorteggio."),
    ("CBS Copenhagen — BSc (IB / BADM / BASM)", 0.45, "Kvote 1: IB richiede 11,1/12 (quasi solo 95-100 di maturità); BADM/BASM 9,4-9,8 raggiungibili con 8,5 (~9-10 danese). Kvote 2 possibile."),
    ("Bocconi — CLEAM/Management/BIEM", 0.55, "Formula 55% test / 45% media 3ª-4ª: media 8,4-8,5 sopra la mediana stimata; serve rifare il test a 30+/50 in Early 2026 per il 2027. Corsi in italiano meno selettivi."),
    ("UCD Dublino — Commerce / Economics", 0.70, "Punti CAO 2025-26: Commerce 553-554, Economics 542-544 ≈ maturità 87-88 con la tabella CAO (90→574, 80→506). Diploma quadriennale da far riconoscere."),
    ("IE University Madrid — BBA", 0.75, "Test IE/SAT ≥1200 + colloquio; benchmark Bachillerato 7,5+. Profilo A sopra i benchmark; tasso non ufficiale 30-40%."),
    ("ESCP — Bachelor in Management", 0.65, "Valutazione olistica (transcript, statement, CV, C1, colloquio), nessun test obbligatorio; media 8,5 adeguata."),
    ("Forward College — Business & Management", 0.55, "Candidatura già inviata (sett. 2026); dichiarano ~1 su 8 offerte; dossier + colloquio 30'; requisito accademico UoL ≈ ABB."),
    ("Cattolica Milano — Economia", 1.00, "Ripiego a Milano: ammissione pressoché certa."),
]
MAR_PROFILE = ("Profilo: liceo scientifico quinquennale, 4ª nel 2026/27, media obiettivo 7,5 (poco meno di 7 in 3ª), inglese B2 (potenziale C1), matematica da portare verso l'8. "
               "Preferisce l'estero in città vere; Bocconi gradita. Candidatura Rotterdam già decisa (IBA).")
mar = [
    ("Rotterdam RSM — IBA", 0.45, "Numerus fixus 650 posti, ranking 75% media (non arrotondata) + 25% motivazione; ultimo ammesso ~1.280° con liste d'attesa. Media 7-7,5 converte vicino alla soglia 6,5 NL: 50/50, motivazione decisiva."),
    ("Bocconi — CLEAM/Management/BIEM", 0.25, "Con media 7-7,5 (3ª e 4ª) serve un test ≥35/50: possibile ma non probabile. Solo corsi in italiano (CLEAM/Management)."),
    ("ESADE Barcellona — BBA / GGELO", 0.45, "Test ESADE/SAT + transcript 3 anni a pari peso; benchmark IB 34+. Media 7,5 sotto i benchmark, compensabile con test forte."),
    ("Maastricht SBE — International Business", 0.65, "Selezione 1/3 essay, 1/3 CV, 1/3 voti penultimo anno (mate 50%); ~67% dei candidati selezionati."),
    ("UvA Amsterdam — Economics & Business Economics", 0.85, "Numerus fixus con solo test online: nel 2026 offerte fino al 1.487° su ~1.500 partecipanti; richiesti diploma scientifico e matematica sufficiente."),
    ("Tilburg — Economics / IBA", 0.90, "Solo requisiti (matematica all'esame finale, IELTS 6.0) + matching."),
    ("Cattolica Milano — Economia", 1.00, "Ripiego a Milano."),
]
IAC_PROFILE = ("Profilo: liceo scientifico quinquennale, 4ª nel 2026/27, media sotto il 7, forte attitudine logico-matematica, molto brillante a colloquio e test attitudinali, inglese B2. "
               "Obiettivo: atenei dove contano test/colloquio più della media; estero in città vere.")
iac = [
    ("UvA Amsterdam — Economics & Business Economics", 0.80, "Selezione solo con test online di matematica/economia (2026: quasi tutti i partecipanti hanno ricevuto un'offerta); ideale per chi rende nei test. Rischio: requisito matematica sul diploma."),
    ("IE University Madrid — BBA", 0.55, "Test attitudinale IE + video Kira + colloquio 30': i criteri non accademici pesano quanto la media; media <7 sotto i benchmark ma recuperabile."),
    ("Maastricht SBE — International Business", 0.50, "Essay e CV valgono 2/3 del punteggio; voti del penultimo anno 1/3 (mate 50%)."),
    ("ESADE Barcellona — BBA / GGELO", 0.45, "Test + transcript a pari peso: il test può compensare, la media <7 pesa."),
    ("Forward College — Business & Management", 0.45, "Dossier + colloquio 30' in inglese, molto centrato sulla persona; il requisito UoL (≈ maturità 80+) è il limite."),
    ("Bocconi — CLEAM/Management/BIEM", 0.15, "Media <7 in 3ª-4ª: servirebbe un test eccezionale (≥40/50). Il 55% di peso del test lascia una porta aperta ma stretta."),
    ("Tilburg — Economics / IBA", 0.80, "Solo requisiti + matching; rischio solo sul requisito di matematica."),
    ("Cattolica Milano — Economia", 1.00, "Ripiego a Milano."),
]
wsF, fF, lF, tF, sF = child_sheet("Francesca", Y_FRA, FRA_PROFILE, fra, bsc2_row=1)
wsM, fM, lM, tM, sM = child_sheet("Marco", Y_BOYS, MAR_PROFILE, mar)
wsI, fI, lI, tI, sI = child_sheet("Iacopo", Y_BOYS, IAC_PROFILE, iac)

# ---------------------------------------------------------------- Cumulativo
c = wb.create_sheet("Cumulativo", 1)
setw(c, [46] + [14] * 6 + [16, 50])
c["A1"] = "ESBORSO CUMULATIVO — valore atteso ponderato per probabilità e scenari (bachelor)"; c["A1"].font = H1
c["A2"] = "Euro nominali per anno accademico (settembre→agosto). Riga 'cumulato' = somma progressiva."; c["A2"].font = BLACK
H = 4
c.cell(row=H, column=1, value="Anno accademico")
for k, y in enumerate(YEARS):
    cc = c.cell(row=H, column=2 + k, value=f"{y}/{str(y+1)[2:]}")
c.cell(row=H, column=8, value="Totale percorso")
c.cell(row=H, column=9, value="Nota")
style_range(c, f"A{H}:I{H}", font=BOLD, fill=GREY)
for k, y in enumerate(YEARS):
    c.cell(row=3, column=2 + k, value=y).number_format = "0"
    c.cell(row=3, column=2 + k).font = Font(name=ARIAL, size=8, color="888888")

def block(title, start_row, rows, bold_total=True, cumul=True):
    """rows: list of (label, [formula per year], note)"""
    r = start_row
    c.cell(row=r, column=1, value=title).font = H2
    r += 1
    first = r
    for label, fmls, note in rows:
        c.cell(row=r, column=1, value=label).font = BLACK
        for k in range(len(YEARS)):
            cc = c.cell(row=r, column=2 + k, value=fmls[k]); cc.font = GREEN; cc.number_format = EUR
        cc = c.cell(row=r, column=8, value=f"=SUM(B{r}:G{r})"); cc.font = BLACK; cc.number_format = EUR
        c.cell(row=r, column=9, value=note).font = BLACK
        for col in range(1, 10): c.cell(row=r, column=col).border = BOX
        r += 1
    last = r - 1
    c.cell(row=r, column=1, value="Totale famiglia").font = BOLD
    for k in range(len(YEARS)):
        yl = get_column_letter(2 + k)
        cc = c.cell(row=r, column=2 + k, value=f"=SUM({yl}{first}:{yl}{last})"); cc.font = BOLD; cc.number_format = EUR
    cc = c.cell(row=r, column=8, value=f"=SUM(B{r}:G{r})"); cc.font = BOLD; cc.number_format = EUR
    style_range(c, f"A{r}:I{r}", fill=LIGHT)
    tot_row = r
    r += 1
    if cumul:
        c.cell(row=r, column=1, value="Cumulato progressivo").font = BOLD
        for k in range(len(YEARS)):
            yl = get_column_letter(2 + k)
            cc = c.cell(row=r, column=2 + k, value=f"=SUM($B${tot_row}:{yl}{tot_row})"); cc.font = BOLD; cc.number_format = EUR
        style_range(c, f"A{r}:I{r}", fill=LIGHT)
        r += 1
    return r + 1, tot_row

def yrefs(sheet, row, col0):
    return [f"='{sheet}'!{get_column_letter(col0 + k)}{row}" for k in range(len(YEARS))]

r = H + 1
# Expected
r, tot_exp = block("A) VALORE ATTESO (ponderato per P(iscrizione))", r, [
    ("Francesca — atteso", yrefs("Francesca", tF, 20), "Somma su tutte le opzioni della cascata"),
    ("Marco — atteso", yrefs("Marco", tM, 20), ""),
    ("Iacopo — atteso", yrefs("Iacopo", tI, 20), ""),
])
# Most probable
r, tot_prob = block("B) SCENARIO PIÙ PROBABILE (ciascuno nell'opzione con la P(iscrizione) più alta)", r, [
    ("Francesca", yrefs("Francesca", sF, 14), "='Francesca'!C%d" % sF),
    ("Marco", yrefs("Marco", sM, 14), "='Marco'!C%d" % sM),
    ("Iacopo", yrefs("Iacopo", sI, 14), "='Iacopo'!C%d" % sI),
])
r, tot_eco = block("C) SCENARIO ECONOMICO (opzione meno cara tra quelle con P(iscrizione) ≥ soglia)", r, [
    ("Francesca", yrefs("Francesca", sF + 1, 14), "='Francesca'!C%d" % (sF + 1)),
    ("Marco", yrefs("Marco", sM + 1, 14), "='Marco'!C%d" % (sM + 1)),
    ("Iacopo", yrefs("Iacopo", sI + 1, 14), "='Iacopo'!C%d" % (sI + 1)),
])
r, tot_caro = block("D) SCENARIO CARO (opzione più cara tra quelle con P(iscrizione) ≥ soglia)", r, [
    ("Francesca", yrefs("Francesca", sF + 2, 14), "='Francesca'!C%d" % (sF + 2)),
    ("Marco", yrefs("Marco", sM + 2, 14), "='Marco'!C%d" % (sM + 2)),
    ("Iacopo", yrefs("Iacopo", sI + 2, 14), "='Iacopo'!C%d" % (sI + 2)),
])
# summary
c.cell(row=r, column=1, value="SINTESI TOTALE PERCORSO (3 bachelor)").font = H2
r += 1
for label, tr in [("Valore atteso", tot_exp), ("Scenario più probabile", tot_prob), ("Scenario economico", tot_eco), ("Scenario caro", tot_caro)]:
    c.cell(row=r, column=1, value=label).font = BOLD
    cc = c.cell(row=r, column=8, value=f"=H{tr}"); cc.font = BOLD; cc.number_format = EUR
    style_range(c, f"A{r}:I{r}", fill=LIGHT)
    r += 1
c.cell(row=r + 1, column=1, value="Nota: gli scenari B-D non sono ponderati; servono a leggere il range. Il valore atteso include anche i casi a bassa probabilità (es. Sciences Po, Dublino).").font = BLACK

# chart of expected per year
ch = BarChart(); ch.type = "col"; ch.grouping = "stacked"; ch.overlap = 100
ch.title = "Esborso atteso per anno accademico"; ch.y_axis.title = "€"; ch.x_axis.title = "a.a."
data = Reference(c, min_col=1, max_col=7, min_row=H + 2, max_row=H + 4)
cats = Reference(c, min_col=2, max_col=7, min_row=H)
ch.add_data(data, from_rows=True, titles_from_data=True); ch.set_categories(cats)
ch.height = 9; ch.width = 18
c.add_chart(ch, f"A{r + 3}")
c.freeze_panes = "B5"

# ---------------------------------------------------------------- Fonti
f = wb.create_sheet("Fonti")
setw(f, [30, 60, 90])
f["A1"] = "FONTI (consultate il 5 ottobre 2026)"; f["A1"].font = H1
f["A3"] = "Area"; f["B3"] = "Cosa"; f["C3"] = "URL"
style_range(f, "A3:C3", font=BOLD, fill=GREY)
fonti = [
    ("Bocconi", "Tasse e contributi 2026/27 (17.000 €)", "https://www.unibocconi.it/it/entrare-bocconi/corsi-di-laurea-triennale-e-giurisprudenza/tasse-e-contributi"),
    ("Bocconi", "Ammissione: formula 55% test / 45% media", "https://www.unibocconi.it/it/entrare-bocconi/corsi-di-laurea-triennale-e-giurisprudenza/ammissione/ammissione"),
    ("Cattolica", "Normativa contributi 1° anno 2026/27", "https://studenticattolica.unicatt.it/2026-2027%20Normativa%20tasse%20primo%20anno%20di%20corso.pdf"),
    ("Statale", "Regolamento tasse 2026/27", "https://www.unimi.it/sites/default/files/regolamenti/Regolamento%20tasse%20e%20contributi%202026_2027_signed.pdf"),
    ("Milano", "Tariffe ATM 2026", "https://www.atm.it/it/ViaggiaConNoi/Documents/TARIFFE%20ATM.pdf"),
    ("Olanda", "Retta statutaria 2026/27 (DUO)", "https://www.duo.nl/particulier/collegegeld.jsp"),
    ("Olanda", "Retta 2027/28 = 2.771 € (TU Delft / VU)", "https://www.tudelft.nl/en/education/study-programme-orientation/practical-matters/tuition-fee-finances"),
    ("Olanda", "Abolizione sconto 50% primo anno", "https://www.studiekeuze123.nl/halvering-collegegeld"),
    ("Rotterdam", "IBEB regolamento numerus fixus 2026/27", "https://www.eur.nl/en/media/2025-09-regulations-numerus-fixus-ibeb-2026-2027"),
    ("Rotterdam", "IBA ranking e lista d'attesa (RSM)", "https://admissions-support.rsm.nl/support/solutions/articles/80000880316-i-am-on-the-iba-waiting-list-what-are-my-chances-of-getting-an-offer-for-the-programme-"),
    ("Rotterdam", "BSc² facts & figures", "https://www.eur.nl/en/bachelor/double-bachelor-bsc2-econometrics-and-economics/facts-figures"),
    ("Rotterdam", "EUR costo della vita", "https://www.eur.nl/en/education/practical-matters/orientation-arrival/costs-living-nl"),
    ("Amsterdam", "UvA EBE selezione e ranking 2026", "https://www.uva.nl/en/programmes/bachelors/economics--business-economics/application-and-admission/selection-procedure/update-ranking-numbers.html"),
    ("Amsterdam", "AUAS costo della vita", "https://www.amsterdamuas.com/study/international-admissions/financial-matters/cost-of-living"),
    ("Tilburg", "Tuition e costo della vita", "https://www.tilburguniversity.edu/education/bachelors-programs/tuition-fees-and-monthly-cost-living"),
    ("Maastricht", "Regolamento selezione numerus fixus 2026/27", "https://www.maastrichtuniversity.nl/file/regulations-selection-bachelor%E2%80%99s-programmes-numerus-fixus-2026-2027pdf"),
    ("Affitti NL", "Kamernet rapporto Q3 2025 / kamer.nl", "https://kamernet.nl/tips/verhuurders/huurprijs/verhuurrapportage-q3-2025"),
    ("Sciences Po", "Droits de scolarité (max 14.900 €)", "https://www.sciencespo.fr/en/admissions-and-financial-aid/tuition-fees/"),
    ("Sciences Po", "Procedure di ammissione", "https://www.sciencespo.fr/college/en/admission-procedures/"),
    ("Sciences Po × ESCP", "Dual bachelor PEM (dal 2027)", "https://escp.eu/news/escp-sciences-po-announce-new-dual-degree-bachelor"),
    ("ESCP", "Bachelor in Management — fees 2027", "https://escp.eu/programmes/bachelor-in-management-BSc"),
    ("Forward College", "Tuition & living costs 2027/28", "https://forward-college.eu/tuition-feesand-living-costs/"),
    ("Parigi", "LocService affitti studenti", "https://www.locservice.fr/paris-75/logement-etudiant-paris.html"),
    ("IE University", "Payment methods / fees 2026/27", "https://www.ie.edu/university/admission/payment-methods/"),
    ("IE University", "Cost of living Madrid", "https://docs.ie.edu/student-services/IEU_COST_OF_LIVING_MADRID.pdf"),
    ("ESADE", "Tuition fees 2027/28", "https://www.esade.edu/bachelor/en/degrees/tuition-fees"),
    ("UC3M", "Prezzi matricola", "https://www.uc3m.es/grado/admision/solicitud/matricula/precios-matricula"),
    ("UPF", "Preus / notes de tall", "https://www.upf.edu/web/graus/preus"),
    ("Spagna", "Idealista affitti camere Q2 2026", "https://www.idealista.com/news/inmobiliario/vivienda/2026/04/09/892181-la-oferta-de-habitaciones-crece-un-22-y-el-precio-solo-aumenta-un-2-en-el-primer"),
    ("Spagna", "Conversione nota de admisión (BOE 2025)", "https://www.boe.es/buscar/doc.php?id=BOE-A-2025-10777"),
    ("CBS", "International applicants (no tuition UE)", "https://cbs.dk/en/study/bachelor/admission/how-to-apply/international-applicants"),
    ("CBS", "BSc International Business (kvote 11,1)", "https://www.cbs.dk/en/study-programmes/bachelor-programmes/bsc-international-business"),
    ("Copenhagen", "Affitti medi (Comune)", "https://international.kk.dk/live/housing/finding-a-place-to-live/average-renting-costs"),
    ("Danimarca", "SU per studenti UE che lavorano", "https://www.su.dk/foreign-citizen/gb-foreign-citizen/eu-rules/you-work-in-denmark"),
    ("UCD", "Fees 2026/27 e Student Contribution", "https://www.ucd.ie/students/fees/eucoursefees/euundergraduatefees202627/"),
    ("UCD", "Living costs / residenze 2026/27", "https://www.ucd.ie/global/study-at-ucd/scholarshipsfinances/livingcosts/"),
    ("UCD", "Punti CAO 2026", "https://www.ucd.ie/myucd/t4media/LC_Points_2026.pdf"),
    ("Trinity", "Fees e levies", "https://www.tcd.ie/courses/undergraduate/fees/"),
    ("Trinity", "Punti CAO 2025 e tabella maturità", "https://www.tcd.ie/study/assets/pdfs/2025-cao-minimum-entry-points-final.pdf"),
    ("CAO", "Linee guida conversione diplomi UE 2025", "https://www2.cao.ie/downloads/documents/2025/Guidelines-EU-EFTA-UK-2025.pdf"),
    ("Dublino", "Daft rental report Q1 2026", "https://www.rte.ie/documents/news/2026/05/daft.ie-rental-report-2026q1.pdf"),
    ("Irlanda", "Budget 2027: nessun taglio universale", "https://www.irishtimes.com/politics/2026/10/04/prospect-of-a-250-cut-to-student-contribution-fees-recedes-ahead-of-budget-2027/"),
]
for i, (a, b, u) in enumerate(fonti, 4):
    f.cell(row=i, column=1, value=a).font = BLACK
    f.cell(row=i, column=2, value=b).font = BLACK
    cc = f.cell(row=i, column=3, value=u); cc.font = Font(name=ARIAL, size=10, color="0563C1", underline="single"); cc.hyperlink = u

for sh in wb.worksheets:
    for row in sh.iter_rows():
        for cell in row:
            if cell.font is None or cell.font.name != ARIAL:
                cell.font = Font(name=ARIAL, size=cell.font.size if cell.font and cell.font.size else 10,
                                 bold=cell.font.bold if cell.font else False,
                                 color=cell.font.color if cell.font else None)

out = "/home/claude/Prospetto_Esborsi_Bachelor_Bonfanti.xlsx"
wb.save(out)
print("saved", out, "rows:", {"F": (fF, lF, tF, sF), "M": (fM, lM, tM, sM), "I": (fI, lI, tI, sI)})
