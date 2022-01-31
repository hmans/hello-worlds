import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import "./App.css";
import Lights from "./components/lights/Lights";
import TerrainChunks from "./components/terrain";

function App() {
  return (
    <>
      <Leva collapsed />
      <Canvas
        gl={{
          antialias: true,
        }}
        camera={{
          position: [120, 120, 120],
        }}
      >
        <TerrainChunks />
        <Lights />
        <OrbitControls />
      </Canvas>
    </>
  );
}

export default App;
