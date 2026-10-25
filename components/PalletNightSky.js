import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_VERTEX_SHADER = `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uMotion;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.82 + 0.18 * sin(aPhase + uTime * uMotion);

    vColor = aColor;
    vAlpha = twinkle;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * (145.0 / max(1.0, -viewPosition.z)), 1.0, 4.0);
  }
`;

const STAR_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Keeping the whole point makes each star a crisp pixel instead of a dot.
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export default function PalletNightSky() {
  const starsRef = useRef();
  const materialRef = useRef();
  const [reduceMotion, setReduceMotion] = useState(false);

  const starField = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const random = seededRandom(151);
    const palette = ["#7d89a4", "#aab8b4", "#697a9b", "#c3c9bf"];

    for (let index = 0; index < count; index += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = 72 + random() * 56;
      const color = new THREE.Color(palette[Math.floor(random() * palette.length)]);

      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      sizes[index] = random() > 0.92 ? 2.25 : 0.8 + random() * 0.85;
      phases[index] = random() * Math.PI * 2;
    }

    return { count, positions, colors, sizes, phases };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: 1 },
    }),
    []
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);
    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current || !starsRef.current) return;

    materialRef.current.uniforms.uMotion.value = reduceMotion ? 0 : 1;
    if (!reduceMotion) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * 0.45;
      starsRef.current.rotation.y += delta * 0.0025;
    }
  });

  return (
    <points ref={starsRef} frustumCulled={false} renderOrder={-10}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={starField.positions}
          count={starField.count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          array={starField.colors}
          count={starField.count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          array={starField.sizes}
          count={starField.count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          array={starField.phases}
          count={starField.count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={STAR_VERTEX_SHADER}
        fragmentShader={STAR_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
