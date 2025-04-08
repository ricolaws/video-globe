import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import GlobeSelector from "./components/GlobeSelector";
import VideoController from "./components/VideoController";
import SearchInfo from "./components/SearchInfo";
import LoadingScreen from "./components/LoadingScreen";
import SettingsMenu from "./components/SettingsMenu";
import useYouTubeAPI from "./hooks/useYouTubeAPI";
import "./App.css";
import "./components/LoadingScreen.css";

function App() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [useRealisticGlobe, setUseRealisticGlobe] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [appLoaded, setAppLoaded] = useState(false);
  const userClosedModal = useRef(false);

  const { videos, isLoading, error, hasMore, loadMoreVideos } =
    useYouTubeAPI(coords);

  const handleGlobeClick = (newCoords: [number, number]) => {
    userClosedModal.current = false;
    setCoords(newCoords);
    setCurrentVideoIndex(0);
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

  // Handle loading completion
  const handleLoadingComplete = () => {
    setAppLoaded(true);
  };

  // Get the current video for display in SearchInfo
  const currentVideo =
    videos.length > 0 && currentVideoIndex < videos.length
      ? videos[currentVideoIndex]
      : null;

  return (
    <div className="app-container">
      {/* Loading Screen Component */}
      {!appLoaded && (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      )}

      {/* SearchInfo component */}
      <SearchInfo coords={coords} currentVideo={currentVideo} />

      {/* Settings Menu - Replaced toggle button */}
      <SettingsMenu
        useRealisticGlobe={useRealisticGlobe}
        toggleGlobeStyle={toggleGlobeStyle}
      />

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
        onVideoChange={handleVideoChange}
        initialIndex={currentVideoIndex}
      />
    </div>
  );
}

export default App;
