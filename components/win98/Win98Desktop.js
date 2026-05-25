import { useMemo, useState } from "react";
import useWindowManager from "./useWindowManager";
import Win98Window from "./Win98Window";
import Win98Taskbar from "./Win98Taskbar";
import Win98StartMenu from "./Win98StartMenu";
import W98Icon from "./icons/W98Icon";
import ResumeApp from "./apps/ResumeApp";
import AboutApp from "./apps/AboutApp";
import ContactApp from "./apps/ContactApp";
import MinesweeperApp from "./apps/MinesweeperApp";

const APPS = {
  // Sizes are in the desktop's zoomed virtual space (the root has zoom:UI_ZOOM),
  // so keep them within ~ (glassCSS / UI_ZOOM). Visually they render UI_ZOOM x bigger.
  resume: { title: "Resume", icon: "document", width: 400, height: 255, maximized: true, Component: ResumeApp },
  about: { title: "About Me - Notepad", icon: "notepad", width: 360, height: 220, Component: AboutApp },
  contact: { title: "Contact", icon: "mail", width: 320, height: 190, Component: ContactApp },
  minesweeper: { title: "Minesweeper", icon: "mines", autoSize: true, Component: MinesweeperApp },
};
const ICON_ORDER = ["resume", "about", "contact", "minesweeper"];
const FONT = '"ms_sans_serif", Tahoma, sans-serif';
// Display scale: makes the whole desktop bigger. The root stays pinned to the
// monitor glass with inset:0, and CSS `zoom` sets the internal coordinate scale.
// MUST be an INTEGER (1, 2, 3): the 98.css MS Sans Serif bitmap font + the pixel
// icons are only crisp at integer multiples of their native size — fractional
// zoom (e.g. 1.2) blurs the text. App window sizes in APPS are authored in this
// zoomed virtual space, so they fit within (glassCSS / UI_ZOOM).
const UI_ZOOM = 2;

// Desktop wallpaper: the genuine Windows 98 "Clouds" bitmap — the same asset
// 98.js.org uses (from github.com/1j01/98), saved to public/win98/clouds.jpg.
// #3a6ea5 (sky blue) shows through if the image ever fails to load.
const WALLPAPER = {
  backgroundColor: "#3a6ea5",
  backgroundImage: "url('/win98/clouds.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

function DesktopIcon({ icon, label, onOpen }) {
  return (
    <div
      onDoubleClick={onOpen}
      style={{ width: 80, textAlign: "center", cursor: "pointer", color: "#fff", userSelect: "none", padding: 4 }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
        <W98Icon name={icon} size={26} />
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.15, textShadow: "1px 1px 1px #000" }}>{label}</div>
    </div>
  );
}

export default function Win98Desktop({ onShutDown }) {
  const { windows, openWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize } = useWindowManager();
  const [startOpen, setStartOpen] = useState(false);

  // Open an app's window, seeding its initial maximized state from the app config.
  const open = (key) => openWindow(key, APPS[key].maximized);

  const activeAppKey = useMemo(() => {
    const visible = windows.filter((w) => !w.minimized);
    if (visible.length === 0) return null;
    return visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).appKey;
  }, [windows]);

  return (
    <div
      className="win98-root"
      onPointerDown={() => setStartOpen(false)}
      style={{
        position: "absolute",
        inset: 0,
        zoom: UI_ZOOM,
        overflow: "hidden",
        ...WALLPAPER,
        fontFamily: FONT,
      }}
    >
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 14 }}>
        {ICON_ORDER.map((key) => (
          <DesktopIcon key={key} icon={APPS[key].icon} label={APPS[key].title} onOpen={() => open(key)} />
        ))}
      </div>

      {windows
        .filter((w) => !w.minimized)
        .map((w) => {
          const app = APPS[w.appKey];
          return (
            <Win98Window
              key={w.appKey}
              title={app.title}
              initialX={w.x}
              initialY={w.y}
              zIndex={w.zIndex}
              width={app.width}
              height={app.height}
              maximized={w.maximized}
              autoSize={app.autoSize}
              scale={UI_ZOOM}
              active={w.appKey === activeAppKey}
              onClose={() => closeWindow(w.appKey)}
              onMinimize={() => minimizeWindow(w.appKey)}
              onToggleMaximize={() => toggleMaximize(w.appKey)}
              onFocus={() => focusWindow(w.appKey)}
            >
              {(() => {
                const Body = app.Component;
                return <Body onClose={() => closeWindow(w.appKey)} />;
              })()}
            </Win98Window>
          );
        })}

      {startOpen && (
        <Win98StartMenu
          apps={APPS}
          onOpenApp={(key) => { open(key); setStartOpen(false); }}
          onShutDown={() => { setStartOpen(false); onShutDown(); }}
        />
      )}

      <Win98Taskbar
        apps={APPS}
        windows={windows}
        activeAppKey={activeAppKey}
        startOpen={startOpen}
        onStartClick={() => setStartOpen((o) => !o)}
        onTaskClick={(key) => openWindow(key)}
      />
    </div>
  );
}
