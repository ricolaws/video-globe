/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from "react";

interface VideoPlayerProps {
  videoId: string;
  onEnded?: () => void;
  title?: string;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onEnded }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);

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

    // Create unique ID for player element
    const playerId = `youtube-player-${videoId}`;

    // Create the player element
    const playerElement = document.createElement("div");
    playerElement.id = playerId;
    playerContainerRef.current.innerHTML = "";
    playerContainerRef.current.appendChild(playerElement);

    // Initialize player
    playerInstanceRef.current = new window.YT.Player(playerId, {
      videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onStateChange: (event: YouTubeEvent) => {
          // Video ended (state = 0)
          if (event.data === window.YT.PlayerState.ENDED && onEnded) {
            onEnded();
          }
        },
      },
    });
  }, [videoId, playerReady, onEnded]);

  return (
    <div className="video-player-container">
      <div className="video-player-wrapper" ref={playerContainerRef} />
      {!playerReady && (
        <div className="video-player-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
