import { useControls } from "leva";
import React, { useMemo } from "react";
import { Color, Group, Vector3 } from "three";
import HyposemetricTints from "../../color-generators/HyposemetricTints";
import { HeightGenerator } from "../../height-generators";
import Noise, { NoiseParams, NOISE_STYLES } from "../../noise/Noise";
import CubeQuadTree from "../../quadtree/CubeQuadtree";
import { TerrainChunkCube, TerrainChunkCubeProps } from "./TerrainChunkCube";

// Equivalent to TerrainChunkManager on SDY
export const TerrainChunksCube: React.FC = () => {
  const [chunkMap] = React.useState(
    new Map<string, { chunk: TerrainChunkCubeProps; edges: string[] }>()
  );
  const rootGroupRef = React.useRef<Group>(null);
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
    addImage: false,
    height: {
      min: 0,
      max: 128,
      value: 16,
      step: 1,
    },
  });

  const planet = useControls("planet", {
    planetRadius: {
      min: -10_000_000,
      max: 10_000_000,
      value: 500,
      step: 10,
    },
    minCellSize: {
      min: 0,
      max: 10_000_000,
      value: 500,
      step: 10,
    },
    minCellResolution: {
      min: 0,
      max: 10_000_000,
      value: 128,
      step: 10,
    },
  });

  const terrain = useControls("terrain", {
    scale: {
      min: 0,
      value: 1000,
      step: 1,
    },
    width: {
      min: 0,
      value: 1000,
      step: 1,
    },
    chunkSize: {
      min: 0,
      max: 1000,
      value: 500,
      step: 1,
    },
    wireframe: false,
    visible: true,
    subdivisions: {
      min: 0,
      value: 128,
      step: 1,
    },
  });

  const noise = useMemo(
    () => new Noise(noiseParams as NoiseParams),
    [noiseParams]
  );

  const biomeParams = useControls("biome", {
    octaves: 10,
    persistence: 0.5,
    lacunarity: 2.0,
    exponentiation: 3.9,
    height: 64,
    scale: 256.0,
    noiseType: NOISE_STYLES.simplex,
    seed: 1,
    snow: "#fff",
    deepOcean: "#fff",
    shallowOcean: "#fff",
    forestBoreal: "#fff",
    seaLevel: 0.5,
  });

  const biomes = useMemo(
    () => new Noise(biomeParams as NoiseParams),
    [noiseParams]
  );

  const colourGenerator = useMemo(
    () =>
      new HyposemetricTints({
        biomeGenerator: biomes,
        snow: new Color(biomeParams.snow),
        deepOcean: new Color(biomeParams.deepOcean),
        shallowOcean: new Color(biomeParams.shallowOcean),
        forestBoreal: new Color(biomeParams.forestBoreal),
        seaLevel: biomeParams.seaLevel,
      }),
    [biomes, biomeParams]
  );

  const heightGenerators = useMemo(() => {
    return [new HeightGenerator(noise, new Vector3(), 100000, 100000 + 1)];
  }, [noise]);

  const cellIndex = (p: Vector3) => {
    const xp = p.x + planet.minCellSize * 0.5;
    const yp = p.z + planet.minCellSize * 0.5;
    const x = Math.floor(xp / planet.minCellSize);
    const z = Math.floor(yp / planet.minCellSize);
    return [x, z];
  };

  React.useEffect(() => {
    if (!rootGroupRef.current) {
      return;
    }
    console.log("hi", rootGroupRef.current);
    const nodes = [];
    const q = new CubeQuadTree({
      radius: planet.planetRadius,
      minNodeSize: planet.minCellSize,
    });
    // q.Insert(this._params.camera.position);

    const sides = q.children;

    console.log({ sides });

    const center = new Vector3();
    const dimensions = new Vector3();
    for (let i = 0; i < sides.length; i++) {
      const group = rootGroupRef.current.children[i];
      console.log({ group });
      group.matrix = sides[i].transform;
      group.matrixAutoUpdate = false;
      for (let c of sides[i].children) {
        c.bounds.getCenter(center);
        c.bounds.getSize(dimensions);

        const child = {
          index: i,
          group,
          position: [center.x, center.y, center.z],
          bounds: c.bounds,
          size: dimensions.x,
        };
        nodes.push(child);

        // const k = _Key(child);
        // newTerrainChunks[k] = child;

        // const [xp, yp, zp] = difference[k].position;

        // const offset = new THREE.Vector3(xp, yp, zp);
      }
    }
  }, [rootGroupRef.current]);

  return (
    <group ref={rootGroupRef}>
      {[...new Array(6)].fill(0).map((val, index) => {
        console.log("hello", index);
        return (
          <group key={`group.${index}`}>
            <TerrainChunkCube
              {...{
                offset: new Vector3(),
                name: `mainChunk.${index}`,
                width: terrain.width,
                scale: terrain.scale,
                radius: planet.planetRadius,
                visible: terrain.visible,
                subdivisions: terrain.subdivisions,
                wireframe: terrain.wireframe,
                resolution: planet.minCellResolution,
                colourGenerator,
                heightGenerators,
              }}
            />
          </group>
        );
      })}
    </group>
  );
};

export default TerrainChunksCube;
