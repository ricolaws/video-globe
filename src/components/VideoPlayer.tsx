/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect, useState } from "react";
import { Video } from "../services/youTubeService";

interface VideoPlayerProps {
  videoId: string;
  onEnded?: () => void;
  title?: string;
  video: Video;
}

// Define proper YouTube Player API types
interface YouTubeEvent {
  data: number;
  target: YouTubePlayer;
}

interface YouTubePlayer {
  destroy: () => void;
  addEventListener: (event: string, listener: (e: any) => void) => void;
  removeEventListener: (event: string, listener: (e: any) => void) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIframe: () => HTMLIFrameElement;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    rel?: 0 | 1;
    start?: number;
    end?: number;
    [key: string]: any;
  };
  events?: {
    onReady?: (event: YouTubeEvent) => void;
    onStateChange?: (event: YouTubeEvent) => void;
    onError?: (event: YouTubeEvent) => void;
    onPlaybackQualityChange?: (event: YouTubeEvent) => void;
    onPlaybackRateChange?: (event: YouTubeEvent) => void;
    onApiChange?: (event: YouTubeEvent) => void;
  };
}

// Enum for YouTube player states
enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

// Define type for YouTube API
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: YouTubePlayerOptions
      ) => YouTubePlayer;
      PlayerState: typeof PlayerState;
    };
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

// Define aspect ratio types
type AspectRatioType = "landscape" | "portrait" | "square";

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onEnded,
  video,
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine aspect ratio type from video data
  const getAspectRatioType = (): AspectRatioType => {
    // First try to use the API-provided aspect ratio
    if (video.isPortrait === true) {
      return "portrait";
    }

    if (video.isPortrait === false) {
      return "landscape";
    }

    // Fallback: check if we can calculate from embedWidth and embedHeight
    if (video.embedWidth && video.embedHeight) {
      const ratio = video.embedWidth / video.embedHeight;
      console.log(`Calculated aspect ratio: ${ratio} for video ${videoId}`);

      if (ratio < 0.9) return "portrait";
      if (ratio > 1.1) return "landscape";
      return "square";
    }

    // Default to landscape if we can't determine
    return "landscape";
  };

  const aspectRatioType = getAspectRatioType();

  useEffect(() => {
    // Log aspect ratio information whenever it changes
    console.log(`Video ${videoId} aspect ratio type: ${aspectRatioType}`);
    console.log("Video details:", {
      embedWidth: video.embedWidth,
      embedHeight: video.embedHeight,
      aspectRatio: video.aspectRatio,
      isPortrait: video.isPortrait,
    });

    // Add a debug log for checking player container dimensions
    if (playerContainerRef.current) {
      const rect = playerContainerRef.current.getBoundingClientRect();
      console.log("Player container dimensions:", {
        width: rect.width,
        height: rect.height,
      });
    }
  }, [videoId, aspectRatioType, video]);

  // Load YouTube IFrame API
  useEffect(() => {
    // Only load the script once
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Create a global callback for when API is ready
      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      // API already loaded
      setPlayerReady(true);
    }

    return () => {
      // Clean up player instance when component unmounts
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, []);

  // Initialize player when ID changes or API is ready
  useEffect(() => {
    if (!playerReady || !playerContainerRef.current) return;

    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
      playerInstanceRef.current = null;
    }

    setIsLoading(true);

    // Create unique ID for player element
    const playerId = `youtube-player-${videoId}`;

    // Create the player element
    const playerElement = document.createElement("div");
    playerElement.id = playerId;
    playerContainerRef.current.innerHTML = "";
    playerContainerRef.current.appendChild(playerElement);

    // Initialize player with better quality settings
    playerInstanceRef.current = new window.YT.Player(playerId, {
      videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
        enablejsapi: 1,
        playsinline: 1, // Important for portrait videos on mobile
        controls: 1,
        fs: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
      },
      events: {
        onReady: (event) => {
          setIsLoading(false);
          const iframe = event.target.getIframe();
          console.log(
            `Player iframe dimensions after load: ${iframe.width}x${iframe.height}`
          );
        },
        onStateChange: (event: YouTubeEvent) => {
          // Video ended (state = 0)
          if (event.data === window.YT.PlayerState.ENDED && onEnded) {
            onEnded();
          }
        },
      },
    });
  }, [videoId, playerReady, onEnded]);

  // Apply CSS classes based on the detected aspect ratio
  const containerClassName = `video-player-container video-player-${aspectRatioType}`;

  return (
    <div className={containerClassName}>
      <div className="video-player-wrapper" ref={playerContainerRef} />
      {(isLoading || !playerReady) && (
        <div className="video-player-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
