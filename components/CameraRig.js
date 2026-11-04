import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Room views — mobile is translated to the model floor's true midpoint
// (x: 0.5, z: 0.5), which matters once the portrait framing is cropped tighter.
const ROOM_POS = new THREE.Vector3(0, 21, 26.25);
const ROOM_LOOK = new THREE.Vector3(0, 0, 0);
const MOBILE_ROOM_POS = new THREE.Vector3(0.5, 21, 26.75);
const MOBILE_ROOM_LOOK = new THREE.Vector3(0.5, 0, 0.5);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

// How far the camera sits in front of the screen, straight along its normal
// (head-on). Smaller = closer. ~1.35 frames the monitor so the glass fills the
// view with the bezel showing as a thin frame around it.
const CAM_DIST = 1.7;
// Original panel sizing, tuned to fill the monitor screen at the zoomed view.
const PANEL_OVERSCAN_X = 1.09;
const PANEL_OVERSCAN_Y = 1.13;
// Trim the left edge slightly inward by this fraction of the
// panel width, without moving the right edge — the left was spilling out a touch.
const PANEL_TRIM_LEFT = 0.02;
const BASE_VERTICAL_FOV = 20;
const BASE_ASPECT = 16 / 9;
const MOBILE_FRAMING_SCALE = 0.7;

export default function CameraRig({
  computerState,
  mobileMode = false,
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

  // Portrait screens still need a wider field of view than desktop, but using
  // the full desktop-width framing makes the room feel distant. Mobile keeps
  // about 70% of that width so the room and character read substantially larger.
  useEffect(() => {
    if (!camera.isPerspectiveCamera || !size.width || !size.height) return;

    const aspect = size.width / size.height;
    const baseHalfFov = THREE.MathUtils.degToRad(BASE_VERTICAL_FOV / 2);
    const framingAspect =
      BASE_ASPECT * (mobileMode ? MOBILE_FRAMING_SCALE : 1);
    const responsiveFov = THREE.MathUtils.radToDeg(
      2 * Math.atan((Math.tan(baseHalfFov) * framingAspect) / aspect)
    );
    camera.fov = THREE.MathUtils.clamp(
      responsiveFov,
      mobileMode ? 16 : BASE_VERTICAL_FOV,
      mobileMode ? 60 : 72
    );
    camera.updateProjectionMatrix();
  }, [camera, mobileMode, size.height, size.width]);

  useEffect(() => {
    if (computerState !== "room") return;

    const roomPosition = mobileMode ? MOBILE_ROOM_POS : ROOM_POS;
    const roomTarget = mobileMode ? MOBILE_ROOM_LOOK : ROOM_LOOK;
    camera.position.copy(roomPosition);
    look.current.copy(roomTarget);
    camera.lookAt(look.current);
  }, [camera, computerState, mobileMode]);

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
      const roomPosition = mobileMode ? MOBILE_ROOM_POS : ROOM_POS;
      const roomTarget = mobileMode ? MOBILE_ROOM_LOOK : ROOM_LOOK;
      camera.position.lerp(roomPosition, 0.1);
      look.current.lerp(roomTarget, 0.1);
      camera.lookAt(look.current);
      const dist = camera.position.distanceTo(roomPosition);
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
