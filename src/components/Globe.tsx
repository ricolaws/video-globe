import { useRef, useEffect } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import earthBumpPath from "../assets/8081_earthbump4k.jpg";
import waterTexturePath from "../assets/waterMap.jpg";
import specTexturePath from "../assets/earthspec1k.jpg";

interface GlobeProps {
  setCoords: (coords: [number, number]) => void;
}

export default function Globe({ setCoords }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Group>(null);
  const lightScale = 3.8;

  // Load textures
  const textures = useTexture({
    bumpMap: earthBumpPath,
    specMap: specTexturePath,
    waterMap: waterTexturePath,
  });

  // Set up points group for markers
  useEffect(() => {
    if (!pointsRef.current) {
      const group = new THREE.Group();
      pointsRef.current = group;
      earthRef.current?.add(group);
    }
  }, []);

  // Handle animation
  useFrame(({ clock }) => {
    if (earthRef.current && atmosphereRef.current) {
      const elapsedTime = clock.getElapsedTime();

      earthRef.current.rotation.y = 0.02 * elapsedTime;
      atmosphereRef.current.rotation.y = -0.08 * elapsedTime;
      atmosphereRef.current.rotation.z = 0.04 * elapsedTime;
    }
  });

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (!earthRef.current) return;

    const pointOfIntersection = event.point;
    const localPoint = new THREE.Vector3();

    // Convert to local coordinate space
    earthRef.current.worldToLocal(localPoint.copy(pointOfIntersection));

    createPoint(localPoint);
  };

  const createPoint = (position: THREE.Vector3) => {
    if (!earthRef.current || !pointsRef.current) return;

    while (pointsRef.current.children.length > 0) {
      pointsRef.current.remove(pointsRef.current.children[0]);
    }

    const point = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 8, 8),
      new THREE.MeshNormalMaterial({ flatShading: true })
    );
    point.position.copy(position);
    pointsRef.current.add(point);

    // Convert to geographic coordinates
    const spherical = new THREE.Spherical().setFromVector3(position);
    const lat = THREE.MathUtils.radToDeg(Math.PI / 2 - spherical.phi);
    let lon = THREE.MathUtils.radToDeg(spherical.theta) - 90;

    if (lon < -180) {
      lon += 360;
    }
    setCoords([lat, lon]);
  };

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} onDoubleClick={handleDoubleClick}>
        <sphereGeometry args={[1, 256, 256]} />
        <meshPhysicalMaterial
          flatShading={false}
          bumpMap={textures.bumpMap}
          bumpScale={999}
          envMap={textures.specMap}
          clearcoat={1}
          clearcoatRoughness={0.3}
          reflectivity={0.5}
          metalness={1.5}
          roughness={0.7}
          color={new THREE.Color(0xf0deff)}
        />
      </mesh>

      {/* Atmosphere layer */}
      <mesh ref={atmosphereRef} scale={1.05}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshToonMaterial
          color={new THREE.Color(0xeeeeff)}
          transparent={true}
          opacity={0.12}
          map={textures.waterMap}
        />
      </mesh>

      {/* Lights */}
      <pointLight
        position={[7, 2, 17]}
        color={0xff6000}
        intensity={0.25 * lightScale}
      />
      <pointLight
        position={[-9.5, 9, -2.52]}
        color={0x22fed0}
        intensity={0.15 * lightScale}
      />
      <pointLight
        position={[-1.95, -18.24, -10.53]}
        color={0x98d0d8}
        intensity={0.22 * lightScale}
      />
      <hemisphereLight
        color={0xffffbb}
        groundColor={0x080820}
        intensity={0.4 * lightScale}
      />

      {/* Camera controls */}
      <OrbitControls
        minDistance={1.3}
        maxDistance={3}
        zoomSpeed={0.2}
        panSpeed={0.2}
        enableDamping
        dampingFactor={0.08}
      />
    </group>
  );
}
