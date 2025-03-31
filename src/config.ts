/**
 * Application configuration file
 * Values are loaded from environment variables with fallbacks
 */

interface Config {
  // YouTube API settings
  youtube: {
    proxyUrl: string;
  };
  // Feature flags
  features: {
    debug: boolean;
  };
}

// Load environment variables with fallbacks
const config: Config = {
  youtube: {
    proxyUrl:
      import.meta.env.VITE_YOUTUBE_PROXY_URL ||
      "http://localhost:3001/api/youtube",
  },
  features: {
    debug: import.meta.env.VITE_DEBUG === "true" || false,
  },
};

export default config;
