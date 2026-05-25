export default function ResumeApp() {
  // Open the PDF fit-to-WIDTH (#view=FitH) so the page fills the window width and
  // the text is large/readable — you scroll vertically instead of squinting at a
  // whole page shrunk to fit a small box. Toolbar/nav panes hidden for room.
  return (
    <iframe
      src="/Carlos Liang - CV.pdf#toolbar=0&navpanes=0&zoom=125"
      title="Resume"
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}
