import React, { useState, useEffect, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";
import { Video } from "../services/youTubeService";
import "./VideoComponents.css";

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
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Define callback functions to prevent dependency cycles in useEffect
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= videos.length && hasMore) {
      onLoadMore();
    } else if (nextIndex < videos.length) {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, videos.length, hasMore, onLoadMore]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Reset index when videos change completely
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
  }, [videos.length, currentIndex]);

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  if (!isOpen || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentIndex];

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
            className="arrow-button left-arrow"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            aria-label="Previous video"
          >
            ←
          </button>

          <button className="control-button" onClick={onClose}>
            Close
          </button>

          <button
            className="arrow-button right-arrow"
            onClick={handleNext}
            disabled={currentIndex === videos.length - 1 && !hasMore}
            aria-label="Next video"
          >
            →
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
