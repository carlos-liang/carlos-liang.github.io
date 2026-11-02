import { useEffect, useState } from "react";

const randomBetween = (min, max) => min + Math.random() * (max - min);

export default function ShootingStar() {
  const [star, setStar] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let launchTimer;
    let clearTimer;
    let stopped = false;

    const schedule = (first = false) => {
      if (stopped || mediaQuery.matches) return;

      const delay = first
        ? randomBetween(4000, 8000)
        : randomBetween(10000, 22000);

      launchTimer = window.setTimeout(() => {
        const duration = Math.round(randomBetween(1000, 1400));
        const topPercent = randomBetween(7, 25);
        const leftPercent = randomBetween(58, 92);
        const endLeftPercent = randomBetween(6, 34);
        const distanceX =
          ((endLeftPercent - leftPercent) / 100) * window.innerWidth;
        const distanceY = ((106 - topPercent) / 100) * window.innerHeight;
        // The visible trail extends in the direction opposite the moving head.
        const trailAngle =
          (Math.atan2(distanceY, distanceX) * 180) / Math.PI - 180;

        setStar({
          id: Date.now(),
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          distanceX: `${Math.round(distanceX)}px`,
          distanceY: `${Math.round(distanceY)}px`,
          angle: `${trailAngle.toFixed(1)}deg`,
          length: `${Math.round(randomBetween(95, 155))}px`,
          duration: `${duration}ms`,
        });

        clearTimer = window.setTimeout(() => {
          setStar(null);
          schedule(false);
        }, duration + 120);
      }, delay);
    };

    const handlePreferenceChange = () => {
      window.clearTimeout(launchTimer);
      window.clearTimeout(clearTimer);
      setStar(null);
      if (!mediaQuery.matches) schedule(true);
    };

    schedule(true);
    mediaQuery.addEventListener?.("change", handlePreferenceChange);

    return () => {
      stopped = true;
      window.clearTimeout(launchTimer);
      window.clearTimeout(clearTimer);
      mediaQuery.removeEventListener?.("change", handlePreferenceChange);
    };
  }, []);

  if (!star) return null;

  return (
    <span
      key={star.id}
      className="shooting-star"
      style={{
        left: star.left,
        top: star.top,
        "--shoot-x": star.distanceX,
        "--shoot-y": star.distanceY,
        "--shoot-angle": star.angle,
        "--shoot-length": star.length,
        "--shoot-duration": star.duration,
      }}
      aria-hidden="true"
    >
      <i />
    </span>
  );
}
