import { useEffect, useState } from "react";
import W98Icon from "./icons/W98Icon";

const FONT = '"ms_sans_serif", Tahoma, sans-serif';
const RAISED = {
  background: "#c0c0c0",
  boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
};
const SUNKEN = {
  background: "#c0c0c0",
  boxShadow: "inset -1px -1px #fff, inset 1px 1px #808080, inset -2px -2px #dfdfdf, inset 2px 2px #0a0a0a",
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function Win98Taskbar({ apps, windows, activeAppKey, startOpen, onStartClick, onTaskClick }) {
  const time = useClock();
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 30,
        display: "flex", alignItems: "center", gap: 4, padding: "2px 3px",
        fontFamily: FONT, fontSize: 11, color: "#000", ...RAISED,
      }}
    >
      <button
        onClick={onStartClick}
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 22,
          padding: "0 8px 0 4px", fontWeight: "bold", fontSize: 11, fontFamily: FONT,
          border: "none", color: "#000", cursor: "pointer",
          ...(startOpen ? SUNKEN : RAISED),
        }}
      >
        <W98Icon name="flag" size={18} />
        Start
      </button>

      <div style={{ width: 2, height: 20, ...SUNKEN }} />

      <div style={{ display: "flex", gap: 3, flex: 1, overflow: "hidden", alignItems: "center" }}>
        {windows.map((w) => {
          const active = w.appKey === activeAppKey && !w.minimized;
          return (
            <button
              key={w.appKey}
              onClick={() => onTaskClick(w.appKey)}
              style={{
                display: "flex", alignItems: "center", gap: 5, height: 22,
                minWidth: 120, maxWidth: 160, padding: "0 6px", fontSize: 11, fontFamily: FONT,
                textAlign: "left", border: "none", color: "#000", cursor: "pointer",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                fontWeight: active ? "bold" : "normal",
                ...(active ? SUNKEN : RAISED),
              }}
            >
              <W98Icon name={apps[w.appKey].icon} size={16} style={{ flex: "0 0 auto" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{apps[w.appKey].title}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", height: 22, ...SUNKEN }}>
        {time}
      </div>
    </div>
  );
}
