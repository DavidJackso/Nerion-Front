// FILES output — published lists (collections) the frontend fetches by slug, no IDs / no hardcoding
const { useState: useFileSt } = React;

/* ─── File-type meta ──────────────────────────────────────── */
const F_TYPES = {
  pdf:   { label: "PDF",  bg: "var(--red-50)",     fg: "var(--red-600)",     bd: "var(--red-100)" },
  docx:  { label: "DOCX", bg: "var(--blue-50)",    fg: "var(--blue-600)",    bd: "#DBEAFE" },
  pptx:  { label: "PPTX", bg: "var(--amber-50)",   fg: "var(--amber-700)",   bd: "var(--amber-100)" },
  zip:   { label: "ZIP",  bg: "var(--neutral-100)",fg: "var(--neutral-600)", bd: "var(--border-default)" },
  img:   { label: "IMG",  bg: "var(--brand-tint)", fg: "var(--purple-600)",  bd: "var(--purple-100)" },
  video: { label: "MP4",  bg: "var(--purple-50)",  fg: "var(--purple-700)",  bd: "var(--purple-100)" },
};
const SRC_LABEL = { gen: "Сгенерировано", course: "Курс", upload: "Загружено" };
const typeIcon = (t) => t === "img" ? "image" : t === "video" ? "play" : t === "zip" ? "folder" : "file";
const fmtSize = (kb) => kb >= 1024 ? `${(kb / 1024).toFixed(kb >= 10240 ? 0 : 1)} МБ` : `${kb} КБ`;

/* ─── Files in the space (generated docs + uploads + course attachments) ─── */
const F_FILES = [
  // 10 generated PDFs — the "нагенерил 10 PDF" scenario
  { name: "Справка_Иванов_АП.pdf",        type: "pdf", kb: 142,  src: "gen", tpl: "Справка",   date: "Сегодня, 14:32" },
  { name: "Справка_Петрова_МС.pdf",       type: "pdf", kb: 139,  src: "gen", tpl: "Справка",   date: "Сегодня, 14:31" },
  { name: "Справка_Сидоров_ДИ.pdf",       type: "pdf", kb: 141,  src: "gen", tpl: "Справка",   date: "Сегодня, 14:31" },
  { name: "Справка_Кузнецова_ОВ.pdf",     type: "pdf", kb: 140,  src: "gen", tpl: "Справка",   date: "Сегодня, 14:30" },
  { name: "Справка_Орлов_ПВ.pdf",         type: "pdf", kb: 138,  src: "gen", tpl: "Справка",   date: "Сегодня, 14:30" },
  { name: "Ведомость_318М.pdf",           type: "pdf", kb: 264,  src: "gen", tpl: "Ведомость", date: "Вчера, 11:05" },
  { name: "Ведомость_412М.pdf",           type: "pdf", kb: 258,  src: "gen", tpl: "Ведомость", date: "Вчера, 11:04" },
  { name: "Приказ_184к_Орлов.pdf",        type: "pdf", kb: 98,   src: "gen", tpl: "Приказ",    date: "18 июня" },
  { name: "Приказ_185к_Андреев.pdf",      type: "pdf", kb: 96,   src: "gen", tpl: "Приказ",    date: "18 июня" },
  { name: "Нагрузка_кафедра.pdf",         type: "pdf", kb: 412,  src: "gen", tpl: "Нагрузка",  date: "15 июня" },
  // course attachments (file-field uploads)
  { name: "Лекция_1_доска.jpg",           type: "img", kb: 1840, src: "course", course: "Математический анализ", date: "16 июня" },
  { name: "График_ряда.png",              type: "img", kb: 320,  src: "course", course: "Математический анализ", date: "16 июня" },
  { name: "Силлабус_МатАнализ.pdf",       type: "pdf", kb: 248,  src: "course", course: "Математический анализ", date: "16 июня" },
  { name: "Матрицы_схема.png",            type: "img", kb: 412,  src: "course", course: "Линейная алгебра",      date: "15 июня" },
  { name: "Граф_пример.png",              type: "img", kb: 286,  src: "course", course: "Дискретная математика", date: "12 июня" },
  { name: "Дерево_обхода.png",            type: "img", kb: 244,  src: "course", course: "Дискретная математика", date: "12 июня" },
  { name: "Чертёж_1.png",                 type: "img", kb: 520,  src: "course", course: "Геометрия",             date: "10 июня" },
  { name: "Чертёж_2.png",                 type: "img", kb: 540,  src: "course", course: "Геометрия",             date: "10 июня" },
  { name: "Код_примеры.zip",              type: "zip", kb: 1240, src: "course", course: "Численные методы",      date: "5 июня" },
  { name: "Лабы.pdf",                     type: "pdf", kb: 1620, src: "course", course: "Физика",                date: "3 июня" },
  { name: "Демонстрация.mp4",             type: "video", kb: 184320, src: "course", course: "Физика",            date: "3 июня" },
  { name: "Логотип_кафедры.png",          type: "img", kb: 88,   src: "upload", date: "1 июня" },
];

/* ─── Published lists — each is a stable endpoint the frontend hits by slug ─── */
const F_LISTS = [
  { slug: "generated-docs", name: "Документы из генератора", icon: "file",   rule: ["Источник", "генерация"], pred: f => f.src === "gen",        public: true,  hero: true },
  { slug: "spravki",        name: "Справки с места работы",  icon: "file",   rule: ["Шаблон", "Справка"],     pred: f => f.tpl === "Справка",    public: true },
  { slug: "materials",      name: "Учебные материалы",       icon: "folder", rule: ["Источник", "курсы"],     pred: f => f.src === "course",     public: false },
  { slug: "gallery",        name: "Галерея изображений",     icon: "image",  rule: ["Тип", "изображение"],    pred: f => f.type === "img",       public: true },
];
const listFiles = (l) => F_FILES.filter(l.pred);
const BASE = "https://app.nerion.ru/api/math-dept/lists";

/* ─── List builder: rule fields, predicate, slug ──────────── */
const F_COURSES = [...new Set(F_FILES.filter(f => f.course).map(f => f.course))];
const FIELD_DEFS = {
  src:    { label: "Источник",   kind: "select", opts: [["gen", "Генерация"], ["course", "Курсы"], ["upload", "Загрузки"]] },
  type:   { label: "Тип файла",  kind: "select", opts: Object.entries(F_TYPES).map(([k, v]) => [k, v.label]) },
  tpl:    { label: "Шаблон",     kind: "select", opts: [["Справка", "Справка"], ["Ведомость", "Ведомость"], ["Приказ", "Приказ"], ["Нагрузка", "Нагрузка"]] },
  course: { label: "Курс",       kind: "select", opts: F_COURSES.map(c => [c, c]) },
  name:   { label: "Имя файла",  kind: "text" },
};
function condMatch(f, c) {
  if (!c.value) return true;
  if (FIELD_DEFS[c.field].kind === "text") return String(f.name || "").toLowerCase().includes(String(c.value).toLowerCase());
  const eq = String(f[c.field] ?? "") === String(c.value);
  return c.op === "ne" ? !eq : eq;
}
const makePred = (conds) => (f) => conds.every(c => condMatch(f, c));
function ruleOf(conds) {
  const active = conds.filter(c => c.value);
  if (active.length === 0) return ["Все файлы", ""];
  if (active.length === 1) { const c = active[0], d = FIELD_DEFS[c.field]; const vl = d.kind === "text" ? `«${c.value}»` : (d.opts.find(o => o[0] === c.value)?.[1] || c.value); return [d.label, vl]; }
  return ["Правило", `${active.length} условия`];
}
function iconOf(conds) {
  if (conds.some(c => c.field === "type" && c.value === "img")) return "image";
  if (conds.some(c => c.field === "src" && c.value === "course")) return "folder";
  return "file";
}
const TRANSLIT = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
const slugify = (s) => (s || "").toLowerCase().split("").map(ch => TRANSLIT[ch] ?? (/[a-z0-9]/.test(ch) ? ch : " ")).join("").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 32) || "novyy-spisok";

/* ─── Style helpers ───────────────────────────────────────── */
const fToolBtn = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", boxSizing: "border-box", border: `0.5px solid ${active ? "var(--purple-300)" : "var(--border-strong)"}`, background: active ? "var(--brand-tint)" : "var(--bg-0)", color: active ? "var(--purple-700)" : "var(--fg-1)", transition: "background 120ms, border-color 120ms" });
const fPill = { minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--brand-primary)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums" };

/* ─── File type glyph ─────────────────────────────────────── */
function FileGlyph({ type, w = 30, h = 38 }) {
  const t = F_TYPES[type] || F_TYPES.pdf;
  return (
    <div style={{ width: w, height: h, borderRadius: 4, background: t.bg, border: `0.5px solid ${t.bd}`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, flexShrink: 0, position: "relative" }}>
      <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", opacity: .5 }}>
        <Icon name={typeIcon(type)} size={Math.round(w * 0.42)} color={t.fg}/>
      </div>
      <span style={{ fontSize: Math.max(7, Math.round(w * 0.26)), fontWeight: 700, color: t.fg, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>{t.label}</span>
    </div>
  );
}

/* ─── Popover + checklist (for All-files filters) ─────────── */
function FilesPopover({ open, onClose, children, width = 220 }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }}/>
      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 41, width, background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 10, boxShadow: "var(--shadow-3)", animation: "slideUp 130ms ease-out" }}>{children}</div>
    </>
  );
}
function CheckList({ items, picked, onToggle }) {
  return (
    <div style={{ padding: 8, maxHeight: 260, overflow: "auto" }}>
      {items.map(({ key, label, hint }) => {
        const on = picked.has(key);
        return (
          <button key={key} onClick={() => onToggle(key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", border: 0, borderRadius: 6, cursor: "pointer", background: on ? "var(--brand-tint)" : "transparent", textAlign: "left", fontFamily: "inherit" }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? "var(--brand-primary)" : "var(--border-strong)"}`, background: on ? "var(--brand-primary)" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>{on && <Icon name="check" size={10} color="#fff"/>}</span>
            <span style={{ flex: 1, fontSize: 13, color: "var(--fg-1)" }}>{label}</span>
            {hint != null && <span style={{ fontSize: 11, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Endpoint bar (copyable stable URL) ──────────────────── */
function EndpointBar({ slug, isPublic, onToast }) {
  const [copied, setCopied] = useFileSt(false);
  const copy = () => { setCopied(true); onToast("Адрес скопирован"); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-0)", border: "0.5px solid var(--border-strong)", borderRadius: 8, padding: "8px 8px 8px 12px" }}>
      <Method method="GET"/>
      <code style={{ flex: 1, fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--fg-1)", background: 0, padding: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`/api/math-dept/lists/${slug}`}</code>
      <Badge tone={isPublic ? "success" : "neutral"} dot>{isPublic ? "публичный" : "по ключу"}</Badge>
      <Button variant="secondary" size="sm" icon={<Icon name={copied ? "check" : "copy"} size={12}/>} onClick={copy}>{copied ? "Скопировано" : "Копировать"}</Button>
    </div>
  );
}

/* ─── Code panel — the generic "fetch + render, no IDs" snippet ─── */
function CodePanel({ slug, count, isPublic, sample, onToast }) {
  const [tab, setTab] = useFileSt("js");
  const [copied, setCopied] = useFileSt(false);
  const auth = isPublic ? "" : ", { headers: { Authorization: `Bearer ${KEY}` } }";
  const MIME = { pdf: "application/pdf", docx: "application/vnd.openxmlformats", pptx: "application/vnd.openxmlformats", zip: "application/zip", img: "image/png", video: "video/mp4" };
  const ext = { pdf: "pdf", docx: "docx", pptx: "pptx", zip: "zip", img: "png", video: "mp4" };
  const s = sample || { name: "file.pdf", type: "pdf", kb: 142 };
  const snippets = {
    js: `// Вывести список на фронте — без ID и без хардкода.
// Меняется список в Nerion — меняется и выдача, код трогать не нужно.
const res = await fetch('${BASE}/${slug}'${auth});
const { data } = await res.json();   // массив файлов

const box = document.querySelector('#files');
data.forEach(f => {
  const a = document.createElement('a');
  a.href = f.url;            // прямая CDN-ссылка
  a.textContent = f.name;
  a.target = '_blank';
  box.append(a);
});`,
    curl: `curl '${BASE}/${slug}'${isPublic ? "" : " \\\n  -H 'Authorization: Bearer nrn_live_••••3f2a'"}`,
  };
  const response = `{
  "list": "${slug}",
  "count": ${count},
  "data": [
    {
      "name": "${s.name}",
      "type": "${MIME[s.type] || "application/octet-stream"}",
      "size": ${Math.round((s.kb || 142) * 1024)},
      "url": "https://cdn.nerion.ru/math-dept/file_7b3e9a.${ext[s.type] || "bin"}",
      "created_at": "2025-06-21T14:32:00Z"
    }
    // … ещё ${Math.max(0, count - 1)}
  ]
}`;
  const copy = () => { setCopied(true); onToast("Код скопирован"); setTimeout(() => setCopied(false), 1500); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Получить на фронте</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["js", "JavaScript"], ["curl", "cURL"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: "5px 10px", fontSize: 12, background: tab === k ? "var(--bg-0)" : "transparent", border: tab === k ? "0.5px solid var(--border-strong)" : "0.5px solid transparent", borderRadius: 4, cursor: "pointer", color: tab === k ? "var(--fg-1)" : "var(--fg-2)", fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ position: "relative", background: "var(--neutral-900)", borderRadius: 8, overflow: "hidden" }}>
          <button onClick={copy} style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.08)", border: 0, color: "rgba(255,255,255,.7)", padding: "4px 9px", borderRadius: 4, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, zIndex: 1 }}><Icon name={copied ? "check" : "copy"} size={11} color="rgba(255,255,255,.7)"/>{copied ? "Готово" : "Копировать"}</button>
          <pre style={{ margin: 0, padding: "16px 18px", color: "rgba(255,255,255,.9)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.6, overflow: "auto", whiteSpace: "pre-wrap" }}>{snippets[tab]}</pre>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>200 OK · application/json</div>
          <div style={{ background: "var(--neutral-900)", borderRadius: 8, padding: "16px 18px", height: "calc(100% - 22px)", boxSizing: "border-box" }}>
            <pre style={{ margin: 0, color: "rgba(255,255,255,.9)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.6, overflow: "auto", whiteSpace: "pre-wrap" }}>{response}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create-list builder modal ───────────────────────────── */
const clSelect = { height: 32, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 26px 0 10px", fontSize: 13, background: "var(--bg-0)", color: "var(--fg-1)", outline: 0, appearance: "none", cursor: "pointer", fontFamily: "inherit" };
function CLChevron() { return <Icon name="chevd" size={11} color="var(--fg-3)" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>; }

function CreateListModal({ onClose, onCreate }) {
  const [name, setName] = useFileSt("");
  const [conds, setConds] = useFileSt([{ field: "src", op: "eq", value: "gen" }]);
  const [isPublic, setIsPublic] = useFileSt(true);
  const slug = slugify(name);
  const matches = F_FILES.filter(makePred(conds));

  const setCond = (i, patch) => setConds(cs => cs.map((c, j) => j === i ? { ...c, ...patch } : c));
  const onField = (i, field) => setCond(i, { field, op: "eq", value: "" });
  const addCond = () => setConds(cs => [...cs, { field: "type", op: "eq", value: "" }]);
  const removeCond = (i) => setConds(cs => cs.filter((_, j) => j !== i));

  const create = () => onCreate({ slug, name: name.trim() || "Новый список", icon: iconOf(conds), rule: ruleOf(conds), pred: makePred(conds), public: isPublic, custom: true });

  return (
    <Modal open={true} onClose={onClose} width={580}
      title="Новый список файлов"
      subtitle="Задай правило — Nerion соберёт подходящие файлы и даст постоянный адрес для фронта."
      footer={<><Button variant="ghost" size="md" onClick={onClose}>Отмена</Button><Button variant="primary" size="md" icon={<Icon name="check" size={13} color="#fff"/>} onClick={create}>Создать список</Button></>}>
      {/* Name + slug */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Название</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Справки для портала"/>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
          Адрес: <code style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "var(--bg-2)", padding: "1px 6px", borderRadius: 3 }}>{`/lists/${slug}`}</code>
        </div>
      </div>

      {/* Conditions */}
      <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 8 }}>Правило отбора</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {conds.map((c, i) => {
          const d = FIELD_DEFS[c.field];
          return (
            <div key={i}>
              {i > 0 && <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 2px" }}>и</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <select value={c.field} onChange={e => onField(i, e.target.value)} style={{ ...clSelect, fontWeight: 500 }}>
                    {Object.entries(FIELD_DEFS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select><CLChevron/>
                </div>
                {d.kind === "select" ? (
                  <>
                    <div style={{ position: "relative" }}>
                      <select value={c.op} onChange={e => setCond(i, { op: e.target.value })} style={{ ...clSelect, color: "var(--fg-2)", width: 110 }}>
                        <option value="eq">равно</option><option value="ne">не равно</option>
                      </select><CLChevron/>
                    </div>
                    <div style={{ position: "relative", flex: 1, minWidth: 130 }}>
                      <select value={c.value} onChange={e => setCond(i, { value: e.target.value })} style={{ ...clSelect, width: "100%", color: c.value ? "var(--fg-1)" : "var(--fg-3)" }}>
                        <option value="">выбери значение…</option>
                        {d.opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select><CLChevron/>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: "var(--fg-2)", padding: "0 4px" }}>содержит</span>
                    <input value={c.value} onChange={e => setCond(i, { value: e.target.value })} placeholder="текст…" style={{ flex: 1, minWidth: 130, height: 32, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 10px", fontSize: 13, background: "var(--bg-0)", color: "var(--fg-1)", outline: 0, fontFamily: "inherit", boxSizing: "border-box" }}/>
                  </>
                )}
                <button onClick={() => removeCond(i)} disabled={conds.length === 1} style={{ background: 0, border: 0, cursor: conds.length === 1 ? "default" : "pointer", color: conds.length === 1 ? "var(--neutral-300)" : "var(--fg-3)", padding: 4, display: "flex", flexShrink: 0 }}><Icon name="x" size={14}/></button>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={addCond} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--brand-primary)", fontSize: 12, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, marginBottom: 22, padding: 0 }}><Icon name="plus" size={12}/>Добавить условие</button>

      {/* Access */}
      <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 8 }}>Доступ</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[[true, "Публичный", "Фронт читает без ключа"], [false, "По ключу", "Нужен Bearer-токен"]].map(([v, t, h]) => (
          <button key={String(v)} onClick={() => setIsPublic(v)} style={{ flex: 1, textAlign: "left", padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: isPublic === v ? "var(--brand-tint)" : "var(--bg-0)", border: `1px solid ${isPublic === v ? "var(--brand-primary)" : "var(--border-default)"}`, fontFamily: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: isPublic === v ? "var(--purple-700)" : "var(--fg-1)" }}><Icon name={v ? "extlink" : "lock"} size={13}/>{t}</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>{h}</div>
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div style={{ background: "var(--brand-tint)", border: "0.5px solid var(--purple-200)", borderRadius: 10, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: matches.length ? 10 : 0 }}>
          <div style={{ display: "flex" }}>
            {matches.slice(0, 5).map((f, i) => <span key={i} style={{ marginLeft: i ? -8 : 0, position: "relative", zIndex: 5 - i }}><FileGlyph type={f.type} w={22} h={27}/></span>)}
          </div>
          <div style={{ flex: 1, fontSize: 13, color: "var(--fg-1)" }}>
            Подойдёт <strong style={{ color: "var(--purple-700)", fontVariantNumeric: "tabular-nums" }}>{matches.length}</strong> {matches.length === 1 ? "файл" : "файлов"}
            {matches.length === 0 && <span style={{ color: "var(--fg-3)" }}> — ослабь условия</span>}
          </div>
          <Badge tone={isPublic ? "success" : "neutral"} dot>{isPublic ? "публичный" : "по ключу"}</Badge>
        </div>
        {matches.length > 0 && (
          <code style={{ display: "block", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--purple-700)", background: "var(--bg-0)", border: "0.5px solid var(--purple-100)", padding: "6px 9px", borderRadius: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`GET /api/math-dept/lists/${slug}`}</code>
        )}
      </div>
    </Modal>
  );
}

/* ─── List card ───────────────────────────────────────────── */
function ListCard({ list, onOpen }) {
  const n = listFiles(list).length;
  return (
    <div onClick={onOpen} style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 10, padding: 16, cursor: "pointer", transition: "box-shadow 160ms, transform 160ms", display: "flex", flexDirection: "column", gap: 12 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--brand-tint)", color: "var(--purple-600)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={list.icon} size={19}/></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{list.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="filter" size={10}/><span>{list.rule[0]} · {list.rule[1]}</span>
          </div>
        </div>
        <Badge tone={list.public ? "success" : "neutral"} dot>{list.public ? "публичный" : "по ключу"}</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "0.5px solid var(--border-default)" }}>
        <code style={{ flex: 1, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-2)", background: "var(--bg-1)", padding: "4px 8px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`/lists/${list.slug}`}</code>
        <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{n} файл.</span>
        <Icon name="chev" size={14} color="var(--fg-3)"/>
      </div>
    </div>
  );
}

/* ─── File row (shared) ───────────────────────────────────── */
function FileRow({ f, onToast, showSource = true }) {
  return (
    <tr className="frow">
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <FileGlyph type={f.type} w={26} h={32}/>
          <span style={{ fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-1)" }}>{f.name}</span>
        </div>
      </td>
      {showSource && <td><Badge tone={f.src === "gen" ? "brand" : "neutral"}>{f.src === "course" ? f.course : f.tpl ? `${SRC_LABEL[f.src]} · ${f.tpl}` : SRC_LABEL[f.src]}</Badge></td>}
      <td style={{ color: "var(--fg-3)", whiteSpace: "nowrap" }}>{f.date}</td>
      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--fg-2)", whiteSpace: "nowrap" }}>{fmtSize(f.kb)}</td>
      <td>
        <div className="frow-act" style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 100ms" }}>
          <button title="Скачать" onClick={() => onToast("Скачивание начато")} style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }}><Icon name="download" size={14}/></button>
          <button title="Копировать ссылку" onClick={() => onToast("Ссылка скопирована")} style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }}><Icon name="link" size={14}/></button>
        </div>
      </td>
    </tr>
  );
}

/* ─── VIEW: list detail ───────────────────────────────────── */
function ListDetail({ list, onBack, onToast }) {
  const files = listFiles(list);
  return (
    <div style={{ padding: "20px 32px 56px", maxWidth: 1080 }}>
      <button onClick={onBack} style={{ background: 0, border: 0, color: "var(--fg-3)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 0, fontFamily: "inherit" }}>
        <Icon name="arrow" size={12} style={{ transform: "rotate(180deg)" }}/>Все списки
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>{list.name}</h1>
        <Badge tone="brand">{list.rule[0]} · {list.rule[1]}</Badge>
      </div>
      <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 18 }}>
        Список собирается автоматически по правилу. Фронт запрашивает его по постоянному адресу — id файлов знать не нужно, выдача обновляется сама.
      </p>

      <div style={{ marginBottom: 20 }}><EndpointBar slug={list.slug} isPublic={list.public} onToast={onToast}/></div>
      <div style={{ marginBottom: 28 }}><CodePanel slug={list.slug} count={files.length} isPublic={list.public} sample={files[0]} onToast={onToast}/></div>

      <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>В списке · {files.length}</div>
      <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
        <table className="dt">
          <thead><tr><th>Файл</th><th>Источник</th><th>Создан</th><th style={{ textAlign: "right" }}>Размер</th><th style={{ width: 72 }}></th></tr></thead>
          <tbody>{files.map((f, i) => <FileRow key={i} f={f} onToast={onToast}/>)}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── VIEW: lists overview ────────────────────────────────── */
function ListsOverview({ lists, onOpen, onNew }) {
  const hero = lists.find(l => l.hero) || lists[0];
  const heroN = listFiles(hero).length;
  return (
    <div style={{ padding: "20px 32px 56px", maxWidth: 1080 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>Списки файлов</h1>
        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Опубликованный список = постоянный адрес, по которому фронт забирает файлы массивом</div>
      </div>

      {/* Scenario hero */}
      <div style={{ background: "linear-gradient(90deg,var(--brand-tint),#F8F4FF)", border: "0.5px solid var(--purple-200)", borderRadius: 12, padding: 18, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--brand-primary)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="code" size={19}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Сгенерировал {heroN} документов — как вывести на сайте?</div>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)" }}>Не нужно знать id или вставлять ссылки руками. Один запрос к списку — и фронт рендерит всё, что в нём лежит.</div>
          </div>
          <Button variant="primary" size="md" icon={<Icon name="arrow" size={13} color="#fff"/>} onClick={() => onOpen(hero)}>Открыть список</Button>
        </div>
        <div style={{ background: "var(--neutral-900)", borderRadius: 8, padding: "12px 16px" }}>
          <pre style={{ margin: 0, color: "rgba(255,255,255,.9)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.55, overflow: "auto", whiteSpace: "pre-wrap" }}>{`const { data } = await (await fetch('${BASE}/${hero.slug}')).json();
data.forEach(f => render(\`<a href="\${f.url}">\${f.name}</a>\`));   // ${heroN} ссылок, без хардкода`}</pre>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Списки · {lists.length}</div>
        <Button variant="secondary" size="sm" icon={<Icon name="plus" size={13}/>} onClick={onNew}>Новый список</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {lists.map(l => <ListCard key={l.slug} list={l} onOpen={() => onOpen(l)}/>)}
      </div>
    </div>
  );
}

/* ─── VIEW: all files browser ─────────────────────────────── */
function AllFiles({ onToast }) {
  const [search, setSearch] = useFileSt("");
  const [types, setTypes] = useFileSt(new Set());
  const [srcs, setSrcs] = useFileSt(new Set());
  const [sort, setSort] = useFileSt("date");
  const [showType, setShowType] = useFileSt(false);
  const [showSrc, setShowSrc] = useFileSt(false);
  const [showSort, setShowSort] = useFileSt(false);
  const toggle = (setFn) => (k) => setFn(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  let list = F_FILES.map((f, i) => ({ ...f, _i: i }));
  if (search) list = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  if (types.size) list = list.filter(f => types.has(f.type));
  if (srcs.size) list = list.filter(f => srcs.has(f.src));
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  else if (sort === "size") list = [...list].sort((a, b) => b.kb - a.kb);

  const typeItems = Object.entries(F_TYPES).map(([k, v]) => ({ key: k, label: v.label, hint: F_FILES.filter(f => f.type === k).length })).filter(t => t.hint > 0);
  const srcItems = Object.entries(SRC_LABEL).map(([k, l]) => ({ key: k, label: l, hint: F_FILES.filter(f => f.src === k).length }));
  const sortLabel = { date: "Сначала новые", name: "По имени", size: "По размеру" }[sort];

  return (
    <div style={{ padding: "20px 32px 56px", maxWidth: 1080 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>Все файлы</h1>
        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{F_FILES.length} файлов в пространстве · из них собираются списки</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 0 240px" }}>
          <Icon name="search" size={14} color="var(--fg-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по файлам…" style={{ height: 32, width: "100%", padding: "0 10px 0 32px", border: "0.5px solid var(--border-strong)", borderRadius: 6, background: "var(--bg-0)", fontSize: 13, color: "var(--fg-1)", outline: 0, fontFamily: "inherit", boxSizing: "border-box" }}/>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowSrc(v => !v); setShowType(false); setShowSort(false); }} style={fToolBtn(showSrc || srcs.size > 0)}><Icon name="folder" size={12}/>Источник{srcs.size > 0 && <span style={fPill}>{srcs.size}</span>}<Icon name="chevd" size={11}/></button>
          <FilesPopover open={showSrc} onClose={() => setShowSrc(false)}><CheckList items={srcItems} picked={srcs} onToggle={toggle(setSrcs)}/></FilesPopover>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowType(v => !v); setShowSrc(false); setShowSort(false); }} style={fToolBtn(showType || types.size > 0)}><Icon name="filter" size={12}/>Тип{types.size > 0 && <span style={fPill}>{types.size}</span>}<Icon name="chevd" size={11}/></button>
          <FilesPopover open={showType} onClose={() => setShowType(false)} width={200}><CheckList items={typeItems} picked={types} onToggle={toggle(setTypes)}/></FilesPopover>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowSort(v => !v); setShowSrc(false); setShowType(false); }} style={fToolBtn(showSort)}><Icon name="sliders" size={12}/>{sortLabel}<Icon name="chevd" size={11}/></button>
          <FilesPopover open={showSort} onClose={() => setShowSort(false)} width={190}>
            <div style={{ padding: 8 }}>
              {[["date", "Сначала новые"], ["name", "По имени (А–Я)"], ["size", "По размеру"]].map(([k, l]) => (
                <button key={k} onClick={() => { setSort(k); setShowSort(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", border: 0, borderRadius: 6, cursor: "pointer", background: sort === k ? "var(--brand-tint)" : "transparent", color: sort === k ? "var(--purple-700)" : "var(--fg-1)", fontSize: 13, fontFamily: "inherit", fontWeight: sort === k ? 500 : 400, textAlign: "left" }}>{l}{sort === k && <Icon name="check" size={13} color="var(--purple-600)"/>}</button>
              ))}
            </div>
          </FilesPopover>
        </div>
      </div>

      <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
        <table className="dt">
          <thead><tr><th>Файл</th><th>Источник</th><th>Создан</th><th style={{ textAlign: "right" }}>Размер</th><th style={{ width: 72 }}></th></tr></thead>
          <tbody>{list.map((f, i) => <FileRow key={i} f={f} onToast={onToast}/>)}</tbody>
        </table>
        {list.length === 0 && (
          <div style={{ padding: "44px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-2)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--fg-3)" }}><Icon name="folder" size={18}/></div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Файлы не найдены</div>
            <Button variant="secondary" size="sm" onClick={() => { setTypes(new Set()); setSrcs(new Set()); setSearch(""); }} style={{ marginTop: 10 }}>Сбросить фильтры</Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Orchestrator ────────────────────────────────────────── */
function ScreenFiles({ onNavigate }) {
  const [tab, setTab] = useFileSt("lists");      // lists | all
  const [active, setActive] = useFileSt(null);   // selected list
  const [lists, setLists] = useFileSt(F_LISTS);
  const [showCreate, setShowCreate] = useFileSt(false);
  const [toast, setToast] = useFileSt(null);
  const show = (t) => { setToast(t); setTimeout(() => setToast(null), 2200); };
  const open = (l) => { setActive(l); };
  const createList = (l) => { setLists(ls => [...ls, l]); setShowCreate(false); setActive(l); show("Список «" + l.name + "» создан"); };

  const crumb = active ? ["Кафедра математики", "Файлы", active.name] : ["Кафедра математики", "Файлы"];

  return (
    <Shell current="files" breadcrumb={crumb}
      actions={<Button variant="primary" size="sm" icon={<Icon name="plus" size={13} color="#fff"/>} onClick={() => { setActive(null); setTab("lists"); setShowCreate(true); }}>Новый список</Button>}
      onNavigate={onNavigate}>
      {!active && (
        <div style={{ background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 32px", gap: 4, height: 44 }}>
          {[["lists", "Списки"], ["all", "Все файлы"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ height: "100%", padding: "0 14px", border: 0, borderBottom: `2px solid ${tab === k ? "var(--brand-primary)" : "transparent"}`, background: "transparent", color: tab === k ? "var(--fg-1)" : "var(--fg-2)", fontSize: 13, fontWeight: tab === k ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
      )}

      {active ? <ListDetail list={active} onBack={() => setActive(null)} onToast={show}/>
        : tab === "lists" ? <ListsOverview lists={lists} onOpen={open} onNew={() => setShowCreate(true)}/>
        : <AllFiles onToast={show}/>}

      {showCreate && <CreateListModal onClose={() => setShowCreate(false)} onCreate={createList}/>}
      {toast && <Toast tone="success" title={toast} onClose={() => setToast(null)}/>}
      <style>{`tr.frow:hover .frow-act { opacity: 1 !important; }`}</style>
    </Shell>
  );
}

Object.assign(window, { ScreenFiles });
