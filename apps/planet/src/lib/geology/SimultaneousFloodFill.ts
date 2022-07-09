import { Queue } from "./Queue";
import Tile from "./Tile";

export const simultaneousFloodFill = (
  tiles: Tile[],
  numberOfSimultaneousPoints: number,
  cb: (node: Tile) => void
) => {
  const q = new Queue<Tile>();
  for (let i = 0; i <= numberOfSimultaneousPoints; i++) {}
};

export const floodFill = (node: Tile, cb: (node: Tile) => void) => {
  const q = new Queue<Tile>();
  q.enqueue(node);
  while (!q.isEmpty) {
    const n = q.dequeue();
    if (n && !n.data.plate) {
      cb(n);
      n.neighbors.forEach((node) => q.enqueue(node));
    }
  }
};
