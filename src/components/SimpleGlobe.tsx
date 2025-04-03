import { useTexture } from "@react-three/drei";
import GlobeBase from "./GlobeBase";

// Import textures needed for the simplified theme
import earthBumpPath from "../assets/8081_earthbump10k.jpg";
import specTexturePath from "../assets/earthspec1k.jpg";
import waterTexturePath from "../assets/waterMap.jpg";

interface SimpleGlobeProps {
  setCoords: (coords: [number, number]) => void;
}

export default function SimpleGlobe({ setCoords }: SimpleGlobeProps) {
  const textures = useTexture({
    bumpMap: earthBumpPath,
    specMap: specTexturePath,
    waterMap: waterTexturePath,
  });

  // Earth material - with the specified styling
  const earthMaterial = (
    <meshLambertMaterial
      flatShading={false}
      bumpMap={textures.bumpMap}
      bumpScale={888}
      color={"#eee8d0"}
      emissive={"#6c4d6f"}
      emissiveMap={textures.specMap}
      emissiveIntensity={0.44}
    />
  );

  // Atmosphere material - as specified
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
      {/* Simple lighting setup as specified */}
      <hemisphereLight
        color={"#ffefef"}
        groundColor={"#242221"}
        intensity={1.2}
      />
    </GlobeBase>
  );
}
