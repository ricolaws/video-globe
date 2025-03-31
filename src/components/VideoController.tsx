import React, { useState, useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import { Video } from "../services/youTubeService";

interface VideoControllerProps {
  videos: Video[];
  isOpen: boolean;
  onClose: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const SimpleVideoController: React.FC<VideoControllerProps> = ({
  videos,
  isOpen,
  onClose,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when videos change completely
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
  }, [videos.length, currentIndex]);

  if (!isOpen || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentIndex];

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= videos.length && hasMore) {
      onLoadMore();
    } else if (nextIndex < videos.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-content">
        <div className="video-info">
          <div className="video-title">{currentVideo.title}</div>
        </div>

        <VideoPlayer
          videoId={currentVideo.id}
          onEnded={handleNext}
          title={currentVideo.title}
        />

        <div className="video-controls">
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

export default SimpleVideoController;
