import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment, ContactShadows } from "@react-three/drei";
import CharacterController from "../components/CharacterController";
import { Physics } from "@react-three/rapier";
import { PokemonRoom } from "../components/PokemonRoom";
import DialogBox from "../components/DialogBox";
import Win98Desktop from "../components/win98/Win98Desktop";
import Win98Boot from "../components/win98/Win98Boot";
import * as THREE from 'three';
import CameraRig from "../components/CameraRig";


const LandingPage = () => {
  const [dpr, setDpr] = useState(1.5)
  const [showDialog, setShowDialog] = useState(true);
  // Shared reference for character position
  const heroRef = useRef(new THREE.Vector3());
  // The Win98 desktop panel's pixel rect is written imperatively by CameraRig each frame.
  const panelRef = useRef(null);
  const [computerState, setComputerState] = useState("room");
  const [zoomTarget, setZoomTarget] = useState(null);

  const enterComputer = (target) => {
    if (target) setZoomTarget(target);
    setComputerState((s) => (s === "room" ? "zooming-in" : s));
  };
  const exitComputer = () => {
    setComputerState((s) => (s === "desktop" ? "zooming-out" : s));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setComputerState((s) => (s === "desktop" ? "zooming-out" : s));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="w-full h-screen relative">
      <Canvas
        shadows
        camera={{
          fov: 20,
          near: 0.1,
          far: 1000,
          position: [0, 20, 25],
        }}
        linear="true"
        legacy="false"
        dpr={dpr}
      >
        <CameraRig
          computerState={computerState}
          zoomTarget={zoomTarget}
          panelRef={panelRef}
          onZoomInDone={() => setComputerState("booting")}
          onZoomOutDone={() => setComputerState("room")}
        />
        <directionalLight
          intensity={0.7}
          color={'#FFFFED'}
          castShadow
          shadow-bias={-0.0004}
          position={[-20, 20, 20]}
          shadow-camera-top={20}
          shadow-camera-right={20}
          shadow-camera-bottom={-20}
          shadow-camera-left={-20}
        />
        <ambientLight intensity={0.2} />
        <OrbitControls enabled={computerState === "room"} />

        <Suspense fallback={null}>
          <Physics>
            <CharacterController
              heroRef={heroRef}
              inputLocked={computerState !== "room"}
            />
            <pointLight position={[5, 5, 5]}/>
            <PokemonRoom heroRef={heroRef} onEnterComputer={enterComputer} />
          </Physics>
        </Suspense>
        <Stars/>
      </Canvas>

      {/* UI Overlay (hidden while using the computer) */}
      {showDialog && computerState === "room" && (
        <DialogBox
            messages={[
                "Welcome to my portfolio!",
                "Use WASD to move and E to interact with objects."
            ]} 
            onDone={() => setShowDialog(false)} 
        />
      )}

      {(computerState === "booting" ||
        computerState === "desktop" ||
        computerState === "zooming-out") && (
        <div
          className="absolute inset-0 z-50"
          style={{
            pointerEvents: "none",
            opacity: computerState === "zooming-out" ? 0 : 1,
            transition: "opacity 0.45s ease",
          }}
        >
          {/* Screen panel — pinned over the monitor's glass by CameraRig (which
              writes left/top/width/height every frame), overscanned a little so
              the desktop covers the grey casing instead of stopping at the glass. */}
          <div
            ref={panelRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              overflow: "hidden",
              pointerEvents: computerState === "zooming-out" ? "none" : "auto",
            }}
          >
            {computerState === "booting" && (
              <Win98Boot onDone={() => setComputerState("desktop")} />
            )}
            {(computerState === "desktop" ||
              computerState === "zooming-out") && (
              <Win98Desktop onShutDown={exitComputer} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
