import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Globe from "./components/Globe";
import VideoPlayer from "./components/VideoPlayer";
import useYouTubeAPI from "./hooks/useYouTubeAPI";
import "./App.css";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const { videos, isLoading, error, hasMore, loadMoreVideos } =
    useYouTubeAPI(coords);

  const handleGlobeClick = (newCoords: [number, number]) => {
    setCoords(newCoords);
    setCurrentVideoIndex(0);
  };

  if (videos.length > 0 && !showVideo) {
    setShowVideo(true);
  }

  const handleNext = () => {
    const nextIndex = currentVideoIndex + 1;
    if (nextIndex >= videos.length) {
      if (hasMore) loadMoreVideos();
    } else {
      setCurrentVideoIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleClose = () => {
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
        <Globe setCoords={handleGlobeClick} />
      </Canvas>

      {showVideo && videos.length > 0 && (
        <div className="video-modal">
          <div className="video-overlay" onClick={handleClose}></div>
          <div className="video-container">
            <VideoPlayer
              videoId={videos[currentVideoIndex].id}
              onEnded={handleNext}
            />
            <div className="video-title">{videos[currentVideoIndex].title}</div>
            <div className="video-controls">
              <button
                onClick={handlePrevious}
                disabled={currentVideoIndex === 0}
              >
                Previous
              </button>
              <button onClick={handleClose}>Close</button>
              <button
                onClick={handleNext}
                disabled={currentVideoIndex === videos.length - 1 && !hasMore}
              >
                {isLoading ? "Loading..." : "Next"}
              </button>
            </div>
            <div className="video-counter">
              {currentVideoIndex + 1} of {videos.length}
              {hasMore ? "+" : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
