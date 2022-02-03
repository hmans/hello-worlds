import { Box3, Matrix4, Vector3 } from "three";

export interface QuadtreeParams {
  size: number;
  minNodeSize: number;
  localToWorld: Matrix4;
}
export interface Node {
  bounds: Box3;
  children: Node[];
  center: Vector3;
  sphereCenter: Vector3;
  size: Vector3;
  root: boolean;
}
export default class QuadTree {
  private root: Node;
  constructor(private params: QuadtreeParams) {
    const s = params.size;
    const b = new Box3(new Vector3(-s, -s, 0), new Vector3(s, s, 0));
    this.root = {
      bounds: b,
      children: [],
      center: b.getCenter(new Vector3()),
      sphereCenter: b.getCenter(new Vector3()),
      size: b.getSize(new Vector3()),
      root: true,
    };
    this.root.sphereCenter = this.root.center.clone();
    this.root.sphereCenter.applyMatrix4(this.params.localToWorld);
    this.root.sphereCenter.normalize();
    this.root.sphereCenter.multiplyScalar(this.params.size);
  }

  get children() {
    const children: Node[] = [];
    this.getChildren(this.root, children);
    return children;
  }

  private getChildren(node: Node, target: Node[]) {
    if (node.children.length == 0) {
      target.push(node);
      return;
    }

    for (let c of node.children) {
      this.getChildren(c, target);
    }
  }

  insert(pos: Vector3) {
    this._insert(this.root, pos);
  }

  private _insert(child: Node, pos: Vector3) {
    const distToChild = this._distanceToChild(child, pos);

    if (
      distToChild < child.size.x * 1.25 &&
      child.size.x > this.params.minNodeSize
    ) {
      child.children = this._createChildren(child);

      for (let c of child.children) {
        this._insert(c, pos);
      }
    }
  }

  private _distanceToChild(child: Node, pos: Vector3) {
    return child.sphereCenter.distanceTo(pos);
  }

  private _createChildren(child: Node) {
    const midpoint = child.bounds.getCenter(new Vector3());

    // Bottom left
    const b1 = new Box3(child.bounds.min, midpoint);

    // Bottom right
    const b2 = new Box3(
      new Vector3(midpoint.x, child.bounds.min.y, 0),
      new Vector3(child.bounds.max.x, midpoint.y, 0)
    );

    // Top left
    const b3 = new Box3(
      new Vector3(child.bounds.min.x, midpoint.y, 0),
      new Vector3(midpoint.x, child.bounds.max.y, 0)
    );

    // Top right
    const b4 = new Box3(midpoint, child.bounds.max);

    const children: Node[] = [b1, b2, b3, b4].map((b) => {
      const center = b.getCenter(new Vector3());
      const sphereCenter = center.clone();
      sphereCenter.applyMatrix4(this.params.localToWorld);
      sphereCenter.normalize();
      sphereCenter.multiplyScalar(this.params.size);
      return {
        bounds: b,
        children: [],
        center,
        size: b.getSize(new Vector3()),
        sphereCenter,
        root: false,
      };
    });

    return children;
  }
}
