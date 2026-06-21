// Nerion DS — Primitives: Icon, Button, Input, Badge, Method, Slug, Modal, Toast, Toggle, StatusDot, Skeleton
const { useState: usePrimSt } = React;

const sharedKeyframes = `
@keyframes shimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes modalFade { from{opacity:0} to{opacity:1} }
@keyframes modalIn { from{transform:translateY(8px) scale(.98)} to{transform:none} }
@keyframes toastIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
`;

function Icon({ name, size = 16, color, style }) {
  const p = {
    plus: <><path d="M5 12h14M12 5v14"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    table: <><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></>,
    pencil: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></>,
    trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    copy: <><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    chev: <><polyline points="9 18 15 12 9 6"/></>,
    chevd: <><polyline points="6 9 12 15 18 9"/></>,
    grid: <><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></>,
    key: <><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15 19 4M18 5l2 2M15 8l2 2"/></>,
    drag: <><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></>,
    more: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
    refresh: <><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></>,
    x: <><path d="M18 6 6 18M6 6l12 12"/></>,
    eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>,
    lock: <><rect width="14" height="11" x="5" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    warn: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></>,
    arrow: <><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    billing: <><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    extlink: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></>,
    sliders: <><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></>,
    folder: <><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></>,
    image: <><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    play: <><polygon points="6 3 20 12 6 21 6 3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></>,
    clip: <><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", ...style }}>
      {p[name] || <circle cx="12" cy="12" r="5"/>}
    </svg>
  );
}

function Button({ children, variant = "primary", size = "md", onClick, disabled, type = "button", icon, style }) {
  const [hov, setHov] = usePrimSt(false);
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, lineHeight: 1, transition: "background 120ms, transform 80ms", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", boxSizing: "border-box" };
  const sizes = { sm: { height: 28, padding: "0 10px", fontSize: 13 }, md: { height: 36, padding: "0 14px", fontSize: 14 }, lg: { height: 44, padding: "0 20px", fontSize: 15 } };
  const vars = { primary: { background: "var(--brand-primary)", color: "#fff" }, secondary: { background: "var(--bg-0)", color: "var(--fg-1)", border: "0.5px solid var(--border-strong)" }, ghost: { background: "transparent", color: "var(--fg-1)" }, danger: { background: "var(--danger-solid)", color: "#fff" }, "danger-ghost": { background: "transparent", color: "var(--danger-fg)", border: "0.5px solid var(--danger-border)" } };
  const hStyle = hov && !disabled ? { primary: { background: "var(--brand-primary-hover)" }, secondary: { background: "var(--bg-2)" }, ghost: { background: "var(--bg-2)" }, danger: { background: "var(--red-600)" }, "danger-ghost": { background: "var(--danger-bg)" } }[variant] : {};
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...base, ...sizes[size], ...vars[variant], ...hStyle, ...style }}>
      {icon}{children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text", error, mono, style, ...rest }) {
  const [focus, setFocus] = usePrimSt(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ height: 36, padding: "0 12px", borderRadius: 6, border: `0.5px solid ${error ? "var(--danger-solid)" : focus ? "var(--border-focus)" : "var(--border-strong)"}`, boxShadow: focus ? "var(--ring-focus)" : "none", background: "var(--bg-0)", color: "var(--fg-1)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: 14, outline: 0, width: "100%", boxSizing: "border-box", transition: "border-color 120ms, box-shadow 120ms", ...style }} {...rest}/>
      {error && <div style={{ fontSize: 11, color: "var(--danger-fg)" }}>{error}</div>}
    </div>
  );
}

function Badge({ children, tone = "neutral", dot, style }) {
  const t = { neutral: { bg: "var(--bg-2)", fg: "var(--fg-2)", dot: "var(--fg-3)" }, brand: { bg: "var(--brand-tint)", fg: "var(--purple-700)", dot: "var(--purple-500)" }, success: { bg: "var(--green-100)", fg: "var(--green-700)", dot: "var(--green-500)" }, warning: { bg: "var(--amber-100)", fg: "var(--amber-700)", dot: "var(--amber-500)" }, danger: { bg: "var(--red-100)", fg: "var(--red-700)", dot: "var(--red-500)" } }[tone] || {};
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 999, background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, ...style }}>{dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, flexShrink: 0 }}/>}{children}</span>;
}

function Method({ method }) {
  const c = { GET: "#2563EB", POST: "#10A37F", PATCH: "#D97706", PUT: "#D97706", DELETE: "#DC2626" };
  return <span style={{ display: "inline-block", minWidth: 52, textAlign: "center", padding: "3px 8px", borderRadius: 4, background: c[method] || "#888", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>{method === "DELETE" ? "DEL" : method}</span>;
}

function Slug({ children, style }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: "var(--bg-2)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-1)", ...style }}>{children}</span>;
}

function Modal({ open, onClose, title, subtitle, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", zIndex: 100, animation: "modalFade 180ms" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-0)", borderRadius: 12, boxShadow: "var(--shadow-3)", width, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "modalIn 250ms" }}>
        <div style={{ padding: "18px 24px", borderBottom: "0.5px solid var(--border-default)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-1)" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 0, border: 0, cursor: "pointer", color: "var(--fg-3)", padding: 4, lineHeight: 1, flexShrink: 0 }}><Icon name="x" size={16}/></button>
        </div>
        <div style={{ padding: 24, overflow: "auto", flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: "14px 24px", borderTop: "0.5px solid var(--border-default)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

function Toast({ tone = "success", title, body, onClose }) {
  const t = { success: { border: "var(--green-100)", solid: "var(--green-500)", icon: "check" }, error: { border: "var(--red-100)", solid: "var(--red-500)", icon: "x" }, warning: { border: "var(--amber-100)", solid: "var(--amber-500)", icon: "warn" }, info: { border: "var(--blue-50)", solid: "var(--blue-500)", icon: "code" } }[tone] || {};
  return (
    <div style={{ position: "fixed", top: 72, right: 24, zIndex: 300, background: "var(--bg-0)", border: "0.5px solid " + t.border, borderLeft: "3px solid " + t.solid, borderRadius: 8, boxShadow: "var(--shadow-2)", padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", minWidth: 280, maxWidth: 380, animation: "toastIn 200ms" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.solid, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={t.icon} size={10} color="#fff"/></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{title}</div>
        {body && <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>{body}</div>}
      </div>
      {onClose && <button onClick={onClose} style={{ background: 0, border: 0, color: "var(--fg-3)", cursor: "pointer", padding: 2 }}><Icon name="x" size={14}/></button>}
    </div>
  );
}

function StatusDot({ status }) {
  const c = { online: "var(--green-500)", offline: "var(--red-500)", setup: "var(--amber-500)" };
  const l = { online: "Работает", offline: "Недоступен", setup: "Настройка" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-2)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c[status], boxShadow: status === "online" ? "0 0 0 3px " + c.online + "33" : "none" }}/>{l[status]}</span>;
}

function Toggle({ on, onChange }) {
  return <button onClick={() => onChange?.(!on)} style={{ width: 32, height: 18, borderRadius: 999, background: on ? "var(--brand-primary)" : "var(--neutral-300)", border: 0, padding: 0, cursor: "pointer", position: "relative", transition: "background 150ms", flexShrink: 0 }}><span style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 150ms", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }}/></button>;
}

function Skeleton({ w = "100%", h = 12, r = 4, style }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,var(--bg-2) 0%,var(--bg-1) 50%,var(--bg-2) 100%)", backgroundSize: "200px 100%", animation: "shimmer 1.4s ease-in-out infinite", ...style }}/>;
}

Object.assign(window, { Icon, Button, Input, Badge, Method, Slug, Modal, Toast, StatusDot, Toggle, Skeleton, sharedKeyframes });
