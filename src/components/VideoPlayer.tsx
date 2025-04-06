/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from "react";
import { Video } from "../services/youTubeService";
import UnMuteIcon from "./UnMuteIcon";

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
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
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
    mute?: 0 | 1;
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
    hasEnabledAutoplay?: boolean; // Global flag to track if user has enabled autoplay
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

  // Check if this is a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // const isMobile = true;

  // Check if user has already enabled autoplay with sound
  const autoplayEnabled =
    typeof window !== "undefined" &&
    (window.hasEnabledAutoplay === true || !isMobile); // Auto-enable for desktop

  const [showPlayButton, setShowPlayButton] = useState(!autoplayEnabled);

  // Determine aspect ratio type from video data
  const getAspectRatioType = (): AspectRatioType => {
    if (video.isPortrait === true) return "portrait";
    if (video.isPortrait === false) return "landscape";

    if (video.embedWidth && video.embedHeight) {
      const ratio = video.embedWidth / video.embedHeight;
      if (ratio < 0.9) return "portrait";
      if (ratio > 1.1) return "landscape";
      return "square";
    }

    return "landscape";
  };

  const aspectRatioType = getAspectRatioType();

  // Enable autoplay with sound for this and all future videos
  const enableAutoplayWithSound = () => {
    if (!playerInstanceRef.current) return;

    const currentTime = playerInstanceRef.current.getCurrentTime();

    // Unmute the video
    playerInstanceRef.current.unMute();
    playerInstanceRef.current.playVideo();

    setTimeout(() => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.seekTo(currentTime, true);
        playerInstanceRef.current.playVideo();
      }
    }, 50);

    window.hasEnabledAutoplay = true;

    setShowPlayButton(false);
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      setPlayerReady(true);
    }

    return () => {
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

    const autoplay = 1; // Always try to autoplay
    const mute = autoplayEnabled ? 0 : 1; // Only mute if on mobile and autoplay hasn't been enabled yet

    // Initialize the player
    playerInstanceRef.current = new window.YT.Player(playerId, {
      videoId,
      playerVars: {
        autoplay,
        mute,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
        enablejsapi: 1,
        playsinline: 1,
        controls: 1,
        fs: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
      },
      events: {
        onReady: (event) => {
          setIsLoading(false);

          if (autoplayEnabled) {
            event.target.unMute();

            // Always try to play, with a slight delay for stability
            setTimeout(() => {
              if (playerInstanceRef.current) {
                playerInstanceRef.current.playVideo();
              }
            }, 100);

            setShowPlayButton(false);
          } else {
            // Otherwise, make sure we're muted to allow autoplay
            event.target.mute();
            event.target.playVideo();
          }
        },
        onStateChange: (event: YouTubeEvent) => {
          // When the video ends and we have a callback, call it
          if (event.data === window.YT.PlayerState.ENDED && onEnded) {
            onEnded();
          }
        },
      },
    });
  }, [videoId, playerReady, onEnded, autoplayEnabled]);

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

      {/* Play button - only shown on mobile before the user has enabled autoplay with sound */}
      {playerReady && !isLoading && showPlayButton && isMobile && (
        <button
          onClick={enableAutoplayWithSound}
          className="play-sound-button"
          aria-label="Play with sound"
        >
          <div className="play-icon-circle">
            <UnMuteIcon size={24} color="#ffffff" />
          </div>
          <span>Play with sound</span>
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
