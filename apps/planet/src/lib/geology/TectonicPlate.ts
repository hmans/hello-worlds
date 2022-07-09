import { Color, Vector3 } from "three";
import { HalfEdge } from "./Face";

export interface PlateProps {
  name: string;
  color: Color;
  driftAxis: Vector3;
  driftRate: number;
  spinRate: number;
  elevation: number;
  oceanic: boolean;
  root: HalfEdge;
}

export default class TectonicPlate {
  edges: HalfEdge[] = [];
  boundaryCorners: any[] = [];
  boundaryBorders: any[] = [];
  name: string;
  color: Color;
  driftAxis: Vector3;
  driftRate: number;
  spinRate: number;
  elevation: number;
  oceanic: boolean;
  root: HalfEdge;
  constructor({
    name,
    color,
    driftAxis,
    driftRate,
    spinRate,
    elevation,
    oceanic,
    root,
  }: PlateProps) {
    this.color = color;
    this.driftAxis = driftAxis;
    this.driftRate = driftRate;
    this.spinRate = spinRate;
    this.elevation = elevation;
    this.oceanic = oceanic;
    this.root = root;
    this.name = name;
  }

  calculateMovement(position: Vector3) {
    const movement = this.driftAxis
      .clone()
      .cross(position)
      .setLength(
        this.driftRate *
          position.clone().projectOnVector(this.driftAxis).distanceTo(position)
      );
    movement.add(
      this.root.vertex
        .clone()
        .cross(position)
        .setLength(
          this.spinRate *
            position
              .clone()
              .projectOnVector(this.root.vertex)
              .distanceTo(position)
        )
    );
    return movement;
  }
}
