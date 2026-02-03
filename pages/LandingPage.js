import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment, ContactShadows } from "@react-three/drei";
import CharacterController from "../components/CharacterController";
import { Physics } from "@react-three/rapier";
import { PokemonRoom } from "../components/PokemonRoom";
import DialogBox from "../components/DialogBox";
import * as THREE from 'three';

const LandingPage = () => {
  const [dpr, setDpr] = useState(1.5)
  const [showDialog, setShowDialog] = useState(true);
  const [showCV, setShowCV] = useState(false);
  // Shared reference for character position
  const heroRef = useRef(new THREE.Vector3());

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
        <OrbitControls/>

        <Suspense fallback={null}>
          <Physics>
            <CharacterController heroRef={heroRef} />
            <pointLight position={[5, 5, 5]}/>
            <PokemonRoom heroRef={heroRef} onOpenCV={() => setShowCV(true)} />
          </Physics>
        </Suspense>
        <Stars/>
      </Canvas>

      {/* UI Overlay */}
      {showDialog && (
        <DialogBox 
            messages={[
                "Welcome to my portfolio!",
                "Use WASD to move and E to interact with objects."
            ]} 
            onDone={() => setShowDialog(false)} 
        />
      )}

      {/* CV Overlay */}
      {showCV && (
        <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setShowCV(false)}
        >
            <div 
                className="relative w-full max-w-5xl h-[90vh] bg-white rounded shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={() => setShowCV(false)}
                    className="absolute top-2 right-4 z-10 text-gray-500 hover:text-gray-800 text-4xl leading-none"
                    aria-label="Close"
                >
                    &times;
                </button>
                <iframe 
                    src="/Carlos Liang - CV.pdf" 
                    className="w-full h-full border-none" 
                    title="CV"
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
