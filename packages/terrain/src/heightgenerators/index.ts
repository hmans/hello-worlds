import { MathUtils, Vector2 } from "three";
import { getImageData } from "../graphics/image";
import { sat } from "../math";

export interface Generator {
  get(x: number, y: number): number;
}

export interface IHeightGenerator {
  get(x: number, y: number): number[];
}

export class HeightGenerator implements IHeightGenerator {
  private position: Vector2;
  private radius: [number, number];
  constructor(
    private generator: Generator,
    position: Vector2,
    minRadius: number,
    maxRadius: number
  ) {
    this.position = position.clone();
    this.radius = [minRadius, maxRadius];
  }

  get(x: number, y: number) {
    const distance = this.position.distanceTo(new Vector2(x, y));
    let normalization =
      1.0 -
      sat((distance - this.radius[0]) / (this.radius[1] - this.radius[0]));
    normalization = normalization * normalization * (3 - 2 * normalization);

    return [this.generator.get(x, y), normalization];
  }
}

export class FlaredCornerHeightGenerator implements IHeightGenerator {
  get(x: number, y: number) {
    if (x == -250 && y == 250) {
      return [128, 1];
    }
    return [0, 1];
  }
}

export class BumpHeightGenerator implements IHeightGenerator {
  get(x: number, y: number) {
    const dist = new Vector2(x, y).distanceTo(new Vector2(0, 0));

    let h = 1.0 - sat(dist / 250.0);
    h = h * h * h * (h * (h * 6 - 15) + 10);
    return [h * 128, 1];
  }
}

export interface HeightmapParams {
  height: number;
  width: number;
  img: HTMLImageElement;
}
export class Heightmap implements Generator {
  private data: ImageData;
  constructor(private params: HeightmapParams) {
    this.data = getImageData(params.img);
  }

  get(x: number, y: number) {
    const _GetPixelAsFloat = (x: number, y: number) => {
      const position = (x + this.data.width * y) * 4;
      const data = this.data.data;
      return data[position] / 255.0;
    };

    // Bilinear filter
    const offset = new Vector2(-250, -250);
    const dimensions = new Vector2(500, 500);

    const xf = 1.0 - sat((x - offset.x) / dimensions.x);
    const yf = sat((y - offset.y) / dimensions.y);
    const w = this.data.width - 1;
    const h = this.data.height - 1;

    const x1 = Math.floor(xf * w);
    const y1 = Math.floor(yf * h);
    const x2 = MathUtils.clamp(x1 + 1, 0, w);
    const y2 = MathUtils.clamp(y1 + 1, 0, h);

    const xp = xf * w - x1;
    const yp = yf * h - y1;

    const p11 = _GetPixelAsFloat(x1, y1);
    const p21 = _GetPixelAsFloat(x2, y1);
    const p12 = _GetPixelAsFloat(x1, y2);
    const p22 = _GetPixelAsFloat(x2, y2);

    const px1 = MathUtils.lerp(xp, p11, p21);
    const px2 = MathUtils.lerp(xp, p12, p22);

    return MathUtils.lerp(yp, px1, px2) * this.params.height;
  }
}
