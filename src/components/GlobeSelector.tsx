import { Suspense, lazy } from "react";

// Lazy load the globe components for better performance
const RealisticGlobe = lazy(() => import("./RealisticGlobe"));
const SimpleGlobe = lazy(() => import("./SimpleGlobe"));

interface GlobeSelectorProps {
  setCoords: (coords: [number, number]) => void;
  useRealistic: boolean;
}

export default function GlobeSelector({
  setCoords,
  useRealistic,
}: GlobeSelectorProps) {
  // Simply return the appropriate globe component based on the prop
  return (
    <Suspense fallback={null}>
      {useRealistic ? (
        <RealisticGlobe setCoords={setCoords} />
      ) : (
        <SimpleGlobe setCoords={setCoords} />
      )}
    </Suspense>
  );
}
