// PDF sub-app: My Templates · Library · Editor (field mapping + live preview) · Generate (single/bulk) · Archive
const { useState: usePdfSt, useEffect: usePdfEff } = React;

/* ════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════ */
const MY_TEMPLATES = [
  { id: "spravka",   name: "Справка с места работы",     gost: "ГОСТ Р 7.0.97-2016",     table: "Преподаватели",  fields: 7,  bound: 7,  docs: 184, last: "2 ч назад",      status: "ready" },
  { id: "vedomost",  name: "Ведомость аттестации",       gost: "Приказ Минобрнауки № 301",table: "Студенты · Курсы",fields: 9, bound: 9,  docs: 312, last: "вчера",          status: "ready" },
  { id: "nagruzka",  name: "Учебная нагрузка",           gost: "ГОСТ Р 7.0.97-2016",     table: "Преподаватели",  fields: 12, bound: 10, docs: 47,  last: "3 дня назад",    status: "setup" },
  { id: "prikaz",    name: "Приказ о приёме на работу",  gost: "ТК РФ ст. 68",           table: "Преподаватели",  fields: 11, bound: 11, docs: 42,  last: "неделю назад",   status: "ready" },
];

const LIB_CATS = [{ id: "all", label: "Все", count: 47 }, { id: "edu", label: "Учебная работа", count: 18 }, { id: "hr", label: "Кадры", count: 11 }, { id: "stud", label: "Студенты", count: 9 }];
const LIB_TPLS = [
  { cat:"edu",  name:"Расписание занятий группы",   gost:"Локальный шаблон",         desc:"Недельная сетка по дисциплинам и аудиториям.",  used:89,  official:false },
  { cat:"edu",  name:"Индивидуальный учебный план", gost:"ФЗ-273 ст. 34",            desc:"ИУП студента с дисциплинами и сроками.",        used:31,  official:true  },
  { cat:"hr",   name:"Должностная инструкция",      gost:"ГОСТ Р 7.0.97-2016",       desc:"Преамбула, обязанности, права.",                used:28,  official:false },
  { cat:"hr",   name:"Карточка сотрудника Т-2",     gost:"Постановление Госкомстата", desc:"Личная карточка по форме.",                    used:14,  official:true  },
  { cat:"stud", name:"Справка об обучении",         gost:"Приказ Минобрнауки № 455", desc:"ФИО, группа, форма, направление.",             used:168, official:true  },
  { cat:"stud", name:"Академическая справка",       gost:"Приказ Минобрнауки № 455", desc:"Курсы с оценками за весь период.",              used:47,  official:true  },
  { cat:"fin",  name:"Отчёт по часам кафедры",      gost:"Локальный шаблон",         desc:"Суммарная нагрузка кафедры.",                  used:12,  official:false },
  { cat:"appeal",name:"Заявление о переводе",       gost:"Свободная форма",          desc:"Личное заявление студента.",                    used:8,   official:false },
];

const FORMATS = ["—", "именительный", "родительный", "дательный", "длинная дата", "короткая дата", "инициалы", "прописью"];
const BIND_TABLES = {
  "Преподаватели": ["ФИО", "Степень", "Должность", "Ставка", "Email", "Дата приёма", "Кафедра"],
  "Организация":   ["Министерство", "Полное название", "Краткое название"],
  "Подписант":     ["Должность", "ФИО"],
  "Система":       ["Дата выдачи", "Номер документа"],
};

const INITIAL_MAPPING = [
  { ph: "fio",        label: "ФИО получателя",  table: "Преподаватели", field: "ФИО",          fmt: "дательный",    sample: "Иванову А. П." },
  { ph: "position",   label: "Должность",       table: "Преподаватели", field: "Должность",    fmt: "—",            sample: "профессор" },
  { ph: "kafedra",    label: "Кафедра",         table: "Преподаватели", field: "Кафедра",      fmt: "родительный",  sample: "математического анализа" },
  { ph: "hired_at",   label: "Дата приёма",     table: "Преподаватели", field: "Дата приёма",  fmt: "длинная дата", sample: "1 сентября 2008 г." },
  { ph: "rate",       label: "Ставка",          table: "Преподаватели", field: "Ставка",       fmt: "прописью",     sample: "полная" },
  { ph: "org",        label: "Организация",     table: "Организация",   field: "Краткое название", fmt: "—",        sample: "МГУ" },
  { ph: "today",      label: "Дата выдачи",     table: "Система",       field: "Дата выдачи",  fmt: "длинная дата", sample: "15 сентября 2025 г." },
  { ph: "signer_fio", label: "Подписант",       table: "",             field: "",             fmt: "инициалы",     sample: "—" },
];

const ARCHIVE = [
  { kind: "single", name: "Справка_Иванов_АП.pdf",          tpl: "Справка с места работы", rec: "Иванов Алексей Петрович",  date: "Сегодня, 14:32",      size: "142 КБ", by: "Анна Иванова" },
  { kind: "bulk",   name: "Ведомости_аттестации_318М.zip",  tpl: "Ведомость аттестации",   rec: "28 студентов",             date: "Сегодня, 11:05",      size: "3.4 МБ", by: "Дмитрий Петров" },
  { kind: "single", name: "Справка_Петрова_МС.pdf",         tpl: "Справка с места работы", rec: "Петрова Мария Сергеевна",  date: "Вчера, 16:48",        size: "139 КБ", by: "Анна Иванова" },
  { kind: "bulk",   name: "Учебная_нагрузка_кафедра.zip",   tpl: "Учебная нагрузка",       rec: "14 преподавателей",        date: "18 июня, 09:12",      size: "1.8 МБ", by: "Анна Иванова" },
  { kind: "single", name: "Приказ_184к_Орлов.pdf",          tpl: "Приказ о приёме",        rec: "Орлов Павел Владимирович", date: "15 июня, 13:20",      size: "98 КБ",  by: "Анна Иванова" },
  { kind: "single", name: "Справка_Сидоров_ДИ.pdf",         tpl: "Справка с места работы", rec: "Сидоров Дмитрий Иванович", date: "12 июня, 10:03",      size: "141 КБ", by: "Сергей Ковалёв" },
];

const RECORDS = ["Иванов Алексей Петрович","Петрова Мария Сергеевна","Сидоров Дмитрий Иванович","Кузнецова Ольга Викторовна","Васильев Сергей Николаевич","Орлов Павел Владимирович"];

/* ════════════════════════════════════════════════════════════════
   REUSABLE: ГОСТ document preview (Справка)
   ════════════════════════════════════════════════════════════════ */
function SpravkaDoc({ scale = 1, rec = "Иванов Алексей Петрович", hl = true }) {
  const last = rec.split(" ")[0], init = rec.split(" ").slice(1).map(w => w[0] + ".").join(" ");
  const datelny = last.endsWith("а") ? last.slice(0, -1) + "ой" : last + "у";
  const H = ({ children }) => <span style={{ background: hl ? "#FFFAEB" : "transparent", padding: hl ? "0 2px" : 0, borderRadius: 2 }}>{children}</span>;
  const px = n => n * scale;
  return (
    <div style={{ width: px(560), background: "#fff", boxShadow: "0 8px 28px rgba(0,0,0,.10)", padding: `${px(70)}px ${px(58)}px ${px(56)}px`, fontFamily: "'Times New Roman', Georgia, serif", fontSize: px(14), lineHeight: 1.55, color: "#1a1a1a", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: px(16), marginBottom: px(20) }}>
        <div style={{ width: px(52), height: px(52), borderRadius: "50%", border: "1px solid #1a1a1a", display: "grid", placeItems: "center", fontSize: px(8), textAlign: "center", lineHeight: 1.2, color: "#444", flexShrink: 0 }}>МГУ<br/>1755</div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: px(12.5), letterSpacing: "0.04em" }}>МИНОБРНАУКИ РОССИИ</div>
          <div style={{ fontSize: px(12), fontWeight: 700, marginTop: px(2) }}>МГУ им. М.В. Ломоносова</div>
          <div style={{ fontSize: px(10.5), marginTop: px(2) }}>Механико-математический факультет</div>
          <div style={{ fontSize: px(9), marginTop: px(4), color: "#666" }}>Ленинские горы, д. 1, Москва, 119991</div>
        </div>
      </div>
      <div style={{ borderTop: "0.5px solid #1a1a1a", marginBottom: px(22) }}/>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: px(28), fontSize: px(12.5) }}>
        <span>«15»&nbsp;сентября&nbsp;2025 г. № <H>184/2025</H></span>
        <span style={{ textAlign: "right" }}>По месту требования</span>
      </div>
      <div style={{ textAlign: "center", fontSize: px(16), fontWeight: 700, letterSpacing: "0.1em", marginBottom: px(24) }}>СПРАВКА</div>
      <div style={{ textIndent: px(28), textAlign: "justify", marginBottom: px(14) }}>
        Настоящая справка выдана <H><u>{datelny} {init}</u></H> в том, что он(а) работает в МГУ им. М.В. Ломоносова на механико-математическом факультете в должности <H><u>профессора</u></H> кафедры <H><u>математического анализа</u></H> с <H><u>1 сентября 2008 года</u></H> по настоящее время.
      </div>
      <div style={{ textIndent: px(28), textAlign: "justify", marginBottom: px(14) }}>
        Ставка: <H><u>полная</u></H>. Имеет учёную степень доктора физико-математических наук.
      </div>
      <div style={{ textIndent: px(28), textAlign: "justify", marginBottom: px(48) }}>
        Справка выдана <H><u>15 сентября 2025 г.</u></H> для предъявления по месту требования.
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: px(50) }}>
        <div>
          <div>Декан факультета</div>
          <div style={{ marginTop: px(16), display: "flex", alignItems: "center", gap: px(8) }}>
            <span style={{ borderBottom: "0.5px solid #1a1a1a", display: "inline-block", width: px(90) }}/>
            <span style={{ fontSize: px(12) }}>Г. И. Архипов</span>
          </div>
        </div>
        <div style={{ width: px(72), height: px(72), borderRadius: "50%", border: "1.5px dashed #c0c0c0", display: "grid", placeItems: "center", fontSize: px(9), color: "#999", letterSpacing: "0.08em" }}>М.П.</div>
      </div>
    </div>
  );
}

function MiniDoc({ w = 36, h = 46 }) {
  return (
    <div style={{ width: w, height: h, background: "linear-gradient(180deg,#fff 0%,var(--neutral-100) 100%)", border: "0.5px solid var(--border-default)", borderRadius: 3, position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: "6px 5px", display: "flex", flexDirection: "column", gap: 2.5 }}>
        <div style={{ height: 2, background: "#cfc8eb", width: "70%", margin: "0 auto 3px" }}/>
        {[100, 88, 95, 70, 90, 60].map((wd, i) => <div key={i} style={{ height: 1.5, background: "#ddd", width: `${wd}%` }}/>)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIEW: My Templates
   ════════════════════════════════════════════════════════════════ */
function PdfTemplates({ onOpen, onGenerate, onLibrary, toast }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Мои шаблоны</h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>4 шаблона подключены к таблицам · 585 документов сгенерировано</p>
        </div>
        <Button variant="secondary" size="md" icon={<Icon name="plus" size={14}/>} onClick={onLibrary}>Из библиотеки</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {MY_TEMPLATES.map(t => (
          <div key={t.id} style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 10, padding: 18, display: "flex", gap: 16, transition: "box-shadow 160ms" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-2)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <MiniDoc w={56} h={72}/>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>{t.name}</div>
                {t.status === "ready"
                  ? <Badge tone="success" dot>готов</Badge>
                  : <Badge tone="warning" dot>{t.fields - t.bound} поля</Badge>}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)", marginTop: 3 }}>{t.gost}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "var(--fg-2)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="table" size={11} color="var(--fg-3)"/>{t.table}</span>
                <span style={{ color: "var(--fg-3)" }}>·</span>
                <span>{t.bound}/{t.fields} полей связано</span>
              </div>
              <div style={{ flex: 1 }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "0.5px solid var(--border-default)" }}>
                <span style={{ fontSize: 11, color: "var(--fg-3)", flex: 1 }}>{t.docs}× · {t.last}</span>
                <Button variant="ghost" size="sm" icon={<Icon name="sliders" size={12}/>} onClick={() => onOpen(t)}>Настроить</Button>
                <Button variant="primary" size="sm" icon={<Icon name="file" size={12} color="#fff"/>} onClick={() => onGenerate(t)} disabled={t.status !== "ready"}>Сгенерировать</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 20, background: "var(--brand-tint)", border: "0.5px solid var(--purple-200)", borderRadius: 10, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--brand-primary)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="plus" size={20}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Нужен другой документ?</div>
          <div style={{ fontSize: 12, color: "var(--fg-2)" }}>Возьми из библиотеки 47 шаблонов под ГОСТ или загрузи свой .docx — Nerion разметит поля автоматически.</div>
        </div>
        <Button variant="secondary" size="md" onClick={() => toast("Загрузка .docx — скоро")}>Загрузить .docx</Button>
        <Button variant="primary" size="md" onClick={onLibrary}>Открыть библиотеку</Button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Library
   ════════════════════════════════════════════════════════════════ */
function PdfLibrary({ onBack, toast }) {
  const [cat, setCat] = usePdfSt("all");
  const [search, setSearch] = usePdfSt("");
  const list = LIB_TPLS.filter(t => (cat === "all" || t.cat === cat) && (!search || t.name.toLowerCase().includes(search.toLowerCase())));
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px 80px" }}>
      <button onClick={onBack} style={{ background: 0, border: 0, color: "var(--fg-3)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 0, fontFamily: "inherit" }}>
        <Icon name="arrow" size={12} style={{ transform: "rotate(180deg)" }}/>К моим шаблонам
      </button>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>Библиотека шаблонов</h1>
      <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 22, maxWidth: 560, lineHeight: 1.5 }}>47 шаблонов под российские нормативы. Зелёный значок — официальный документ, принимаемый регуляторами.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Icon name="search" size={14} color="var(--fg-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по библиотеке…" style={{ height: 36, width: 280, padding: "0 12px 0 32px", border: "0.5px solid var(--border-strong)", borderRadius: 6, background: "var(--bg-0)", fontSize: 13, outline: 0, fontFamily: "inherit" }}/>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {LIB_CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: "0.5px solid var(--border-default)", background: cat === c.id ? "var(--fg-1)" : "var(--bg-0)", color: cat === c.id ? "var(--bg-0)" : "var(--fg-2)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              {c.label} <span style={{ opacity: .6 }}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {list.map((t, i) => (
          <div key={i} style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 10, overflow: "hidden", transition: "all 160ms" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ background: "linear-gradient(180deg,var(--neutral-100),var(--neutral-200))", padding: 18, display: "grid", placeItems: "center", borderBottom: "0.5px solid var(--border-default)" }}>
              <MiniDoc w={72} h={94}/>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>{t.name}</div>
                {t.official && <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--green-100)", color: "var(--green-700)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={9}/></span>}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{t.gost}</div>
              <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.4, marginBottom: 10, minHeight: 32 }}>{t.desc}</div>
              <Button variant="primary" size="sm" style={{ width: "100%" }} onClick={() => toast("Шаблон добавлен в мои")}>Взять за основу</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Editor (field mapping + live preview)
   ════════════════════════════════════════════════════════════════ */
function PdfEditor({ tpl, onBack, onGenerate, toast }) {
  const [mapping, setMapping] = usePdfSt(INITIAL_MAPPING);
  const [zoom, setZoom] = usePdfSt(78);
  const [previewRec, setPreviewRec] = usePdfSt(RECORDS[0]);
  const [showBanner, setShowBanner] = usePdfSt(true);
  const boundCount = mapping.filter(m => m.field).length;
  const unbound = mapping.length - boundCount;

  const setRow = (i, patch) => setMapping(ms => ms.map((m, j) => j === i ? { ...m, ...patch } : m));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Toolbar */}
      <div style={{ height: 46, background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 20px", gap: 14, fontSize: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 0, border: 0, color: "var(--fg-2)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0, fontFamily: "inherit" }}>
          <Icon name="arrow" size={12} style={{ transform: "rotate(180deg)" }}/>Шаблоны
        </button>
        <div style={{ width: 1, height: 16, background: "var(--border-default)" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-2)" }}>
          <Icon name="file" size={12} color="var(--fg-3)"/>
          <select defaultValue="a4" style={{ background: 0, border: 0, color: "var(--fg-1)", fontSize: 12, fontFamily: "inherit", outline: 0, cursor: "pointer" }}><option value="a4">A4 · 210×297</option><option value="a5">A5</option></select>
        </div>
        <div style={{ width: 1, height: 16, background: "var(--border-default)" }}/>
        <span style={{ color: "var(--fg-2)" }}>Шрифт <span style={{ color: "var(--fg-1)" }}>PT Serif · 12pt</span></span>
        <div style={{ width: 1, height: 16, background: "var(--border-default)" }}/>
        <span style={{ color: "var(--fg-2)" }}>Поля <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>2 / 2.5 см</span></span>
        <Button variant="ghost" size="sm" icon={<Icon name="users" size={12}/>}>Подписант: Архипов Г. И.</Button>
        <div style={{ flex: 1 }}/>
        <Button variant="ghost" size="sm" icon={<Icon name="check" size={12} color="var(--green-600)"/>}>Сохранено</Button>
        <Button variant="primary" size="sm" onClick={() => onGenerate(tpl)}>Сгенерировать →</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "440px 1fr", flex: 1, minHeight: 0 }}>
        {/* LEFT — field mapping */}
        <aside style={{ background: "var(--bg-0)", borderRight: "0.5px solid var(--border-default)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {showBanner && (
            <div style={{ background: "linear-gradient(90deg,var(--brand-tint),#F8F4FF)", borderBottom: "0.5px solid var(--purple-200)", padding: "12px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--brand-primary)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon name="check" size={11} color="#fff"/>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: "var(--fg-1)", lineHeight: 1.45 }}>
                Nerion распознал <strong>7 из 8 полей</strong> и связал их с таблицей «Преподаватели». Поле <strong>«Подписант»</strong> нужно выбрать вручную.
              </div>
              <button onClick={() => setShowBanner(false)} style={{ background: 0, border: 0, color: "var(--fg-3)", cursor: "pointer", padding: 2 }}><Icon name="x" size={12}/></button>
            </div>
          )}
          <div style={{ padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Поля документа</div>
            <span style={{ fontSize: 11, color: unbound ? "var(--amber-600)" : "var(--green-600)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: unbound ? "var(--amber-500)" : "var(--green-500)" }}/>
              {boundCount}/{mapping.length} связано
            </span>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "4px 14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {mapping.map((m, i) => {
              const isUnbound = !m.field;
              return (
                <div key={i} style={{ background: isUnbound ? "var(--amber-50)" : "var(--bg-1)", border: `0.5px solid ${isUnbound ? "#FDE68A" : "var(--border-default)"}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {isUnbound && <Icon name="warn" size={12} color="var(--amber-600)"/>}
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{m.label}</span>
                    <code style={{ fontSize: 10, background: "var(--bg-2)", color: "var(--fg-2)", padding: "1px 6px", borderRadius: 3 }}>{`{{${m.ph}}}`}</code>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <select value={m.table ? `${m.table}::${m.field}` : ""} onChange={e => { const [table, field] = e.target.value.split("::"); setRow(i, { table: table || "", field: field || "", sample: field ? m.sample : "—" }); }}
                      style={{ height: 30, borderRadius: 5, border: `0.5px solid ${isUnbound ? "#F59E0B" : "var(--border-strong)"}`, padding: "0 8px", fontSize: 12, background: "var(--bg-0)", color: isUnbound ? "var(--amber-700)" : "var(--fg-1)", outline: 0, fontFamily: "inherit" }}>
                      <option value="">— не связано —</option>
                      {Object.entries(BIND_TABLES).map(([tbl, fields]) => (
                        <optgroup key={tbl} label={tbl}>
                          {fields.map(f => <option key={f} value={`${tbl}::${f}`}>{f}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <select value={m.fmt} onChange={e => setRow(i, { fmt: e.target.value })}
                      style={{ height: 30, borderRadius: 5, border: "0.5px solid var(--border-strong)", padding: "0 8px", fontSize: 12, background: "var(--bg-0)", color: "var(--fg-2)", outline: 0, fontFamily: "inherit" }}>
                      {FORMATS.map(f => <option key={f} value={f}>{f === "—" ? "без формата" : f}</option>)}
                    </select>
                  </div>
                  {m.field && <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="arrow" size={10} color="var(--green-500)"/>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{m.sample}</span>
                  </div>}
                </div>
              );
            })}
            <button onClick={() => toast("Поле добавлено")} style={{ padding: "9px 12px", background: "transparent", border: "0.5px dashed var(--border-strong)", borderRadius: 6, color: "var(--fg-2)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
              <Icon name="plus" size={11}/>Добавить поле
            </button>
          </div>
        </aside>

        {/* RIGHT — live preview */}
        <section style={{ background: "var(--neutral-200)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 40, background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, fontSize: 12, flexShrink: 0 }}>
            <span style={{ color: "var(--fg-3)" }}>Превью на:</span>
            <select value={previewRec} onChange={e => setPreviewRec(e.target.value)} style={{ background: "var(--bg-1)", border: "0.5px solid var(--border-default)", borderRadius: 4, padding: "3px 8px", fontSize: 12, color: "var(--fg-1)", outline: 0, fontFamily: "inherit", cursor: "pointer" }}>
              {RECORDS.map((r, i) => <option key={r} value={r}>{r}{i === 0 ? " (1/14)" : ""}</option>)}
            </select>
            <div style={{ flex: 1 }}/>
            <button onClick={() => setZoom(z => Math.max(50, z - 8))} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-2)", fontSize: 14, padding: 4 }}>−</button>
            <span style={{ fontSize: 11, color: "var(--fg-2)", fontFamily: "var(--font-mono)", minWidth: 34, textAlign: "center" }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(140, z + 8))} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-2)", fontSize: 14, padding: 4 }}>+</button>
            <div style={{ width: 1, height: 16, background: "var(--border-default)", margin: "0 4px" }}/>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--fg-3)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-500)" }}/>Live
            </span>
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "grid", placeItems: "start center", padding: 28 }}>
            <SpravkaDoc scale={zoom / 100} rec={previewRec} hl={true}/>
          </div>
          <div style={{ height: 26, borderTop: "0.5px solid var(--border-default)", background: "var(--bg-0)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: 11, color: "var(--fg-3)", flexShrink: 0 }}>
            <span>Стр. 1 / 1 · 142 КБ · подсветка = подставленные поля</span>
            <span>обновлено 0.3 с назад</span>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Generate (single / bulk)
   ════════════════════════════════════════════════════════════════ */
function PdfGenerate({ tpl, onBack, onArchive, toast }) {
  const [mode, setMode] = usePdfSt("single");
  const [rec, setRec] = usePdfSt(RECORDS[0]);
  const [num, setNum] = usePdfSt("184/2025");
  const [phase, setPhase] = usePdfSt("idle"); // idle | running | done
  const [progress, setProgress] = usePdfSt(0);

  usePdfEff(() => {
    if (phase !== "running") return;
    setProgress(0);
    const iv = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(iv); setPhase("done"); return 100; }
      return p + (mode === "bulk" ? 4 : 12);
    }), mode === "bulk" ? 90 : 70);
    return () => clearInterval(iv);
  }, [phase, mode]);

  const total = 14;
  const doneCount = Math.round(progress / 100 * total);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", height: "calc(100vh - 56px)" }}>
      {/* form */}
      <div style={{ borderRight: "0.5px solid var(--border-default)", background: "var(--bg-1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "0.5px solid var(--border-default)", background: "var(--bg-0)" }}>
          <button onClick={onBack} style={{ background: 0, border: 0, color: "var(--fg-3)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: 0, fontFamily: "inherit" }}>
            <Icon name="arrow" size={12} style={{ transform: "rotate(180deg)" }}/>К шаблонам
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MiniDoc w={36} h={46}/>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700 }}>{tpl?.name || "Справка с места работы"}</h1>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{tpl?.gost || "ГОСТ Р 7.0.97-2016"}</div>
            </div>
          </div>
        </div>

        {/* mode switch */}
        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-2)", borderRadius: 8 }}>
            {[["single", "Одна запись"], ["bulk", "Вся таблица"]].map(([k, l]) => (
              <button key={k} onClick={() => { setMode(k); setPhase("idle"); }} style={{ flex: 1, height: 32, border: 0, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit", background: mode === k ? "var(--bg-0)" : "transparent", color: mode === k ? "var(--fg-1)" : "var(--fg-2)", boxShadow: mode === k ? "var(--shadow-1)" : "none", transition: "all 120ms" }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "18px 24px" }}>
          {mode === "single" ? (
            <>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Для кого</div>
              <select value={rec} onChange={e => setRec(e.target.value)} style={{ width: "100%", height: 36, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 12px", fontSize: 13, background: "var(--bg-0)", color: "var(--fg-1)", outline: 0, fontFamily: "inherit", marginBottom: 20 }}>
                {RECORDS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Ручные поля</div>
              <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, padding: "4px 14px", marginBottom: 16 }}>
                {[["Номер документа", num, setNum], ["Дата выдачи", "15.09.2025", null], ["Кому адресовано", "По месту требования", null]].map(([lbl, val, set], i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: i < 2 ? "0.5px solid var(--border-default)" : 0 }}>
                    <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{lbl}</span>
                    {set ? <input value={val} onChange={e => set(e.target.value)} style={{ height: 28, border: "0.5px solid var(--border-strong)", borderRadius: 4, padding: "0 8px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-1)", background: "var(--bg-0)", outline: 0 }}/> : <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{val}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--brand-tint)", borderRadius: 6, fontSize: 12, color: "var(--purple-700)" }}>
                <Icon name="check" size={13} color="var(--green-600)"/>Все обязательные поля заполнены
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Источник</div>
              <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-tint)", color: "var(--purple-600)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="table" size={18}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Преподаватели</div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)" }}>14 записей · 1 неактивная исключена</div>
                </div>
                <Badge tone="brand">14 PDF</Badge>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Фильтр</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                <Badge tone="neutral" dot>Активен · да</Badge>
                <button style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, border: "0.5px dashed var(--border-strong)", background: "transparent", color: "var(--fg-3)", cursor: "pointer", fontFamily: "inherit" }}>+ условие</button>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Имя файла</div>
              <div style={{ display: "flex", alignItems: "center", height: 36, border: "0.5px solid var(--border-strong)", borderRadius: 6, overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 16 }}>
                <span style={{ padding: "0 8px", background: "var(--bg-2)", color: "var(--fg-3)", height: "100%", display: "flex", alignItems: "center" }}>Справка_</span>
                <span style={{ padding: "0 4px", background: "var(--brand-tint)", color: "var(--purple-700)", margin: "0 2px", borderRadius: 3, fontSize: 11 }}>{`{{ФИО}}`}</span>
                <span style={{ padding: "0 8px", color: "var(--fg-3)" }}>.pdf</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--brand-tint)", borderRadius: 6, fontSize: 12, color: "var(--purple-700)" }}>
                <Icon name="check" size={13} color="var(--green-600)"/>Будет создано 14 документов в один .zip
              </div>
            </>
          )}
        </div>

        {/* footer action */}
        <div style={{ padding: 16, borderTop: "0.5px solid var(--border-default)", background: "var(--bg-0)" }}>
          {phase === "idle" && (
            <div style={{ display: "flex", gap: 8 }}>
              {mode === "single" && <Button variant="ghost" size="md" icon={<Icon name="download" size={13}/>}>Печать</Button>}
              <Button variant="primary" size="md" style={{ flex: 1 }} icon={<Icon name="file" size={13} color="#fff"/>} onClick={() => setPhase("running")}>
                {mode === "single" ? "Скачать PDF" : "Сгенерировать 14 документов"}
              </Button>
            </div>
          )}
          {phase === "running" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "var(--fg-2)" }}>{mode === "bulk" ? `Генерация ${doneCount} / ${total}…` : "Рендер документа…"}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg-2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "var(--brand-primary)", borderRadius: 3, transition: "width 80ms linear" }}/>
              </div>
            </div>
          )}
          {phase === "done" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--green-50)", border: "0.5px solid var(--green-100)", borderRadius: 6, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green-500)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={12} color="#fff"/></div>
                <span style={{ fontSize: 12, color: "var(--green-700)", fontWeight: 500 }}>{mode === "single" ? "Документ готов и скачан." : "14 документов готовы. Архив скачан."}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="secondary" size="md" style={{ flex: 1 }} onClick={() => setPhase("idle")}>Ещё раз</Button>
                <Button variant="primary" size="md" style={{ flex: 1 }} icon={<Icon name="file" size={13} color="#fff"/>} onClick={onArchive}>В архив</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* preview */}
      <div style={{ background: "var(--neutral-200)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 40, background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, fontSize: 12, flexShrink: 0 }}>
          <span style={{ fontWeight: 500 }}>Предпросмотр</span>
          <Badge tone="success" dot>свежий рендер</Badge>
          <div style={{ flex: 1 }}/>
          {mode === "bulk" && <span style={{ fontSize: 11, color: "var(--fg-3)" }}>показан 1-й из 14</span>}
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "grid", placeItems: "start center", padding: 32 }}>
          <SpravkaDoc scale={0.86} rec={mode === "single" ? rec : RECORDS[0]} hl={false}/>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Archive
   ════════════════════════════════════════════════════════════════ */
function PdfArchive({ toast }) {
  const [search, setSearch] = usePdfSt("");
  const list = ARCHIVE.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.rec.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px 80px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Архив документов</h1>
      <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 22 }}>Все сгенерированные PDF хранятся 90 дней. Скачивай, делись по ссылке или генерируй заново.</p>
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Icon name="search" size={14} color="var(--fg-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или записи…" style={{ height: 36, width: "100%", padding: "0 12px 0 32px", border: "0.5px solid var(--border-strong)", borderRadius: 6, background: "var(--bg-0)", fontSize: 13, outline: 0, fontFamily: "inherit", boxSizing: "border-box" }}/>
      </div>
      <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
        <table className="dt">
          <thead><tr><th>Документ</th><th>Шаблон</th><th>Запись</th><th>Создан</th><th style={{ textAlign: "right" }}>Размер</th><th style={{ width: 96 }}></th></tr></thead>
          <tbody>
            {list.map((a, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 32, borderRadius: 3, background: a.kind === "bulk" ? "var(--amber-50)" : "var(--red-50)", border: `0.5px solid ${a.kind === "bulk" ? "var(--amber-100)" : "var(--red-100)"}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 7, fontWeight: 700, color: a.kind === "bulk" ? "var(--amber-700)" : "var(--red-600)", fontFamily: "var(--font-mono)" }}>{a.kind === "bulk" ? "ZIP" : "PDF"}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{a.by}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--fg-2)" }}>{a.tpl}</td>
                <td style={{ color: "var(--fg-2)" }}>{a.rec}</td>
                <td style={{ color: "var(--fg-2)", whiteSpace: "nowrap" }}>{a.date}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--fg-2)" }}>{a.size}</td>
                <td>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => toast("Скачивание начато")} style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }}><Icon name="download" size={14}/></button>
                    <button onClick={() => toast("Ссылка скопирована")} style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }}><Icon name="extlink" size={14}/></button>
                    <button style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }}><Icon name="more" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ORCHESTRATOR
   ════════════════════════════════════════════════════════════════ */
function ScreenPDF({ onNavigate }) {
  const [view, setView] = usePdfSt("templates"); // templates | library | editor | generate | archive
  const [activeTpl, setActiveTpl] = usePdfSt(null);
  const [toast, setToast] = usePdfSt(null);
  const show = (t) => { setToast(t); setTimeout(() => setToast(null), 2600); };

  const isDeep = view === "editor" || view === "generate";
  const crumbMap = { templates: ["PDF", "Мои шаблоны"], library: ["PDF", "Библиотека"], archive: ["PDF", "Архив"], editor: ["PDF", activeTpl?.name || "Шаблон", "Настройка"], generate: ["PDF", activeTpl?.name || "Шаблон", "Генерация"] };

  const Tabs = () => (
    <div style={{ background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 32px", gap: 4, height: 44 }}>
      {[["templates", "Мои шаблоны"], ["library", "Библиотека"], ["archive", "Архив"]].map(([k, l]) => (
        <button key={k} onClick={() => setView(k)} style={{ height: "100%", padding: "0 14px", border: 0, borderBottom: `2px solid ${view === k ? "var(--brand-primary)" : "transparent"}`, background: "transparent", color: view === k ? "var(--fg-1)" : "var(--fg-2)", fontSize: 13, fontWeight: view === k ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
      ))}
    </div>
  );

  return (
    <Shell current="pdf01" breadcrumb={["Кафедра математики", ...crumbMap[view]]} onNavigate={onNavigate}>
      {!isDeep && <Tabs/>}
      {view === "templates" && <PdfTemplates onOpen={t => { setActiveTpl(t); setView("editor"); }} onGenerate={t => { setActiveTpl(t); setView("generate"); }} onLibrary={() => setView("library")} toast={show}/>}
      {view === "library"   && <PdfLibrary onBack={() => setView("templates")} toast={show}/>}
      {view === "editor"    && <PdfEditor tpl={activeTpl} onBack={() => setView("templates")} onGenerate={t => { setActiveTpl(t); setView("generate"); }} toast={show}/>}
      {view === "generate"  && <PdfGenerate tpl={activeTpl} onBack={() => setView("templates")} onArchive={() => setView("archive")} toast={show}/>}
      {view === "archive"   && <PdfArchive toast={show}/>}
      {toast && <Toast tone="success" title={toast} onClose={() => setToast(null)}/>}
    </Shell>
  );
}

Object.assign(window, { ScreenPDF });
