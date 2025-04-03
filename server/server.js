import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mockResponse from "./mockYouTubeResponse.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Load keys from environment
const API_KEYS = process.env.YOUTUBE_API_KEYS
  ? process.env.YOUTUBE_API_KEYS.split(",").filter(
      (key) => key.trim().length > 0
    )
  : process.env.YOUTUBE_API_KEY
  ? [process.env.YOUTUBE_API_KEY]
  : [];

if (API_KEYS.length === 0) {
  console.error(
    "No YouTube API keys found. Set YOUTUBE_API_KEY or YOUTUBE_API_KEYS in your .env file."
  );
  process.exit(1);
}

console.log(`Loaded ${API_KEYS.length} YouTube API key(s)`);

// Set up key rotation
let currentKeyIndex = 0;

// Function to get the next API key in rotation
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const youtubeApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// YouTube API proxy endpoint with rate limiting
app.get("/api/youtube/search", youtubeApiLimiter, async (req, res) => {
  try {
    console.log("Received YouTube API search request:", req.query);

    const queryParams = new URLSearchParams(req.query);

    // Add the API key using rotation
    const apiKey = getNextApiKey();
    queryParams.append("key", apiKey);

    // Log which key is being used (first 4 chars only)
    const keyIdentifier = `${apiKey.substring(0, 4)}...`;
    console.log(
      `Using API key ${keyIdentifier} (${currentKeyIndex + 1}/${
        API_KEYS.length
      })`
    );

    // Make the request to YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${queryParams.toString()}`
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return res.status(response.status).json({
        error: "YouTube API error",
        status: response.status,
      });
    }

    const data = await response.json();
    console.log(
      `Successfully retrieved ${
        data.items?.length || 0
      } results from YouTube API`
    );

    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy server error" });
  }
});

// NEW: YouTube Videos API endpoint for detailed video information
app.get("/api/youtube/videos", youtubeApiLimiter, async (req, res) => {
  try {
    console.log("Received YouTube API videos request:", req.query);

    const queryParams = new URLSearchParams(req.query);

    // Add the API key using rotation
    const apiKey = getNextApiKey();
    queryParams.append("key", apiKey);

    // Log which key is being used (first 4 chars only)
    const keyIdentifier = `${apiKey.substring(0, 4)}...`;
    console.log(
      `Using API key ${keyIdentifier} (${currentKeyIndex + 1}/${
        API_KEYS.length
      }) for videos endpoint`
    );

    // Make the request to YouTube Videos API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${queryParams.toString()}`
    );

    if (!response.ok) {
      console.error("YouTube Videos API error:", response.status);
      return res.status(response.status).json({
        error: "YouTube Videos API error",
        status: response.status,
      });
    }

    const data = await response.json();
    console.log(
      `Successfully retrieved ${
        data.items?.length || 0
      } video details from YouTube API`
    );

    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy server error" });
  }
});

// Fake data endpoint for search - returns the mock response
app.get("/api/youtube/fake/search", (req, res) => {
  console.log("Serving fake YouTube search data");

  // Add a slight delay
  setTimeout(() => {
    res.json(mockResponse);
  }, 200);
});

// NEW: Fake data endpoint for videos
app.get("/api/youtube/fake/videos", (req, res) => {
  console.log("Serving fake YouTube videos data");

  // Extract video IDs from request
  const videoIds = req.query.id ? String(req.query.id).split(",") : [];

  // Generate fake video details data
  const fakeVideoDetails = {
    items: videoIds.map((id) => ({
      id,
      snippet: {
        publishedAt: new Date().toISOString(),
        description:
          "This is a sample video description. Location: New York City, Central Park.",
      },
      statistics: {
        viewCount: String(Math.floor(Math.random() * 100000)),
        likeCount: String(Math.floor(Math.random() * 5000)),
      },
      recordingDetails: {
        locationDescription: "New York City, Central Park",
        location: {
          latitude: 40.785091,
          longitude: -73.968285,
        },
      },
    })),
  };

  // Add a slight delay
  setTimeout(() => {
    res.json(fakeVideoDetails);
  }, 200);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
