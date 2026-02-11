import React, { useState, Suspense, useMemo, useEffect, useRef } from 'react'
import { useLoader, useFrame } from "@react-three/fiber";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {RigidBody} from "@react-three/rapier";
import { useVideoTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

function ObjectGlow({ geometry, center }) {
  const glowRef = useRef();

  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.getElapsedTime();
      glowRef.current.material.opacity = 0.5 + Math.sin(t * 4) * 0.2;
    }
  })

  return (
    <group position={[center.x, center.y, center.z]}>
      <group scale={1.05}>
        <mesh
          ref={glowRef}
          geometry={geometry}
          position={[-center.x, -center.y, -center.z]}
        >
          <meshBasicMaterial
            color="white"
            transparent
            opacity={0.6}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}

function TvScreen({ material, geometry, scale = 1.5, heroRef, ...props }) {
  const [on, setOn] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inRange, setInRange] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto' };
  }, [hovered]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e' && inRange) {
        setOn((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inRange]);

  // Calculate TV dimensions to place the screen
  const { center, size, bottomCenter } = useMemo(() => {
    if (!geometry) return { center: [0, 0, 0], size: [0, 0, 0], bottomCenter: [0, 0, 0] };
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    // Pivot at the bottom center to keep it on the stand when scaling
    const bottomCenter = new THREE.Vector3(center.x, box.min.y, center.z);
    return { center, size, bottomCenter };
  }, [geometry]);

  useFrame(() => {
    if (heroRef && heroRef.current) {
      const dist = heroRef.current.distanceTo(center);
      if (dist < 3.5) { // Proximity threshold
        if (!inRange) setInRange(true);
      } else {
        if (inRange) setInRange(false);
      }
    }
  });

  return (
    // Pivot group: positioned at the bottom-center of the TV
    <group {...props} position={bottomCenter} scale={scale}>
      {/* Shift content back so the bottom-center aligns with the pivot origin */}
      <group position={[-bottomCenter.x, -bottomCenter.y, -bottomCenter.z]}>
        {/* The TV Cabinet/Frame (Always visible) */}
        <RigidBody type="fixed" colliders="trimesh">
          <mesh
            geometry={geometry}
            material={material}
            onClick={(e) => {
              e.stopPropagation();
              // Removed click toggle, now handled by key 'E'
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
          />
        </RigidBody>

        {/* White Outline/Glow always visible */}
        <ObjectGlow geometry={geometry} center={center} />

        {/* Tooltip when in range or hovered */}
        {(inRange || hovered) && (
          <Html position={[center.x, center.y + size.y * 1.2, center.z]} center distanceFactor={8}>
            <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-bold border border-white/50 backdrop-blur-sm shadow-lg pointer-events-none select-none flex items-center gap-2 whitespace-nowrap">
              {on ? "Turn Off" : "Watch TV"}
              <span className="text-xs text-gray-300 ml-1">
                (E)
              </span>
            </div>
          </Html>
        )}

        {/* The Video Screen (Overlay) */}
        {on && (
          <Suspense fallback={null}>
            <mesh
              // Position slightly in front of the TV center
              // We assume the TV faces +Z or -Z, or X. 
              // Adjusting based on typical room layouts: 
              // If the TV is thin (Z), screen is on Z face.
              // Let's try placing it on the face with largest area or just +Z relative to bounding box center.
              // We position it at center + half depth + offset
              // Shift Y up by size.y * 0.1 to cover the grey part
              // Reduced Z offset to minimize gap while avoiding Z-fighting
              position={[center.x, center.y + size.y * 0.15, center.z + size.z / 2 + 0.005]}
              rotation={[0, 0, 0]} // Assuming no rotation needed relative to world if geometry is baked
              onClick={(e) => {
                e.stopPropagation();
                // Removed click toggle, now handled by key 'E'
              }}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
              onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
            >
              {/* Make the screen slightly smaller than the TV bounds */}
              <planeGeometry args={[size.x * 0.8, size.y * 0.7]} />
              <VideoMaterial />
            </mesh>
          </Suspense>
        )}
      </group>
    </group>
  );
}

function Computer({ geometry, material, heroRef, onOpenCV }) {
  const [hovered, setHovered] = useState(false);
  const [inRange, setInRange] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e' && inRange) {
        if (onOpenCV) onOpenCV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inRange, onOpenCV]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto' };
  }, [hovered]);

  const { center, size } = useMemo(() => {
    if (!geometry) return { center: [0, 0, 0], size: [0, 0, 0] };
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    return { center, size };
  }, [geometry]);

  useFrame(() => {
    if (heroRef && heroRef.current) {
      const dist = heroRef.current.distanceTo(center);
      if (dist < 1.8) {
        if (!inRange) setInRange(true);
      } else {
        if (inRange) setInRange(false);
      }
    }
  });

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        onClick={(e) => {
          e.stopPropagation();
          // Removed click toggle, handled by key 'E'
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
      />
      {/* White Outline/Glow always visible */}
      <ObjectGlow geometry={geometry} center={center} />

      {inRange && (
        <Html position={[center.x, center.y + size.y, center.z]} center distanceFactor={8}>
          <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-bold border border-white/50 backdrop-blur-sm shadow-lg pointer-events-none select-none flex items-center gap-2 whitespace-nowrap">
            Use Computer
            <span className="text-xs text-gray-300 ml-1">
              (E)
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

function Clipboard({ geometry, material, heroRef, onOpenLinkedIn }) {
  const [hovered, setHovered] = useState(false);
  const [inRange, setInRange] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e' && inRange) {
        if (onOpenLinkedIn) onOpenLinkedIn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inRange, onOpenLinkedIn]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto' };
  }, [hovered]);

  const { center, size } = useMemo(() => {
    if (!geometry) return { center: [0, 0, 0], size: [0, 0, 0] };
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    return { center, size };
  }, [geometry]);

  useFrame(() => {
    if (heroRef && heroRef.current) {
      const dist = heroRef.current.distanceTo(center);
      if (dist < 2.5) {
        if (!inRange) setInRange(true);
      } else {
        if (inRange) {
          setInRange(false);
        }
      }
    }
  });

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenLinkedIn) onOpenLinkedIn();
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
      />
      <ObjectGlow geometry={geometry} center={center} />

      {inRange && (
        <Html position={[center.x, center.y, center.z]} center distanceFactor={8}>
          <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-bold border border-white/50 backdrop-blur-sm shadow-lg pointer-events-none select-none flex items-center gap-2 whitespace-nowrap">
            Check Clipboard
            <span className="text-xs text-gray-300 ml-1">
              (E)
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

function VideoMaterial() {
  // Using a sample video from local public folder
  const texture = useVideoTexture("/new-jeans-right-now.mp4", {
    muted: false, // Changed to false to enable audio
    loop: true,
    start: true
  });

  useEffect(() => {
    const video = texture.image;
    if (video) {
      video.play();
    }
    return () => {
      if (video) {
        video.pause();
        // Optional: reset time so it starts from beginning next time
        // video.currentTime = 0; 
      }
    };
  }, [texture]);
  
  // Changed flipY to true to fix upside down video
  // Most videos on planes need flipY=true or scale=[1, -1, 1] on the geometry if UVs are standard
  // Since we are using a plain planeGeometry, flipY=true is usually correct for video textures.
  texture.flipY = true;

  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

export function PokemonRoom({ heroRef, onOpenCV, onOpenLinkedIn, ...props }) {
  const {nodes, materials} = useLoader(GLTFLoader, 'pokemon_fire_red_players_room/scene.gltf')

  return (
    <group {...props} dispose={null}>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={nodes.base_fireRed_material_0.geometry} material={materials.fireRed_material} />
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.tiles_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.chair_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.table_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>

      {/* Computer with Interaction */}
      <RigidBody type="fixed">
        <Computer 
            geometry={nodes.Computer_fireRed_material_0.geometry} 
            material={materials.fireRed_material} 
            heroRef={heroRef}
            onOpenCV={onOpenCV}
        />
      </RigidBody>

      <RigidBody type="fixed">
        <mesh geometry={nodes.TV_stand_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>

      {/* TV Screen with Video support */}
      <TvScreen geometry={nodes.TV_fireRed_material_0.geometry} material={materials.fireRed_material} scale={1.8} heroRef={heroRef} />

      <RigidBody type="fixed">
        <mesh geometry={nodes.carpet_A_fireRed_material_0.geometry} material={materials.fireRed_material}/>
        <mesh geometry={nodes.carpet_B_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.bed_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.dresser_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.bookShelf_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.NES_fireRed_material_0.geometry} material={materials.fireRed_material} />
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.railing_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.stairs_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <Clipboard geometry={nodes.wall_picture_fireRed_material_0.geometry} material={materials.fireRed_material} heroRef={heroRef} onOpenLinkedIn={onOpenLinkedIn}/>
      <RigidBody type="fixed">
        <mesh geometry={nodes.ambient_occlusion_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.title_fireRed_material_0.geometry} material={materials.fireRed_material}/>
    </group>
  )
}
