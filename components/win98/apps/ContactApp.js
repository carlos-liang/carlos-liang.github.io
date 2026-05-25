export default function ContactApp() {
  const rows = [
    {
      label: "Email",
      value: "carlos.liang97@gmail.com",
      href: "mailto:carlos.liang97@gmail.com",
    },
    {
      label: "LinkedIn",
      value: "linkedin.com/in/carlosl97",
      href: "https://www.linkedin.com/in/carlosl97/",
    },
  ];
  return (
    <div
      style={{
        background: "#fff",
        height: "100%",
        padding: 16,
        boxSizing: "border-box",
        fontSize: 13,
        fontFamily: "Tahoma, sans-serif",
      }}
    >
      <p style={{ marginTop: 0, marginBottom: 14 }}>Get in touch with me:</p>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 10 }}>
          <strong>{r.label}:</strong>{" "}
          <a
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0645ad" }}
          >
            {r.value}
          </a>
        </div>
      ))}
    </div>
  );
}
