import { useTexture } from "@react-three/drei";
import { Environment, Stars } from "@react-three/drei";
import GlobeBase from "./GlobeBase";
import earthBumpPath from "../assets/8081_earthbump10k.jpg";
import waterTexturePath from "../assets/waterMap.jpg";
import specTexturePath from "../assets/earthspec1k.jpg";
import colorMapPath from "../assets/8081_earthmap4k.jpg";

interface RealisticGlobeProps {
  setCoords: (coords: [number, number]) => void;
}

export default function RealisticGlobe({ setCoords }: RealisticGlobeProps) {
  const textures = useTexture({
    bumpMap: earthBumpPath,
    specMap: specTexturePath,
    waterMap: waterTexturePath,
    colorMap: colorMapPath,
  });

  const globalLightScale = 9.0;

  const earthMaterial = (
    <meshPhysicalMaterial
      bumpMap={textures.bumpMap}
      bumpScale={320}
      clearcoat={0.5}
      clearcoatRoughness={0.13}
      metalness={0.27}
      roughness={0.38}
      color={"#d2d2d2"}
      map={textures.colorMap}
      specularIntensity={2}
      specularIntensityMap={textures.specMap}
    />
  );

  const atmosphereMaterial = (
    <meshToonMaterial
      color={"#cce6ea"}
      transparent={true}
      opacity={0.12}
      map={textures.waterMap}
    />
  );

  return (
    <GlobeBase
      setCoords={setCoords}
      earthMaterial={earthMaterial}
      atmosphereMaterial={atmosphereMaterial}
    >
      {/* Environment and lighting */}
      <Environment preset="night" />
      <ambientLight intensity={0.3} />

      <pointLight
        position={[7, 2, 17]}
        color="#ff6000"
        intensity={0.55 * globalLightScale}
      />
      <pointLight
        position={[-9.5, 9, -2.52]}
        color="#71d5c1"
        intensity={0.4 * globalLightScale}
      />
      <pointLight
        position={[-1.95, -18.24, -3.5]}
        color="#6c4d6f"
        intensity={0.6 * globalLightScale}
      />
      <hemisphereLight
        color="#dedcc2"
        groundColor="#4b4b4b"
        intensity={0.5 * globalLightScale}
      />

      {/* Stars background */}
      <Stars
        radius={99}
        depth={64}
        count={1600}
        factor={6}
        saturation={1}
        fade
        speed={1}
      />
    </GlobeBase>
  );
}
