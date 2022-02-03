import { Color } from "three";
import { Generator3 } from "../height-generators";
import LinearSpline, { LerpFunc } from "../spline/LinearSpline";

export interface HyposemetricTintsParams {
  snow: Color;
  forestBoreal: Color;
  deepOcean: Color;
  shallowOcean: Color;
  seaLevel: number;
  biomeGenerator: Generator3;
}
export default class HyposemetricTints implements Generator3<Color> {
  private _colourSplines: {
    arid: LinearSpline<Color>;
    humid: LinearSpline<Color>;
    ocean: LinearSpline<Color>;
  };
  constructor(private params: HyposemetricTintsParams) {
    const colourLerp: LerpFunc<Color> = (t, p0, p1) => {
      const c = p0.clone();

      return c.lerp(p1, t);
    };
    this._colourSplines = {
      arid: new LinearSpline(colourLerp),
      humid: new LinearSpline(colourLerp),
      ocean: new LinearSpline(colourLerp),
    };

    this._colourSplines.arid.addPoint(0.0, new Color(0xb7a67d));
    this._colourSplines.arid.addPoint(0.5, new Color(0xf1e1bc));
    this._colourSplines.arid.addPoint(1.0, this.params.snow);

    this._colourSplines.humid.addPoint(0.0, this.params.forestBoreal);
    this._colourSplines.humid.addPoint(0.5, new Color(0xcee59c));
    this._colourSplines.humid.addPoint(1.0, this.params.snow);

    this._colourSplines.ocean.addPoint(0, this.params.deepOcean);
    this._colourSplines.ocean.addPoint(0.03, this.params.shallowOcean);
    this._colourSplines.ocean.addPoint(0.05, this.params.shallowOcean);
  }

  get(x: number, y: number, z: number) {
    const m = this.params.biomeGenerator.get(x, y, z);
    const h = z / 100.0;

    if (h < this.params.seaLevel) {
      return this._colourSplines.ocean.get(h);
    }

    const c1 = this._colourSplines.arid.get(h);
    const c2 = this._colourSplines.arid.get(h);

    return c1.lerp(c2, m);
  }
}
