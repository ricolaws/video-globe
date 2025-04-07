/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Video } from "../services/youTubeService";
import UnMuteIcon from "./UnMuteIcon";

interface VideoPlayerProps {
  videoId: string;
  onEnded?: () => void;
  title?: string;
  video: Video;
}

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
  loadVideoById: (
    videoId: string | { videoId: string; startSeconds?: number }
  ) => void;
  cueVideoById: (
    videoId: string | { videoId: string; startSeconds?: number }
  ) => void;
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

const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

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
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(true);

  // Check if this is a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

  // Function to handle unmuting that won't trigger re-renders of the component
  const enableSoundForSession = useCallback(() => {
    if (
      !playerInstanceRef.current ||
      typeof playerInstanceRef.current.unMute !== "function"
    )
      return;

    // Store the user's choice in sessionStorage for future videos
    sessionStorage.setItem("videoPlayerUnmuted", "true");

    playerInstanceRef.current.unMute();

    setTimeout(() => {
      setIsMuted(false);
      setShowPlayButton(false);
    }, 50);
  }, []);

  // Load YouTube API and set up player
  useEffect(() => {
    // Check if user previously unmuted videos in this session
    const previouslyUnmuted =
      sessionStorage.getItem("videoPlayerUnmuted") === "true";
    if (previouslyUnmuted) {
      setIsMuted(false);
      setShowPlayButton(false);
    }

    // Load the API if not already loaded
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

    // Clean up function
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, []);

  // Handle video ID changes - create or update player
  useEffect(() => {
    if (!playerReady || !playerContainerRef.current || !videoId) return;

    const createNewPlayer = () => {
      setIsLoading(true);

      // Create unique ID for player element
      const playerId = `youtube-player-${Date.now()}`;

      // Create the player element
      const playerElement = document.createElement("div");
      playerElement.id = playerId;
      playerContainerRef.current!.innerHTML = "";
      playerContainerRef.current!.appendChild(playerElement);

      // Always start with muted=1 for mobile autoplay
      const shouldMute = isMobile && isMuted;

      // Initialize the player
      playerInstanceRef.current = new window.YT.Player(playerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: shouldMute ? 1 : 0,
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
            if (event.target && typeof event.target.playVideo === "function") {
              // Apply mute state based on user preference
              if (!isMuted && typeof event.target.unMute === "function") {
                event.target.unMute();
              }

              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            // When the video ends, call the callback
            if (event.data === PlayerState.ENDED && onEnded) {
              onEnded();
            }
          },
          onError: () => {
            setIsLoading(false);
          },
        },
      });
    };

    const loadVideoInExistingPlayer = () => {
      setIsLoading(true);

      if (
        playerInstanceRef.current &&
        typeof playerInstanceRef.current.loadVideoById === "function"
      ) {
        if (typeof playerInstanceRef.current.stopVideo === "function") {
          playerInstanceRef.current.stopVideo();
        }

        // Apply mute state from component state
        if (isMuted) {
          if (typeof playerInstanceRef.current.mute === "function") {
            playerInstanceRef.current.mute();
          }
        } else {
          if (typeof playerInstanceRef.current.unMute === "function") {
            playerInstanceRef.current.unMute();
          }
        }

        // Load and play the new video
        playerInstanceRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
        });

        setIsLoading(false);
      } else {
        // If player reference exists but methods don't, recreate the player
        createNewPlayer();
      }
    };

    if (!playerInstanceRef.current) {
      createNewPlayer();
    } else {
      loadVideoInExistingPlayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerReady, isMobile, onEnded]); // Removed isMuted from dependency array

  // Separate effect to handle mute state changes
  useEffect(() => {
    if (
      playerInstanceRef.current &&
      typeof playerInstanceRef.current.unMute === "function"
    ) {
      if (isMuted) {
        playerInstanceRef.current.mute();
      } else {
        playerInstanceRef.current.unMute();
      }
    }
  }, [isMuted]);

  const containerClassName = `video-player-container video-player-${aspectRatioType}`;

  return (
    <div className={containerClassName}>
      <div className="video-player-wrapper" ref={playerContainerRef} />
      {(isLoading || !playerReady) && (
        <div className="video-player-loading">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Play button - only shown if muted and on mobile */}
      {playerReady && !isLoading && showPlayButton && isMuted && isMobile && (
        <button
          onClick={enableSoundForSession}
          className="play-sound-button"
          aria-label="Play with sound"
        >
          <div className="play-icon-circle">
            <UnMuteIcon size={24} color="#ebebeb" />
          </div>
          <span>Play with sound</span>
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
