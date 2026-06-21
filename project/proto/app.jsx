// Root router — maps screen IDs to components
const { useState: useAppSt, useEffect: useAppEff } = React;

const INIT_SCREEN = (() => {
  try { return localStorage.getItem("nerion_screen") || "login"; } catch { return "login"; }
})();

function App() {
  const [screen, setScreen] = useAppSt(INIT_SCREEN);

  const navigate = (id) => {
    setScreen(id);
    try { localStorage.setItem("nerion_screen", id); } catch {}
  };

  // App screens that need the shell
  const APP_SCREENS = ["data-prep", "data-courses", "data-plans", "sch02", "sch03", "api01", "api02", "files", "pdf01", "set01", "set02"];

  const renderScreen = () => {
    switch (screen) {
      case "login":        return <ScreenLogin onNavigate={navigate}/>;
      case "register":     return <ScreenRegister onNavigate={navigate}/>;
      case "reset":        return <ScreenReset onNavigate={navigate}/>;
      case "spaces":       return <ScreenSpaces onNavigate={navigate}/>;
      case "data-prep":    return <ScreenDataTable tableKey="data-prep" onNavigate={navigate}/>;
      case "data-courses": return <ScreenDataTable tableKey="data-courses" onNavigate={navigate}/>;
      case "data-plans":   return <ScreenDataTable tableKey="data-plans" onNavigate={navigate}/>;
      case "sch02":        return <ScreenSCH02 onNavigate={navigate}/>;
      case "sch03":        return <ScreenSCH03 onNavigate={navigate}/>;
      case "api01":        return <ScreenAPI01 onNavigate={navigate}/>;
      case "api02":        return <ScreenAPI02 onNavigate={navigate}/>;
      case "files":        return <ScreenFiles onNavigate={navigate}/>;
      case "pdf01":        return <ScreenPDF onNavigate={navigate}/>;
      case "set01":        return <ScreenSET01 onNavigate={navigate}/>;
      case "set02":        return <ScreenSET02 onNavigate={navigate}/>;
      default:             return <ScreenLogin onNavigate={navigate}/>;
    }
  };

  return renderScreen();
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
