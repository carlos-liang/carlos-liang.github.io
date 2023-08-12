import React from 'react';
import { CuboidCollider, RigidBody } from "@react-three/rapier";

const Room = () => {
  return (
    <RigidBody type="fixed" restitution={0.2} friction={1}>
      <mesh receiveShadow position={[0, 0, 0]}  rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5, 5]} />
        <meshStandardMaterial color={"DarkSlateGrey"} />
      </mesh>
    </RigidBody>
  );
}

export default Room;