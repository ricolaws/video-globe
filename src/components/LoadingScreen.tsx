import React, { useState, useEffect } from "react";
import "./LoadingScreen.css";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  minDisplayTime?: number; // Minimum time to show the loading screen (ms)
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoadingComplete,
  minDisplayTime = 2000, // Default minimum display time is 2 seconds
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [startFadeOut, setStartFadeOut] = useState(false);
  const [loadingStartTime] = useState(Date.now());

  // Monitor document loading state
  useEffect(() => {
    const checkReadyState = () => {
      if (document.readyState === "complete") {
        // Calculate how long the page has been loading
        const currentTime = Date.now();
        const elapsedTime = currentTime - loadingStartTime;

        // If we've already exceeded the minimum time, mark as ready immediately
        if (elapsedTime >= minDisplayTime) {
          setIsReady(true);

          // Start fade-out animation after a short delay
          setTimeout(() => {
            setStartFadeOut(true);
          }, 1000); // Show "READY" message for 1 second before fading
        } else {
          // Otherwise, wait until the minimum time has passed
          const remainingTime = minDisplayTime - elapsedTime;

          // Set ready state after the remaining time
          setTimeout(() => {
            setIsReady(true);

            // Start fade-out animation after a short delay
            setTimeout(() => {
              setStartFadeOut(true);
            }, 1000); // Show "READY" message for 1 second before fading
          }, remainingTime);
        }
      }
    };

    // Check initial state
    checkReadyState();

    // Set up event listeners for document loading states
    const handleReadyStateChange = () => checkReadyState();
    document.addEventListener("readystatechange", handleReadyStateChange);

    return () => {
      document.removeEventListener("readystatechange", handleReadyStateChange);
    };
  }, [loadingStartTime, minDisplayTime]);

  // Handle fade-out completion
  useEffect(() => {
    if (startFadeOut) {
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 600); // Match this with the CSS transition duration

      return () => clearTimeout(fadeOutTimer);
    }
  }, [startFadeOut, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className={`loading-screen ${startFadeOut ? "fade-out" : ""}`}>
      <div className="loading-container">
        <div className="globe-container">
          {/* Outer spinner ring */}
          <div className="spinner-ring outer-ring"></div>

          {/* Middle spinner ring */}
          <div className="spinner-ring middle-ring"></div>

          {/* Inner spinner ring */}
          <div className="spinner-ring inner-ring"></div>

          {/* Globe icon */}
          <div className="globe-icon">
            <svg
              width="100"
              height="100"
              viewBox="0 0 192 192"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M48.6318 20.0732C49.8865 18.7276 51.9893 18.6642 53.3281 19.9323L62.9098 28.9919C73.6691 18.7065 88.2071 12.3872 104.188 12.3872C138.009 12.3872 164.539 40.3485 164.124 73.4029C163.956 87.2321 159.071 100.632 150.028 111.41L159.603 120.476C160.942 121.737 161.005 123.851 159.743 125.196C145.788 140.096 126.75 148.804 105.974 149.296L105.981 159.335H117.61C128.601 159.335 137.544 168.325 137.544 179.37C137.544 181.216 136.058 182.71 134.221 182.71H57.791C55.9546 182.71 54.4685 181.216 54.4685 179.37C54.4685 168.324 63.4124 159.335 74.4024 159.335H86.0309V147.148C73.358 144.048 61.638 137.701 51.8819 128.473C21.1816 99.4203 19.7299 50.937 48.6295 20.0739L48.6318 20.0732ZM154.872 89.2046H96.0073C89.5938 89.2046 84.3788 83.9633 84.3788 77.5171C84.3788 71.0499 89.5796 65.8295 96.0073 65.8295H122.593C125.341 65.8295 127.577 63.5822 127.577 60.8207C127.577 58.052 125.348 55.8119 122.593 55.8119H112.626C106.212 55.8119 100.997 50.5706 100.997 44.1244C100.997 37.6572 106.198 32.4368 112.626 32.4368H139.366C129.973 24.1238 117.657 19.0798 104.192 19.0798C74.6133 19.0798 50.8933 43.3007 50.8933 72.6489C50.8933 102.188 74.8017 126.218 104.192 126.218C127.821 126.197 147.909 110.656 154.869 89.205L154.872 89.2046ZM74.4118 166.022C68.2296 166.022 63.0216 170.285 61.5426 176.04H130.48C129.001 170.285 123.793 166.022 117.61 166.022H74.4118ZM99.3377 159.337V149.164C97.1017 149.023 94.8867 148.791 92.6929 148.46L92.6859 159.337L99.3377 159.337ZM56.4482 123.612C83.6027 149.304 126.036 148.783 152.574 122.999L145.494 116.299C134.749 126.592 120.17 132.883 104.195 132.883C68.2152 132.883 40.1151 101.04 44.7482 64.8929C46.2132 53.4592 50.8954 42.7154 58.3393 33.8386L51.2599 27.139C27.2455 55.3186 29.2943 97.9191 56.4482 123.612Z"
                fill="var(--loading-color)"
              />
            </svg>
          </div>
        </div>

        {/* Dynamic text that changes when ready */}
        <div className="loading-text">
          {isReady ? "VIDEO GLOBE READY" : "VIDEO GLOBE LOADING"}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
