import { Planet as HelloPlanet } from '@hello-worlds/react/dist/esm/planets/Planets';
import { useThree } from '@react-three/fiber';
import * as React from 'react';
import { Mesh } from 'three';
import FlyCamera from '../cameras/FlyCamera';
import { useTheme } from './Theme';
import { CERES_RADIUS } from './WorldBuilder.math';
import { ECS, Planet, THEMES } from './WorldBuilder.state';
import worker from "./WorldBuilder.worker";

export const PlanetRender = React.forwardRef<Mesh, Planet>(({
  position,
  radius = CERES_RADIUS,
  seed,
  focused,
  name,
  labelColor,
  type
}, ref) => {

  const theme = useTheme();

  const { camera } = useThree();
  const planetProps = React.useMemo(
    () => ({
      radius: radius,
      minCellSize: 32 * 8,
      minCellResolution: theme === THEMES.SYNTHWAVE ? 16 : 32 * 2,
      invert: false,
    }),
    [radius]
  );

  const initialData = React.useMemo(() => ({
    seed,
    type
  }), []);
  const chunkData = React.useMemo(() => ({}), []);

  return (
    <mesh ref={ref} position={position}>
      <HelloPlanet
        planetProps={planetProps}
        lodOrigin={camera.position}
        worker={worker}
        initialData={initialData}
        data={chunkData}
      >
        {focused && <FlyCamera />}
        {theme === THEMES.SYNTHWAVE ? 
        
        <meshStandardMaterial vertexColors wireframe wireframeLinewidth={2} emissive={labelColor} emissiveIntensity={1.1}/>
        :
        <meshStandardMaterial vertexColors />
      }
      </HelloPlanet>
    </mesh>
  );
});

export const Planets: React.FC = () => {
  return (
    <ECS.ManagedEntities tag="planet">
      {(entity) => {
        return (
          <ECS.Component name="mesh" key={entity.name}>
            <PlanetRender {...entity} />
          </ECS.Component>
        )
      }}
    </ECS.ManagedEntities>
  )
}