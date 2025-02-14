import { Vector3 } from "three";
import { BuildChunkInitialParams, BuildChunkParams } from "./types";

export function buildChunk<T, I>(initialParams: BuildChunkInitialParams<T>) {
  const colorInputVector = new Vector3();
  const _D = new Vector3();
  const _D1 = new Vector3();
  const _D2 = new Vector3();
  const _P = new Vector3();
  const _H = new Vector3();
  const _W = new Vector3();

  const _N = new Vector3();
  const _N1 = new Vector3();
  const _N2 = new Vector3();
  const _N3 = new Vector3();
  const { heightGenerator, colorGenerator } = initialParams;
  return function runBuildChunk(params: BuildChunkParams<T>) {
    const positions = [];
    const colors = [];
    const normals = [];
    const tangents = [];
    const uvs = [];
    const indices: number[] = [];

    const localToWorld = params.worldMatrix;
    const resolution = params.resolution;
    const radius = params.radius;
    const offset = params.offset;
    const width = params.width;
    const half = width / 2;

    for (let x = 0; x < resolution + 1; x++) {
      const xp = (width * x) / resolution;
      for (let y = 0; y < resolution + 1; y++) {
        const yp = (width * y) / resolution;

        // Compute position
        _P.set(xp - half, yp - half, radius);
        _P.add(offset);
        _P.normalize();
        _D.copy(_P);
        _P.multiplyScalar(radius);
        _P.z -= radius;

        // Compute a world space position to sample noise
        _W.copy(_P);
        _W.applyMatrix4(localToWorld);

        const heightInput = _W.clone();
        const height = heightGenerator({
          input: heightInput,
          worldPosition: heightInput,
          data: params.data,
          radius,
          offset,
          width,
          worldMatrix: params.worldMatrix,
          resolution,
        });
        const color = colorGenerator({
          input: colorInputVector.set(_W.x, _W.y, height).clone(),
          worldPosition: _W.clone(),
          data: {
            ...params.data,
            height,
          },
          radius,
          offset,
          width,
          worldMatrix: params.worldMatrix,
          resolution,
        });

        // Purturb height along z-vector
        _H.copy(_D);
        _H.multiplyScalar(height * (params.invert ? -1 : 1));
        _P.add(_H);

        positions.push(_P.x, _P.y, _P.z);
        // localPosition.normalize();

        // colors.push(color.r, color.g, color.b);
        //@ts-ignore
        // const color = this.#colorGenerator.getTemperature(_W, height);
        colors.push(color.r, color.g, color.b);
        // _P.normalize();
        // colors.push(_W.x, _W.y, _W.z);
        normals.push(_D.x, _D.y, _D.z);
        tangents.push(1, 0, 0, 1);
        uvs.push(_P.x / 200.0, _P.y / 200.0);
      }
    }

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        indices.push(
          i * (resolution + 1) + j,
          (i + 1) * (resolution + 1) + j + 1,
          i * (resolution + 1) + j + 1
        );
        indices.push(
          (i + 1) * (resolution + 1) + j,
          (i + 1) * (resolution + 1) + j + 1,
          i * (resolution + 1) + j
        );
      }
    }

    for (let i = 0, n = indices.length; i < n; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;

      _N1.fromArray(positions, i1);
      _N2.fromArray(positions, i2);
      _N3.fromArray(positions, i3);

      _D1.subVectors(_N3, _N2);
      _D2.subVectors(_N1, _N2);
      _D1.cross(_D2);

      normals[i1] += _D1.x;
      normals[i2] += _D1.x;
      normals[i3] += _D1.x;

      normals[i1 + 1] += _D1.y;
      normals[i2 + 1] += _D1.y;
      normals[i3 + 1] += _D1.y;

      normals[i1 + 2] += _D1.z;
      normals[i2 + 2] += _D1.z;
      normals[i3 + 2] += _D1.z;
    }

    for (let i = 0, n = normals.length; i < n; i += 3) {
      _N.fromArray(normals, i);
      _N.normalize();
      normals[i] = _N.x;
      normals[i + 1] = _N.y;
      normals[i + 2] = _N.z;
    }

    function _Unindex(src: number[], stride: number) {
      const dst = [];
      for (let i = 0, n = indices.length; i < n; i += 3) {
        const i1 = indices[i] * stride;
        const i2 = indices[i + 1] * stride;
        const i3 = indices[i + 2] * stride;

        for (let j = 0; j < stride; j++) {
          dst.push(src[i1 + j]);
        }
        for (let j = 0; j < stride; j++) {
          dst.push(src[i2 + j]);
        }
        for (let j = 0; j < stride; j++) {
          dst.push(src[i3 + j]);
        }
      }
      return dst;
    }

    const uiPositions = _Unindex(positions, 3);
    const uiColours = _Unindex(colors, 3);
    const uiNormals = _Unindex(normals, 3);
    const uiTangents = _Unindex(tangents, 4);
    const uiUVs = _Unindex(uvs, 2);

    const bytesInFloat32 = 4;
    const positionsArray = new Float32Array(
      new SharedArrayBuffer(bytesInFloat32 * uiPositions.length)
    );
    const coloursArray = new Float32Array(
      new SharedArrayBuffer(bytesInFloat32 * uiColours.length)
    );
    const normalsArray = new Float32Array(
      new SharedArrayBuffer(bytesInFloat32 * uiNormals.length)
    );
    const tangentsArray = new Float32Array(
      new SharedArrayBuffer(bytesInFloat32 * uiTangents.length)
    );
    const uvsArray = new Float32Array(
      new SharedArrayBuffer(bytesInFloat32 * uiUVs.length)
    );

    positionsArray.set(uiPositions, 0);
    coloursArray.set(uiColours, 0);
    normalsArray.set(uiNormals, 0);
    uvsArray.set(uiUVs, 0);

    return {
      positions: positionsArray,
      colours: coloursArray,
      uvs: uvsArray,
      normals: normalsArray,
      tangents: tangentsArray,
    };
  };
}
