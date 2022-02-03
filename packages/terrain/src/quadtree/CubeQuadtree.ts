import { Matrix4, Vector3 } from "three";
import QuadTree from "./Quadtree";

export interface CubeQuadTreeParams {
  radius: number;
  minNodeSize: number;
}
export interface Side {
  transform: Matrix4;
  worldToLocal: Matrix4;
  quadtree: QuadTree;
}
export default class CubeQuadTree {
  private _sides: Side[] = [];
  constructor(private params: CubeQuadTreeParams) {
    this._sides = [];
    const r = params.radius;
    let m;

    const transforms = [];

    // +Y
    m = new Matrix4();
    m.makeRotationX(-Math.PI / 2);
    m.premultiply(new Matrix4().makeTranslation(0, r, 0));
    transforms.push(m);

    // -Y
    m = new Matrix4();
    m.makeRotationX(Math.PI / 2);
    m.premultiply(new Matrix4().makeTranslation(0, -r, 0));
    transforms.push(m);

    // +X
    m = new Matrix4();
    m.makeRotationY(Math.PI / 2);
    m.premultiply(new Matrix4().makeTranslation(r, 0, 0));
    transforms.push(m);

    // -X
    m = new Matrix4();
    m.makeRotationY(-Math.PI / 2);
    m.premultiply(new Matrix4().makeTranslation(-r, 0, 0));
    transforms.push(m);

    // +Z
    m = new Matrix4();
    m.premultiply(new Matrix4().makeTranslation(0, 0, r));
    transforms.push(m);

    // -Z
    m = new Matrix4();
    m.makeRotationY(Math.PI);
    m.premultiply(new Matrix4().makeTranslation(0, 0, -r));
    transforms.push(m);

    for (let t of transforms) {
      this._sides.push({
        transform: t.clone(),
        worldToLocal: t.clone().invert(),
        quadtree: new QuadTree({
          size: r,
          minNodeSize: params.minNodeSize,
          localToWorld: t,
        }),
      });
    }
  }

  get children() {
    const children = [];

    for (let s of this._sides) {
      const side = {
        transform: s.transform,
        children: s.quadtree.children,
      };
      children.push(side);
    }
    return children;
  }

  insert(pos: Vector3) {
    for (let s of this._sides) {
      s.quadtree.insert(pos);
    }
  }
}
