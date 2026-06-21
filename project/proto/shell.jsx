// Shell — sidebar + topbar + command palette
const { useState: useShellSt, useEffect: useShellEff } = React;

function Shell({ children, current, breadcrumb = [], actions, spaceName = "Кафедра математики", spaceSlug = "math-dept", onNavigate }) {
  const [pal, setPal] = useShellSt(false);
  useShellEff(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal(true); }
      if (e.key === "Escape") setPal(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <div data-screen-label={current} style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", background: "var(--bg-1)", fontFamily: "var(--font-sans)" }}>
      <ShellSidebar current={current} spaceName={spaceName} spaceSlug={spaceSlug} onNavigate={onNavigate}/>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ShellTopBar breadcrumb={breadcrumb} actions={actions} onPalette={() => setPal(true)}/>
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </div>
      {pal && <CommandPalette onClose={() => setPal(false)} onNavigate={id => { onNavigate?.(id); setPal(false); }}/>}
    </div>
  );
}

function ShellSidebar({ current, spaceName, spaceSlug, onNavigate }) {
  const Item = ({ icon, label, count, id }) => {
    const active = current === id;
    const [hov, setHov] = useShellSt(false);
    return (
      <div onClick={() => onNavigate?.(id)}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 10px", borderRadius: 6, cursor: "pointer", marginBottom: 1, background: active ? "var(--brand-tint)" : hov ? "var(--bg-1)" : "transparent", color: active ? "var(--purple-700)" : "var(--fg-1)", fontSize: 13, fontWeight: active ? 500 : 400, transition: "background 100ms" }}>
        <Icon name={icon} size={14} style={{ opacity: active ? 1 : 0.65 }}/>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {count != null && <span style={{ fontSize: 11, color: active ? "var(--purple-600)" : "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{count}</span>}
      </div>
    );
  };
  const Lbl = ({ label }) => <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.07em", padding: "14px 10px 5px" }}>{label}</div>;

  return (
    <aside style={{ background: "var(--bg-0)", borderRight: "0.5px solid var(--border-default)", padding: "12px 8px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflow: "auto", boxSizing: "border-box" }}>
      {/* Space switcher */}
      <div onClick={() => onNavigate?.("spaces")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 12px", cursor: "pointer", borderBottom: "0.5px solid var(--border-default)", marginBottom: 4 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--brand-primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>N</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, overflow: "hidden", flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{spaceName}</span>
          <span style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{spaceSlug}</span>
        </div>
        <Icon name="chevd" size={12} color="var(--fg-3)"/>
      </div>

      <Lbl label="Таблицы"/>
      <Item icon="table" label="Преподаватели" count={14} id="data-prep"/>
      <Item icon="table" label="Курсы" count={42} id="data-courses"/>
      <Item icon="table" label="Учебные планы" count={8} id="data-plans"/>
      <Item icon="plus" label="Новая таблица" id="sch02"/>

      <Lbl label="Выходы"/>
      <Item icon="code" label="REST API" id="api01"/>
      <Item icon="folder" label="Файлы" count={4} id="files"/>
      <Item icon="file" label="PDF" id="pdf01"/>

      <Lbl label="Пространство"/>
      <Item icon="users" label="Команда" id="set01"/>
      <Item icon="settings" label="Настройки" id="set02"/>

      <div style={{ flex: 1 }}/>
      <div style={{ borderTop: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", gap: 8, padding: "10px 10px 4px" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--purple-200)", color: "var(--purple-700)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>АИ</div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Анна Иванова</div>
          <div style={{ fontSize: 10, color: "var(--fg-3)" }}>Админ</div>
        </div>
        <div onClick={() => onNavigate?.("login")} style={{ cursor: "pointer", color: "var(--fg-3)", padding: 4 }}>
          <Icon name="logout" size={14}/>
        </div>
      </div>
    </aside>
  );
}

function ShellTopBar({ breadcrumb, actions, onPalette }) {
  return (
    <header style={{ height: 56, background: "var(--bg-0)", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, position: "sticky", top: 0, zIndex: 10, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden" }}>
        {(breadcrumb || []).map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: "var(--fg-3)", flexShrink: 0 }}>/</span>}
            <span style={{ color: i === breadcrumb.length - 1 ? "var(--fg-1)" : "var(--fg-2)", fontWeight: i === breadcrumb.length - 1 ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b}</span>
          </React.Fragment>
        ))}
      </div>
      <button onClick={onPalette} style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 12px", background: "var(--bg-1)", border: "0.5px solid var(--border-default)", borderRadius: 6, color: "var(--fg-3)", fontSize: 13, cursor: "pointer", minWidth: 220, fontFamily: "inherit" }}>
        <Icon name="search" size={14}/>
        <span style={{ flex: 1, textAlign: "left" }}>Поиск или команда…</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "1px 5px", background: "var(--bg-2)", borderRadius: 3, color: "var(--fg-2)", flexShrink: 0 }}>⌘K</span>
      </button>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </header>
  );
}

function CommandPalette({ onClose, onNavigate }) {
  const [q, setQ] = useShellSt("");
  const ALL = [
    { id: "data-prep",    icon: "table",    label: "Преподаватели",          hint: "14 записей",                group: "Таблицы"     },
    { id: "data-courses", icon: "table",    label: "Курсы",                  hint: "42 записи",                 group: "Таблицы"     },
    { id: "data-plans",   icon: "table",    label: "Учебные планы",          hint: "8 записей",                 group: "Таблицы"     },
    { id: "sch02",        icon: "plus",     label: "Создать таблицу",        hint: "Из шаблона или с нуля",    group: "Действия"    },
    { id: "api01",        icon: "code",     label: "REST API",               hint: "Документация эндпоинтов",  group: "Выходы"      },
    { id: "api02",        icon: "key",      label: "Ключи API",              hint: "Создать или отозвать",     group: "Выходы"      },
    { id: "files",        icon: "folder",   label: "Файлы и списки",         hint: "Списки для фронта · API",   group: "Выходы"      },
    { id: "pdf01",        icon: "file",     label: "PDF",                    hint: "Шаблоны и генерация",      group: "Выходы"      },
    { id: "set01",        icon: "users",    label: "Команда",                hint: "Участники и роли",         group: "Настройки"   },
    { id: "set02",        icon: "settings", label: "Настройки пространства", hint: "Имя, slug, удаление",      group: "Настройки"   },
    { id: "spaces",       icon: "box",      label: "Все пространства",       hint: "Сменить пространство",     group: "Навигация"   },
  ];
  const filtered = q.trim()
    ? ALL.filter(i => i.label.toLowerCase().includes(q.toLowerCase()) || i.hint.toLowerCase().includes(q.toLowerCase()))
    : ALL;
  const groups = filtered.reduce((acc, i) => { (acc[i.group] = acc[i.group] || []).push(i); return acc; }, {});

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(2px)", display: "grid", placeItems: "start center", zIndex: 200, paddingTop: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-0)", borderRadius: 12, boxShadow: "var(--shadow-3)", width: 560, maxWidth: "calc(100vw - 32px)", maxHeight: "60vh", display: "flex", flexDirection: "column", overflow: "hidden", animation: "modalIn 200ms" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "0.5px solid var(--border-default)" }}>
          <Icon name="search" size={16} color="var(--fg-3)"/>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск или команда…" style={{ flex: 1, border: 0, outline: 0, fontSize: 15, background: "transparent", color: "var(--fg-1)", fontFamily: "inherit" }}/>
          <span style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>esc</span>
        </div>
        <div style={{ overflow: "auto", padding: 8 }}>
          {Object.keys(groups).length === 0
            ? <div style={{ padding: 32, textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>Ничего не найдено</div>
            : Object.entries(groups).map(([g, items]) => (
              <div key={g} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.07em", padding: "8px 12px 4px" }}>{g}</div>
                {items.map(item => (
                  <div key={item.id} onClick={() => { onNavigate(item.id); onClose(); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 6, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Icon name={item.icon} size={14} color="var(--fg-3)"/>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: "var(--fg-3)", marginLeft: 4 }}>{item.hint}</span>
                  </div>
                ))}
              </div>
            ))}
        </div>
        <div style={{ borderTop: "0.5px solid var(--border-default)", padding: "8px 16px", fontSize: 11, color: "var(--fg-3)", display: "flex", gap: 16 }}>
          <span>↵ открыть</span><span>↑↓ навигация</span><span>esc закрыть</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Shell, ShellSidebar, ShellTopBar, CommandPalette });
