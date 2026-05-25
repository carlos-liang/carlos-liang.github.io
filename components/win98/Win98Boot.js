import { useEffect } from "react";

export default function Win98Boot({ onDone, duration = 2600 }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div
      style={{
        position: "absolute", inset: 0, background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '"ms_sans_serif", Tahoma, sans-serif',
      }}
    >
      <style>{`@keyframes w98boot { 0%{left:-40%} 100%{left:100%} }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ display: "inline-grid", gridTemplateColumns: "24px 24px", gridTemplateRows: "24px 24px", gap: 2, transform: "skewX(-10deg)" }}>
          <span style={{ background: "#f65314" }} />
          <span style={{ background: "#7cbb00" }} />
          <span style={{ background: "#00a1f1" }} />
          <span style={{ background: "#ffbb00" }} />
        </span>
        <div style={{ color: "#fff", lineHeight: 1.1 }}>
          <div style={{ fontSize: 13 }}>Microsoft<sup style={{ fontSize: 8 }}>&reg;</sup></div>
          <div style={{ fontSize: 42, fontWeight: "bold" }}>
            Windows<span style={{ fontWeight: 400 }}>98</span>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 46, left: "22%", right: "22%", height: 16, border: "1px solid #555", background: "#0b0b0b", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", top: 0, bottom: 0, width: "40%",
            animation: "w98boot 2s linear infinite",
            background: "repeating-linear-gradient(90deg,#1a3fa0 0 10px, transparent 10px 14px)",
          }}
        />
      </div>
    </div>
  );
}
