import { useRef, useEffect, ReactNode, JSX } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface GlobeBaseProps {
  setCoords: (coords: [number, number]) => void;
  children: ReactNode;
  earthMaterial?: JSX.Element;
  atmosphereMaterial?: JSX.Element;
  rotationSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
}

export default function GlobeBase({
  setCoords,
  children,
  earthMaterial,
  atmosphereMaterial,
  rotationSpeed = 0.015,
  minDistance = 1.15,
  maxDistance = 2.5,
}: GlobeBaseProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Group>(null);

  // Set up points group for markers
  useEffect(() => {
    if (!pointsRef.current && earthRef.current) {
      const group = new THREE.Group();
      pointsRef.current = group;
      earthRef.current.add(group);
    }
  }, []);

  // Handle animation
  useFrame(({ clock }) => {
    if (earthRef.current && atmosphereRef.current) {
      const elapsedTime = clock.getElapsedTime();

      // Apply rotation to earth and atmosphere
      earthRef.current.rotation.y = rotationSpeed * elapsedTime;
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

    // Clear existing points
    while (pointsRef.current.children.length > 0) {
      pointsRef.current.remove(pointsRef.current.children[0]);
    }

    // Create new point marker
    const point = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshNormalMaterial()
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

    // Send coordinates to parent component
    setCoords([lat, lon]);
  };

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} onDoubleClick={handleDoubleClick}>
        <sphereGeometry args={[1, 256, 256]} />
        {earthMaterial}
      </mesh>

      {/* Atmosphere layer */}
      <mesh ref={atmosphereRef} scale={1.01}>
        <sphereGeometry args={[1, 32, 32]} />
        {atmosphereMaterial}
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        minDistance={minDistance}
        maxDistance={maxDistance}
        zoomSpeed={0.12}
        panSpeed={0.2}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Theme-specific elements (additional lighting, effects) will be injected here */}
      {children}
    </group>
  );
}
