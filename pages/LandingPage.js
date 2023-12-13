import React, { Suspense, useState } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import CharacterController from "../components/CharacterController";
import { Physics } from "@react-three/rapier";
import { PokemonRoom } from "../components/PokemonRoom";

const LandingPage = () => {
  const [dpr, setDpr] = useState(1.5)

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
          <Physics timeStep="vary">
            <CharacterController />
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
