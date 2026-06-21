// Auth screens (Login, Register, Reset) + Spaces (SP01 + SP02 modal)
const { useState: useAuthSt } = React;

/* ── Auth wrapper ─────────────────────────────────────────── */
function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-1)", display: "grid", gridTemplateRows: "auto 1fr auto" }}>
      <header style={{ padding: "28px 40px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--brand-primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>N</div>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--fg-1)" }}>Nerion</span>
      </header>
      <main style={{ display: "grid", placeItems: "center", padding: "0 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "slideUp 220ms both" }}>{children}</div>
      </main>
      <footer style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", color: "var(--fg-3)", fontSize: 12 }}>
        <span>© Nerion · 2026</span>
        <span>Помощь</span>
      </footer>
    </div>
  );
}

/* ── A01 Login ────────────────────────────────────────────── */
function ScreenLogin({ onNavigate }) {
  const [email, setEmail] = useAuthSt("anna.ivanova@msu.ru");
  const [pwd, setPwd] = useAuthSt("••••••••••");
  const [showPwd, setShowPwd] = useAuthSt(false);
  const handleSubmit = e => { e.preventDefault(); onNavigate("spaces"); };
  return (
    <AuthLayout>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>С возвращением</h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>Войди, чтобы продолжить работу с пространствами.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.ru" type="email"/>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>Пароль</label>
            <span onClick={() => onNavigate("reset")} style={{ fontSize: 12, color: "var(--brand-primary)", cursor: "pointer" }}>Забыл пароль?</span>
          </div>
          <div style={{ position: "relative" }}>
            <Input value={pwd} onChange={e => setPwd(e.target.value)} type={showPwd ? "text" : "password"} placeholder="••••••••" style={{ paddingRight: 38 }}/>
            <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 10, top: 9, background: 0, border: 0, cursor: "pointer", color: "var(--fg-3)", padding: 2 }}><Icon name="eye" size={14}/></button>
          </div>
        </div>
        <Button type="submit" variant="primary" size="md" style={{ width: "100%", marginTop: 4 }}>Войти</Button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 12 }}>
          <div style={{ flex: 1, height: "0.5px", background: "var(--border-default)" }}/> или <div style={{ flex: 1, height: "0.5px", background: "var(--border-default)" }}/>
        </div>
        <Button variant="secondary" size="md" style={{ width: "100%" }}>Войти через Яндекс ID</Button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: "var(--fg-2)", textAlign: "center" }}>
        Нет аккаунта?{" "}
        <span onClick={() => onNavigate("register")} style={{ color: "var(--brand-primary)", fontWeight: 500, cursor: "pointer" }}>Зарегистрироваться</span>
      </p>
    </AuthLayout>
  );
}

/* ── A02 Register ─────────────────────────────────────────── */
function ScreenRegister({ onNavigate }) {
  const [name, setName] = useAuthSt("Анна Иванова");
  const [email, setEmail] = useAuthSt("");
  const [pwd, setPwd] = useAuthSt("");
  return (
    <AuthLayout>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>Создать аккаунт</h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, marginBottom: 28 }}>14 дней Pro бесплатно, карта не нужна.</p>
      <form onSubmit={e => { e.preventDefault(); onNavigate("spaces"); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Имя</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Как тебя зовут"/>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.ru" type="email"/>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Пароль</label>
          <Input value={pwd} onChange={e => setPwd(e.target.value)} type="password" placeholder="Минимум 8 символов"/>
        </div>
        <Button type="submit" variant="primary" size="md" style={{ width: "100%", marginTop: 4 }}>Зарегистрироваться</Button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: "var(--fg-2)", textAlign: "center" }}>
        Уже есть аккаунт?{" "}
        <span onClick={() => onNavigate("login")} style={{ color: "var(--brand-primary)", fontWeight: 500, cursor: "pointer" }}>Войти</span>
      </p>
      <p style={{ marginTop: 16, fontSize: 11, color: "var(--fg-3)", textAlign: "center", lineHeight: 1.5 }}>
        Регистрируясь, ты соглашаешься с условиями использования и политикой конфиденциальности.
      </p>
    </AuthLayout>
  );
}

/* ── A03 Reset ────────────────────────────────────────────── */
function ScreenReset({ onNavigate }) {
  const [email, setEmail] = useAuthSt("anna.ivanova@msu.ru");
  const [sent, setSent] = useAuthSt(false);
  if (sent) return (
    <AuthLayout>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-100)", color: "var(--green-700)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}><Icon name="check" size={24}/></div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.01em" }}>Письмо отправлено</h1>
        <p style={{ color: "var(--fg-2)", fontSize: 14, marginBottom: 28 }}>Проверь <strong>{email}</strong> — там ссылка для сброса пароля.</p>
        <Button variant="secondary" size="md" onClick={() => onNavigate("login")} style={{ width: "100%" }}>← Назад к входу</Button>
      </div>
    </AuthLayout>
  );
  return (
    <AuthLayout>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>Сброс пароля</h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, marginBottom: 28 }}>Пришлём ссылку для сброса на email.</p>
      <form onSubmit={e => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.ru" type="email"/>
        </div>
        <Button type="submit" variant="primary" size="md" style={{ width: "100%", marginTop: 4 }}>Отправить ссылку</Button>
      </form>
      <p style={{ marginTop: 24, fontSize: 13, color: "var(--fg-2)", textAlign: "center" }}>
        <span onClick={() => onNavigate("login")} style={{ color: "var(--brand-primary)", fontWeight: 500, cursor: "pointer" }}>← Назад к входу</span>
      </p>
    </AuthLayout>
  );
}

/* ── SP01 Spaces ──────────────────────────────────────────── */
const SPACES = [
  { id: 1, name: "Кафедра математики",    slug: "math-dept",      tables: 8,  members: 4, updated: "2 ч назад",    icon: "table", color: "var(--purple-100)", fg: "var(--purple-700)" },
  { id: 2, name: "Кафедра физики",        slug: "physics-dept",   tables: 12, members: 6, updated: "вчера",        icon: "box",   color: "#FFE4E6",            fg: "#9F1239"           },
  { id: 3, name: "Деканат ФПМИ",          slug: "dean-fpmi",      tables: 5,  members: 2, updated: "3 дня назад",  icon: "users", color: "#DBEAFE",            fg: "#1E40AF"           },
  { id: 4, name: "Приёмная комиссия 2026",slug: "admission-2026", tables: 3,  members: 8, updated: "неделю назад", icon: "file",  color: "#D1FAE5",            fg: "var(--green-700)" },
];

function SpaceCard({ s, onClick }) {
  const [hov, setHov] = useAuthSt(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 12, padding: 24, cursor: "pointer", boxShadow: hov ? "var(--shadow-2)" : "var(--shadow-1)", transition: "box-shadow 180ms, transform 120ms", transform: hov ? "translateY(-2px)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color, color: s.fg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={s.icon} size={20}/></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)", marginBottom: 4 }}>{s.name}</div>
          <Slug>{s.slug}</Slug>
        </div>
        <Icon name="chev" size={14} color="var(--fg-3)" style={{ opacity: hov ? 1 : 0, transition: "opacity 120ms" }}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 14, borderTop: "0.5px solid var(--border-default)" }}>
        <div><div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.tables}</div><div style={{ fontSize: 11, color: "var(--fg-3)" }}>таблиц</div></div>
        <div><div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.members}</div><div style={{ fontSize: 11, color: "var(--fg-3)" }}>в команде</div></div>
        <div><div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>{s.updated}</div><div style={{ fontSize: 11, color: "var(--fg-3)" }}>обновлено</div></div>
      </div>
    </div>
  );
}

function ScreenSpaces({ onNavigate }) {
  const [showCreate, setShowCreate] = useAuthSt(false);
  const [newName, setNewName] = useAuthSt("Кафедра информатики");
  const [newSlug, setNewSlug] = useAuthSt("informatics-dept");
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-1)" }}>
      <header style={{ height: 56, background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 32px", gap: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--brand-primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>N</div>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>Nerion</span>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 13, color: "var(--fg-2)" }}>anna.ivanova@msu.ru</span>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--purple-200)", color: "var(--purple-700)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>АИ</div>
      </header>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>Пространства</h1>
            <p style={{ fontSize: 14, color: "var(--fg-2)" }}>Каждое пространство — изолированная база с API и командой.</p>
          </div>
          <Button variant="primary" size="md" icon={<Icon name="plus" size={14} color="#fff"/>} onClick={() => setShowCreate(true)}>Новое пространство</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {SPACES.map(s => <SpaceCard key={s.id} s={s} onClick={() => onNavigate("data-prep")}/>)}
        </div>
        <div style={{ marginTop: 28, padding: "16px 20px", background: "var(--brand-tint)", border: "0.5px solid var(--purple-100)", borderRadius: 8, display: "flex", alignItems: "center", gap: 14 }}>
          <Icon name="box" size={18} color="var(--purple-600)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--purple-700)" }}>На тарифе Free доступно ещё 1 пространство</div>
            <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>Pro снимает лимит и добавляет 100k записей в каждом.</div>
          </div>
          <Button variant="secondary" size="sm">Сравнить тарифы</Button>
        </div>
      </main>

      {/* SP02 Create Space Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новое пространство" subtitle="Изолированная база с собственным API и командой.">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Название</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)}/>
            <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 5 }}>Видно только команде. Можно изменить позже.</p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Slug</label>
            <div style={{ display: "flex", alignItems: "center", height: 36, border: "0.5px solid var(--border-strong)", borderRadius: 6, overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              <span style={{ padding: "0 10px", background: "var(--bg-2)", color: "var(--fg-3)", height: "100%", display: "flex", alignItems: "center", borderRight: "0.5px solid var(--border-default)", whiteSpace: "nowrap" }}>app.nerion.ru/</span>
              <input value={newSlug} onChange={e => setNewSlug(e.target.value)} style={{ flex: 1, height: "100%", padding: "0 10px", border: 0, outline: 0, fontFamily: "inherit", fontSize: 13, color: "var(--fg-1)", background: "transparent" }}/>
              <span style={{ padding: "0 10px", color: "var(--green-500)" }}><Icon name="check" size={14}/></span>
            </div>
            <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 5 }}>Используется в URL API. a–z, 0–9, дефис.</p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
          <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>Отмена</Button>
          <Button variant="primary" size="md" onClick={() => { setShowCreate(false); onNavigate("data-prep"); }}>Создать пространство</Button>
        </div>
      </Modal>
    </div>
  );
}

Object.assign(window, { ScreenLogin, ScreenRegister, ScreenReset, ScreenSpaces });
