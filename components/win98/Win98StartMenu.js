import W98Icon from "./icons/W98Icon";

const FONT = '"ms_sans_serif", Tahoma, sans-serif';
const RAISED = {
  background: "#c0c0c0",
  boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
};
const SYSTEM_ITEMS = [
  { icon: "programs", label: "Programs", arrow: true },
  { icon: "mydocs", label: "Documents", arrow: true },
  { icon: "settings", label: "Settings", arrow: true },
  { icon: "find", label: "Find", arrow: true },
];

function Item({ icon, label, arrow, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "5px 8px",
        fontSize: 12, cursor: onClick ? "pointer" : "default", color: "#000",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#000080"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#000"; }}
    >
      <W98Icon name={icon} size={24} />
      <span style={{ flex: 1 }}>{label}</span>
      {arrow && <span>{"▸"}</span>}
    </div>
  );
}

export default function Win98StartMenu({ apps, onOpenApp, onShutDown }) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute", left: 0, bottom: 30, width: 220, display: "flex",
        padding: 3, zIndex: 99999, fontFamily: FONT, ...RAISED,
      }}
    >
      <div
        style={{
          width: 30, background: "linear-gradient(#000080,#1084d0)", marginRight: 3,
          flex: "0 0 auto", display: "flex", alignItems: "flex-end", justifyContent: "center",
          overflow: "hidden", paddingBottom: 8,
        }}
      >
        {/* vertical-rl lays the text out top->bottom in normal flow (so it can't
            overflow the menu like an absolutely-positioned rotate did); rotate(180)
            flips it to the Win98 bottom-to-top reading direction. */}
        <div
          style={{
            writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap",
            color: "#c0c0c0", fontWeight: "bold", fontSize: 16, lineHeight: 1,
          }}
        >
          Windows<span style={{ color: "#fff" }}>98</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {Object.keys(apps).map((key) => (
          <Item key={key} icon={apps[key].icon} label={apps[key].title} onClick={() => onOpenApp(key)} />
        ))}
        <div style={{ borderTop: "1px solid #808080", borderBottom: "1px solid #fff", margin: "3px 2px" }} />
        {SYSTEM_ITEMS.map((it) => (
          <Item key={it.label} icon={it.icon} label={it.label} arrow={it.arrow} />
        ))}
        <div style={{ borderTop: "1px solid #808080", borderBottom: "1px solid #fff", margin: "3px 2px" }} />
        <Item icon="shutdown" label="Shut Down..." onClick={onShutDown} />
      </div>
    </div>
  );
}
