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
  // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isMobile = true;

  // More persistent approach using sessionStorage + window flag
  // Check if user has already enabled autoplay with sound
  const autoplayEnabled =
    typeof window !== "undefined" &&
    (sessionStorage.getItem("hasEnabledAutoplay") === "true" ||
      window.hasEnabledAutoplay === true ||
      !isMobile); // Auto-enable for desktop

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
    console.log(`[VideoPlayer] enableAutoplayWithSound called`);

    if (!playerInstanceRef.current) {
      console.log(
        `[VideoPlayer] Player not ready yet, can't enable autoplay with sound`
      );
      return;
    }

    const currentTime = playerInstanceRef.current.getCurrentTime();
    const playerState = playerInstanceRef.current.getPlayerState();
    console.log(
      `[VideoPlayer] Current time: ${currentTime}, Player state: ${playerState}`
    );

    // Unmute the video without restarting it
    console.log(`[VideoPlayer] Unmuting`);
    playerInstanceRef.current.unMute();

    // Only play if not already playing (to avoid restart)
    if (playerState !== window.YT.PlayerState.PLAYING) {
      console.log(`[VideoPlayer] Playing video (was not already playing)`);
      playerInstanceRef.current.playVideo();
    } else {
      console.log(`[VideoPlayer] Video already playing, not restarting`);
    }

    console.log(`[VideoPlayer] Setting autoplay enabled flags`);
    window.hasEnabledAutoplay = true;
    // Also store in sessionStorage for better persistence
    sessionStorage.setItem("hasEnabledAutoplay", "true");

    setShowPlayButton(false);
  };

  // Load YouTube IFrame API
  useEffect(() => {
    console.log(`[VideoPlayer] Initial mount, loading YouTube API`);

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log(`[VideoPlayer] YouTube API ready callback`);
        setPlayerReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      console.log(`[VideoPlayer] YouTube API already loaded`);
      setPlayerReady(true);
    }

    return () => {
      console.log(`[VideoPlayer] Component unmounting, cleaning up player`);
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, []);

  // Initialize player when ID changes or API is ready
  useEffect(() => {
    if (!playerReady || !playerContainerRef.current) return;

    console.log(`[VideoPlayer] Creating new player for ${videoId}`);
    console.log(`[VideoPlayer] autoplayEnabled: ${autoplayEnabled}`);
    console.log(
      `[VideoPlayer] window.hasEnabledAutoplay: ${window.hasEnabledAutoplay}`
    );
    console.log(
      `[VideoPlayer] sessionStorage.hasEnabledAutoplay: ${sessionStorage.getItem(
        "hasEnabledAutoplay"
      )}`
    );

    if (playerInstanceRef.current) {
      console.log(`[VideoPlayer] Destroying previous player`);
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

    console.log(
      `[VideoPlayer] Player config - autoplay: ${autoplay}, mute: ${mute}`
    );

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
          console.log(`[VideoPlayer] Player ready event`);
          setIsLoading(false);

          if (autoplayEnabled) {
            console.log(`[VideoPlayer] Autoplay enabled, unmuting and playing`);
            event.target.unMute();

            // Ensure autoplay flags are consistent
            window.hasEnabledAutoplay = true;
            sessionStorage.setItem("hasEnabledAutoplay", "true");

            // Always try to play, with a short delay for stability
            // Use a longer delay for mobile to give the browser more time
            const playDelay = isMobile ? 300 : 100;

            setTimeout(() => {
              if (playerInstanceRef.current) {
                console.log(
                  `[VideoPlayer] Delayed play attempt after ${playDelay}ms`
                );
                playerInstanceRef.current.playVideo();

                // Double-check it's unmuted
                if (playerInstanceRef.current.isMuted()) {
                  console.log(`[VideoPlayer] Player was muted, unmuting again`);
                  playerInstanceRef.current.unMute();
                }
              }
            }, playDelay);

            setShowPlayButton(false);
          } else {
            console.log(
              `[VideoPlayer] Autoplay not enabled, muting and playing`
            );
            // Otherwise, make sure we're muted to allow autoplay
            event.target.mute();
            event.target.playVideo();
          }
        },
        onStateChange: (event: YouTubeEvent) => {
          console.log(`[VideoPlayer] Player state changed: ${event.data}`);

          // Log detailed state for debugging
          const stateNames = {
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

          // Check if player is muted for debugging
          if (playerInstanceRef.current) {
            const isMuted = playerInstanceRef.current.isMuted();
            console.log(`[VideoPlayer] Player muted state: ${isMuted}`);
          }

          // When the video ends and we have a callback, call it
          if (event.data === window.YT.PlayerState.ENDED && onEnded) {
            console.log(`[VideoPlayer] Video ended, calling onEnded callback`);
            // Store current autoplay settings before transitioning
            const currentAutoplaySettings = {
              hasEnabled: window.hasEnabledAutoplay,
              sessionValue: sessionStorage.getItem("hasEnabledAutoplay"),
            };
            console.log(
              `[VideoPlayer] Current autoplay settings:`,
              currentAutoplaySettings
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
  }, [videoId, playerReady, onEnded, autoplayEnabled, isMobile]);

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
