import { useCallback, useEffect, useRef, useState } from "react";

const KEY_BINDINGS = {
  forward: { key: "w", code: "KeyW" },
  backward: { key: "s", code: "KeyS" },
  left: { key: "a", code: "KeyA" },
  right: { key: "d", code: "KeyD" },
  jump: { key: " ", code: "Space" },
  interact: { key: "e", code: "KeyE" },
};

function dispatchVirtualKey(type, binding) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new KeyboardEvent(type, {
      key: binding.key,
      code: binding.code,
      bubbles: true,
      cancelable: true,
    })
  );
}

function ControlButton({ binding, className = "", label, children }) {
  const pressedRef = useRef(false);

  const release = useCallback(() => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    dispatchVirtualKey("keyup", binding);
  }, [binding]);

  useEffect(() => release, [release]);

  const press = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (pressedRef.current) return;

    pressedRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dispatchVirtualKey("keydown", binding);
  };

  return (
    <button
      type="button"
      className={`mobile-control-button ${className}`.trim()}
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {children}
    </button>
  );
}

function MovementJoystick() {
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const activePointerRef = useRef(null);
  const activeDirectionsRef = useRef(new Set());

  const syncDirections = useCallback((nextDirections) => {
    const currentDirections = activeDirectionsRef.current;

    currentDirections.forEach((direction) => {
      if (!nextDirections.has(direction)) {
        dispatchVirtualKey("keyup", KEY_BINDINGS[direction]);
      }
    });
    nextDirections.forEach((direction) => {
      if (!currentDirections.has(direction)) {
        dispatchVirtualKey("keydown", KEY_BINDINGS[direction]);
      }
    });

    activeDirectionsRef.current = nextDirections;
  }, []);

  const resetJoystick = useCallback(() => {
    activePointerRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    syncDirections(new Set());
  }, [syncDirections]);

  useEffect(() => resetJoystick, [resetJoystick]);

  const updateJoystick = useCallback(
    (event, joystick) => {
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rawX = event.clientX - centerX;
      const rawY = event.clientY - centerY;
      const rawDistance = Math.hypot(rawX, rawY);
      const maxDistance = rect.width * 0.27;
      const scale = rawDistance > maxDistance ? maxDistance / rawDistance : 1;
      const x = rawX * scale;
      const y = rawY * scale;
      const normalizedX = x / maxDistance;
      const normalizedY = y / maxDistance;
      const nextDirections = new Set();

      setKnobOffset({ x, y });

      // A short dead zone prevents accidental movement while the thumb is
      // resting near the centre. Independent axes preserve diagonal movement.
      if (Math.hypot(normalizedX, normalizedY) > 0.24) {
        if (normalizedY < -0.32) nextDirections.add("forward");
        if (normalizedY > 0.32) nextDirections.add("backward");
        if (normalizedX < -0.32) nextDirections.add("left");
        if (normalizedX > 0.32) nextDirections.add("right");
      }

      syncDirections(nextDirections);
    },
    [syncDirections]
  );

  const startJoystick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateJoystick(event, event.currentTarget);
  };

  const moveJoystick = (event) => {
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    updateJoystick(event, event.currentTarget);
  };

  const releaseJoystick = (event) => {
    if (
      event?.pointerId !== undefined &&
      activePointerRef.current !== event.pointerId
    ) {
      return;
    }
    resetJoystick();
  };

  return (
    <div
      className="mobile-controls__joystick"
      role="group"
      aria-label="Movement joystick"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={startJoystick}
      onPointerMove={moveJoystick}
      onPointerUp={releaseJoystick}
      onPointerCancel={releaseJoystick}
      onLostPointerCapture={releaseJoystick}
    >
      <span className="mobile-controls__joystick-ticks" aria-hidden="true" />
      <span
        className="mobile-controls__joystick-knob"
        aria-hidden="true"
        style={{ transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)` }}
      />
    </div>
  );
}

export default function MobileControls() {
  return (
    <div className="mobile-controls" role="group" aria-label="Game controls">
      <MovementJoystick />

      <div className="mobile-controls__actions" role="group" aria-label="Action controls">
        <ControlButton
          binding={KEY_BINDINGS.jump}
          className="mobile-control-button--secondary"
          label="Jump"
        >
          <strong>B</strong>
          <small>JUMP</small>
        </ControlButton>
        <ControlButton
          binding={KEY_BINDINGS.interact}
          className="mobile-control-button--primary"
          label="Interact"
        >
          <strong>E</strong>
          <small>USE</small>
        </ControlButton>
      </div>
    </div>
  );
}
