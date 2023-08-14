import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import * as THREE from "three";
import { Bmo } from "./Bmo";

const CharacterController = () => {
  const characterBody = useRef();
  const character = useRef()
  const [orientation, setOrientation] = useState(Math.PI);
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  })
  const [movementY] = useState(() => ({
    positionOffsetY: 0.0,
    velocityY: 0.0,
    gravity: 0.5,
    onGround: true,
  }))

  const velocity = 300;
  const sprintVelocity = 600;
  const {nodes, materials, animations} = useGLTF('/bmo/scene.gltf')
  const {actions} = useAnimations(animations, character)

  let rotateQuaternion = new THREE.Quaternion();

  const handleKeyPress = useCallback((event) => {
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
        movementY.onGround && ((movementY.velocityY = -6.0), (movementY.onGround = false))
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
      case 32: //space
        movementY.velocityY < -3.0 && (movementY.velocityY = -3.0);
        break;
      case 16: //left shift
        setMovement((prev) => ({...prev, sprint: false}));
        break;
    }
  }, []);

  const calculateOrientation = ({forward, backward, left, right}) => {
    const angle = Math.PI / 4 / 7; // rotation normalizedSpeed (more divided => more smooth)
    const topLeftAngle = 3.927; // (225 * Math.PI / 180).toFixed(3)
    const bottomLeftAngle = 5.498; // (315 * Math.PI / 180).toFixed(3)
    const topRightAngle = 2.356; // (135 * Math.PI / 180).toFixed(3)
    const bottomRightAngle = 0.785; // (45 * Math.PI / 180).toFixed(3)

    let aTanAngle = Math.atan2(Math.sin(orientation), Math.cos(orientation));
    aTanAngle = aTanAngle < 0 ? aTanAngle + Math.PI * 2 : aTanAngle;
    aTanAngle = Number(aTanAngle.toFixed(3));
    aTanAngle = aTanAngle == 0 ? Number((Math.PI * 2).toFixed(3)) : aTanAngle;

    // Forward right
    if (forward && !backward && !left && right && aTanAngle != topRightAngle) {
      setOrientation((prevState) => prevState + angle * (aTanAngle > topRightAngle ? -1 : 1));
    }

    // Forward left
    if (forward && !backward && left && !right && aTanAngle != topLeftAngle) {
      setOrientation((prevState) => prevState + angle * (aTanAngle > topLeftAngle ? -1 : 1));
    }

    // Backward right
    if (!forward && backward && !left && right && aTanAngle != bottomRightAngle) {
      setOrientation((prevState) => prevState + angle * (aTanAngle > bottomRightAngle && aTanAngle < topLeftAngle ? -1 : 1));
    }

    // Backward left
    if (!forward && backward && left && !right && aTanAngle != bottomLeftAngle) {
      setOrientation((prevState) => prevState + angle * (aTanAngle < topRightAngle || aTanAngle > bottomLeftAngle ? -1 : 1));
    }

    // Right
    if (!forward && !backward && !left && right && Math.sin(orientation) != 1) {
      setOrientation((prevState) => prevState + angle * (Math.cos(orientation) > 0 ? 1 : -1));
    }

    // Left
    if (!forward && !backward && left && !right && Math.sin(orientation) != -1) {
      setOrientation((prevState) => prevState + angle * (Math.cos(orientation) > 0 ? -1 : 1));
    }

    // Forward
    if (forward && !backward && !left && !right && Math.cos(orientation) != -1) {
      setOrientation((prevState) => prevState + angle * (Math.sin(orientation) > 0 ? 1 : -1));
    }

    // Backward
    if (!forward && backward && !left && !right && Math.cos(orientation) != 1) {
      setOrientation((prevState) => prevState + angle * (Math.sin(orientation) > 0 ? -1 : 1));
    }
  }

  useFrame((state, delta) => {
    if (movement.forward || movement.backward || movement.left || movement.right || !movementY.onGround || characterBody.current.linvel().y < -30) {
      actions.Animation.play();

      /**
       * Model orientation
       */
      calculateOrientation(movement);
      rotateQuaternion.setFromEuler(new THREE.Euler(0, orientation, 0));
      characterBody.current.setRotation(rotateQuaternion);

      /**
       * Model Movement
       */
      movementY.velocityY += movementY.gravity
      movementY.positionOffsetY -= movementY.velocityY
      if (movementY.positionOffsetY < 0) {
        movementY.positionOffsetY = 0
        movementY.velocityY = 0.0
        movementY.onGround = true
      }

      // if character falls off, respawn
      let respawn = false;
      if (characterBody.current.linvel().y < -20) respawn = true

      const linvelY = characterBody.current.linvel().y;

      const speed = movement.sprint ? sprintVelocity : velocity;
      const nbOfKeysPressed = Object.values(movement).reduce((count, value) => count + value, 0);
      const normalizedSpeed = nbOfKeysPressed == 1 ? speed * delta : Math.sqrt(2) * (speed / 2) * delta;

      const impulse = {
        x: movement.left ? -normalizedSpeed : movement.right ? normalizedSpeed : 0,
        y: linvelY + (movementY.positionOffsetY / 100),
        z: movement.forward ? -normalizedSpeed : movement.backward ? normalizedSpeed : 0
      };
      characterBody.current.setLinvel(impulse);

      /**
       * Camera orientation
       */
      // const characterPosition = characterBody.current.translation();
      //
      // const cameraPosition = new THREE.Vector3();
      // cameraPosition.copy(characterPosition);
      // cameraPosition.z += 5;
      // cameraPosition.y += 2.5;
      //
      // const cameraTarget = new THREE.Vector3();
      // cameraTarget.copy(characterPosition);
      // cameraTarget.y += 0.25;
      //
      // state.camera.position.copy(cameraPosition);
      // state.camera.lookAt(cameraTarget);
    } else {
      actions.Animation.fadeOut(0.2);
      actions.Animation.reset().fadeIn(0.2).play();
    }

    if (characterBody.current.translation().y < -20) {
      characterBody.current.setTranslation({x: -2.0, y: 1.0, z: 2.2})
    }
  })

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("keyup", handleKeyUp);
    };
  });

  return (
    <RigidBody
      lockRotations={true}
      ref={characterBody}
      colliders={false}
      position={[-2, 1, 2.2]}
      restitution={0.2}
      friction={1}
    >
      <group ref={character}>
        <Bmo/>
      </group>
      <CapsuleCollider args={[0.8, 0.4]} position={[0, 1.2, 0]}/>
    </RigidBody>
  )
};

export default CharacterController;