import Link from "next/link";
import SignalGlitchText from "./SignalGlitchText";

const Navbar = () => {
  return (
    <nav className="site-navbar absolute z-50 w-full" aria-label="Primary navigation">
      <Link href="/" className="site-navbar__home">
        <SignalGlitchText
          text="Carlos Liang"
          className="site-navbar__brand text-white font-bold tracking-wide"
          style={{ fontFamily: "monospace" }}
        />
      </Link>
    </nav>
  )
}

export default Navbar;
