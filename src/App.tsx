import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
// import Globe from "./components/Globe";
import VideoController from "./components/VideoController";
import useYouTubeAPI from "./hooks/useYouTubeAPI";
import "./App.css";
import Globe2 from "./components/Globe2";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  // Track if user explicitly closed the modal
  const userClosedModal = useRef(false);

  const { videos, isLoading, error, hasMore, loadMoreVideos } =
    useYouTubeAPI(coords);

  const handleGlobeClick = (newCoords: [number, number]) => {
    // When user clicks globe, reset the user closed state
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

  return (
    <div className="app-container">
      {coords && (
        <div className="coords-display">
          Lat: {coords[0].toFixed(2)}°, Long: {coords[1].toFixed(2)}°
        </div>
      )}

      {isLoading && <div className="loading-indicator">Loading videos...</div>}
      {error && <div className="error-message">{error}</div>}

      <Canvas className="globe-canvas">
        <Globe2 setCoords={handleGlobeClick} />
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
