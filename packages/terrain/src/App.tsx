import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Vector3 } from "three";
import "./App.css";
import Lights from "./components/lights/Lights";
import TerrainChunksCube from "./components/terrain/TerrainChunksCube";

function App() {
  const cameraDistance = 2_000;
  const maxCameraViewDistance = 10_000_000;
  return (
    <>
      <Leva collapsed />
      <Canvas
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
        }}
        camera={{
          position: [cameraDistance, cameraDistance, cameraDistance],
          far: maxCameraViewDistance,
        }}
      >
        <TerrainChunksCube />
        <Lights />
        <group scale={new Vector3(100, 100, 100)}>
          <Stars />
        </group>
        <OrbitControls />
      </Canvas>
    </>
  );
}

export default App;
