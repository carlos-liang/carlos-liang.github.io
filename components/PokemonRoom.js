import React from 'react'
import { useLoader} from "@react-three/fiber";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RigidBody } from "@react-three/rapier";

export function PokemonRoom(props) {
  const {nodes, materials} = useLoader(GLTFLoader, 'pokemon_fire_red_players_room/scene.gltf')

  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.base_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <RigidBody type="fixed">
        <mesh geometry={nodes.tiles_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.chair_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.table_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.Computer_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.TV_stand_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.TV_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <RigidBody type="fixed">
        <mesh geometry={nodes.carpet_A_fireRed_material_0.geometry} material={materials.fireRed_material}/>
        <mesh geometry={nodes.carpet_B_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh geometry={nodes.bed_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.dresser_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <RigidBody type="fixed">
        <mesh geometry={nodes.bookShelf_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.NES_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <RigidBody type="fixed">
        <mesh geometry={nodes.railing_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.stairs_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <mesh geometry={nodes.wall_picture_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      <RigidBody type="fixed">
      <mesh geometry={nodes.ambient_occlusion_fireRed_material_0.geometry} material={materials.fireRed_material}/>
      </RigidBody>
      <mesh geometry={nodes.title_fireRed_material_0.geometry} material={materials.fireRed_material}/>
    </group>
  )
}