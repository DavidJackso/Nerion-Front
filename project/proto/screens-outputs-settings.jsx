// API01 docs, API02 keys, PDF01 gallery, SET01 team, SET02 settings
const { useState: useOutSt } = React;

/* ─── API01 Docs ──────────────────────────────────────────── */
const ENDPOINTS = [
  { method: "GET",    path: "/api/math-dept/teachers",       desc: "Список с фильтрами и пагинацией" },
  { method: "GET",    path: "/api/math-dept/teachers/{id}",  desc: "Одна запись по ID" },
  { method: "POST",   path: "/api/math-dept/teachers",       desc: "Создать запись" },
  { method: "PATCH",  path: "/api/math-dept/teachers/{id}",  desc: "Обновить поля" },
  { method: "DELETE", path: "/api/math-dept/teachers/{id}",  desc: "Удалить запись" },
];
const METHOD_COLOR = { GET: ["#DBEAFE","#1E40AF"], POST: ["#D1FAE5","#065F46"], PATCH: ["#FEF3C7","#92400E"], DELETE: ["#FEE2E2","#991B1B"] };

const SAMPLES = {
  curl: (ep) => `curl -X ${ep.method} 'https://app.nerion.ru${ep.path.replace("{id}", "rec_a8f2b4")}' \\
  -H 'Authorization: Bearer nrn_live_••••••••3f2a' \\
  -H 'Content-Type: application/json'`,
  js: (ep) => `const res = await fetch(
  'https://app.nerion.ru${ep.path.replace("{id}", "rec_a8f2b4")}',
  {
    method: '${ep.method}',
    headers: {
      'Authorization': \`Bearer \${process.env.NERION_KEY}\`,
    },
  }
);
const data = await res.json();`,
  py: (ep) => `import requests, os
r = requests.${ep.method.toLowerCase()}(
  'https://app.nerion.ru${ep.path.replace("{id}", "rec_a8f2b4")}',
  headers={'Authorization': f'Bearer {os.environ["NERION_KEY"]}'},
)
data = r.json()`,
};

const RESPONSE_JSON = `{
  "data": [
    {
      "id": "rec_a8f2b4e9c1",
      "fio": "Иванов Алексей Петрович",
      "degree": "д.ф.-м.н.",
      "position": "профессор",
      "rate": 1.0,
      "email": "ivanov@msu.ru",
      "active": true
    }
  ],
  "meta": { "total": 14, "page": 1, "per_page": 50 }
}`;

function ScreenAPI01({ onNavigate }) {
  const [picked, setPicked] = useOutSt(0);
  const [tab, setTab] = useOutSt("curl");
  const [copied, setCopied] = useOutSt(false);
  const ep = ENDPOINTS[picked];
  const [mc, fc] = METHOD_COLOR[ep.method] || ["#eee","#333"];
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <Shell current="api01" breadcrumb={["Кафедра математики", "REST API"]}
      actions={<Button variant="secondary" size="sm" icon={<Icon name="key" size={13}/>} onClick={() => onNavigate("api02")}>Ключи API</Button>}
      onNavigate={onNavigate}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "calc(100vh - 56px)" }}>
        {/* Endpoint list */}
        <aside style={{ background: "var(--bg-0)", borderRight: "0.5px solid var(--border-default)", padding: "20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 12px" }}>
            <StatusDot status="online"/>
            <span style={{ fontSize: 11, color: "var(--fg-3)", marginLeft: "auto" }}>API активен</span>
          </div>
          <div style={{ padding: "0 16px 8px", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Преподаватели</div>
          {ENDPOINTS.map((e, i) => {
            const [bg, fg] = METHOD_COLOR[e.method] || ["#eee","#333"];
            return (
              <button key={i} onClick={() => setPicked(i)} style={{ width: "100%", padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, background: picked === i ? "var(--brand-tint)" : "transparent", border: 0, borderLeft: `3px solid ${picked === i ? "var(--brand-primary)" : "transparent"}`, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: bg, color: fg, fontFamily: "var(--font-mono)", minWidth: 38, textAlign: "center" }}>{e.method === "DELETE" ? "DEL" : e.method}</span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path.replace("/api/math-dept/", "/")}</span>
              </button>
            );
          })}
          <div style={{ marginTop: 16, padding: "0 16px 8px", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Курсы</div>
          {[["GET","/api/math-dept/courses"],["POST","/api/math-dept/courses"]].map(([m, p], i) => {
            const [bg, fg] = METHOD_COLOR[m];
            return <button key={i} style={{ width: "100%", padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: 0, borderLeft: "3px solid transparent", cursor: "pointer" }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: bg, color: fg, fontFamily: "var(--font-mono)", minWidth: 38, textAlign: "center" }}>{m}</span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-2)" }}>{p.replace("/api/math-dept/", "/")}</span>
            </button>;
          })}
        </aside>

        {/* Main content */}
        <main style={{ padding: "32px 40px 80px", maxWidth: 840 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4, background: mc, color: fc, fontFamily: "var(--font-mono)" }}>{ep.method}</span>
            <code style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{ep.path}</code>
          </div>
          <p style={{ fontSize: 14, color: "var(--fg-2)", marginBottom: 28 }}>{ep.desc}.</p>

          <section style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Параметры query</div>
            <table className="dt">
              <tbody>
                {[["page","integer","Номер страницы, по умолчанию 1."],["per_page","integer","Записей на странице, до 200."],["sort","string","Поле сортировки, с минусом — убывание."],["filter[active]","boolean","Только активные записи."]].map(([k,t,d],i) => (
                  <tr key={i}>
                    <td style={{ width: 160 }}><code style={{ fontSize: 12 }}>{k}</code></td>
                    <td style={{ width: 90, color: "var(--fg-3)", fontSize: 12 }}>{t}</td>
                    <td style={{ color: "var(--fg-2)", fontSize: 13 }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Запрос</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[["curl","cURL"],["js","JavaScript"],["py","Python"]].map(([k,lbl]) => (
                  <button key={k} onClick={() => setTab(k)} style={{ padding: "5px 10px", fontSize: 12, background: tab === k ? "var(--bg-0)" : "transparent", border: tab === k ? "0.5px solid var(--border-strong)" : "0.5px solid transparent", borderRadius: 4, cursor: "pointer", color: tab === k ? "var(--fg-1)" : "var(--fg-2)", fontFamily: "inherit" }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{ position: "relative", background: "var(--neutral-900)", borderRadius: 8, overflow: "hidden" }}>
              <button onClick={copy} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.08)", border: 0, color: "rgba(255,255,255,.7)", padding: "5px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name={copied ? "check" : "copy"} size={11} color="rgba(255,255,255,.7)"/>{copied ? "Скопировано" : "Копировать"}
              </button>
              <pre style={{ margin: 0, padding: "20px 24px", color: "rgba(255,255,255,.9)", fontSize: 13, fontFamily: "var(--font-mono)", lineHeight: 1.6, overflow: "auto", whiteSpace: "pre-wrap" }}>{SAMPLES[tab](ep)}</pre>
            </div>
          </section>

          <section>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Ответ <span style={{ color: "var(--green-600)", fontFamily: "var(--font-mono)", marginLeft: 8, textTransform: "none" }}>200 OK</span>
            </div>
            <div style={{ background: "var(--neutral-900)", borderRadius: 8, padding: "20px 24px" }}>
              <pre style={{ margin: 0, color: "rgba(255,255,255,.9)", fontSize: 13, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>{RESPONSE_JSON}</pre>
            </div>
          </section>
        </main>
      </div>
    </Shell>
  );
}

/* ─── API02 Keys ──────────────────────────────────────────── */
const API_KEYS = [
  { name: "Production · LMS",      key: "nrn_live_8a72f9b1c4e5d6a3f2a", scope: "read+write", last: "2 мин назад", req: 14820 },
  { name: "Аналитика (R/O)",       key: "nrn_live_3c91e2a7f4b8d6c1e2b", scope: "read",       last: "1 ч назад",  req: 312   },
  { name: "Локальная разработка",  key: "nrn_test_•••••••••••••••••••",  scope: "read+write", last: "вчера",      req: 47    },
];

function ScreenAPI02({ onNavigate }) {
  const [toast, setToast] = useOutSt(null);
  const show = (t) => { setToast(t); setTimeout(() => setToast(null), 2500); };
  return (
    <Shell current="api02" breadcrumb={["Кафедра математики", "REST API", "Ключи"]} onNavigate={onNavigate}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 32px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Ключи API</h1>
            <p style={{ fontSize: 13, color: "var(--fg-2)" }}>Используй в заголовке <code style={{ fontSize: 12 }}>Authorization: Bearer …</code></p>
          </div>
          <Button variant="primary" size="md" icon={<Icon name="plus" size={14} color="#fff"/>} onClick={() => show("Ключ создан — скопируй сейчас")}>Создать ключ</Button>
        </div>

        {/* Fresh key banner */}
        <div style={{ background: "var(--bg-0)", border: "1.5px solid var(--brand-primary)", borderRadius: 8, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Icon name="key" size={14} color="var(--purple-600)"/>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Ключ создан — скопируй сейчас</span>
            <Badge tone="warning" dot>видно один раз</Badge>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, padding: "10px 14px", background: "var(--bg-2)", borderRadius: 6, fontSize: 12, color: "var(--fg-1)", fontFamily: "var(--font-mono)", border: "0.5px solid var(--border-default)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>nrn_live_8a72f9b1c4e5d6a3f2a9b8c7d6e5f4a3b2c1d0</code>
            <Button variant="primary" size="md" icon={<Icon name="copy" size={13} color="#fff"/>} onClick={() => show("Ключ скопирован")}>Копировать</Button>
          </div>
        </div>

        <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
          <table className="dt">
            <thead><tr><th>Имя</th><th>Ключ</th><th>Scope</th><th style={{ textAlign: "right" }}>Запросов / 24ч</th><th>Последнее использование</th><th style={{ width: 80 }}></th></tr></thead>
            <tbody>
              {API_KEYS.map((k, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{k.name}</td>
                  <td><code style={{ fontSize: 11 }}>{k.key.slice(0, 14)}…</code></td>
                  <td><Badge tone={k.scope.includes("write") ? "warning" : "neutral"}>{k.scope}</Badge></td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{k.req.toLocaleString("ru")}</td>
                  <td style={{ color: "var(--fg-2)" }}>{k.last}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--fg-3)" }} onClick={() => show("Ключ обновлён")}><Icon name="refresh" size={13}/></button>
                      <button style={{ background: 0, border: 0, padding: 5, cursor: "pointer", color: "var(--red-500)" }}><Icon name="trash" size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, padding: "14px 16px", background: "#FFFBEB", border: "0.5px solid #FDE68A", borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="lock" size={15} color="#92400E"/>
          <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.55 }}><strong>Безопасность.</strong> Test-ключи работают только на localhost. Live-ключи держи в переменных окружения, никогда — в коде.</div>
        </div>
      </div>
      {toast && <Toast tone="success" title={toast} onClose={() => setToast(null)}/>}
    </Shell>
  );
}

/* ─── SET01 Team ──────────────────────────────────────────── */
const MEMBERS = [
  { name: "Анна Иванова",    email: "anna.ivanova@msu.ru",  role: "Admin",  joined: "12.03.2024", color: "var(--purple-200)", fg: "var(--purple-700)", you: true },
  { name: "Дмитрий Петров",  email: "d.petrov@msu.ru",     role: "Member", joined: "15.03.2024", color: "#DBEAFE",            fg: "#1E40AF" },
  { name: "Мария Сидорова",  email: "m.sidorova@msu.ru",   role: "Member", joined: "20.03.2024", color: "#FFE4E6",            fg: "#9F1239" },
  { name: "Сергей Ковалёв",  email: "s.kovalev@msu.ru",    role: "Member", joined: "01.04.2024", color: "#D1FAE5",            fg: "var(--green-700)" },
];

function ScreenSET01({ onNavigate }) {
  const [toast, setToast] = useOutSt(null);
  return (
    <Shell current="set01" breadcrumb={["Кафедра математики", "Настройки", "Команда"]} onNavigate={onNavigate}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 32px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>Команда</h1>
            <p style={{ fontSize: 13, color: "var(--fg-2)" }}>4 из 10 мест на тарифе Pro</p>
          </div>
          <Button variant="primary" size="md" icon={<Icon name="plus" size={14} color="#fff"/>} onClick={() => setToast("Приглашение отправлено")}>Добавить участника</Button>
        </div>

        <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, overflow: "hidden" }}>
          {MEMBERS.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, borderTop: i ? "0.5px solid var(--border-default)" : 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.color, color: m.fg, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{m.name.split(" ").map(p => p[0]).join("").slice(0,2)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>{m.name}{m.you && <Badge tone="brand">это ты</Badge>}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{m.email}</div>
              </div>
              <Badge tone={m.role === "Admin" ? "brand" : "neutral"}>{m.role}</Badge>
              <span style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>с {m.joined}</span>
              <button disabled={m.you} style={{ background: 0, border: 0, padding: 6, cursor: m.you ? "default" : "pointer", color: m.you ? "var(--neutral-300)" : "var(--fg-3)" }}><Icon name="more" size={14}/></button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Что умеет каждая роль</div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px 16px", fontSize: 12 }}>
            <div style={{ color: "var(--fg-1)", fontWeight: 500 }}>Admin</div><div style={{ color: "var(--fg-2)" }}>Всё: таблицы, API-ключи, биллинг, состав команды, настройки пространства.</div>
            <div style={{ color: "var(--fg-1)", fontWeight: 500 }}>Member</div><div style={{ color: "var(--fg-2)" }}>Чтение и редактирование записей, генерация PDF.</div>
          </div>
        </div>
      </div>
      {toast && <Toast tone="success" title={toast} onClose={() => setToast(null)}/>}
    </Shell>
  );
}

/* ─── SET02 Settings ──────────────────────────────────────── */
function ScreenSET02({ onNavigate }) {
  const [name, setName] = useOutSt("Кафедра математики");
  const [slug, setSlug] = useOutSt("math-dept");
  const [toast, setToast] = useOutSt(null);
  const [dangerInput, setDangerInput] = useOutSt("");
  return (
    <Shell current="set02" breadcrumb={["Кафедра математики", "Настройки"]} onNavigate={onNavigate}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 32px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28, letterSpacing: "-0.01em" }}>Настройки пространства</h1>

        <div style={{ background: "var(--bg-0)", border: "0.5px solid var(--border-default)", borderRadius: 8, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Основное</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Название пространства</label>
              <Input value={name} onChange={e => setName(e.target.value)}/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Slug</label>
              <div style={{ display: "flex", alignItems: "center", height: 36, border: "0.5px solid var(--border-strong)", borderRadius: 6, overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                <span style={{ padding: "0 10px", background: "var(--bg-2)", color: "var(--fg-3)", height: "100%", display: "flex", alignItems: "center", borderRight: "0.5px solid var(--border-default)", whiteSpace: "nowrap" }}>app.nerion.ru/</span>
                <input value={slug} onChange={e => setSlug(e.target.value)} style={{ flex: 1, height: "100%", padding: "0 10px", border: 0, outline: 0, fontFamily: "inherit", fontSize: 13, color: "var(--fg-1)", background: "transparent" }}/>
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 5 }}>Изменение slug изменит все URL API — обнови ключи в интеграциях.</p>
            </div>
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="primary" size="md" onClick={() => setToast("Настройки сохранены")}>Сохранить</Button>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ border: "0.5px solid var(--red-100)", background: "var(--red-50)", borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red-700)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="warn" size={14}/>Опасная зона
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: "0.5px solid var(--red-100)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>Удалить пространство</div>
              <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>Все таблицы, записи и API-ключи будут удалены без возможности восстановления.</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Введи <code style={{ fontSize: 11 }}>math-dept</code> для подтверждения</label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input value={dangerInput} onChange={e => setDangerInput(e.target.value)} placeholder="math-dept" style={{ flex: 1 }}/>
              <Button variant="danger" size="md" disabled={dangerInput !== "math-dept"}>Удалить пространство</Button>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast tone="success" title={toast} onClose={() => setToast(null)}/>}
    </Shell>
  );
}

Object.assign(window, { ScreenAPI01, ScreenAPI02, ScreenSET01, ScreenSET02 });
