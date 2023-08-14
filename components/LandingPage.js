import React, { Suspense, useState } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import CharacterController from "./CharacterController";
import { Physics } from "@react-three/rapier";
import { PokemonRoom } from "./PokemonRoom";

const LandingPage = () => {
  const [dpr, setDpr] = useState(1.5)

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{
          fov: 20,
          near: 0.1,
          far: 1000,
          position: [5, 20, 35],
        }}
        linear="true"
        legacy="false"
        dpr={dpr}
      >
        <ambientLight intensity={0.85}/>
        <OrbitControls/>
        <Suspense fallback={null}>
          <Physics>
            <CharacterController/>
            <pointLight position={[5, 5, 5]}/>
            <PokemonRoom/>
          </Physics>
        </Suspense>
        <Stars/>
      </Canvas>
    </div>
  );
};

export default LandingPage;
