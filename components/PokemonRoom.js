import React, { useState, Suspense, useMemo, useEffect, useRef } from 'react'
import { useLoader, useFrame } from "@react-three/fiber";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {RigidBody} from "@react-three/rapier";
import { useVideoTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

const FIRE_RED_PALETTE = [
  // Floor: move the brown parquet range toward the game's olive-gold floor.
  ['#946F2E', '#8F8536'],
  ['#A17535', '#9B9039'],
  ['#956E40', '#978D45'],
  ['#8C6E30', '#897F32'],
  ['#A09030', '#9E9435'],
  ['#A89040', '#A69C3F'],
  ['#B09348', '#AAA043'],
  ['#C09448', '#B0A543'],
  ['#C0B048', '#BEB34A'],
  ['#D0C068', '#CEC45F'],
  ['#E0D078', '#DDD36D'],
  ['#F0E890', '#EEE783'],

  // Rug and green furniture: cleaner, slightly cooler FireRed greens.
  ['#54A768', '#4EAA62'],
  ['#68C068', '#60C873'],
  ['#8EE5A1', '#91E7A7'],

  // Walls and warm neutrals: pale green-cream rather than flat beige.
  ['#979784', '#9EA88B'],
  ['#B0B0A0', '#B7C0AA'],
  ['#C3BCA8', '#C2CBAF'],
  ['#D0D0A8', '#D0D9B1'],

  // Blue trims and furniture accents.
  ['#4165AD', '#416FC0'],
  ['#5090C0', '#579CCB'],
  ['#98D0F8', '#9FD8F2'],

  // Replace purple-brown outlines with the cooler blue-charcoal reference.
  ['#383654', '#3D465C'],
  ['#3E3368', '#414B61'],
  ['#3F3D5D', '#424A61'],
  ['#434361', '#465067'],
  ['#443C68', '#444E68'],
  ['#505068', '#505A6D'],
  ['#585870', '#586276'],
  ['#616576', '#626C7E'],
  ['#635678', '#5D647A'],

  // FireRed salmon used by the stair rug and wall clipboard.
  ['#E08860', '#FF8373'],
];

function shaderColor(hex) {
  const channelToLinear = (value) => {
    const srgb = value / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  const value = Number.parseInt(hex.slice(1), 16);
  const red = channelToLinear((value >> 16) & 255);
  const green = channelToLinear((value >> 8) & 255);
  const blue = channelToLinear(value & 255);
  return `vec3(${red.toFixed(7)}, ${green.toFixed(7)}, ${blue.toFixed(7)})`;
}

function shaderDisplayColor(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  return `vec3(${red.toFixed(7)}, ${green.toFixed(7)}, ${blue.toFixed(7)})`;
}

function createFireRedMaterial(sourceMaterial, normalizeFloorTiles = false) {
  const material = sourceMaterial.clone();
  const comparisons = FIRE_RED_PALETTE.map(
    ([source, target]) =>
      `if (distance(color, ${shaderColor(source)}) < 0.002) return ${shaderColor(target)};`
  ).join('\n  ');
  const floorNormalization = normalizeFloorTiles
    ? `if (distance(color, ${shaderColor('#C09448')}) < 0.002 || distance(color, ${shaderColor('#B09348')}) < 0.002) return ${shaderColor('#C0B048')};
  if (distance(color, ${shaderColor('#A17535')}) < 0.002 || distance(color, ${shaderColor('#8C6E30')}) < 0.002) return ${shaderColor('#A09030')};
  if (distance(color, ${shaderColor('#866416')}) < 0.002 || distance(color, ${shaderColor('#715416')}) < 0.002) return ${shaderColor('#867616')};
  if (distance(color, ${shaderColor('#635678')}) < 0.002) return ${shaderColor('#787878')};`
    : '';
  const floorMaskDeclarations = normalizeFloorTiles
    ? `float fireRedFloorBase = 0.0;
float fireRedFloorShade = 0.0;
float fireRedFloorLine = 0.0;
float fireRedFloorGrout = 0.0;`
    : '';
  const floorMaskCapture = normalizeFloorTiles
    ? `fireRedFloorBase = distance(diffuseColor.rgb, ${shaderColor('#C0B048')}) < 0.002 ? 1.0 : 0.0;
fireRedFloorShade = distance(diffuseColor.rgb, ${shaderColor('#A09030')}) < 0.002 ? 1.0 : 0.0;
fireRedFloorLine = distance(diffuseColor.rgb, ${shaderColor('#867616')}) < 0.002 ? 1.0 : 0.0;
fireRedFloorGrout = distance(diffuseColor.rgb, ${shaderColor('#787878')}) < 0.002 ? 1.0 : 0.0;`
    : '';
  const floorFinalColors = normalizeFloorTiles
    ? `if (fireRedFloorBase > 0.5) gl_FragColor.rgb = ${shaderDisplayColor('#C0B048')};
if (fireRedFloorShade > 0.5) gl_FragColor.rgb = ${shaderDisplayColor('#A09030')};
if (fireRedFloorLine > 0.5) gl_FragColor.rgb = ${shaderDisplayColor('#867616')};
if (fireRedFloorGrout > 0.5) gl_FragColor.rgb = ${shaderDisplayColor('#787878')};`
    : '';

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `vec3 normalizeFireRedFloor(vec3 color) {
  ${floorNormalization}
  return color;
}

vec3 applyFireRedPalette(vec3 color) {
  ${comparisons}
  return color;
}

float fireRedOrangeAccent = 0.0;
${floorMaskDeclarations}

void main() {`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
diffuseColor.rgb = normalizeFireRedFloor(diffuseColor.rgb);
${floorMaskCapture}
fireRedOrangeAccent = distance(diffuseColor.rgb, ${shaderColor('#E08860')}) < 0.002 ? 1.0 : 0.0;
diffuseColor.rgb = applyFireRedPalette(diffuseColor.rgb);`
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
${floorFinalColors}
if (fireRedOrangeAccent > 0.5) gl_FragColor.rgb = ${shaderDisplayColor('#FF8373')};`
      );
  };
  material.customProgramCacheKey = () => normalizeFloorTiles
    ? 'fire-red-uniform-floor-palette-v2'
    : 'fire-red-reference-palette-v3';
  material.needsUpdate = true;
  return material;
}

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

function Computer({ geometry, material, heroRef, onEnterComputer }) {
  const [hovered, setHovered] = useState(false);
  const [inRange, setInRange] = useState(false);
  const [hasBeenUsed, setHasBeenUsed] = useState(false);

  const { center, size, screen } = useMemo(() => {
    if (!geometry)
      return { center: new THREE.Vector3(), size: new THREE.Vector3(), screen: null };
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    // Monitor glass, measured from the Computer mesh geometry: centred in X,
    // ~15% of height above centre, sitting on the front (+Z) face. The screen
    // opening is ~84% of the mesh width and ~55% of its height; the camera
    // frames this rectangle head-on and the Win98 desktop panel is pinned to it.
    const screen = {
      center: new THREE.Vector3(center.x, center.y + size.y * 0.151, box.max.z),
      normal: new THREE.Vector3(0, 0, 1),
      halfW: (size.x * 0.842) / 2,
      halfH: (size.y * 0.548) / 2,
    };
    return { center, size, screen };
  }, [geometry]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e' && inRange) {
        // Hand the camera rig the measured screen plane so it can frame the
        // monitor glass head-on and pin the Win98 desktop panel to it.
        if (onEnterComputer && screen) {
          setHasBeenUsed(true);
          onEnterComputer(screen);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inRange, onEnterComputer, screen]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto' };
  }, [hovered]);

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
      {/* Stop highlighting the computer after the player has used it. */}
      {!hasBeenUsed && <ObjectGlow geometry={geometry} center={center} />}

      {(inRange || hovered) && (
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

export function PokemonRoom({ heroRef, onEnterComputer, ...props }) {
  const {nodes, materials} = useLoader(GLTFLoader, 'pokemon_fire_red_players_room/scene.gltf')
  const roomMaterial = useMemo(
    () => createFireRedMaterial(materials.fireRed_material),
    [materials.fireRed_material]
  );
  const floorMaterial = useMemo(
    () => createFireRedMaterial(materials.fireRed_material, true),
    [materials.fireRed_material]
  );

  useEffect(() => () => roomMaterial.dispose(), [roomMaterial]);
  useEffect(() => () => floorMaterial.dispose(), [floorMaterial]);

  return (
    <group {...props} dispose={null}>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={nodes.base_fireRed_material_0.geometry} material={roomMaterial} />
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.tiles_fireRed_material_0.geometry} material={floorMaterial}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.chair_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.table_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>

      {/* Computer with Interaction */}
      <RigidBody type="fixed">
        <Computer
          geometry={nodes.Computer_fireRed_material_0.geometry}
          material={roomMaterial}
          heroRef={heroRef}
          onEnterComputer={onEnterComputer}
        />
      </RigidBody>

      <RigidBody type="fixed">
        <mesh geometry={nodes.TV_stand_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>

      {/* TV Screen with Video support */}
      <TvScreen geometry={nodes.TV_fireRed_material_0.geometry} material={roomMaterial} scale={1.8} heroRef={heroRef} />

      <RigidBody type="fixed">
        <mesh geometry={nodes.carpet_A_fireRed_material_0.geometry} material={roomMaterial}/>
        <mesh geometry={nodes.carpet_B_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.bed_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.dresser_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.bookShelf_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.NES_fireRed_material_0.geometry} material={roomMaterial} />
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.railing_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <mesh geometry={nodes.stairs_fireRed_material_0.geometry} material={roomMaterial}/>
      <RigidBody type="fixed">
        <mesh
          geometry={nodes.wall_picture_fireRed_material_0.geometry}
          material={roomMaterial}
        />
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.ambient_occlusion_fireRed_material_0.geometry} material={roomMaterial}/>
      </RigidBody>
      <mesh geometry={nodes.title_fireRed_material_0.geometry} material={roomMaterial}/>
    </group>
  )
}
