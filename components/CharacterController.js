import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import * as THREE from "three";
import { Bmo } from "./Bmo";

const CharacterController = ({ heroRef, inputLocked }) => {
  const characterBody = useRef();
  const character = useRef()
  const orientation = useRef(Math.PI);
  const inAir = useRef(false);

  // Procedural walk state (grounded & natural)
  const stepPhase = useRef(0);   // accumulates with distance travelled, drives the bob
  const leanAmt = useRef(0);     // smoothed forward-lean angle
  const walkWeight = useRef(0);  // 0 = standing, 1 = walking; blends the clip + bob in/out

  // Procedural jump state (squash & stretch)
  const prevVelY = useRef(0);    // last frame's vertical speed, for landing detection
  const landSquash = useRef(0);  // squash impulse, springs back to 0
  const airStretch = useRef(0);  // smoothed airborne stretch

  const inputLockedRef = useRef(inputLocked);
  useEffect(() => {
    inputLockedRef.current = inputLocked;
  }, [inputLocked]);

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

  // Walk-feel tuning (grounded & natural)
  const ANIM_SPEED_K = 0.6;       // morph playback per unit ground speed (kills foot-slide)
  const ANIM_MAX_TIMESCALE = 6;   // cap so sprinting doesn't go frantic
  const STEP_FREQ = 2.0;          // step cadence per unit ground speed
  const BOB_HEIGHT = 0.1;         // vertical lift at the top of each step
  const MAX_LEAN = 0.14;          // forward lean (radians) at full sprint
  const LEAN_SIGN = -1;           // -1 leans into travel; flip to +1 if it leans backward

  // Jump-feel tuning (grounded & natural)
  const JUMP_VELOCITY = 10.0;     // takeoff speed
  const FALL_BOOST = 22;          // extra downward accel while falling (kills the float)
  const MAX_FALL_SPEED = -30;     // terminal fall speed clamp
  const STRETCH_K = 0.012;        // vertical stretch per unit vertical speed
  const MAX_STRETCH = 0.16;       // cap on airborne stretch
  const LAND_SQUASH = 0.22;       // max squash on a hard landing

  const {nodes, materials, animations} = useGLTF('/bmo/scene.gltf')
  const {actions} = useAnimations(animations, character)

  // Keep the single walk clip always running; we control visibility via weight.
  useEffect(() => {
    const a = actions.Animation;
    if (a) {
      a.reset();
      a.play();
      a.setEffectiveWeight(0); // start standing still
    }
  }, [actions]);

  let rotateQuaternion = new THREE.Quaternion();

  const handleKeyPress = useCallback((event) => {
    if (inputLockedRef.current) return;
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
          characterBody.current.setLinvel({ x: linvel.x, y: JUMP_VELOCITY, z: linvel.z });
          inAir.current = true;
        }
        break;
      case 16: //shift
        setMovement((prev) => ({...prev, sprint: true}));
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event) => {
    if (inputLockedRef.current) return;
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

      // Less-floaty arc: pile on extra gravity while falling, clamped to a terminal speed
      let velY = linvel.y;
      if (velY < 0) velY = Math.max(velY - FALL_BOOST * delta, MAX_FALL_SPEED);

      // Apply horizontal velocity, keep the (adjusted) vertical velocity
      characterBody.current.setLinvel({
        x: currentVelocity.current.x,
        y: velY,
        z: currentVelocity.current.z
      });

    }

    /**
     * Walk animation + procedural motion (grounded & natural)
     * Drives the morph "walk" by real ground speed (no foot-slide), and adds a
     * small per-step bob plus a slight lean into the direction of travel.
     */
    const horizontalSpeed = Math.hypot(currentVelocity.current.x, currentVelocity.current.z);
    const walkAction = actions.Animation;
    if (walkAction) {
      // Blend the walk clip in/out based on actual ground speed
      const targetWeight = horizontalSpeed > 0.2 ? 1 : 0;
      walkWeight.current = THREE.MathUtils.lerp(walkWeight.current, targetWeight, 0.15);
      walkAction.setEffectiveWeight(walkWeight.current);
      // Sync playback speed to ground speed so the gait matches distance covered
      walkAction.timeScale = Math.min(horizontalSpeed * ANIM_SPEED_K, ANIM_MAX_TIMESCALE);
    }

    if (character.current) {
      // Vertical bob: a lift at the top of each step, faded by how much we're walking
      stepPhase.current += delta * horizontalSpeed * STEP_FREQ;
      character.current.position.y = Math.abs(Math.sin(stepPhase.current)) * BOB_HEIGHT * walkWeight.current;

      // Lean into the direction of travel, proportional to speed
      const targetLean = (horizontalSpeed / sprintVelocity) * MAX_LEAN;
      leanAmt.current = THREE.MathUtils.lerp(leanAmt.current, targetLean, 0.1);
      character.current.rotation.x = leanAmt.current * LEAN_SIGN;

      /**
       * Squash & stretch (jump): elongate while moving through the air, then a
       * quick squash on impact that springs back out — sells weight and a real hop.
       */
      const vy = linvel.y;
      const targetStretch = Math.abs(vy) > 1 ? Math.min(Math.abs(vy) * STRETCH_K, MAX_STRETCH) : 0;
      airStretch.current = THREE.MathUtils.lerp(airStretch.current, targetStretch, 0.2);

      // Landing impact: was falling fast last frame, now suddenly not -> squash, scaled by impact
      if (prevVelY.current < -3 && vy > -1) {
        landSquash.current = Math.min(Math.abs(prevVelY.current) * 0.022, LAND_SQUASH);
      }
      landSquash.current = THREE.MathUtils.lerp(landSquash.current, 0, 0.15);
      prevVelY.current = vy;

      // Tall & thin in the air, short & wide on impact (volume roughly preserved)
      const sy = 1 + airStretch.current - landSquash.current;
      const sxz = 1 - (airStretch.current - landSquash.current) * 0.5;
      character.current.scale.set(sxz, sy, sxz);
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
    if (inputLocked) {
      setMovement({
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
      });
    }
  }, [inputLocked]);

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