import { useCallback, useEffect, useRef, useState } from "react";

export default function Win98Window({
  title,
  initialX,
  initialY,
  zIndex,
  width,
  height,
  maximized,
  autoSize,
  scale = 1,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  active,
  children,
}) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 700;
  // Fill the desktop (minus the 30px taskbar) when maximized or on mobile — keeps
  // big content like the resume PDF readable without manual zoom.
  const full = isMobile || maximized;
  const dragRef = useRef(null);
  const listenersRef = useRef(null);

  // While dragging, track the pointer on `window` (not on the title bar) so we
  // keep getting moves/ups even if the cursor outruns the window or passes over
  // an <iframe> — element-level pointer capture is unreliable under CSS zoom and
  // across iframes, which is what made drags freeze ("stuck"). A transparent
  // shield (below) keeps the pointer over this document the whole time. The
  // listeners are attached synchronously here (not in an effect) so the very
  // first moves after press are never missed.
  const onPointerDownTitle = useCallback(
    (e) => {
      if (e.target.closest("button")) return;
      onFocus();
      // A maximized (or forced-full mobile) window fills the desktop — there's
      // nowhere to drag it, so don't start a drag.
      if (full) return;
      const d = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
      dragRef.current = d;
      setDragging(true);

      const onMove = (ev) => {
        // Pointer deltas are viewport pixels, but `pos`/`left` live in the
        // desktop's zoomed space (root has zoom:scale). Convert so the window
        // tracks the cursor 1:1 instead of moving `scale`× too far.
        const dx = (ev.clientX - d.startX) / scale;
        const dy = (ev.clientY - d.startY) / scale;
        setPos({ x: Math.max(0, d.originX + dx), y: Math.max(0, d.originY + dy) });
      };
      const onUp = () => {
        dragRef.current = null;
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        listenersRef.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      listenersRef.current = onUp;
    },
    [onFocus, full, pos.x, pos.y, scale]
  );

  // Safety net: if the window unmounts mid-drag, drop the window listeners.
  useEffect(() => () => listenersRef.current && listenersRef.current(), []);

  return (
    <div
      className="window"
      style={
        full
          ? { position: "absolute", left: 0, top: 0, width: "100%", height: "calc(100% - 30px)", zIndex }
          : autoSize
          ? { position: "absolute", left: pos.x, top: pos.y, width: "fit-content", zIndex }
          : { position: "absolute", left: pos.x, top: pos.y, width, zIndex }
      }
      onPointerDown={onFocus}
    >
      <div
        className={active ? "title-bar" : "title-bar inactive"}
        style={{ cursor: "default" }}
        onPointerDown={onPointerDownTitle}
        onDoubleClick={(e) => {
          if (e.target.closest("button") || isMobile) return;
          onToggleMaximize();
        }}
      >
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={(e) => { e.stopPropagation(); onMinimize(); }} />
          <button
            aria-label={maximized ? "Restore" : "Maximize"}
            disabled={isMobile}
            onClick={(e) => { e.stopPropagation(); onToggleMaximize(); }}
          />
          <button aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} />
        </div>
      </div>
      <div
        className="window-body"
        style={
          full
            ? { height: "calc(100% - 30px)", margin: 0, padding: 0, overflow: "hidden" }
            : autoSize
            ? { margin: 0, padding: 0 }
            : { height, margin: 0, padding: 0, overflow: "hidden" }
        }
      >
        {children}
      </div>

      {/* Transparent drag shield: covers everything (incl. iframes) while
          dragging so the pointer never leaves this document and the window-level
          move/up listeners can't lose the gesture. */}
      {dragging && <div style={{ position: "fixed", inset: 0, zIndex: 99999, cursor: "default" }} />}
    </div>
  );
}
