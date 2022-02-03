import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import "./App.css";
import Lights from "./components/lights/Lights";
import TerrainChunksCube from "./components/terrain/TerrainChunksCube";
function App() {
  const cameraDistance = 2000;
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
          far: 10_000_000,
        }}
      >
        <TerrainChunksCube />
        <Lights />
        {/* <Sky /> */}
        <OrbitControls />
      </Canvas>
    </>
  );
}

export default App;
