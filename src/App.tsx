import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import GlobeSelector from "./components/GlobeSelector";
import VideoController from "./components/VideoController";
import SearchInfo from "./components/SearchInfo"; // Import the new component
import useYouTubeAPI from "./hooks/useYouTubeAPI";
import "./App.css";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [useRealisticGlobe, setUseRealisticGlobe] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track current video index
  const userClosedModal = useRef(false);

  const { videos, isLoading, error, hasMore, loadMoreVideos } =
    useYouTubeAPI(coords);

  const handleGlobeClick = (newCoords: [number, number]) => {
    userClosedModal.current = false;
    setCoords(newCoords);
    setCurrentVideoIndex(0); // Reset to first video when selecting a new location
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

  // Handle video navigation and track current index
  const handleVideoChange = (index: number) => {
    setCurrentVideoIndex(index);
  };

  // Get the current video for display in SearchInfo
  const currentVideo =
    videos.length > 0 && currentVideoIndex < videos.length
      ? videos[currentVideoIndex]
      : null;

  return (
    <div className="app-container">
      {/* Remove the old coords display since it's now part of SearchInfo */}

      {/* SearchInfo component */}
      <SearchInfo coords={coords} currentVideo={currentVideo} />

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
        onVideoChange={handleVideoChange} // Pass the handler to track current video
        initialIndex={currentVideoIndex} // Pass initial index
      />
    </div>
  );
}

export default App;
