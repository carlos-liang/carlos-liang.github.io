import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment, ContactShadows } from "@react-three/drei";
import CharacterController from "../components/CharacterController";
import { Physics } from "@react-three/rapier";
import { PokemonRoom } from "../components/PokemonRoom";
import DialogBox from "../components/DialogBox";
import * as THREE from 'three';

function LinkedInDialog({ onClose }) {
  const text = "Connect with me on LinkedIn:";
  const [displayedText, setDisplayedText] = useState('');
  const [showLink, setShowLink] = useState(false);
  const typeSpeed = 30;
  const timerRef = useRef(null);

  useEffect(() => {
    let charIndex = 0;
    const typeChar = () => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
        timerRef.current = setTimeout(typeChar, typeSpeed);
      } else {
        setShowLink(true);
      }
    };
    timerRef.current = setTimeout(typeChar, typeSpeed);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleClick = () => {
    if (!showLink) {
        clearTimeout(timerRef.current);
        setDisplayedText(text);
        setShowLink(true);
    } else {
        onClose();
    }
  };

  return (
    <div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-50 select-none cursor-pointer"
        onClick={handleClick}
    >
        {/* Outer Container for spacing/shadow if needed */}
        <div className="relative">
            {/* The Dialog Box */}
            <div 
                className="bg-white border-[5px] border-[#6faedd] rounded-[30px] px-6 pt-4 pb-6 min-h-[100px] flex flex-col justify-start items-start"
                style={{
                    imageRendering: 'pixelated',
                    boxShadow: '0 0 0 2px #376888, 0 4px 0 rgba(0,0,0,0.1)' 
                }}
            >
                <p 
                    className="text-[#333333] text-base leading-relaxed m-0 w-full"
                    style={{ 
                        fontFamily: '"PokemonGb", monospace',
                        textShadow: '1px 1px 0 #ddd' 
                    }}
                >
                    {displayedText}
                    {showLink && (
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16" 
                            className="inline-block ml-2 align-baseline animate-bounce"
                            style={{ imageRendering: 'pixelated' }}
                        >
                             {/* Red Body */}
                            <path 
                                d="M1 4h14v2h-2v2h-2v2h-2v2h-2v-2h-2v-2h-2v-2h-2z" 
                                fill="#FF0000" 
                            />
                            {/* Darker Shadow/Border on right/bottom edges */}
                            <path 
                                d="M15 4v2h-2v2h-2v2h-2v2h-2v2h-1v-2h2v-2h2v-2h2v-2h1z" 
                                fill="#8B0000" 
                            />
                        </svg>
                    )}
                </p>
                {showLink && (
                  <a 
                      href="https://www.linkedin.com/in/carlosl97/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-base break-all hover:underline mt-2 block"
                      style={{ fontFamily: '"PokemonGb", monospace' }}
                      onClick={(e) => e.stopPropagation()} 
                  >
                      https://www.linkedin.com/in/carlosl97/
                  </a>
                )}
            </div>
        </div>
    </div>
  );
}

const LandingPage = () => {
  const [dpr, setDpr] = useState(1.5)
  const [showDialog, setShowDialog] = useState(true);
  const [showCV, setShowCV] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
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
            <PokemonRoom 
                heroRef={heroRef} 
                onOpenCV={() => setShowCV(true)} 
                onOpenLinkedIn={() => setShowLinkedIn(true)}
            />
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

      {/* LinkedIn Overlay */}
      {showLinkedIn && (
        <LinkedInDialog onClose={() => setShowLinkedIn(false)} />
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
