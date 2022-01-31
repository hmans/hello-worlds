import * as React from "react";
import { FrontSide, PlaneGeometry, Vector3 } from "three";
import { IHeightGenerator } from "../../heightgenerators";

// function genHeightfieldGeometry(
//   nrows: number,
//   ncols: number,
//   heights: number[],
//   scale: Vector3
// ) {
//   let vertices = new Array();
//   let indices = new Array();
//   let eltWX = 1.0 / nrows;
//   let eltWY = 1.0 / ncols;

//   let i, j;
//   for (j = 0; j <= ncols; ++j) {
//     for (i = 0; i <= nrows; ++i) {
//       let x = (j * eltWX - 0.5) * scale.x;
//       let y = heights[j * (nrows + 1) + i] * scale.y;
//       let z = (i * eltWY - 0.5) * scale.z;
//       vertices.push(x, y, z);
//     }
//   }

//   for (j = 0; j < ncols; ++j) {
//     for (i = 0; i < nrows; ++i) {
//       let i1 = (i + 0) * (ncols + 1) + (j + 0);
//       let i2 = (i + 0) * (ncols + 1) + (j + 1);
//       let i3 = (i + 1) * (ncols + 1) + (j + 0);
//       let i4 = (i + 1) * (ncols + 1) + (j + 1);

//       indices.push(i1, i3, i2);
//       indices.push(i3, i4, i2);
//     }
//   }

//   return {
//     vertices: new Float32Array(vertices),
//     indices: new Uint32Array(indices),
//   };
// }

// export const TerrainMaterial: React.FC<{ repeat?: number }> = ({ repeat }) => {
//   const matRef = React.useRef<MeshStandardMaterial>(null);
//   const [colorMap] = useLoader(TextureLoader, [grass]);
//   const [texture, setTexture] = React.useState<Texture | null>(null);

//   React.useEffect(() => {
//     if (texture && matRef.current) {
//       matRef.current.needsUpdate = true;
//     }
//   }, [texture, matRef]);

//   React.useEffect(() => {
//     if (colorMap && matRef.current) {
//       const newTexture = colorMap;
//       if (repeat) {
//         newTexture.repeat.set(repeat, repeat);
//       }
//       newTexture.magFilter = NearestFilter;
//       newTexture.wrapS = RepeatWrapping;
//       newTexture.wrapT = RepeatWrapping;
//       matRef.current.needsUpdate = true;
//       setTexture(newTexture);
//     }
//   }, [colorMap, matRef]);

//   return <meshStandardMaterial ref={matRef} side={DoubleSide} map={texture} />;
// };

// export const HeightfieldGeometryFromMatrix: React.FC<{
//   nrows: number;
//   ncols: number;
//   scale: Vector3;
//   heights: number[];
// }> = ({ nrows, ncols, scale, heights }) => {
//   const geoRef = React.useRef<BufferGeometry>(null);

//   React.useEffect(() => {
//     if (!geoRef.current) {
//       return;
//     }
//     // should update this on change to component?
//     let geometry = geoRef.current;
//     let vertices;
//     let indices;

//     let g = genHeightfieldGeometry(nrows, ncols, heights, scale);
//     vertices = g.vertices;
//     indices = g.indices;

//     const planeGeo = new PlaneGeometry(nrows, ncols, nrows, ncols);
//     const uv = planeGeo.getAttribute("uv");

//     geometry.setIndex(Array.from(indices));
//     geometry.setAttribute("position", new BufferAttribute(vertices, 3));
//     geometry.setAttribute("uv", uv);
//     geometry.computeVertexNormals();
//   }, [geoRef.current]);

//   return <bufferGeometry ref={geoRef} />;
// };

export interface TerrainChunkProps {
  width: number;
  scale: number;
  subdivisions?: number;
  offset: Vector3;
  heightGenerators: IHeightGenerator[];
  wireframe?: boolean;
}

export const TerrainChunk: React.FC<TerrainChunkProps> = ({
  width,
  scale,
  subdivisions = 128,
  children,
  offset,
  heightGenerators,
  wireframe = false,
}) => {
  const planeRef = React.useRef<PlaneGeometry>(null);
  const size = new Vector3(width * scale, 0, width * scale);

  React.useEffect(() => {
    if (!planeRef.current) {
      return;
    }

    const plane = planeRef.current;
    const vertices = plane.getAttribute("position");
    for (let index = 0; index <= vertices.count; index++) {
      const heightPairs = [];
      let normalization = 0;

      vertices.setZ(index, 0);
      const x = vertices.getX(index);
      const y = vertices.getY(index);

      for (let gen of heightGenerators) {
        heightPairs.push(gen.get(x + offset.x, y + offset.y));
        normalization += heightPairs[heightPairs.length - 1][1];
      }

      if (normalization > 0) {
        for (let h of heightPairs) {
          vertices.setZ(
            index,
            vertices.getZ(index) + (h[0] * h[1]) / normalization
          );
        }
      }
    }

    // DEMO
    // if (heightGenerators.length > 1 && offset.x == 0 && offset.y == 0) {
    //   const gen = heightGenerators[0];
    //   const maxHeight = 16.0;
    //   const GREEN = new Color(0x46b00c);

    //   for (let f of plane.faces) {
    //     const vs = [
    //         this._plane.geometry.vertices[f.a],
    //         this._plane.geometry.vertices[f.b],
    //         this._plane.geometry.vertices[f.c]
    //     ];

    //     const vertexColours = [];
    //     for (let v of vs) {
    //       const [h, _] = gen.get(v.x + offset.x, v.y + offset.y);
    //       const a = sat(h / maxHeight);
    //       const vc = new Color(0xFFFFFF);
    //       vc.lerp(GREEN, a);

    //       vertexColours.push(vc);
    //     }
    //     f.vertexColors = vertexColours;
    //   }
    //   this._plane.geometry.elementsNeedUpdate = true;
    // } else {
    // for (let f of plane.faces) {
    //   f.vertexColors = [
    //     new Color(0xffffff),
    //     new Color(0xffffff),
    //     new Color(0xffffff),
    //   ];
    // }

    plane.computeVertexNormals();
  }, [planeRef, width, scale, subdivisions, offset, heightGenerators]);

  return (
    <mesh position={offset} castShadow={false} receiveShadow={true}>
      <planeGeometry
        ref={planeRef}
        args={[size.x, size.z, subdivisions, subdivisions]}
      />
      <meshStandardMaterial
        wireframe={wireframe}
        color={0xfff}
        side={FrontSide}
        // vertexColors
      />
      {children}
    </mesh>
  );
};
