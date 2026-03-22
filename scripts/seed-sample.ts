/**
 * Seed the IP RS database with sample decisions and guidelines for testing.
 *
 * Usage:
 *   npx tsx scripts/seed-sample.ts
 *   npx tsx scripts/seed-sample.ts --force
 */

import Database from "better-sqlite3";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_SQL } from "../src/db.js";

const DB_PATH = process.env["IPRS_DB_PATH"] ?? "data/iprs.db";
const force = process.argv.includes("--force");

const dir = dirname(DB_PATH);
if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
if (force && existsSync(DB_PATH)) { unlinkSync(DB_PATH); console.log(`Deleted existing database at ${DB_PATH}`); }

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(SCHEMA_SQL);
console.log(`Database initialised at ${DB_PATH}`);

interface TopicRow { id: string; name_local: string; name_en: string; description: string; }

const topics: TopicRow[] = [
  { id: "cookies", name_local: "Piškotki in sledilniki", name_en: "Cookies and trackers", description: "Uporaba piškotkov in drugih sledilnikov na napravah uporabnikov (GDPR čl. 6)." },
  { id: "employee_monitoring", name_local: "Nadzor zaposlenih", name_en: "Employee monitoring", description: "Obdelava podatkov zaposlenih in nadzor na delovnem mestu." },
  { id: "video_surveillance", name_local: "Videonadzorom", name_en: "Video surveillance", description: "Uporaba sistemov videonadzora in varstvo osebnih podatkov (GDPR čl. 6)." },
  { id: "data_breach", name_local: "Kršitve varnosti podatkov", name_en: "Data breach notification", description: "Obveščanje o kršitvah varnosti osebnih podatkov IP RS in posameznikom (GDPR čl. 33–34)." },
  { id: "consent", name_local: "Privolitev", name_en: "Consent", description: "Pridobitev, veljavnost in umik privolitve za obdelavo osebnih podatkov (GDPR čl. 7)." },
  { id: "dpia", name_local: "Ocena učinka na varstvo podatkov", name_en: "Data Protection Impact Assessment (DPIA)", description: "Ocena učinka za obdelavo z visokim tveganjem (GDPR čl. 35)." },
  { id: "transfers", name_local: "Mednarodni prenosi podatkov", name_en: "International data transfers", description: "Prenos osebnih podatkov v tretje države ali mednarodne organizacije (GDPR čl. 44–49)." },
  { id: "data_subject_rights", name_local: "Pravice posameznikov", name_en: "Data subject rights", description: "Uveljavljanje pravic dostopa, popravka, izbrisa in drugih pravic (GDPR čl. 15–22)." },
];

const insertTopic = db.prepare("INSERT OR IGNORE INTO topics (id, name_local, name_en, description) VALUES (?, ?, ?, ?)");
for (const t of topics) { insertTopic.run(t.id, t.name_local, t.name_en, t.description); }
console.log(`Inserted ${topics.length} topics`);

interface DecisionRow {
  reference: string; title: string; date: string; type: string;
  entity_name: string; fine_amount: number | null; summary: string;
  full_text: string; topics: string; gdpr_articles: string; status: string;
}

const decisions: DecisionRow[] = [
  {
    reference: "0644-13/2022",
    title: "Odločba IP RS glede kršitve privolitve pri piškotkih",
    date: "2022-05-11",
    type: "sanction",
    entity_name: "Spletna trgovina",
    fine_amount: 11000,
    summary: "IP RS je izrekel globo 11.000 EUR spletni trgovini za nameščanje analitičnih in oglaševalskih piškotkov brez predhodne privolitve uporabnikov in brez enako enostavne možnosti zavrnitve.",
    full_text: "Informacijski pooblaščenec je opravil inšpekcijski pregled po pritožbah uporabnikov glede praks piškotkov. Ugotovljeno je bilo, da je podjetje aktiviralo oglaševalske in analitične piškotke takoj ob obisku spletnega mesta, preden je uporabnik imel priložnost izraziti svojo odločitev. Baner za piškotke je prikazoval vidni gumb za sprejetje, medtem ko je bila možnost zavrnitve skrita v več nivojih podmenije. IP RS je ugotovil: 1) piškotki so bili aktivirani pred pridobitvijo privolitve; 2) postopek zavrnitve je bil bistveno bolj zapleten kot sprejetje; 3) informacije o namenih piškotkov so bile neustrezne. Podjetju je bila izrečena globa 11.000 EUR in naložena obveznost odprave kršitev v 60 dneh.",
    topics: JSON.stringify(["cookies", "consent"]),
    gdpr_articles: JSON.stringify(["6", "7"]),
    status: "final",
  },
  {
    reference: "0644-28/2022",
    title: "Odločba IP RS glede sledenja zaposlenim z GPS",
    date: "2022-09-07",
    type: "sanction",
    entity_name: "Transportno podjetje",
    fine_amount: 22000,
    summary: "IP RS je izrekel globo 22.000 EUR transportnemu podjetju za neprekinjeno sledenje zaposlenim z GPS tako med delovnim časom kot zunaj njega, s čimer je kršilo načelo sorazmernosti.",
    full_text: "IP RS je prejel pritožbe zaposlenih glede neprekinjeno sledenje z GPS prek sistema za upravljanje voznega parka. Preiskava je pokazala: 1) podatki GPS so se zbirali 24 ur na dan, 7 dni v tednu, vključno z zunaj delovnega časa in vikendi; 2) zaposleni pred namestitvijo sistema niso bili ustrezno obveščeni o obsegu in namenu zbiranja podatkov; 3) podatki o lokaciji so bili hranjeni 3 leta brez utemeljene potrebe. IP RS je poudaril, da je sledenje GPS zakonitemu le med delovnim časom in za konkretne zakonite namene. Neprekinjeno sledenje zunaj delovnega časa pomeni nesorazmeren poseg v zasebno življenje. Podjetju je bila izrečena globa 22.000 EUR.",
    topics: JSON.stringify(["employee_monitoring"]),
    gdpr_articles: JSON.stringify(["5", "6", "13"]),
    status: "final",
  },
  {
    reference: "0644-05/2023",
    title: "Odločba IP RS glede zamude pri prijavi kršitve varnosti podatkov",
    date: "2023-02-15",
    type: "sanction",
    entity_name: "Zdravstveni zavod",
    fine_amount: 32000,
    summary: "IP RS je izrekel globo 32.000 EUR zdravstvenemu zavodu za zamudo pri prijavi kršitve varnosti podatkov, ki je prizadela približno 10.000 pacientov — obvestilo je bilo poslano 14 dni po odkritju namesto v 72 urah.",
    full_text: "Zdravstveni zavod je utrpel kibernetski napad, ki je ogrozil osebne podatke približno 10.000 pacientov, vključno z medicinskimi podatki. IP RS je ugotovil naslednje kršitve: 1) obvestilo IP RS je bilo poslano 14 dni po odkritju incidenta, kar preseže 72-urni rok; 2) obvestilo je bilo nepopolno — ni vsebovalo vrst prizadetih podatkov, približnega števila posameznikov in ocene tveganja; 3) prizadeti pacienti niso bili obveščeni, čeprav je incident pomenil visoko tveganje za njihove pravice. Zavodu je bila izrečena globa 32.000 EUR. IP RS je poudaril, da kršitve medicinskih podatkov zahtevajo takojšnje ukrepanje.",
    topics: JSON.stringify(["data_breach"]),
    gdpr_articles: JSON.stringify(["33", "34"]),
    status: "final",
  },
  {
    reference: "0644-22/2023",
    title: "Odločba IP RS glede videonadzora na delovnem mestu",
    date: "2023-06-28",
    type: "warning",
    entity_name: "Maloprodajni verižna trgovina",
    fine_amount: null,
    summary: "IP RS je izrekel opozorilo maloprodajni verigi za namestitev kamer videonadzora v prostorih za počitek zaposlenih in za neustrezno obveščanje zaposlenih o videonadzoru.",
    full_text: "IP RS je opravil načrtovane preglede v prodajalnah maloprodajne verige in ugotovil, da so bile kamere videonadzora nameščene v prostorih za počitek zaposlenih — v slačilnicah in jedilnici. To je očitna kršitev načela sorazmernosti, saj ni zakonite podlage za tako intenziven nadzor v zasebnih prostorih zaposlenih. Poleg tega zaposleni niso bili ustrezno obveščeni o lokacijah kamer in obsegu zbranih podatkov. IP RS je izrekel opozorilo in naložil obveznosti: 1) nemudoma odstraniti kamere iz prostorov za počitek zaposlenih; 2) pregledati politiko videonadzora in jo uskladiti z zahtevami GDPR; 3) pripraviti in objaviti jasne informacije za zaposlene.",
    topics: JSON.stringify(["video_surveillance", "employee_monitoring"]),
    gdpr_articles: JSON.stringify(["5", "6", "13"]),
    status: "final",
  },
  {
    reference: "0644-41/2023",
    title: "Odločba IP RS glede pošiljanja neposrednega trženja brez privolitve",
    date: "2023-10-12",
    type: "sanction",
    entity_name: "Zavarovalniška agencija",
    fine_amount: 16000,
    summary: "IP RS je izrekel globo 16.000 EUR zavarovalniški agenciji za pošiljanje trženjskih e-poštnih sporočil brez veljavne privolitve in za oteževano odjavo od prejemanja sporočil.",
    full_text: "IP RS je preiskal pritožbe potrošnikov, ki so prejemali nezaželena trženjska e-poštna sporočila od zavarovalniške agencije. Preiskava je razkrila: 1) agencija je pošiljala trženjska sporočila osebam, ki niso izrecno privolile v njihovo prejemanje — privolitev je bila pridobljena z vnaprej označenimi okenci; 2) povezava za odjavo je bila skrita v nogi e-poštnega sporočila v majhni pisavi; 3) nekateri potrošniki so poročali, da so e-poštna sporočila prejemali še tedne po odjavi. IP RS je poudaril, da mora biti privolitev za trženjska sporočila pridobljena z aktivnim dejanjem. Agenciji je bila izrečena globa 16.000 EUR.",
    topics: JSON.stringify(["consent"]),
    gdpr_articles: JSON.stringify(["6", "7"]),
    status: "final",
  },
];

const insertDecision = db.prepare(`INSERT OR IGNORE INTO decisions (reference, title, date, type, entity_name, fine_amount, summary, full_text, topics, gdpr_articles, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertDecisionsAll = db.transaction(() => { for (const d of decisions) { insertDecision.run(d.reference, d.title, d.date, d.type, d.entity_name, d.fine_amount, d.summary, d.full_text, d.topics, d.gdpr_articles, d.status); } });
insertDecisionsAll();
console.log(`Inserted ${decisions.length} decisions`);

interface GuidelineRow { reference: string | null; title: string; date: string; type: string; summary: string; full_text: string; topics: string; language: string; }

const guidelines: GuidelineRow[] = [
  {
    reference: "IP-RS-NAPOTKI-PISKOTKI-2022",
    title: "Napotki za uporabo piškotkov",
    date: "2022-03-10",
    type: "guide",
    summary: "Napotki IP RS za uporabo piškotkov in podobnih tehnologij. Zajema zahteve glede privolitve, obveznosti obveščanja in mehanizme zavrnitve.",
    full_text: "Ti napotki pojasnjujejo pravila za uporabo piškotkov v Sloveniji v skladu z GDPR in Zakonom o elektronskih komunikacijah. Ključne zahteve: 1) Privolitev pred piškotki — za nebistvene piškotke (oglaševanje, analitika) je potrebna predhodna, svobodna, specifična, informirana in nedvoumna privolitev; strogo potrebni piškotki so izvzeti; 2) Enaka dostopnost — možnost zavrnitve mora biti enako dostopna kot možnost sprejema; piškotne pregrade načeloma niso dovoljene; 3) Informacije — jasne informacije o namenih, trajanju in tretjih straneh piškotkov; 4) Umik — privolitev mora biti enako enostavno umakniti kot jo dati; 5) Dokaz — upravljavci morajo hraniti dokazila o privolitvi.",
    topics: JSON.stringify(["cookies", "consent"]),
    language: "sl",
  },
  {
    reference: "IP-RS-NAPOTKI-DPIA-2021",
    title: "Napotki za izvedbo ocene učinka na varstvo podatkov",
    date: "2021-11-01",
    type: "guide",
    summary: "Metodološki napotki IP RS za izvedbo ocene učinka na varstvo podatkov (DPIA). Zajema, kdaj je DPIA obvezna, kako jo izvesti in dokumentirati.",
    full_text: "Člen 35 GDPR zahteva oceno učinka na varstvo podatkov, kadar je verjetno, da bo vrsta obdelave povzročila visoko tveganje za pravice in svoboščine posameznikov. DPIA je obvezna: pri obsežni obdelavi posebnih vrst podatkov; pri sistematičnem spremljanju javno dostopnih prostorov; pri obdelavi za namene avtomatiziranega odločanja s pravnimi ali podobno pomembnimi učinki. Faze DPIA: 1) Opis obdelave — kategorije podatkov, nameni, prejemniki, prenosi, rok hrambe, varnostni ukrepi; 2) Ocena nujnosti in sorazmernosti — zakonitost, minimizacija podatkov, pravice posameznikov; 3) Obvladovanje tveganj — ugotavljanje groženj zasebnosti, ocena verjetnosti in resnosti, opredelitev dodatnih ukrepov. DPIA mora biti dokumentirana in posodobljena pri vsaki bistveni spremembi obdelave.",
    topics: JSON.stringify(["dpia"]),
    language: "sl",
  },
  {
    reference: "IP-RS-NAPOTKI-PRAVICE-2022",
    title: "Napotki za uveljavljanje pravic posameznikov",
    date: "2022-06-15",
    type: "guide",
    summary: "Napotki IP RS o pravicah posameznikov po GDPR — dostop, popravek, izbris, omejitev, prenosljivost in ugovor. Zajema roke, postopke in izjeme.",
    full_text: "GDPR daje posameznikom obsežne pravice glede obdelave njihovih osebnih podatkov. Ključne pravice: 1) Pravica dostopa (čl. 15) — posameznik ima pravico pridobiti potrditev o obdelavi in kopijo svojih podatkov; odgovor je treba posredovati v 1 mesecu; 2) Pravica do popravka (čl. 16) — netočne podatke je treba popraviti brez nepotrebnega odlašanja; 3) Pravica do izbrisa (čl. 17) — 'pravica do pozabe' pod določenimi pogoji; 4) Pravica do omejitve obdelave (čl. 18); 5) Pravica do prenosljivosti podatkov (čl. 20) — posameznik ima pravico prejeti svoje podatke v strukturirani, splošno uporabljani in strojno berljivi obliki; 6) Pravica do ugovora (čl. 21) — posameznik se lahko upre obdelavi za namene neposrednega trženja. Organizacije morajo imeti jasne postopke za uresničevanje teh pravic in odgovarjati v predpisanih rokih.",
    topics: JSON.stringify(["data_subject_rights"]),
    language: "sl",
  },
];

const insertGuideline = db.prepare(`INSERT INTO guidelines (reference, title, date, type, summary, full_text, topics, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const insertGuidelinesAll = db.transaction(() => { for (const g of guidelines) { insertGuideline.run(g.reference, g.title, g.date, g.type, g.summary, g.full_text, g.topics, g.language); } });
insertGuidelinesAll();
console.log(`Inserted ${guidelines.length} guidelines`);

const dc = (db.prepare("SELECT count(*) as cnt FROM decisions").get() as { cnt: number }).cnt;
const gc = (db.prepare("SELECT count(*) as cnt FROM guidelines").get() as { cnt: number }).cnt;
const tc = (db.prepare("SELECT count(*) as cnt FROM topics").get() as { cnt: number }).cnt;
console.log(`\nDatabase summary:\n  Topics: ${tc}\n  Decisions: ${dc}\n  Guidelines: ${gc}\n\nDone. Database ready at ${DB_PATH}`);
db.close();
