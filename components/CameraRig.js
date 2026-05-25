import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Room view — matches the <Canvas camera position> and OrbitControls target.
const ROOM_POS = new THREE.Vector3(0, 20, 25);
const ROOM_LOOK = new THREE.Vector3(0, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

// How far the camera sits in front of the screen, straight along its normal
// (head-on). Smaller = closer. ~1.35 frames the monitor so the glass fills the
// view with the bezel showing as a thin frame around it.
const CAM_DIST = 1.7;
// Overscan the panel a little BEYOND the measured glass rect so the desktop
// fills the monitor's recessed screen while leaving the cream plastic bezel
// (the computer's frame) clearly visible all the way around. 1.0 = the measured
// glass (leaves a fat grey screen border); ~1.25+ spills onto the bezel/into the
// room. These values were tuned against screenshots so the desktop fills the
// screen but the monitor border still shows. Y is a touch larger than X because
// the measured glass under-counts height more.
const PANEL_OVERSCAN_X = 1.09;
const PANEL_OVERSCAN_Y = 1.13;
// Pull the LEFT edge of the panel inward (rightward) by this fraction of the
// panel width, without moving the right edge — the left was spilling out a touch.
const PANEL_TRIM_LEFT = 0.02;

export default function CameraRig({
  computerState,
  zoomTarget,
  panelRef,
  onZoomInDone,
  onZoomOutDone,
}) {
  const { camera, size } = useThree();
  const look = useRef(ROOM_LOOK.clone());
  const arrivedRef = useRef(false);

  // Scratch vectors reused every frame (no per-frame allocation).
  const right = useRef(new THREE.Vector3());
  const camPos = useRef(new THREE.Vector3());
  const corner = useRef(new THREE.Vector3());
  // Last panel rect written to the DOM, so we can skip redundant style writes
  // (which would otherwise re-layout the whole zoomed desktop every frame).
  const lastRect = useRef({ left: null, top: null, width: null, height: null });

  useFrame(() => {
    const zoomedIn =
      computerState === "zooming-in" ||
      computerState === "booting" ||
      computerState === "desktop";

    if (zoomedIn) {
      // Need a captured screen plane: { center, normal, halfW, halfH }.
      if (!zoomTarget || !zoomTarget.center) return;
      const screenC = zoomTarget.center;
      const normal = zoomTarget.normal;

      // Camera dead-on the screen: sit along the screen normal, look at its
      // centre, world-up so there is no roll (=> the glass projects to an
      // axis-aligned rectangle the flat panel can match exactly).
      camPos.current.copy(screenC).addScaledVector(normal, CAM_DIST);
      if (computerState === "desktop") {
        // Settled: snap exactly to target. A perpetual lerp never truly
        // arrives, so the camera would keep micro-moving and re-project the
        // panel every frame, re-laying-out the whole desktop and making window
        // dragging stutter. Snapping makes the projected rect stable.
        camera.position.copy(camPos.current);
        look.current.copy(screenC);
      } else {
        camera.position.lerp(camPos.current, 0.1);
        look.current.lerp(screenC, 0.1);
      }
      camera.lookAt(look.current);

      // Pin the 2D Win98 desktop panel over the screen's projected rectangle.
      if (panelRef && panelRef.current) {
        camera.updateMatrixWorld();
        // Horizontal axis across the screen (perpendicular to normal & up).
        right.current.crossVectors(WORLD_UP, normal).normalize();
        const halfW = zoomTarget.halfW * PANEL_OVERSCAN_X;
        const halfH = zoomTarget.halfH * PANEL_OVERSCAN_Y;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            corner.current
              .copy(screenC)
              .addScaledVector(right.current, sx * halfW)
              .addScaledVector(WORLD_UP, sy * halfH)
              .project(camera);
            const px = (corner.current.x * 0.5 + 0.5) * size.width;
            const py = (-corner.current.y * 0.5 + 0.5) * size.height;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }
        }
        // Only touch the DOM when the rect actually changed — once the camera
        // is snapped (desktop) these values are identical frame-to-frame, so
        // this skips the layout-thrashing writes that made dragging stutter.
        // Trim the left edge inward, leaving the right edge (maxX) where it is.
        const trimPx = (maxX - minX) * PANEL_TRIM_LEFT;
        const nextLeft = minX + trimPx;
        const nextTop = minY;
        const nextW = maxX - minX - trimPx;
        const nextH = maxY - minY;
        const last = lastRect.current;
        if (last.left !== nextLeft || last.top !== nextTop || last.width !== nextW || last.height !== nextH) {
          const el = panelRef.current;
          el.style.left = `${nextLeft}px`;
          el.style.top = `${nextTop}px`;
          el.style.width = `${nextW}px`;
          el.style.height = `${nextH}px`;
          last.left = nextLeft;
          last.top = nextTop;
          last.width = nextW;
          last.height = nextH;
        }
      }

      if (computerState === "zooming-in") {
        const dist = camera.position.distanceTo(camPos.current);
        if (dist < 0.03) {
          if (onZoomInDone && !arrivedRef.current) {
            arrivedRef.current = true;
            onZoomInDone();
          }
        } else {
          arrivedRef.current = false;
        }
      }
    } else if (computerState === "zooming-out") {
      camera.position.lerp(ROOM_POS, 0.1);
      look.current.lerp(ROOM_LOOK, 0.1);
      camera.lookAt(look.current);
      const dist = camera.position.distanceTo(ROOM_POS);
      if (dist < 0.05) {
        if (onZoomOutDone && !arrivedRef.current) {
          arrivedRef.current = true;
          onZoomOutDone();
        }
      } else {
        arrivedRef.current = false;
      }
    } else {
      arrivedRef.current = false; // 'room' — OrbitControls owns the camera
    }
  });

  return null;
}
