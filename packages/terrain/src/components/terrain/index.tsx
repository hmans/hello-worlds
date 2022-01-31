import { useControls } from "leva";
import React, { useMemo } from "react";
import { Euler, Vector2, Vector3 } from "three";
import { HeightGenerator } from "../../heightgenerators";
import Noise, { NoiseParams, NOISE_STYLES } from "../../noise/Noise";
import { TerrainChunk, TerrainChunkProps } from "./TerrainChunk";

export const TerrainChunks: React.FC = () => {
  const [chunkMap] = React.useState(
    new Map<string, { chunk: TerrainChunkProps; edges: string[] }>()
  );
  const chunkSize = 1;
  // const [update, setUpdate] = React.useState(generateUUID());
  const noiseParams = useControls("noise", {
    octaves: 10,
    persistence: 0.5,
    lacunarity: 2.0,
    exponentiation: 3.9,
    height: 64,
    scale: 256.0,
    noiseType: NOISE_STYLES.simplex,
    seed: 1,
  });

  const heightmapParams = useControls("heightmap", {
    height: {
      min: 0,
      max: 128,
      value: 16,
      step: 1,
    },
  });

  const terrain = useControls("terrain", {
    scale: {
      min: 0,
      max: 100000,
      value: 256,
      step: 1,
    },
    wireframe: false,
  });

  const noise = useMemo(
    () => new Noise(noiseParams as NoiseParams),
    [noiseParams]
  );

  const makeChunkKey = (x: number, z: number) => `${x}.${z}`;

  // Create chunks on init
  const chunks = useMemo(() => {
    const chunkProps: TerrainChunkProps[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const offset = new Vector2(x * chunkSize, z * chunkSize);
        const key = makeChunkKey(x, z);
        const edges = [];
        for (let xi = -1; xi <= 1; xi++) {
          for (let zi = -1; zi <= 1; zi++) {
            if (xi == 0 || zi == 0) {
              continue;
            }
            edges.push(makeChunkKey(x + xi, z + zi));
          }
        }
        const chunk = {
          key,
          offset: new Vector3(offset.x, offset.y, 0),
          scale: terrain.scale,
          width: chunkSize,
          heightGenerators: [
            new HeightGenerator(noise, offset, 100000, 100000 + 1),
          ],
        };
        chunkProps.push(chunk);
        chunkMap.set(key, {
          chunk,
          edges,
        });
      }
    }
    return chunkProps;
  }, [heightmapParams, noiseParams]);

  return (
    <group rotation={new Euler(-Math.PI / 2, 0, 0)}>
      {chunks.map((props) => (
        <TerrainChunk
          {...{ ...props }}
          wireframe={terrain.wireframe}
          scale={terrain.scale}
        />
      ))}
    </group>
  );
};

export default TerrainChunks;
