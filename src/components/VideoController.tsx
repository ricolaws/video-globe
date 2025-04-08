import React, { useState, useEffect, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";
import { Video } from "../services/youTubeService";
import "./VideoComponents.css";
import ChevronIcon from "./ChevronIcon";
import CloseIcon from "./CloseIcon";

interface VideoControllerProps {
  videos: Video[];
  isOpen: boolean;
  onClose: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  onVideoChange?: (index: number) => void;
  initialIndex?: number;
}

const VideoController: React.FC<VideoControllerProps> = ({
  videos,
  isOpen,
  onClose,
  onLoadMore,
  hasMore,
  onVideoChange = () => {},
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, videos]);

  // Update parent component when current index changes due to prev/next buttons
  const updateParentIndex = useCallback(
    (index: number) => {
      onVideoChange(index);
    },
    [onVideoChange]
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= videos.length && hasMore) {
      onLoadMore();
    } else if (nextIndex < videos.length) {
      setCurrentIndex(nextIndex);
      updateParentIndex(nextIndex);
    }
  }, [currentIndex, videos.length, hasMore, onLoadMore, updateParentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      updateParentIndex(prevIndex);
    }
  }, [currentIndex, updateParentIndex]);

  // Reset index when videos change completely
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      const newIndex = 0;
      setCurrentIndex(newIndex);
      updateParentIndex(newIndex);
    }
  }, [videos.length, currentIndex, updateParentIndex]);

  if (!isOpen || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="modal-container">
      <div className="modal-background" onClick={onClose}></div>

      <div className="floating-modal-content">
        <VideoPlayer
          video={currentVideo}
          videoId={currentVideo.id}
          onEnded={handleNext}
          title={currentVideo.title}
        />

        {/* Controls placed below the video */}
        <div className="bottom-video-controls">
          <button
            className="arrow-button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            aria-label="Previous video"
          >
            <ChevronIcon direction="left" size={28} />
          </button>

          {/* Close button with SVG icon */}
          <button
            className="arrow-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={28} />
          </button>

          <button
            className="arrow-button"
            onClick={handleNext}
            disabled={currentIndex === videos.length - 1 && !hasMore}
            aria-label="Next video"
          >
            <ChevronIcon direction="right" size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoController;
