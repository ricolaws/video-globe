import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Globe from "./components/Globe";
import "./App.css";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);

  return (
    <div className="app-container">
      {coords && (
        <div className="coords-display">
          Lat: {coords[0].toFixed(2)}°, Long: {coords[1].toFixed(2)}°
        </div>
      )}

      <Canvas className="globe-canvas">
        <Globe setCoords={(newCoords) => setCoords(newCoords)} />
      </Canvas>
    </div>
  );
}

export default App;
