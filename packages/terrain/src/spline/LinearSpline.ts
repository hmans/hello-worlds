export type LerpFunc<T = number> = (t: number, p0: T, p1: T) => T;

export default class LinearSpline<T> {
  private _points: [number, T][] = [];
  constructor(private _lerp: LerpFunc<T>) {
    this._points = [];
  }

  addPoint(t: number, d: T) {
    this._points.push([t, d]);
  }

  get(t: number) {
    let p1 = 0;

    for (let i = 0; i < this._points.length; i++) {
      if (this._points[i][0] >= t) {
        break;
      }
      p1 = i;
    }

    const p2 = Math.min(this._points.length - 1, p1 + 1);

    if (p1 == p2) {
      return this._points[p1][1];
    }

    return this._lerp(
      (t - this._points[p1][0]) / (this._points[p2][0] - this._points[p1][0]),
      this._points[p1][1],
      this._points[p2][1]
    );
  }
}
