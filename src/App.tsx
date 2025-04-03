import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import GlobeSelector from "./components/GlobeSelector";
import VideoController from "./components/VideoController";
import useYouTubeAPI from "./hooks/useYouTubeAPI";
import "./App.css";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [useRealisticGlobe, setUseRealisticGlobe] = useState(true);
  const userClosedModal = useRef(false);

  const { videos, isLoading, error, hasMore, loadMoreVideos } =
    useYouTubeAPI(coords);

  const handleGlobeClick = (newCoords: [number, number]) => {
    userClosedModal.current = false;
    setCoords(newCoords);
  };

  // Show videos automatically if user hasn't explicitly closed the modal
  useEffect(() => {
    if (videos.length > 0 && !showVideo && !userClosedModal.current) {
      setShowVideo(true);
    }
  }, [videos, showVideo]);

  const handleClose = () => {
    // Set the user closed flag to prevent auto-reopening
    userClosedModal.current = true;
    setShowVideo(false);
  };

  const toggleGlobeStyle = () => {
    setUseRealisticGlobe(!useRealisticGlobe);
  };

  return (
    <div className="app-container">
      {coords && (
        <div className="coords-display">
          Lat: {coords[0].toFixed(2)}°, Long: {coords[1].toFixed(2)}°
        </div>
      )}

      {/* Toggle Button for Globe Style - Outside Canvas */}
      <button
        className="globe-toggle-button"
        onClick={toggleGlobeStyle}
        style={{
          position: "absolute",
          top: "70px",
          left: "20px",
          zIndex: 191,
          padding: "8px 12px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Switch to {useRealisticGlobe ? "Simple" : "Realistic"} Globe
      </button>

      {isLoading && <div className="loading-indicator">Loading videos...</div>}
      {error && <div className="error-message">{error}</div>}

      <Canvas className="globe-canvas">
        <GlobeSelector
          setCoords={handleGlobeClick}
          useRealistic={useRealisticGlobe}
        />
      </Canvas>

      <VideoController
        videos={videos}
        isOpen={showVideo}
        onClose={handleClose}
        onLoadMore={loadMoreVideos}
        hasMore={hasMore}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
