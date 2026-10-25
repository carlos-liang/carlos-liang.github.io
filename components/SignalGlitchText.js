import { useEffect, useRef } from "react";

const BAND_EDGES = [0, 0.18, 0.31, 0.38, 0.61, 0.68, 0.86, 1];
const BAND_SHIFTS = [-0.8, 0.55, -1, 0.18, 0.9, -0.35, 0.55];
const BAND_ARRIVALS = [0, 0.12, 0.03, 0.2, 0.08, 0, 0.15];
const DURATION = 1100;

function createCopy(source, text, color, clean = false) {
  const copy = document.createElement("span");
  copy.textContent = text;
  copy.setAttribute("aria-hidden", "true");
  copy.style.cssText = [
    "position:absolute",
    "inset:0",
    "display:block",
    "margin:0",
    "white-space:nowrap",
    "pointer-events:none",
    `color:${color}`,
    clean ? "text-shadow:0 0 10px currentColor" : "text-shadow:none",
  ].join(";");

  // Keep every copy locked to the browser-rendered metrics of the real text.
  const style = getComputedStyle(source);
  copy.style.fontFamily = style.fontFamily;
  copy.style.fontSize = style.fontSize;
  copy.style.fontWeight = style.fontWeight;
  copy.style.fontStyle = style.fontStyle;
  copy.style.fontStretch = style.fontStretch;
  copy.style.lineHeight = style.lineHeight;
  copy.style.letterSpacing = style.letterSpacing;
  copy.style.textTransform = style.textTransform;

  return copy;
}

export default function SignalGlitchText({ text, className = "", style }) {
  const wrapperRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const source = sourceRef.current;
    if (!wrapper || !source || !Element.prototype.animate) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let replayTimer;
    let finishTimer;
    let overlay;
    let animations = [];
    let running = false;
    let disposed = false;
    let generation = 0;

    function isVisible() {
      const rect = wrapper.getBoundingClientRect();
      return (
        !document.hidden &&
        !reducedMotion.matches &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      );
    }

    function clearAnimation() {
      generation += 1;
      clearTimeout(finishTimer);
      animations.forEach((animation) => animation.cancel());
      animations = [];
      overlay?.remove();
      overlay = undefined;
      source.style.opacity = "";
      running = false;
    }

    function schedule() {
      clearTimeout(replayTimer);
      if (disposed || reducedMotion.matches) return;

      replayTimer = setTimeout(() => {
        replayTimer = undefined;
        if (isVisible()) run();
        else schedule();
      }, 2000 + Math.random() * 3000);
    }

    function run() {
      if (running || !isVisible()) {
        schedule();
        return;
      }

      running = true;
      const currentGeneration = ++generation;
      const computed = getComputedStyle(source);
      const rgb = computed.color.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [255, 255, 255];
      const channels = [
        `rgb(${rgb[0]}, 0, 0)`,
        `rgb(0, ${rgb[1]}, 0)`,
        `rgb(0, 0, ${rgb[2]})`,
      ];
      const strength = Math.min(14, parseFloat(computed.fontSize) * 0.17);

      overlay = document.createElement("span");
      overlay.className = "signal-glitch-text__overlay";
      overlay.setAttribute("aria-hidden", "true");
      wrapper.appendChild(overlay);

      for (let index = 0; index < BAND_EDGES.length - 1; index += 1) {
        const band = document.createElement("span");
        const top = BAND_EDGES[index] * 100;
        const bottom = (1 - BAND_EDGES[index + 1]) * 100;
        const dx = BAND_SHIFTS[index] * strength;
        const arrival = BAND_ARRIVALS[index];

        band.className = "signal-glitch-text__band";
        band.style.clipPath = `inset(${top}% 0 ${bottom}% 0)`;
        overlay.appendChild(band);

        animations.push(
          band.animate(
            [
              { offset: 0, opacity: arrival ? 0 : 1, transform: `translateX(${dx}px)`, easing: "steps(1, end)" },
              { offset: arrival || 0.01, opacity: 1, transform: `translateX(${dx}px)`, easing: "steps(1, end)" },
              { offset: 0.3, opacity: 1, transform: `translateX(${dx * -0.32}px)`, easing: "steps(1, end)" },
              { offset: 0.49, opacity: 1, transform: `translateX(${dx * 0.12}px)`, easing: "ease-out" },
              { offset: 0.73, opacity: 1, transform: "translateX(0)" },
              { offset: 0.88, opacity: 0, transform: "translateX(0)" },
              { offset: 1, opacity: 0, transform: "translateX(0)" },
            ],
            { duration: DURATION, fill: "both" }
          )
        );

        channels.forEach((color, channelIndex) => {
          const copy = createCopy(source, text, color);
          const split =
            (channelIndex - 1) * strength * (index % 3 === 1 ? 0.55 : 0.23);

          copy.style.mixBlendMode = "screen";
          band.appendChild(copy);
          animations.push(
            copy.animate(
              [
                { offset: 0, transform: `translateX(${split}px)`, easing: "steps(1, end)" },
                { offset: 0.3, transform: `translateX(${split * -0.6}px)`, easing: "steps(1, end)" },
                { offset: 0.49, transform: `translateX(${split * 0.24}px)`, easing: "ease-out" },
                { offset: 0.73, transform: "translateX(0)" },
                { offset: 1, transform: "translateX(0)" },
              ],
              { duration: DURATION, fill: "both" }
            )
          );
        });
      }

      const cleanCopy = createCopy(source, text, computed.color, true);
      overlay.appendChild(cleanCopy);
      const cleanAnimation = cleanCopy.animate(
        [
          { offset: 0, opacity: 0 },
          { offset: 0.69, opacity: 0 },
          { offset: 0.88, opacity: 1 },
          { offset: 1, opacity: 1 },
        ],
        { duration: DURATION, fill: "both" }
      );
      animations.push(cleanAnimation);

      // The accessible, real heading stays in the document; only its pixels are
      // swapped for decorative copies during the short acquisition effect.
      source.style.opacity = "0";

      function finish() {
        if (disposed || generation !== currentGeneration) return;
        clearAnimation();
        schedule();
      }

      cleanAnimation.finished.then(finish, finish);
      finishTimer = setTimeout(finish, DURATION + 150);
    }

    function reset() {
      clearTimeout(replayTimer);
      clearAnimation();
      schedule();
    }

    schedule();
    window.addEventListener("resize", reset);
    window.addEventListener("scroll", reset, { passive: true });
    document.addEventListener("visibilitychange", reset);
    reducedMotion.addEventListener?.("change", reset);

    return () => {
      disposed = true;
      clearTimeout(replayTimer);
      clearAnimation();
      window.removeEventListener("resize", reset);
      window.removeEventListener("scroll", reset);
      document.removeEventListener("visibilitychange", reset);
      reducedMotion.removeEventListener?.("change", reset);
    };
  }, [text]);

  return (
    <span ref={wrapperRef} className={`signal-glitch-text ${className}`.trim()} style={style}>
      <span ref={sourceRef} className="signal-glitch-text__source">
        {text}
      </span>
    </span>
  );
}
