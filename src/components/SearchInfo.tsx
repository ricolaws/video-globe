import React from "react";
import { Video } from "../services/youTubeService";
import "../App.css";

interface SearchInfoProps {
  coords: [number, number] | null;
  currentVideo: Video | null;
}

const SearchInfo: React.FC<SearchInfoProps> = ({ coords, currentVideo }) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatNumber = (num?: string): string => {
    if (!num) return "Unknown";
    return parseInt(num).toLocaleString();
  };

  if (!coords) {
    return null;
  }

  return (
    <div className="search-info-container">
      <div className="search-info-card">
        <div className="search-info-coords">
          Lat: {coords[0].toFixed(2)}°, Long: {coords[1].toFixed(2)}°
        </div>

        {currentVideo && (
          <>
            <div className="search-info-location">
              {currentVideo.locationDescription || "unknown"}
            </div>
            <div className="search-info-stats">
              <div className="search-info-item">
                <span className="search-info-value">
                  {formatDate(currentVideo.publishedAt)}
                </span>
              </div>
              <div className="search-info-item">
                <span className="search-info-label">Views:</span>
                <span className="search-info-value">
                  {formatNumber(currentVideo.viewCount)}
                </span>
              </div>
              <div className="search-info-item">
                <span className="search-info-label">Likes:</span>
                <span className="search-info-value">
                  {formatNumber(currentVideo.likeCount)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchInfo;
