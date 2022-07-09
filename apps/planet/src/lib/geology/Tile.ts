import { HalfEdge } from "./Face";

export default class Tile {
  neighbors: Tile[] = [];
  data: Record<string, any> = {};
  constructor(public halfEdge: HalfEdge) {}
}
