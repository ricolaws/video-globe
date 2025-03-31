import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Globe from "./components/Globe";
import VideoController from "./components/VideoController";
import useYouTubeAPI from "./hooks/useYouTubeAPI";
import "./App.css";
import "./components/VideoComponents.css";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Use our custom hook to fetch videos
  const { videos, isLoading, error, hasMore, loadMoreVideos } = useYouTubeAPI({
    coords,
    onError: () => console.error("Error fetching videos"),
  });

  // Show video modal when videos are loaded
  useEffect(() => {
    if (videos.length > 0 && !showVideoModal) {
      setShowVideoModal(true);
    }
  }, [videos, showVideoModal]);

  const handleGlobeClick = (newCoords: [number, number]) => {
    setCoords(newCoords);
  };

  const handleCloseModal = () => {
    setShowVideoModal(false);
  };

  return (
    <div className="app-container">
      {coords && (
        <div className="coords-display">
          Lat: {coords[0].toFixed(2)}°, Long: {coords[1].toFixed(2)}°
        </div>
      )}

      {isLoading && <div className="loading-indicator">Loading videos...</div>}

      {error && <div className="error-message">{error.message}</div>}

      <Canvas className="globe-canvas">
        <Globe setCoords={handleGlobeClick} />
      </Canvas>

      <VideoController
        videos={videos}
        isOpen={showVideoModal && videos.length > 0}
        onClose={handleCloseModal}
        onLoadMore={loadMoreVideos}
        hasMore={hasMore}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
