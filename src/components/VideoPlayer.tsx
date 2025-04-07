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

  // Separate state for mute control
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(true);

  // Check if this is a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // const isMobile = true;

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
  const enableSoundAndRememberChoice = useCallback(() => {
    console.log(`[VideoPlayer] enableSoundAndRememberChoice called`);

    if (!playerInstanceRef.current) {
      console.log(`[VideoPlayer] Player not ready yet, can't enable sound`);
      return;
    }

    // Store the user's choice in sessionStorage for future videos
    sessionStorage.setItem("videoPlayerUnmuted", "true");

    // Unmute directly without changing state that would cause re-renders
    console.log(`[VideoPlayer] Unmuting player directly`);
    playerInstanceRef.current.unMute();

    // Only update our local state after directly handling the player
    // Use a setTimeout to avoid immediate re-renders that could trigger the useEffect
    setTimeout(() => {
      setIsMuted(false);
      setShowPlayButton(false);
    }, 50);
  }, []);

  // Load YouTube API and set up player
  useEffect(() => {
    console.log(`[VideoPlayer] Setting up YouTube API`);

    // Check if user previously unmuted videos in this session
    const previouslyUnmuted =
      sessionStorage.getItem("videoPlayerUnmuted") === "true";
    if (previouslyUnmuted) {
      console.log(
        `[VideoPlayer] User previously unmuted videos, applying that preference`
      );
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
        console.log(`[VideoPlayer] YouTube API ready`);
        setPlayerReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      console.log(`[VideoPlayer] YouTube API already loaded`);
      setPlayerReady(true);
    }

    // Clean up function
    return () => {
      if (playerInstanceRef.current) {
        console.log(`[VideoPlayer] Cleaning up player on unmount`);
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, []);

  // Handle video ID changes - create or update player
  useEffect(() => {
    if (!playerReady || !playerContainerRef.current || !videoId) return;

    console.log(`[VideoPlayer] Handling video ID change: ${videoId}`);
    console.log(
      `[VideoPlayer] Current mute state: ${isMuted ? "muted" : "unmuted"}`
    );

    const createNewPlayer = () => {
      console.log(`[VideoPlayer] Creating new player instance`);
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
      console.log(
        `[VideoPlayer] Initial player mute setting: ${
          shouldMute ? "muted" : "unmuted"
        }`
      );

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
            console.log(`[VideoPlayer] Player ready event`);
            setIsLoading(false);

            // Apply mute state based on user preference
            if (!isMuted) {
              console.log(`[VideoPlayer] Unmuting player on ready`);
              event.target.unMute();
            }

            // Start playing
            event.target.playVideo();
          },
          onStateChange: (event) => {
            // Log the state changes for debugging
            const stateNames: Record<number, string> = {
              [-1]: "UNSTARTED",
              0: "ENDED",
              1: "PLAYING",
              2: "PAUSED",
              3: "BUFFERING",
              5: "CUED",
            };
            console.log(
              `[VideoPlayer] State: ${stateNames[event.data] || event.data}`
            );

            // When the video ends, call the callback
            if (event.data === PlayerState.ENDED && onEnded) {
              console.log(
                `[VideoPlayer] Video ended, calling onEnded callback`
              );
              onEnded();
            }
          },
          onError: (event) => {
            console.error(`[VideoPlayer] YouTube player error: ${event.data}`);
            setIsLoading(false);
          },
        },
      });
    };

    const loadVideoInExistingPlayer = () => {
      console.log(
        `[VideoPlayer] Loading new video in existing player: ${videoId}`
      );
      setIsLoading(true);

      if (playerInstanceRef.current) {
        // Stop current video
        playerInstanceRef.current.stopVideo();

        // Apply mute state from component state
        if (isMuted) {
          playerInstanceRef.current.mute();
        } else {
          playerInstanceRef.current.unMute();
        }

        // Load and play the new video
        playerInstanceRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
        });

        setIsLoading(false);
      }
    };

    // Either create a new player or use the existing one
    if (!playerInstanceRef.current) {
      createNewPlayer();
    } else {
      loadVideoInExistingPlayer();
    }
  }, [videoId, playerReady, isMobile, onEnded]); // Removed isMuted from dependency array

  // Separate effect to handle mute state changes
  useEffect(() => {
    // Only handle mute state changes if player already exists
    if (playerInstanceRef.current) {
      console.log(
        `[VideoPlayer] Mute state changed to: ${isMuted ? "muted" : "unmuted"}`
      );

      if (isMuted) {
        playerInstanceRef.current.mute();
      } else {
        playerInstanceRef.current.unMute();
      }
    }
  }, [isMuted]);

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

      {/* Play button - only shown if muted and on mobile */}
      {playerReady && !isLoading && showPlayButton && isMuted && isMobile && (
        <button
          onClick={enableSoundAndRememberChoice}
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
