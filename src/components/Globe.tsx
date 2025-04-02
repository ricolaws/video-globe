import { useRef, useEffect } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useControls, folder } from "leva";
import earthBumpPath from "../assets/8081_earthbump10k.jpg";
import waterTexturePath from "../assets/waterMap.jpg";
import specTexturePath from "../assets/earthspec1k.jpg";

interface GlobeProps {
  setCoords: (coords: [number, number]) => void;
}

export default function Globe({ setCoords }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Group>(null);

  // Set up Leva controls for lights
  const controls = useControls({
    Lights: folder({
      // Global light settings
      globalLightScale: {
        value: 4.0,
        min: 0,
        max: 10,
        step: 0.1,
        label: "Global Intensity",
      },

      light1: folder({
        light1Color: { value: "#ff6000" },
        light1Intensity: { value: 0.36, min: 0, max: 1, step: 0.01 },
        light1Position: {
          value: [7, 2, 17],
          step: 0.5,
          joystick: "invertY",
        },
      }),

      light2: folder({
        light2Color: { value: "#71d5c1" },
        light2Intensity: { value: 0.3, min: 0, max: 1, step: 0.01 },
        light2Position: {
          value: [-9.5, 9, -2.52],
          step: 0.5,
          joystick: "invertY",
        },
      }),

      light3: folder({
        light3Color: { value: "#6c4d6f" },
        light3Intensity: { value: 0.6, min: 0, max: 1, step: 0.01 },
        light3Position: {
          value: [-1.95, -18.24, -3.5],
          step: 0.5,
          joystick: "invertY",
        },
      }),

      // Hemisphere light
      hemisphereLight: folder({
        skyColor: { value: "#dedcc2" },
        groundColor: { value: "#1d0b03" },
        hemisphereLightIntensity: { value: 0.36, min: 0, max: 1, step: 0.01 },
      }),
    }),

    // Earth material controls
    Material: folder({
      bumpScale: { value: 999, min: 1, max: 2000, step: 10 },
      clearcoat: { value: 0.9, min: 0, max: 1, step: 0.01 },
      clearcoatRoughness: { value: 0.2, min: 0, max: 1, step: 0.01 },
      metalness: { value: 0.27, min: 0, max: 1, step: 0.01 },
      roughness: { value: 0.8, min: 0, max: 1, step: 0.01 },
      earthColor: { value: "#d9d9d9" },
    }),

    // Atmosphere controls
    Atmosphere: folder({
      atmosphereOpacity: { value: 0.12, min: 0, max: 1, step: 0.01 },
      atmosphereScale: { value: 1.02, min: 1, max: 1.2, step: 0.01 },
      atmosphereColor: { value: "#cce6ea" },
    }),
  });

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
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshNormalMaterial({ flatShading: false })
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
          bumpScale={controls.bumpScale}
          // envMap={textures.specMap}
          clearcoat={controls.clearcoat}
          clearcoatRoughness={controls.clearcoatRoughness}
          metalness={controls.metalness}
          roughness={controls.roughness}
          color={new THREE.Color(controls.earthColor)}
          // specularColorMap={textures.bumpMap}
          specularColor={"#fbb0c5"}
          specularIntensityMap={textures.specMap}
          specularIntensity={444}
        />
      </mesh>

      {/* Atmosphere layer */}
      <mesh ref={atmosphereRef} scale={controls.atmosphereScale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshToonMaterial
          color={new THREE.Color(controls.atmosphereColor)}
          transparent={true}
          opacity={controls.atmosphereOpacity}
          map={textures.waterMap}
        />
      </mesh>

      {/* Lights */}
      <pointLight
        position={controls.light1Position}
        color={controls.light1Color}
        intensity={controls.light1Intensity * controls.globalLightScale}
      />
      <pointLight
        position={controls.light2Position}
        color={controls.light2Color}
        intensity={controls.light2Intensity * controls.globalLightScale}
      />
      <pointLight
        position={controls.light3Position}
        color={controls.light3Color}
        intensity={controls.light3Intensity * controls.globalLightScale}
      />
      <hemisphereLight
        color={controls.skyColor}
        groundColor={controls.groundColor}
        intensity={
          controls.hemisphereLightIntensity * controls.globalLightScale
        }
      />

      {/* Camera controls */}
      <OrbitControls
        minDistance={1.2}
        maxDistance={2.5}
        zoomSpeed={0.1}
        panSpeed={0.2}
        enableDamping
        dampingFactor={0.06}
      />
    </group>
  );
}
