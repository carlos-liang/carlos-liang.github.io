import React, {useEffect, Suspense, useState} from 'react';
import { Canvas } from "@react-three/fiber";
import {Cloud, OrbitControls, PerspectiveCamera, Sky, Sparkles, Stars} from "@react-three/drei";
import CharacterController from "./CharacterController";

import {Physics, RigidBody} from "@react-three/rapier";
import {PokemonRoom} from "./PokemonRoom";
import Navbar from "./NavBar";

const LandingPage = () => {
  const [dpr, setDpr] = useState(0.5)

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{
          fov: 20,
          near: 0.1,
          far: 1000,
          position: [0, 6, 6],

        }}
        linear="true"
        legacy="false"
        shadows
      >
        <ambientLight intensity={0.85} />
        <OrbitControls />
        <Suspense fallback={null}>
          <Physics >
            <CharacterController/>
            <pointLight position={[5, 5, 5]} />
            <PokemonRoom/>
          </Physics>
        </Suspense>
        <Stars/>
      </Canvas>
    </div>
  );
};

export default LandingPage;
