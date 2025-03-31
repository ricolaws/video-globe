import React, { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import { Video } from "../hooks/useYouTubeAPI";

interface VideoInfoProps {
  views: string;
  location: string | null;
  title: string;
}

const VideoInfo: React.FC<VideoInfoProps> = ({ views, location, title }) => (
  <div className="video-info">
    <div className="video-title">{title}</div>
    {location && <div className="video-location">Location: {location}</div>}
    <div className="video-views">Views: {parseInt(views).toLocaleString()}</div>
  </div>
);

interface VideoControllerProps {
  videos: Video[];
  isOpen: boolean;
  onClose: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const VideoController: React.FC<VideoControllerProps> = ({
  videos,
  isOpen,
  onClose,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);

  // Reset index when videos change completely (new location)
  useEffect(() => {
    if (
      videos.length > 0 &&
      !videos.some((v) => v.id === videos[currentIndex]?.id)
    ) {
      setCurrentIndex(0);
    }
  }, [videos, currentIndex]);

  // Show controls after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentIndex];

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    // If we're at the last video and there are more to load
    if (nextIndex >= videos.length && hasMore) {
      onLoadMore();
      // Stay at current index until new videos are loaded
    }
    // If we're not at the end of our current videos
    else if (nextIndex < videos.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      handleNext();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      handlePrevious();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="modal-container" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-content">
        <VideoInfo
          views={currentVideo.views}
          location={currentVideo.location}
          title={currentVideo.title}
        />

        <VideoPlayer
          videoId={currentVideo.id}
          onEnded={handleNext}
          title={currentVideo.title}
        />

        <div
          className="video-controls"
          style={{ opacity: showControls ? 1 : 0 }}
        >
          <button
            className="control-button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>

          <button className="control-button" onClick={onClose}>
            Close
          </button>

          <button
            className="control-button"
            onClick={handleNext}
            disabled={currentIndex === videos.length - 1 && !hasMore}
          >
            {isLoading ? "Loading..." : "Next"}
          </button>
        </div>

        <div className="video-progress">
          {currentIndex + 1} of {videos.length}
          {hasMore ? "+" : ""}
        </div>
      </div>
    </div>
  );
};

export default VideoController;
