import React, { useEffect, Suspense } from 'react';
import { Canvas } from "@react-three/fiber";
import {OrbitControls, PerspectiveCamera, Sky} from "@react-three/drei";
import CharacterController from "./CharacterController";
import Room from "./Room";
import Navbar from "./NavBar";
import * as THREE from "three";
import {Physics} from "@react-three/rapier";
import {AiFillGithub} from "react-icons/ai";

const LandingPage = () => {

  return (
    <div className="w-full h-screen">

      <Canvas
      >
        <ambientLight intensity={0.85} />
        <OrbitControls />
        <Suspense fallback={null}>
          <Physics >
            <CharacterController/>
            <Room/>
          </Physics>
        </Suspense>
        <Sky/>
      </Canvas>
    </div>
  );
};

export default LandingPage;
