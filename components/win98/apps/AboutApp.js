export default function AboutApp() {
  return (
    <div
      style={{
        background: "#fff",
        height: "100%",
        padding: 10,
        boxSizing: "border-box",
        fontFamily: '"Lucida Console", monospace',
        fontSize: 13,
        whiteSpace: "pre-wrap",
        overflow: "auto",
      }}
    >
      <p style={{ margin: "0 0 1em" }}>Hi! I&apos;m Carlos Liang.</p>
      <p style={{ margin: "0 0 1em" }}>
        I&apos;m a computer scientist from Sydney with a passion to create and inspire!
      </p>
      <p style={{ margin: "0 0 1em" }}>I received my degree from UNSW.</p>
      <p style={{ margin: "0 0 1em" }}>
        I work across both software and art, building things that are equal parts
        technical and expressive. Double click the other icons to see my resume
        or get in touch.
      </p>
      <p style={{ margin: 0 }}>
        3D model shoutout:{" "}
        <a
          href="https://sketchfab.com/Wesai"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wesai
        </a>{" "}
        &amp;{" "}
        <a
          href="https://sketchfab.com/bruno_sales"
          target="_blank"
          rel="noopener noreferrer"
        >
          bruno_sales
        </a>
      </p>
    </div>
  );
}
