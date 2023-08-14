import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Bmo(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF('bmo/scene.gltf');

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]} scale={[5, 5, 5]}>
          <group name="root">
            <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group name="BODY_0" position={[0, 0.16, 0]} scale={[1, 0.975, 0.988]}>
                <mesh name="mesh_0" geometry={nodes.mesh_0.geometry} material={materials.BASE_COLOR} morphTargetDictionary={nodes.mesh_0.morphTargetDictionary} morphTargetInfluences={nodes.mesh_0.morphTargetInfluences} />
                <mesh name="mesh_0_1" geometry={nodes.mesh_0_1.geometry} material={materials.OUTLINE} morphTargetDictionary={nodes.mesh_0_1.morphTargetDictionary} morphTargetInfluences={nodes.mesh_0_1.morphTargetInfluences} />
              </group>
              <group name="LEFT_ARM_1" position={[0.062, 0.114, 0]} rotation={[Math.PI / 2, 1.571, 0]}>
                <mesh name="mesh_1" geometry={nodes.mesh_1.geometry} material={materials['Material.001']} morphTargetDictionary={nodes.mesh_1.morphTargetDictionary} morphTargetInfluences={nodes.mesh_1.morphTargetInfluences} />
                <mesh name="mesh_1_1" geometry={nodes.mesh_1_1.geometry} material={materials.OUTLINE} morphTargetDictionary={nodes.mesh_1_1.morphTargetDictionary} morphTargetInfluences={nodes.mesh_1_1.morphTargetInfluences} />
              </group>
              <group name="LEFT_LEG_2" position={[0.032, 0.07, -0.001]} rotation={[Math.PI / 2, 1.571, 0]}>
                <mesh name="mesh_2" geometry={nodes.mesh_2.geometry} material={materials['Material.001']} morphTargetDictionary={nodes.mesh_2.morphTargetDictionary} morphTargetInfluences={nodes.mesh_2.morphTargetInfluences} />
                <mesh name="mesh_2_1" geometry={nodes.mesh_2_1.geometry} material={materials.OUTLINE} morphTargetDictionary={nodes.mesh_2_1.morphTargetDictionary} morphTargetInfluences={nodes.mesh_2_1.morphTargetInfluences} />
              </group>
              <group name="RIGHT_ARM_3" position={[-0.062, 0.114, 0]} rotation={[Math.PI / 2, 1.571, 0]}>
                <mesh name="mesh_3" geometry={nodes.mesh_3.geometry} material={materials['Material.001']} morphTargetDictionary={nodes.mesh_3.morphTargetDictionary} morphTargetInfluences={nodes.mesh_3.morphTargetInfluences} />
                <mesh name="mesh_3_1" geometry={nodes.mesh_3_1.geometry} material={materials.OUTLINE} morphTargetDictionary={nodes.mesh_3_1.morphTargetDictionary} morphTargetInfluences={nodes.mesh_3_1.morphTargetInfluences} />
              </group>
              <group name="RIGHT_LEG_4" position={[-0.032, 0.07, -0.001]} rotation={[Math.PI / 2, 1.571, 0]}>
                <mesh name="mesh_4" geometry={nodes.mesh_4.geometry} material={materials['Material.001']} morphTargetDictionary={nodes.mesh_4.morphTargetDictionary} morphTargetInfluences={nodes.mesh_4.morphTargetInfluences} />
                <mesh name="mesh_4_1" geometry={nodes.mesh_4_1.geometry} material={materials.OUTLINE} morphTargetDictionary={nodes.mesh_4_1.morphTargetDictionary} morphTargetInfluences={nodes.mesh_4_1.morphTargetInfluences} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}