import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import * as THREE from "three";
import { Bmo } from "./Bmo";

const CharacterController = ({ heroRef }) => {
  const characterBody = useRef();
  const character = useRef()
  const orientation = useRef(Math.PI);
  const inAir = useRef(false);

  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  })

  // Smoothing: Track current velocity
  const currentVelocity = useRef({ x: 0, z: 0 });

  // Adjusted constants for frame-rate independence and better scale
  const velocity = 5;
  const sprintVelocity = 10;

  const {nodes, materials, animations} = useGLTF('/bmo/scene.gltf')
  const {actions} = useAnimations(animations, character)

  let rotateQuaternion = new THREE.Quaternion();

  const handleKeyPress = useCallback((event) => {
    if (event.repeat) return;
    switch (event.keyCode) {
      case 87: //w
        setMovement((prev) => ({...prev, forward: true}));
        break;
      case 65: //a
        setMovement((prev) => ({...prev, left: true}));
        break;
      case 83: //s
        setMovement((prev) => ({...prev, backward: true}));
        break;
      case 68: //d
        setMovement((prev) => ({...prev, right: true}));
        break;
      case 32: //space
        if (!inAir.current && characterBody.current) {
          const linvel = characterBody.current.linvel();
          // Increased jump velocity from 5.0 to 10.0
          characterBody.current.setLinvel({ x: linvel.x, y: 10.0, z: linvel.z });
          inAir.current = true;
        }
        break;
      case 16: //shift
        setMovement((prev) => ({...prev, sprint: true}));
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event) => {
    switch (event.keyCode) {
      case 87: //w
        setMovement((prev) => ({...prev, forward: false}));
        break;
      case 65: //a
        setMovement((prev) => ({...prev, left: false}));
        break;
      case 83: //s
        setMovement((prev) => ({...prev, backward: false}));
        break;
      case 68: //d
        setMovement((prev) => ({...prev, right: false}));
        break;
      case 16: //left shift
        setMovement((prev) => ({...prev, sprint: false}));
        break;
    }
  }, []);

  useFrame((state, delta) => {
    const isMoving = movement.forward || movement.backward || movement.left || movement.right;

    // Check ground status roughly by velocity
    const linvel = characterBody.current.linvel();
    if (Math.abs(linvel.y) < 0.1) {
      inAir.current = false;
    } else {
      inAir.current = true;
    }

    // Determine if we should be simulating movement or stopping
    const hasVelocity = Math.abs(currentVelocity.current.x) > 0.05 || Math.abs(currentVelocity.current.z) > 0.05;

    if (isMoving || inAir.current || linvel.y < -30 || hasVelocity) {
      if (actions.Animation && (isMoving || inAir.current)) {
        actions.Animation.play();
        // Speed up animation to match movement velocity
        // Increased timeScale to match faster movement
        actions.Animation.timeScale = movement.sprint ? 4.0 : 2.5;
      }

      /**
       * Model Movement (Camera Relative)
       */
      const speed = movement.sprint ? sprintVelocity : velocity;

      // Get camera direction
      const camera = state.camera;
      // Forward vector (projected to XZ plane)
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();

      // Right vector
      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      const moveDir = new THREE.Vector3(0, 0, 0);
      if (movement.forward) moveDir.add(forward);
      if (movement.backward) moveDir.sub(forward);
      if (movement.left) moveDir.sub(right);
      if (movement.right) moveDir.add(right);

      if (moveDir.lengthSq() > 0) moveDir.normalize();

      let targetX = moveDir.x * speed;
      let targetZ = moveDir.z * speed;

      // Smooth velocity (Lerp)
      const smoothFactor = 0.1;
      currentVelocity.current.x = THREE.MathUtils.lerp(currentVelocity.current.x, targetX, smoothFactor);
      currentVelocity.current.z = THREE.MathUtils.lerp(currentVelocity.current.z, targetZ, smoothFactor);

      /**
       * Model orientation
       */
      if (isMoving) {
          // Calculate target angle from velocity
          // Note: atan2(x, z) gives 0 at +Z (South), PI at -Z (North), PI/2 at +X (East).
          // Three.js standard: 0 is usually looking down -Z if model is set up that way.
          // BMO seems to face -Z by default based on previous code.
          // Let's test standard atan2(x, z).
          const angle = Math.atan2(currentVelocity.current.x, currentVelocity.current.z);
          
          // Smooth rotation logic
          let angleDiff = angle - orientation.current;
          // Normalize angle difference to -PI to PI
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          orientation.current += angleDiff * 0.15; // Increased turning speed slightly
          
          rotateQuaternion.setFromEuler(new THREE.Euler(0, orientation.current, 0));
          characterBody.current.setRotation(rotateQuaternion);
      }

      // Apply horizontal velocity, preserve vertical velocity (gravity)
      characterBody.current.setLinvel({
        x: currentVelocity.current.x,
        y: linvel.y,
        z: currentVelocity.current.z
      });

    } else {
      // Idle state
      if (actions.Animation) {
        actions.Animation.fadeOut(0.2);
        actions.Animation.reset().fadeIn(0.2).play();
        actions.Animation.timeScale = 1;
      }
    }

    if (characterBody.current.translation().y < -20) {
      characterBody.current.setTranslation({x: -2.0, y: 1.0, z: 2.2})
      characterBody.current.setLinvel({ x: 0, y: 0, z: 0 })
    }

    // Update heroRef with current position for other components to use
    if (heroRef && characterBody.current) {
      const t = characterBody.current.translation();
      heroRef.current.set(t.x, t.y, t.z);
    }
  })

  useEffect(() => {
    // Reset movement on window blur to prevent stuck keys
    const handleBlur = () => {
      setMovement({
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false
      });
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyPress, handleKeyUp]);

  return (
    <RigidBody
      lockRotations={true}
      ref={characterBody}
      colliders={false}
      position={[-2, 1, 2.2]}
      restitution={0.2}
      friction={1}
      gravityScale={2.5}
      ccd={true} // Continuous Collision Detection prevents falling through floor at high speeds/lag
    >
      <group ref={character}>
        <Bmo/>
      </group>
      <CapsuleCollider args={[0.8, 0.4]} position={[0, 1.2, 0]}/>
    </RigidBody>
  )
};

export default CharacterController;