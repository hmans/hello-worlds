import SimplexNoise from "simplex-noise";
import { RandomFn } from "simplex-noise/dist/cjs/simplex-noise";
import { Generator } from "../heightgenerators";

export enum NOISE_STYLES {
  simplex = "simplex",
}

export interface NoiseParams {
  seed: RandomFn | string | number;
  scale: number;
  height: number;
  noiseType: NOISE_STYLES.simplex;
  octaves: number;
  persistence: number;
  lacunarity: number;
  exponentiation: number;
}

export default class Noise implements Generator {
  private noise: {
    simplex: SimplexNoise;
  };

  constructor(private params: NoiseParams) {
    this.params = params;
    this.noise = {
      simplex: new SimplexNoise(params.seed),
      // support more noise types?
      // ...perlin
    };
  }

  get(x: number, y: number) {
    const xs = x / this.params.scale;
    const ys = y / this.params.scale;
    const noiseFunc = this.noise[this.params.noiseType];
    let amplitude = 1.0;
    let frequency = 1.0;
    let normalization = 0;
    let total = 0;
    for (let o = 0; o < this.params.octaves; o++) {
      const noiseValue =
        noiseFunc.noise2D(xs * frequency, ys * frequency) * 0.5 + 0.5;
      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= this.params.persistence;
      frequency *= this.params.lacunarity;
    }
    total /= normalization;
    return Math.pow(total, this.params.exponentiation) * this.params.height;
  }
}
