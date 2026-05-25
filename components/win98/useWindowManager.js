import { useCallback, useRef, useState } from "react";

// Each window is identified by its appKey (one window per app, no duplicates).
// Window shape: { appKey, x, y, zIndex, minimized, maximized }
// `maximized` lives here (per-window state) rather than as a static app config so
// the title-bar maximize button can toggle it; the caller passes the app's default.
export default function useWindowManager() {
  const [windows, setWindows] = useState([]);
  const zCounter = useRef(10);

  const openWindow = useCallback((appKey, initialMaximized = false) => {
    setWindows((prev) => {
      zCounter.current += 1;
      const existing = prev.find((w) => w.appKey === appKey);
      if (existing) {
        return prev.map((w) =>
          w.appKey === appKey
            ? { ...w, minimized: false, zIndex: zCounter.current }
            : w
        );
      }
      const offset = prev.length * 16;
      return [
        ...prev,
        {
          appKey,
          x: 24 + offset,
          y: 20 + offset,
          zIndex: zCounter.current,
          minimized: false,
          maximized: initialMaximized,
        },
      ];
    });
  }, []);

  const closeWindow = useCallback((appKey) => {
    setWindows((prev) => prev.filter((w) => w.appKey !== appKey));
  }, []);

  const focusWindow = useCallback((appKey) => {
    setWindows((prev) => {
      zCounter.current += 1;
      return prev.map((w) =>
        w.appKey === appKey ? { ...w, zIndex: zCounter.current } : w
      );
    });
  }, []);

  const minimizeWindow = useCallback((appKey) => {
    setWindows((prev) =>
      prev.map((w) => (w.appKey === appKey ? { ...w, minimized: true } : w))
    );
  }, []);

  // Toggle fullscreen<->restore and bring the window to the front.
  const toggleMaximize = useCallback((appKey) => {
    setWindows((prev) => {
      zCounter.current += 1;
      return prev.map((w) =>
        w.appKey === appKey
          ? { ...w, maximized: !w.maximized, zIndex: zCounter.current }
          : w
      );
    });
  }, []);

  return { windows, openWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize };
}
