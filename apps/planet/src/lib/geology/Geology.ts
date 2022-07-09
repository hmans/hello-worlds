import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronBufferGeometry,
  Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { EARTH_RADIUS } from "../../components/planet/PlanetConfigurator";
import { choose } from "../language/utils";
import Noise from "../noise/Noise";
import { DEFAULT_NOISE_PARAMS } from "../planet/PlanetEngine";
import { EdgeHelper, randomUnitVector } from "./helpers";
import { Queue } from "./Queue";
import TectonicPlate from "./TectonicPlate";
import Tile from "./Tile";

export interface GeologyProps {
  seed?: string | number;
  tectonicPlateCount?: number;
  subdivisions?: number;
  radius: number;
}

export type TileMap = Record<string, Tile>;

const placeholderVector = new Vector3();
export const getClosestTile = (v: THREE.Vector3, tileMap: TileMap) => {
  let smallestDistance: number | undefined = undefined;
  let smallestDistanceKey = "";
  for (let key in tileMap) {
    const [x, y, z] = key.split(".");
    const tileMapVector = placeholderVector.set(
      Number(x),
      Number(y),
      Number(z)
    );
    const dist = v.distanceTo(tileMapVector);
    if (smallestDistance === undefined) {
      smallestDistance = dist;
      smallestDistanceKey = key;
    } else if (dist < smallestDistance) {
      smallestDistance = dist;
      smallestDistanceKey = key;
    }
  }
  return {
    tile: tileMap[smallestDistanceKey],
    dist: smallestDistance,
  };
};

const DEFAULT_SUBDIVISIONS = 20;

export default class Geology {
  public mesh: Mesh;
  public geometry: BufferGeometry;
  public material: Material;
  public tileMap: TileMap;
  public edgeHelper: EdgeHelper;
  public plates: TectonicPlate[] = [];
  public oceanicRate = 0.75;
  constructor(public props: GeologyProps) {
    const { radius, subdivisions = DEFAULT_SUBDIVISIONS } = props;
    this.geometry = new IcosahedronBufferGeometry(radius, subdivisions);
    this.material = new MeshBasicMaterial({
      // wireframe: true,
      // wireframeLinewidth: 5,
      color: 0xffffff,
      side: DoubleSide,
      vertexColors: true,
    });
    this.edgeHelper = new EdgeHelper(this.geometry);
    this.mesh = new Mesh(this.geometry, this.material);
    this.tileMap = {};
    this.rebuild(props);
  }

  rebuild(props: GeologyProps) {
    const { radius, subdivisions = DEFAULT_SUBDIVISIONS } = props;
    this.geometry = new IcosahedronBufferGeometry(radius, subdivisions);
    this.mesh.geometry = this.geometry;
    this.edgeHelper = new EdgeHelper(this.geometry);
    this.makeTileMap();
    this.randomFloodFill();
    const noise = new Noise({
      ...DEFAULT_NOISE_PARAMS,
      scale: (EARTH_RADIUS / 4) * 2,
      height: 1,
    });
    const points = this.geometry.getAttribute("position").array;
    const oceanColor = new Color().setRGB(66 / 255, 135 / 255, 245 / 255);
    const groundColor = new Color().setRGB(54 / 255, 247 / 255, 54 / 255);
    const colors = new Float32Array(points.length);
    for (let edgeIndex in this.edgeHelper.edges) {
      const edge = this.edgeHelper.edges[edgeIndex];
      const { x, y, z } = edge.vertex;
      const tile = this.tileMap[JSON.stringify(edge.vertex)];
      const noiseAtPoint = noise.get(x, y, z);
      const isOcean = noiseAtPoint >= 0.05;
      let vertexColor;
      if (tile.data.plate) {
        vertexColor = tile.data.plate.color;
      } else {
        vertexColor = isOcean ? oceanColor : groundColor;
      }

      vertexColor.toArray(colors, Number(edgeIndex) * 3);
    }
    this.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  }

  makeTileMap() {
    // make neighbors
    this.tileMap = {};
    Object.keys(this.edgeHelper.edgeMap).forEach((key) => {
      const { edge, neighbors } = this.edgeHelper.edgeMap[key];
      let tile = this.tileMap[key];
      if (!tile) {
        tile = new Tile(edge);
      }
      tile.neighbors = neighbors.map((edge) => {
        const key = JSON.stringify(edge.face.edge.next.vertex);
        const tile = this.tileMap[key];
        if (!tile) {
          const newTile = new Tile(edge.face.edge.next);
          this.tileMap[key] = newTile;
          return newTile;
        }
        return tile;
      });
      this.tileMap[key] = tile;
    });
  }

  randomFloodFill(
    numberFronts = MathUtils.clamp(
      MathUtils.randInt(15, 20),
      1,
      Object.keys(this.tileMap).length
    )
  ) {
    this.plates = [];
    const tiles = Object.values(this.tileMap);
    const queues = Array(numberFronts)
      .fill(0)
      .map(() => new Queue<Tile>());

    console.log(
      "filling",
      tiles.filter((tile) => !tile.neighbors.length)
    );

    // prime the queues with starter nodes
    for (let i = 0; i < queues.length; i++) {
      let startingNode: Tile | null = null;
      // choose a starting node that does not have a plate yet
      // and is not also adjacent to another plate
      while (!startingNode) {
        startingNode = choose<Tile[]>(tiles);
        if (
          startingNode.data.plate ||
          startingNode.neighbors.reduce(
            (memo, entry) => memo && entry.data.plate,
            true
          )
        ) {
          startingNode = null;
        }
      }

      const oceanic = Math.random() < this.oceanicRate;
      const plate = new TectonicPlate({
        color: new Color(Math.random() * 0xffffff),
        name: `plate-blah`,
        root: startingNode.halfEdge,
        driftAxis: randomUnitVector(),
        driftRate: MathUtils.randFloat(-Math.PI / 30, Math.PI / 30),
        spinRate: MathUtils.randFloat(-Math.PI / 30, Math.PI / 30),
        elevation: oceanic
          ? MathUtils.randFloat(-0.8, -0.3)
          : MathUtils.randFloat(0.1, 0.5),
        oceanic,
      });

      this.plates.push(plate);
      const queue = queues[i];
      queue.enqueue(startingNode);
    }
    while (queues.reduce((memo, q) => memo || !q.isEmpty, false)) {
      for (let i = 0; i < queues.length; i++) {
        const queue = queues[i];
        const tile = queue.dequeue();
        const plate = this.plates[i];
        if (tile && !tile.data.plate) {
          tile.data.plate = plate;
          tile.neighbors.forEach((node) => queue.enqueue(node));
        }
      }
    }
  }
}
