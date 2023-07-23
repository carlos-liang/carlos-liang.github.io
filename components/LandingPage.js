import React, {useEffect} from 'react';
import { Canvas } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Model } from "./Scene";
import {OrbitControls} from "@react-three/drei";

const LandingPage = () => {

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 0, 3] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Model />
        <OrbitControls/>
      </Canvas>
    </div>
  );
};

export default LandingPage;
