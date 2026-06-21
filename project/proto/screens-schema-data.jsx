// Schema screens (SCH02 template picker, SCH03 field editor) + Data table (D01/D02/D03/D04)
const { useState: useDataSt } = React;

/* ─── SCH02 Template Picker ───────────────────────────────── */
const TEMPLATES = [
  { id: "teachers", icon: "users",  title: "Преподаватели", desc: "Учёная степень, ставка, нагрузка", fields: 11, tag: "273-ФЗ" },
  { id: "courses",  icon: "file",   title: "Курсы",         desc: "Дисциплина, часы, форма контроля", fields: 9,  tag: "273-ФЗ" },
  { id: "clients",  icon: "box",    title: "Клиенты",       desc: "Имя, контакты, источник",           fields: 7,  tag: null },
  { id: "leads",    icon: "table",  title: "Заявки",        desc: "Контакт, статус воронки, сумма",    fields: 8,  tag: null },
  { id: "staff",    icon: "users",  title: "Сотрудники",    desc: "ФИО, должность, контакты",          fields: 6,  tag: null },
  { id: "blank",    icon: "plus",   title: "С нуля",        desc: "Пустая таблица — определи поля сам",fields: 0, tag: null },
];

function ScreenSCH02({ onNavigate }) {
  const [picked, setPicked] = useDataSt("teachers");
  const [name, setName] = useDataSt("Преподаватели");
  return (
    <Shell current="sch02" breadcrumb={["Кафедра математики", "Новая таблица"]} onNavigate={onNavigate}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 8, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Шаг 1 / 2</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>С чего начнём?</h1>
          <p style={{ fontSize: 14, color: "var(--fg-2)" }}>Выбери шаблон с готовыми полями или начни с пустой таблицы.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {TEMPLATES.map(t => {
            const active = picked === t.id;
            return (
              <div key={t.id} onClick={() => { setPicked(t.id); if (t.id !== "blank") setName(t.title); }}
                style={{ background: "var(--bg-0)", border: `${active ? 1.5 : 0.5}px solid ${active ? "var(--brand-primary)" : "var(--border-default)"}`, borderRadius: 12, padding: 18, cursor: "pointer", boxShadow: active ? "var(--shadow-2)" : "var(--shadow-1)", transition: "all 140ms", position: "relative" }}>
                {t.tag && <div style={{ position: "absolute", top: 12, right: 12 }}><Badge tone="brand">{t.tag}</Badge></div>}
                <div style={{ width: 36, height: 36, borderRadius: 8, background: active ? "var(--brand-tint)" : "var(--bg-1)", display: "grid", placeItems: "center", marginBottom: 14, color: active ? "var(--purple-600)" : "var(--fg-3)" }}>
                  <Icon name={t.icon} size={18}/>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.45, marginBottom: 10, minHeight: 34 }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{t.fields > 0 ? `${t.fields} полей` : "Без полей"}</div>
              </div>
            );
          })}
        </div>
        <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 10, padding: 20, display: "flex", gap: 16, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Название таблицы</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Преподаватели"/>
          </div>
          <Button variant="primary" size="md" onClick={() => onNavigate("sch03")} disabled={!picked}>Настроить поля →</Button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── SCH03 Field Editor ──────────────────────────────────── */
const FIELD_TYPES = { text: "Текст", number: "Число", date: "Дата", bool: "Булево", select: "Выбор", email: "Email", file: "📎 Файл", relation: "↔ Связь" };
const FILE_ACCEPT = [["img", "Изображения"], ["pdf", "PDF"], ["doc", "Документы"], ["video", "Видео"], ["any", "Любые файлы"]];
// Tables in this space that a relation can point to
const REL_TABLES = [
  { name: "Кафедры",        count: 6  },
  { name: "Предметы",       count: 28 },
  { name: "Курсы",          count: 42 },
  { name: "Учебные планы",  count: 8  },
  { name: "Студенты",       count: 214 },
];
const INITIAL_FIELDS = [
  { name: "ФИО",           type: "text",     req: true  },
  { name: "Учёная степень",type: "select",   req: true  },
  { name: "Должность",     type: "text",     req: true  },
  { name: "Ставка",        type: "number",   req: true  },
  { name: "Email",         type: "email",    req: false },
  { name: "Фото",          type: "file",     req: false, accept: "img", many: false },
  { name: "Дата приёма",   type: "date",     req: true  },
  { name: "Кафедра",       type: "relation", req: true,  target: "Кафедры",  many: false },
  { name: "Предметы",      type: "relation", req: false, target: "Предметы", many: true  },
  { name: "Активен",       type: "bool",     req: true  },
];

function FieldRow({ f, onChange, onDelete }) {
  const isRel = f.type === "relation";
  const isFile = f.type === "file";
  const onTypeChange = (v) => {
    if (v === "relation") onChange({ ...f, type: v, target: f.target || REL_TABLES[0].name, many: f.many ?? false });
    else if (v === "file") onChange({ ...f, type: v, accept: f.accept || "img", many: f.many ?? true });
    else onChange({ ...f, type: v });
  };
  return (
    <div style={{ padding: "8px 12px", background: isRel ? "var(--brand-tint)" : isFile ? "var(--bg-1)" : "var(--bg-0)", border: `0.5px solid ${isRel ? "var(--purple-200)" : isFile ? "var(--border-strong)" : "var(--border-default)"}`, borderRadius: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 180px 80px 28px", gap: 10, alignItems: "center" }}>
        <Icon name="drag" size={13} color="var(--fg-3)" style={{ cursor: "grab" }}/>
        <Input value={f.name} onChange={e => onChange({ ...f, name: e.target.value })} style={{ height: 30, fontSize: 13 }}/>
        <select value={f.type} onChange={e => onTypeChange(e.target.value)} style={{ height: 30, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 8px", fontSize: 12, background: "var(--bg-0)", color: isRel ? "var(--purple-700)" : "var(--fg-1)", fontWeight: isRel ? 500 : 400, outline: 0 }}>
          {Object.entries(FIELD_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Toggle on={f.req} onChange={v => onChange({ ...f, req: v })}/>
          <span style={{ fontSize: 11, color: "var(--fg-3)" }}>обяз.</span>
        </div>
        <button onClick={onDelete} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-3)", padding: 2, display: "flex" }}><Icon name="x" size={14}/></button>
      </div>

      {/* Relation config — appears only when type is «Связь» */}
      {isRel && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", rowGap: 8, marginTop: 8, marginLeft: 28, padding: "8px 10px", background: "var(--bg-0)", border: "0.5px solid var(--purple-200)", borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: "var(--purple-700)", fontWeight: 500, whiteSpace: "nowrap" }}>↔ Ссылается на</span>
          <div style={{ position: "relative" }}>
            <select value={f.target || ""} onChange={e => onChange({ ...f, target: e.target.value })}
              style={{ height: 30, borderRadius: 6, border: "0.5px solid var(--purple-300)", padding: "0 28px 0 10px", fontSize: 12, background: "var(--bg-0)", color: "var(--purple-700)", fontWeight: 500, outline: 0, appearance: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {REL_TABLES.map(t => <option key={t.name} value={t.name}>{t.name} · {t.count} записей</option>)}
            </select>
            <Icon name="chevd" size={11} color="var(--purple-500)" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
          </div>
          {/* one / many segmented control */}
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--bg-2)", borderRadius: 6 }}>
            {[[false, "одно значение"], [true, "список"]].map(([v, l]) => (
              <button key={String(v)} onClick={() => onChange({ ...f, many: v })}
                style={{ height: 24, padding: "0 10px", border: 0, borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: f.many === v ? "var(--bg-0)" : "transparent", color: f.many === v ? "var(--purple-700)" : "var(--fg-3)", boxShadow: f.many === v ? "var(--shadow-1)" : "none", transition: "all 120ms" }}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {/* File config — appears only when type is «Файл» */}
      {isFile && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", rowGap: 8, marginTop: 8, marginLeft: 28, padding: "8px 10px", background: "var(--bg-0)", border: "0.5px solid var(--border-strong)", borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}><Icon name="clip" size={12} color="var(--fg-3)"/>Принимать</span>
          <div style={{ position: "relative" }}>
            <select value={f.accept || "img"} onChange={e => onChange({ ...f, accept: e.target.value })} style={{ height: 30, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 26px 0 10px", fontSize: 12, background: "var(--bg-0)", color: "var(--fg-1)", outline: 0, appearance: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {FILE_ACCEPT.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <Icon name="chevd" size={11} color="var(--fg-3)" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
          </div>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--bg-2)", borderRadius: 6 }}>
            {[[false, "один файл"], [true, "галерея"]].map(([v, l]) => (
              <button key={String(v)} onClick={() => onChange({ ...f, many: v })} style={{ height: 24, padding: "0 10px", border: 0, borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: (f.many ?? true) === v ? "var(--bg-0)" : "transparent", color: (f.many ?? true) === v ? "var(--fg-1)" : "var(--fg-3)", boxShadow: (f.many ?? true) === v ? "var(--shadow-1)" : "none" }}>{l}</button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "var(--fg-3)", flexBasis: "100%" }}>Прямые ссылки в API — собирай галерею или слайдер на своём сайте.</span>
        </div>
      )}
    </div>
  );
}

function ScreenSCH03({ onNavigate }) {
  const [fields, setFields] = useDataSt(INITIAL_FIELDS);
  const upd = (i, nf) => setFields(fs => fs.map((x, j) => j === i ? nf : x));
  const del = i => setFields(fs => fs.filter((_, j) => j !== i));
  return (
    <Shell current="sch03" breadcrumb={["Кафедра математики", "Новая таблица", "Преподаватели"]} onNavigate={onNavigate}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 32px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 8, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Шаг 2 / 2</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Поля таблицы «Преподаватели»</h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>Перетащи, чтобы поменять порядок. Связи ссылаются на другие таблицы без технических терминов.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 180px 80px 28px", gap: 10, padding: "0 12px 8px", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          <div/><div>Имя поля</div><div>Тип</div><div/><div/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fields.map((f, i) => <FieldRow key={i} f={f} onChange={nf => upd(i, nf)} onDelete={() => del(i)}/>)}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => setFields(fs => [...fs, { name: "", type: "text", req: false }])} style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "0.5px dashed var(--border-strong)", borderRadius: 6, color: "var(--fg-2)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
            <Icon name="plus" size={14}/>Добавить поле
          </button>
          <button onClick={() => setFields(fs => [...fs, { name: "", type: "relation", req: false, target: REL_TABLES[0].name, many: false }])} style={{ flex: 1, padding: "10px 14px", background: "var(--brand-tint)", border: "0.5px dashed var(--purple-300)", borderRadius: 6, color: "var(--purple-700)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
            ↔ Добавить связь
          </button>
        </div>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between" }}>
          <Button variant="ghost" size="md" onClick={() => onNavigate("sch02")}>← Назад</Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="md">Сохранить черновик</Button>
            <Button variant="primary" size="md" onClick={() => onNavigate("data-prep")}>Создать таблицу</Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ─── D01 Data Table ──────────────────────────────────────── */
const FILE_TONE = {
  img:   { label: "IMG", bg: "var(--brand-tint)",  fg: "var(--purple-600)",  bd: "var(--purple-100)", icon: "image" },
  pdf:   { label: "PDF", bg: "var(--red-50)",      fg: "var(--red-600)",     bd: "var(--red-100)",    icon: "file"  },
  doc:   { label: "DOC", bg: "var(--blue-50)",     fg: "var(--blue-600)",    bd: "#DBEAFE",           icon: "file"  },
  ppt:   { label: "PPT", bg: "var(--amber-50)",    fg: "var(--amber-700)",   bd: "var(--amber-100)",  icon: "file"  },
  video: { label: "MP4", bg: "var(--purple-50)",   fg: "var(--purple-700)",  bd: "var(--purple-100)", icon: "play"  },
  zip:   { label: "ZIP", bg: "var(--neutral-100)", fg: "var(--neutral-600)", bd: "var(--border-default)", icon: "folder" },
};
const FF = (name, type) => ({ name, type });

const TABLE_DATA = {
  "data-prep": {
    title: "Преподаватели", slug: "teachers", count: 14,
    cols: ["ФИО", "Степень", "Должность", "Ставка", "Email", "Активен"],
    rows: [
      ["Иванов Алексей Петрович",     "д.ф.-м.н.", "профессор", "1.00", "ivanov@msu.ru",     true ],
      ["Петрова Мария Сергеевна",     "к.ф.-м.н.", "доцент",    "1.00", "petrova@msu.ru",    true ],
      ["Сидоров Дмитрий Иванович",    "к.ф.-м.н.", "доцент",    "0.50", "sidorov@msu.ru",    true ],
      ["Кузнецова Ольга Викторовна",  "к.т.н.",    "ст. преп.", "1.00", "kuznetsova@msu.ru", true ],
      ["Морозов Игорь Александрович", "—",         "ассистент", "0.25", "morozov@msu.ru",    true ],
      ["Васильев Сергей Николаевич",  "д.ф.-м.н.", "профессор", "1.00", "vasiliev@msu.ru",   true ],
      ["Новикова Анна Дмитриевна",    "к.ф.-м.н.", "доцент",    "1.00", "novikova@msu.ru",   true ],
      ["Орлов Павел Владимирович",    "—",         "ассистент", "0.50", "orlov@msu.ru",      true ],
      ["Соколова Елена Михайловна",   "к.п.н.",    "доцент",    "1.00", "sokolova@msu.ru",   false],
      ["Лебедев Артём Романович",     "к.ф.-м.н.", "доцент",    "1.00", "lebedev@msu.ru",    true ],
      ["Григорьев Михаил Олегович",   "д.ф.-м.н.", "профессор", "1.00", "grigoriev@msu.ru",  true ],
      ["Тихонова Светлана Ильинична", "к.ф.-м.н.", "доцент",    "0.75", "tikhonova@msu.ru",  true ],
      ["Андреев Виктор Юрьевич",      "—",         "ст. преп.", "1.00", "andreev@msu.ru",    true ],
      ["Смирнов Денис Геннадьевич",   "к.ф.-м.н.", "доцент",    "1.00", "smirnov@msu.ru",    true ],
    ],
  },
  "data-courses": {
    title: "Курсы", slug: "courses", count: 42,
    cols: ["Название", "Кафедра", "Форма контроля", "Часов", "Материалы", "Активен"],
    rows: [
      ["Математический анализ",      "Кафедра математики",  "Экзамен",  144, [FF("Лекция_1_доска.jpg","img"),FF("График_ряда.png","img"),FF("Силлабус_2025.pdf","pdf"),FF("Лекции_1-8.pdf","pdf"),FF("Ряды.pptx","ppt")], true ],
      ["Линейная алгебра",           "Кафедра математики",  "Экзамен",  72,  [FF("Матрицы_схема.png","img"),FF("Силлабус.pdf","pdf"),FF("Задачник.pdf","pdf")], true ],
      ["Дискретная математика",      "Кафедра математики",  "Зачёт",    54,  [FF("Граф_пример.png","img"),FF("Дерево_обхода.png","img"),FF("Конспект.pdf","pdf"),FF("Вводная.mp4","video")], true ],
      ["Теория вероятностей",        "Кафедра математики",  "Экзамен",  72,  [FF("Силлабус.pdf","pdf"),FF("Байес.pptx","ppt")], true ],
      ["Численные методы",           "Кафедра математики",  "Зачёт",    54,  [FF("Сходимость.png","img"),FF("Силлабус.pdf","pdf"),FF("Код_примеры.zip","zip")], true ],
      ["Алгебра",                    "Кафедра математики",  "Экзамен",  108, [FF("Группы_схема.png","img"),FF("Силлабус.pdf","pdf")], true ],
      ["Геометрия",                  "Кафедра математики",  "Экзамен",  72,  [FF("Чертёж_1.png","img"),FF("Чертёж_2.png","img"),FF("Поверхность.png","img"),FF("Силлабус.pdf","pdf")], true ],
      ["Уравнения мат. физики",      "Кафедра математики",  "Экзамен",  72,  [FF("Волновой_фронт.png","img"),FF("Лекции.pdf","pdf")], true ],
      ["Топология",                  "Кафедра математики",  "Зачёт",    36,  [FF("Лента_Мёбиуса.png","img")], false],
      ["Программирование",           "Кафедра АСОИУ",       "Зачёт",    72,  [FF("Исходники.zip","zip"),FF("Методичка.pdf","pdf")], true ],
      ["Физика",                     "Кафедра физики",      "Экзамен",  144, [FF("Установка.jpg","img"),FF("Опыт_1.jpg","img"),FF("Лабы.pdf","pdf"),FF("Демонстрация.mp4","video")], true ],
      ["Статистика",                 "Кафедра математики",  "Зачёт",    54,  [FF("Гистограмма.png","img"),FF("Силлабус.pdf","pdf")], true ],
    ],
  },
  "data-plans": {
    title: "Учебные планы", slug: "plans", count: 8,
    cols: ["Специальность", "Направление", "Форма", "Срок", "Год набора", "Статус"],
    rows: [
      ["01.03.01 Математика",              "Прикладная математика",       "очная",     "4 года", "2022", "active"],
      ["01.03.01 Математика",              "Математика и компьютерные науки", "очная",  "4 года", "2023", "active"],
      ["01.03.02 Прикладная математика",   "Вычислительная математика",   "очная",     "4 года", "2022", "active"],
      ["09.03.01 Информатика и ВТ",        "Программная инженерия",       "очная",     "4 года", "2024", "active"],
      ["01.04.01 Математика",              "Современная математика",      "очная",     "2 года", "2024", "active"],
      ["01.03.01 Математика",              "Прикладная математика",       "заочная",   "4 года", "2022", "setup" ],
      ["09.04.01 Информатика",             "Математические методы в IT",  "очная",     "2 года", "2025", "setup" ],
      ["01.03.02 Прикладная математика",   "Математическое моделирование","очно-заочн","4 года", "2023", "offline"],
    ],
  },
};

// Per-column input meta — selects for enums, relation pickers for links, toggle for bool
const COL_META = {
  "Степень":        { kind: "select",   options: ["д.ф.-м.н.", "к.ф.-м.н.", "к.т.н.", "к.п.н.", "—"] },
  "Должность":      { kind: "select",   options: ["профессор", "доцент", "ст. преп.", "ассистент"] },
  "Кафедра":        { kind: "relation", relTable: "Кафедры",  many: false, options: ["Математического анализа", "Высшей алгебры", "Дифференциальной геометрии", "Вычислительной математики"] },
  "Форма контроля": { kind: "select",   options: ["Экзамен", "Зачёт", "Дифф. зачёт"] },
  "Форма":          { kind: "select",   options: ["очная", "заочная", "очно-заочная"] },
  "Активен":        { kind: "bool" },
  "Email":          { kind: "text",     mono: true, placeholder: "name@msu.ru" },
  "Ставка":         { kind: "select",   options: ["1.00", "0.75", "0.50", "0.25"] },
  "Часов":          { kind: "number" },
  "Материалы":      { kind: "file" },
  "Фото":           { kind: "file", single: true, accept: "img" },
};

function RecordField({ col, value, onChange }) {
  const meta = COL_META[col] || { kind: "text" };
  const lbl = <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>{col}</label>;

  if (meta.kind === "bool") return (
    <div>{lbl}<div style={{ display: "flex", alignItems: "center", gap: 8 }}><Toggle on={value ?? true} onChange={onChange}/><span style={{ fontSize: 13, color: "var(--fg-2)" }}>{(value ?? true) ? "да" : "нет"}</span></div></div>
  );

  if (meta.kind === "select") return (
    <div>{lbl}
      <div style={{ position: "relative" }}>
        <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ width: "100%", height: 36, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 32px 0 12px", fontSize: 14, background: "var(--bg-0)", color: value ? "var(--fg-1)" : "var(--fg-3)", outline: 0, appearance: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Выбери значение…</option>
          {meta.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <Icon name="chevd" size={12} color="var(--fg-3)" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
      </div>
    </div>
  );

  if (meta.kind === "relation") return (
    <div>
      <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {col}<Badge tone="brand">↔ связь · {meta.relTable}</Badge>
      </label>
      <div style={{ position: "relative" }}>
        <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ width: "100%", height: 36, borderRadius: 6, border: "0.5px solid var(--purple-300)", padding: "0 32px 0 12px", fontSize: 14, background: "var(--brand-tint)", color: value ? "var(--purple-700)" : "var(--fg-3)", fontWeight: value ? 500 : 400, outline: 0, appearance: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">{meta.many ? "Выбери одну или несколько…" : `Выбери запись из «${meta.relTable}»…`}</option>
          {meta.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <Icon name="chevd" size={12} color="var(--purple-500)" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
      </div>
      <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 5 }}>Выбирается из связанной таблицы, не вводится вручную.</p>
    </div>
  );

  if (meta.kind === "file") return (
    <div>
      <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>{col}{!meta.single && <Badge tone="neutral">📎 галерея</Badge>}</label>
      <div style={{ border: "1px dashed var(--border-strong)", borderRadius: 8, padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, background: "var(--bg-1)", textAlign: "center", cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-0)", border: "0.5px solid var(--border-default)", display: "grid", placeItems: "center", color: "var(--fg-3)" }}><Icon name="upload" size={16}/></div>
        <div style={{ fontSize: 13, color: "var(--fg-2)" }}>Перетащи {meta.single ? "файл" : "файлы"} или <span style={{ color: "var(--brand-primary)", fontWeight: 500 }}>выбери</span></div>
        <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{meta.accept === "img" ? "PNG, JPG до 10 МБ" : "любые файлы до 50 МБ"}</div>
      </div>
    </div>
  );

  return <div>{lbl}<Input value={value || ""} onChange={e => onChange(e.target.value)} mono={meta.mono} type={meta.kind === "number" ? "number" : "text"} placeholder={meta.placeholder || `Введи ${col.toLowerCase()}…`}/></div>;
}

function CreateRecordModal({ open, onClose, onSave, tableKey }) {
  const td = TABLE_DATA[tableKey] || TABLE_DATA["data-prep"];
  const [vals, setVals] = useDataSt({});
  const setV = (k, v) => setVals(prev => ({ ...prev, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title={`Новая запись — ${td.title}`} subtitle="Поля-связи и перечисления выбираются из списка." width={520}
      footer={<><Button variant="ghost" size="md" onClick={onClose}>Отмена</Button><Button variant="primary" size="md" onClick={() => { onSave(); onClose(); }}>Добавить запись</Button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {td.cols.map((col, i) => <RecordField key={i} col={col} value={vals[col]} onChange={v => setV(col, v)}/>)}
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({ open, onClose, onConfirm, rowName }) {
  return (
    <Modal open={open} onClose={onClose} title="Удалить запись?" width={440}
      footer={<><Button variant="ghost" size="md" onClick={onClose}>Отмена</Button><Button variant="danger" size="md" onClick={() => { onConfirm(); onClose(); }}>Удалить</Button></>}>
      <p style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.5 }}>
        Запись <strong>«{rowName}»</strong> будет удалена без возможности восстановления.
      </p>
      <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--red-50)", border: "0.5px solid var(--red-100)", borderRadius: 6, fontSize: 12, color: "var(--red-700)" }}>
        Это действие нельзя отменить.
      </div>
    </Modal>
  );
}

/* ─── Filtering / sorting helpers ─────────────────────────── */
const STATUS_OPTS = [["active", "Работает"], ["setup", "Настройка"], ["offline", "Недоступен"]];
const NUM_COLS = new Set(["Часов", "Ставка"]);

function colFilterMeta(col, sampleRows, ci) {
  const m = COL_META[col];
  if (m?.kind === "bool") return { type: "bool" };
  if (col === "Статус") return { type: "select", options: STATUS_OPTS };
  if ((m?.kind === "select" || m?.kind === "relation") && m.options) return { type: "select", options: m.options.map(o => [o, o]) };
  if (m?.kind === "number" || NUM_COLS.has(col)) return { type: "number" };
  // infer a small enum from the data when a column repeats few distinct values
  const vals = [...new Set(sampleRows.map(r => String(r[ci])))];
  if (vals.length > 1 && vals.length <= 8 && vals.every(v => v.length <= 24)) return { type: "select", options: vals.map(v => [v, v]) };
  return { type: "text" };
}
const OPS = {
  text: [["contains", "содержит"], ["ncontains", "не содержит"]],
  select: [["eq", "равно"], ["ne", "не равно"]],
  number: [["eq", "="], ["gt", "больше"], ["lt", "меньше"]],
  bool: [["eq", "равно"]],
};
function defaultFilter(col, meta) {
  return { col, op: OPS[meta.type][0][0], value: meta.type === "bool" ? "true" : "" };
}
function filterActive(f, meta) { return meta.type === "bool" || String(f.value).trim() !== ""; }
function matchOne(cell, f, meta) {
  if (meta.type === "bool") return String(cell) === f.value;
  if (meta.type === "number") {
    const n = parseFloat(cell), v = parseFloat(f.value);
    if (isNaN(v)) return true;
    return f.op === "gt" ? n > v : f.op === "lt" ? n < v : n === v;
  }
  if (meta.type === "select") return f.op === "ne" ? String(cell) !== f.value : String(cell) === f.value;
  const s = String(cell).toLowerCase(), v = String(f.value).toLowerCase();
  return f.op === "ncontains" ? !s.includes(v) : s.includes(v);
}
const statusLabel = v => (STATUS_OPTS.find(s => s[0] === v) || [, v])[1];
function valLabel(f, meta) {
  if (meta.type === "bool") return f.value === "true" ? "да" : "нет";
  if (f.col === "Статус") return statusLabel(f.value);
  return f.value;
}

/* ─── Anchored popover ────────────────────────────────────── */
function Popover({ open, onClose, children, width = 320, align = "left" }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }}/>
      <div style={{ position: "absolute", top: "calc(100% + 6px)", [align]: 0, zIndex: 41, width, background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 10, boxShadow: "var(--shadow-3)", animation: "slideUp 130ms ease-out" }}>
        {children}
      </div>
    </>
  );
}
const popSelect = { height: 30, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 24px 0 9px", fontSize: 12, background: "var(--bg-0)", color: "var(--fg-1)", outline: 0, appearance: "none", cursor: "pointer", fontFamily: "inherit" };

function FilterRow({ f, cols, sampleRows, onChange, onRemove }) {
  const ci = cols.indexOf(f.col);
  const meta = colFilterMeta(f.col, sampleRows, ci);
  const onCol = (col) => { const nci = cols.indexOf(col); onChange(defaultFilter(col, colFilterMeta(col, sampleRows, nci))); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <div style={{ position: "relative" }}>
        <select value={f.col} onChange={e => onCol(e.target.value)} style={{ ...popSelect, fontWeight: 500, maxWidth: 120 }}>
          {cols.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Icon name="chevd" size={10} color="var(--fg-3)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
      </div>
      <div style={{ position: "relative" }}>
        <select value={f.op} onChange={e => onChange({ ...f, op: e.target.value })} style={{ ...popSelect, color: "var(--fg-2)" }}>
          {OPS[meta.type].map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <Icon name="chevd" size={10} color="var(--fg-3)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
      </div>
      {meta.type === "bool" ? (
        <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--bg-2)", borderRadius: 6 }}>
          {[["true", "да"], ["false", "нет"]].map(([v, l]) => (
            <button key={v} onClick={() => onChange({ ...f, value: v })} style={{ height: 24, padding: "0 10px", border: 0, borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: f.value === v ? "var(--bg-0)" : "transparent", color: f.value === v ? "var(--fg-1)" : "var(--fg-3)", boxShadow: f.value === v ? "var(--shadow-1)" : "none" }}>{l}</button>
          ))}
        </div>
      ) : meta.type === "select" ? (
        <div style={{ position: "relative", flex: 1, minWidth: 110 }}>
          <select value={f.value} onChange={e => onChange({ ...f, value: e.target.value })} style={{ ...popSelect, width: "100%", color: f.value ? "var(--fg-1)" : "var(--fg-3)" }}>
            <option value="">значение…</option>
            {meta.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Icon name="chevd" size={10} color="var(--fg-3)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
        </div>
      ) : (
        <input value={f.value} onChange={e => onChange({ ...f, value: e.target.value })} type={meta.type === "number" ? "number" : "text"} placeholder={meta.type === "number" ? "0" : "значение…"} style={{ flex: 1, minWidth: 90, height: 30, borderRadius: 6, border: "0.5px solid var(--border-strong)", padding: "0 9px", fontSize: 12, background: "var(--bg-0)", color: "var(--fg-1)", outline: 0, fontFamily: "inherit", boxSizing: "border-box" }}/>
      )}
      <button onClick={onRemove} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-3)", padding: 4, display: "flex", flexShrink: 0 }}><Icon name="x" size={13}/></button>
    </div>
  );
}

/* ─── Monogram avatar for people tables ───────────────────── */
const MONO_HUES = ["var(--purple-400)", "var(--green-500)", "var(--amber-500)", "var(--blue-500)", "var(--purple-600)"];
function Monogram({ name }) {
  const parts = String(name).trim().split(/\s+/);
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = MONO_HUES[h % MONO_HUES.length];
  return (
    <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", background: color, letterSpacing: "0.02em", textTransform: "uppercase" }}>{initials}</span>
  );
}

/* ─── File field: thumbnails, cell, gallery modal ─────── */
function imgGradient(name) {
  let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = h % 360, b = (a + 38) % 360;
  return `linear-gradient(135deg, hsl(${a} 58% 70%), hsl(${b} 62% 54%))`;
}
const kbFmt = (kb) => kb >= 1024 ? `${(kb / 1024).toFixed(1)} МБ` : `${kb} КБ`;
const fakeKb = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 60 + h % 1900; };
const fileWord = (n) => n % 10 === 1 && n % 100 !== 11 ? "файл" : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? "файла" : "файлов";

function MiniFile({ file, size = 26, ring = true }) {
  const t = FILE_TONE[file.type] || FILE_TONE.doc;
  const common = { width: size, height: size, borderRadius: 5, flexShrink: 0, boxSizing: "border-box", border: ring ? "1.5px solid var(--bg-0)" : `0.5px solid ${t.bd}`, boxShadow: ring ? "var(--shadow-1)" : "none" };
  if (file.type === "img") return <span style={{ ...common, background: imgGradient(file.name), display: "block" }}/>;
  return <span style={{ ...common, background: t.bg, display: "grid", placeItems: "center" }}><Icon name={t.icon} size={Math.round(size * 0.5)} color={t.fg}/></span>;
}

function FileCell({ files, onOpen }) {
  if (!files || files.length === 0) return <span style={{ color: "var(--fg-3)" }}>—</span>;
  const shown = files.slice(0, 3);
  const n = files.length;
  return (
    <button onClick={onOpen} className="filecell" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: 0, border: 0, cursor: "pointer", padding: "2px 4px", margin: "-2px -4px", borderRadius: 6, fontFamily: "inherit" }}>
      <span style={{ display: "inline-flex" }}>
        {shown.map((f, i) => <span key={i} style={{ marginLeft: i ? -9 : 0, position: "relative", zIndex: shown.length - i }}><MiniFile file={f}/></span>)}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--fg-2)", fontWeight: 500, whiteSpace: "nowrap" }}>{n} {fileWord(n)}</span>
      <Icon name="chev" size={12} color="var(--fg-3)"/>
    </button>
  );
}

function FilesGalleryModal({ data, onClose, onToast, tableSlug }) {
  const [copied, setCopied] = useDataSt(false);
  if (!data) return null;
  const imgs = data.files.filter(f => f.type === "img");
  const docs = data.files.filter(f => f.type !== "img");
  const copy = () => { setCopied(true); onToast?.("Сниппет скопирован"); setTimeout(() => setCopied(false), 1600); };
  const snippet = `GET /api/math-dept/${tableSlug}/{record}/files\n\n// галерея или слайдер на твоём сайте:\nconst { data } = await (await fetch(url, { headers })).json();\ndata.filter(f => f.type.startsWith("image"))\n    .forEach(f => slider.add(f.url));`;
  return (
    <Modal open={true} onClose={onClose} width={620}
      title={`${data.col} — ${data.rowName}`}
      subtitle={`${data.files.length} ${fileWord(data.files.length)} · прямые CDN-ссылки для твоего сайта`}>
      <style>{`.gtile:hover .gact{opacity:1} .gtile:hover{transform:translateY(-2px)}`}</style>
      {imgs.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>Изображения · {imgs.length}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: docs.length ? 22 : 18 }}>
            {imgs.map((f, i) => (
              <div key={i} className="gtile" style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "4 / 3", background: imgGradient(f.name), transition: "transform 150ms", boxShadow: "var(--shadow-1)" }}>
                <div className="gact" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, opacity: 0, transition: "opacity 120ms" }}>
                  {["download", "link"].map(ic => (
                    <button key={ic} onClick={() => onToast?.(ic === "download" ? "Скачивание начато" : "Ссылка скопирована")} style={{ width: 26, height: 26, borderRadius: 6, border: 0, cursor: "pointer", background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center" }}><Icon name={ic} size={13} color="#fff"/></button>
                  ))}
                </div>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 8px 6px", background: "linear-gradient(transparent, rgba(0,0,0,.5))", color: "#fff", fontSize: 10.5, fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {docs.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Документы · {docs.length}</div>
          <div style={{ border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
            {docs.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderTop: i ? "0.5px solid var(--border-default)" : 0 }}>
                <MiniFile file={f} size={30} ring={false}/>
                <span style={{ flex: 1, fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <span style={{ fontSize: 12, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{kbFmt(fakeKb(f.name))}</span>
                <button onClick={() => onToast?.("Скачивание начато")} style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)" }}><Icon name="download" size={15}/></button>
                <button onClick={() => onToast?.("Ссылка скопирована")} style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)" }}><Icon name="link" size={15}/></button>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ background: "var(--brand-tint)", border: "0.5px solid var(--purple-200)", borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon name="code" size={14} color="var(--purple-600)"/>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>Забрать на свой сайт</span>
          <Badge tone="brand" style={{ marginLeft: "auto" }}>массив ссылок</Badge>
        </div>
        <div style={{ position: "relative", background: "var(--neutral-900)", borderRadius: 8, overflow: "hidden" }}>
          <button onClick={copy} style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.08)", border: 0, color: "rgba(255,255,255,.7)", padding: "4px 9px", borderRadius: 4, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Icon name={copied ? "check" : "copy"} size={11} color="rgba(255,255,255,.7)"/>{copied ? "Готово" : "Копировать"}</button>
          <pre style={{ margin: 0, padding: "16px 18px", color: "rgba(255,255,255,.9)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.6, overflow: "auto", whiteSpace: "pre-wrap" }}>{snippet}</pre>
        </div>
      </div>
    </Modal>
  );
}

const toolBtn = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", boxSizing: "border-box", border: `0.5px solid ${active ? "var(--purple-300)" : "var(--border-strong)"}`, background: active ? "var(--brand-tint)" : "var(--bg-0)", color: active ? "var(--purple-700)" : "var(--fg-1)", transition: "background 120ms, border-color 120ms" });
const countPill = { minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--brand-primary)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums" };
const chip = { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 4px 4px 10px", borderRadius: 999, background: "var(--brand-tint)", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" };
const chipX = { background: 0, border: 0, cursor: "pointer", color: "var(--purple-500)", padding: 2, display: "flex", borderRadius: "50%", lineHeight: 0 };

function ScreenDataTable({ tableKey, onNavigate }) {
  const td = TABLE_DATA[tableKey] || TABLE_DATA["data-prep"];
  const [rows, setRows] = useDataSt(td.rows);
  const [sel, setSel] = useDataSt(new Set());
  const [search, setSearch] = useDataSt("");
  const [filters, setFilters] = useDataSt([]);
  const [sort, setSort] = useDataSt({ col: null, dir: "asc" });
  const [showFilter, setShowFilter] = useDataSt(false);
  const [showSort, setShowSort] = useDataSt(false);
  const [showCreate, setShowCreate] = useDataSt(false);
  const [deleteRow, setDeleteRow] = useDataSt(null);
  const [gallery, setGallery] = useDataSt(null);
  const [toast, setToast] = useDataSt(null);
  const showToast = (title, tone = "success") => { setToast({ title, tone }); setTimeout(() => setToast(null), 3000); };

  const hasMono = td.cols[0] === "ФИО";
  const fileCols = new Set(td.cols.filter((c, i) => rows.some(r => Array.isArray(r[i]))));
  const activeFilters = filters.filter(f => filterActive(f, colFilterMeta(f.col, rows, td.cols.indexOf(f.col))));

  // Build display rows preserving original index for selection/delete
  let view = rows.map((r, idx) => ({ r, idx }));
  if (search) view = view.filter(({ r }) => r.some(c => (Array.isArray(c) ? c.map(x => x.name).join(" ") : String(c)).toLowerCase().includes(search.toLowerCase())));
  for (const f of activeFilters) {
    const ci = td.cols.indexOf(f.col);
    const meta = colFilterMeta(f.col, rows, ci);
    view = view.filter(({ r }) => matchOne(r[ci], f, meta));
  }
  if (sort.col) {
    const ci = td.cols.indexOf(sort.col);
    view = [...view].sort((a, b) => {
      let x = a.r[ci], y = b.r[ci];
      if (typeof x === "boolean") { x = x ? 1 : 0; y = y ? 1 : 0; }
      const nx = parseFloat(x), ny = parseFloat(y);
      const cmp = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : String(x).localeCompare(String(y), "ru");
      return sort.dir === "desc" ? -cmp : cmp;
    });
  }
  const viewIdx = view.map(v => v.idx);
  const allSel = view.length > 0 && viewIdx.every(i => sel.has(i));

  const addFilter = () => { const col = td.cols.find(c => !fileCols.has(c)); setFilters(fs => [...fs, defaultFilter(col, colFilterMeta(col, rows, td.cols.indexOf(col)))]); };
  const toggleSort = (col) => { if (fileCols.has(col)) return; setSort(s => s.col !== col ? { col, dir: "asc" } : s.dir === "asc" ? { col, dir: "desc" } : { col: null, dir: "asc" }); };

  return (
    <Shell current={tableKey} breadcrumb={["Кафедра математики", td.title]}
      actions={<Button variant="primary" size="sm" icon={<Icon name="plus" size={13} color="#fff"/>} onClick={() => setShowCreate(true)}>Добавить запись</Button>}
      onNavigate={onNavigate}>
      <div style={{ padding: "20px 32px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{td.title}</h1>
          <div style={{ fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{td.count} записей</span>
            <span>·</span>
            <span>Обновлено 5 минут назад</span>
            <span>·</span>
            <span onClick={() => onNavigate("api01")} style={{ color: "var(--brand-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>API <Icon name="extlink" size={11}/></span>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: activeFilters.length || sort.col ? 10 : 12 }}>
          <div style={{ position: "relative", flex: "0 0 260px" }}>
            <Icon name="search" size={14} color="var(--fg-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по всем полям…" style={{ height: 32, width: "100%", padding: "0 10px 0 32px", border: "0.5px solid var(--border-strong)", borderRadius: 6, background: "var(--bg-0)", fontSize: 13, color: "var(--fg-1)", outline: 0, fontFamily: "inherit", boxSizing: "border-box" }}/>
          </div>

          {/* Filter */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowFilter(v => !v); setShowSort(false); }} style={toolBtn(showFilter || activeFilters.length > 0)}>
              <Icon name="filter" size={12}/>Фильтр{activeFilters.length > 0 && <span style={countPill}>{activeFilters.length}</span>}
            </button>
            <Popover open={showFilter} onClose={() => setShowFilter(false)} width={360}>
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--border-default)", fontSize: 12, fontWeight: 600, color: "var(--fg-1)" }}>Фильтры</div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflow: "auto" }}>
                {filters.length === 0 && <div style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", padding: "8px 0" }}>Условий пока нет</div>}
                {filters.map((f, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginLeft: 2 }}>и</div>}
                    <FilterRow f={f} cols={td.cols.filter(c => !fileCols.has(c))} sampleRows={rows} onChange={nf => setFilters(fs => fs.map((x, j) => j === i ? nf : x))} onRemove={() => setFilters(fs => fs.filter((_, j) => j !== i))}/>
                  </React.Fragment>
                ))}
              </div>
              <div style={{ padding: "10px 14px", borderTop: "0.5px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={addFilter} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--brand-primary)", fontSize: 12, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}><Icon name="plus" size={12}/>Добавить условие</button>
                {filters.length > 0 && <button onClick={() => setFilters([])} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-3)", fontSize: 12, fontFamily: "inherit" }}>Сбросить всё</button>}
              </div>
            </Popover>
          </div>

          {/* Sort */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowSort(v => !v); setShowFilter(false); }} style={toolBtn(showSort || !!sort.col)}>
              <Icon name="sliders" size={12}/>Сортировка
            </button>
            <Popover open={showSort} onClose={() => setShowSort(false)} width={240}>
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--border-default)", fontSize: 12, fontWeight: 600 }}>Сортировать по</div>
              <div style={{ padding: 8, maxHeight: 260, overflow: "auto" }}>
                {td.cols.filter(c => !fileCols.has(c)).map(c => {
                  const on = sort.col === c;
                  return (
                    <button key={c} onClick={() => setSort(on ? { col: null, dir: "asc" } : { col: c, dir: sort.dir })} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 10px", border: 0, borderRadius: 6, cursor: "pointer", background: on ? "var(--brand-tint)" : "transparent", color: on ? "var(--purple-700)" : "var(--fg-1)", fontSize: 13, fontFamily: "inherit", fontWeight: on ? 500 : 400, textAlign: "left" }}>
                      <span>{c}</span>{on && <Icon name="check" size={13} color="var(--purple-600)"/>}
                    </button>
                  );
                })}
              </div>
              {sort.col && (
                <div style={{ padding: 8, borderTop: "0.5px solid var(--border-default)", display: "flex", gap: 6 }}>
                  {[["asc", "↑ По возрастанию"], ["desc", "↓ По убыванию"]].map(([d, l]) => (
                    <button key={d} onClick={() => setSort(s => ({ ...s, dir: d }))} style={{ flex: 1, height: 30, border: 0, borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500, background: sort.dir === d ? "var(--brand-primary)" : "var(--bg-2)", color: sort.dir === d ? "#fff" : "var(--fg-2)" }}>{l}</button>
                  ))}
                </div>
              )}
            </Popover>
          </div>

          <div style={{ flex: 1 }}/>
          <Button variant="ghost" size="sm" icon={<Icon name="refresh" size={12}/>} onClick={() => showToast("Данные обновлены")}>Обновить</Button>
        </div>

        {/* Active filter chips */}
        {(activeFilters.length > 0 || sort.col) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {activeFilters.map((f, i) => {
              const meta = colFilterMeta(f.col, rows, td.cols.indexOf(f.col));
              const opLabel = (OPS[meta.type].find(o => o[0] === f.op) || [, ""])[1];
              return (
                <span key={i} style={chip}>
                  <span style={{ color: "var(--fg-3)" }}>{f.col}</span>
                  <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>{opLabel}</span>
                  <span style={{ color: "var(--purple-700)" }}>{valLabel(f, meta)}</span>
                  <button onClick={() => setFilters(fs => fs.filter(x => x !== f))} style={chipX}><Icon name="x" size={11}/></button>
                </span>
              );
            })}
            {sort.col && (
              <span style={{ ...chip, background: "var(--bg-2)" }}>
                <Icon name="sliders" size={11} color="var(--fg-3)"/>
                <span style={{ color: "var(--fg-2)" }}>{sort.col} {sort.dir === "asc" ? "↑" : "↓"}</span>
                <button onClick={() => setSort({ col: null, dir: "asc" })} style={chipX}><Icon name="x" size={11}/></button>
              </span>
            )}
            {(activeFilters.length > 0) && <button onClick={() => setFilters([])} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-3)", fontSize: 12, fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>Очистить</button>}
          </div>
        )}

        {/* Table */}
        <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
          <table className="dt">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allSel} onChange={e => { const s = new Set(sel); viewIdx.forEach(i => e.target.checked ? s.add(i) : s.delete(i)); setSel(s); }} style={{ accentColor: "var(--brand-primary)" }}/>
                </th>
                {td.cols.map((c, i) => {
                  const on = sort.col === c;
                  const isFileCol = fileCols.has(c);
                  return (
                    <th key={i} onClick={() => !isFileCol && toggleSort(c)} className={isFileCol ? undefined : "sortable"} style={{ textAlign: NUM_COLS.has(c) ? "right" : "left" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: on ? "var(--purple-700)" : undefined }}>
                        {c}
                        {!isFileCol && <span style={{ width: 9, fontSize: 9, lineHeight: 1, color: on ? "var(--purple-500)" : "var(--neutral-300)" }}>{on ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>}
                      </span>
                    </th>
                  );
                })}
                <th style={{ width: 72 }}></th>
              </tr>
            </thead>
            <tbody>
              {view.map(({ r, idx }) => (
                <tr key={idx} style={{ background: sel.has(idx) ? "var(--brand-tint)" : undefined }}>
                  <td style={{ padding: "8px 12px" }}>
                    <input type="checkbox" checked={sel.has(idx)} onChange={e => { const s = new Set(sel); e.target.checked ? s.add(idx) : s.delete(idx); setSel(s); }} style={{ accentColor: "var(--brand-primary)" }}/>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {hasMono && <Monogram name={r[0]}/>}
                      <span>{String(r[0])}</span>
                    </span>
                  </td>
                  {r.slice(1).map((cell, ci) => {
                    const col = td.cols[ci + 1];
                    const isNum = NUM_COLS.has(col);
                    return (
                      <td key={ci} style={{ textAlign: isNum ? "right" : "left" }}>
                        {Array.isArray(cell) ? <FileCell files={cell} onOpen={() => setGallery({ rowName: String(r[0]), col, files: cell })}/> : typeof cell === "boolean"
                          ? <Badge tone={cell ? "success" : "neutral"} dot>{cell ? "да" : "нет"}</Badge>
                          : cell === "active"   ? <StatusDot status="online"/>
                          : cell === "setup"    ? <StatusDot status="setup"/>
                          : cell === "offline"  ? <StatusDot status="offline"/>
                          : <span style={{ fontFamily: (isNum || typeof cell === "number") ? "var(--font-mono)" : "inherit", fontVariantNumeric: "tabular-nums", color: String(cell).includes("@") ? "var(--brand-primary)" : "inherit", fontSize: String(cell).includes("@") ? 12 : "inherit" }}>{String(cell)}</span>
                        }
                      </td>
                    );
                  })}
                  <td>
                    <div className="row-actions" style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 100ms" }}>
                      <button style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }} onClick={() => showToast("Изменения сохранены")}><Icon name="pencil" size={13}/></button>
                      <button style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-2)", borderRadius: 4 }} onClick={() => setDeleteRow(idx)}><Icon name="trash" size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {view.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-2)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--fg-3)" }}><Icon name="search" size={18}/></div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Ничего не найдено</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 14 }}>Попробуй изменить фильтры или поисковый запрос.</div>
              <Button variant="secondary" size="sm" onClick={() => { setFilters([]); setSearch(""); }}>Сбросить фильтры</Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, fontSize: 12, color: "var(--fg-3)" }}>
          <span>{view.length > 0 ? `Показано 1–${view.length}` : "Нет записей"}{(activeFilters.length || search) ? ` из ${rows.length}` : ` из ${td.count}`}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <Button variant="ghost" size="sm" disabled>← Назад</Button>
            <Button variant="secondary" size="sm" style={{ minWidth: 32 }}>1</Button>
            <Button variant="ghost" size="sm" disabled>Вперёд →</Button>
          </div>
        </div>
      </div>

      {/* Selection bar */}
      {sel.size > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(calc(-50% + 110px))", background: "var(--neutral-900)", color: "#fff", padding: "10px 16px", borderRadius: 8, boxShadow: "var(--shadow-3)", display: "flex", alignItems: "center", gap: 16, fontSize: 13, zIndex: 30 }}>
          <span style={{ fontWeight: 500 }}>Выбрано: {sel.size}</span>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,.15)" }}/>
          <button style={{ background: 0, border: 0, color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }} onClick={() => showToast("Экспорт готов")}><Icon name="download" size={13}/>Экспорт</button>
          <button style={{ background: 0, border: 0, color: "var(--red-500)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><Icon name="trash" size={13}/>Удалить</button>
          <button onClick={() => setSel(new Set())} style={{ background: 0, border: 0, color: "rgba(255,255,255,.5)", cursor: "pointer", padding: 4 }}><Icon name="x" size={13}/></button>
        </div>
      )}

      <CreateRecordModal open={showCreate} onClose={() => setShowCreate(false)} onSave={() => showToast("Запись добавлена")} tableKey={tableKey}/>
      <DeleteConfirmModal open={deleteRow !== null} onClose={() => setDeleteRow(null)} onConfirm={() => { setRows(rs => rs.filter((_, i) => i !== deleteRow)); showToast("Запись удалена", "error"); }} rowName={deleteRow !== null ? String(rows[deleteRow]?.[0]) : ""}/>
      <FilesGalleryModal data={gallery} onClose={() => setGallery(null)} onToast={showToast} tableSlug={td.slug}/>
      {toast && <Toast tone={toast.tone} title={toast.title} onClose={() => setToast(null)}/>}

      <style>{`
        tr:hover .row-actions { opacity: 1 !important; }
        table.dt tbody tr { transition: background 90ms; }
        table.dt tbody tr:hover td { background: var(--bg-1); }
        table.dt th.sortable { cursor: pointer; user-select: none; transition: color 100ms; }
        table.dt th.sortable:hover { color: var(--fg-1); }
        table.dt th.sortable:hover span span { color: var(--fg-3) !important; }
      `}</style>
    </Shell>
  );
}

Object.assign(window, { ScreenSCH02, ScreenSCH03, ScreenDataTable });
