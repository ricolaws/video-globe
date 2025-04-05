export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Load keys from environment
  const API_KEYS = process.env.YOUTUBE_API_KEYS
    ? process.env.YOUTUBE_API_KEYS.split(",").filter(
        (key) => key.trim().length > 0
      )
    : process.env.YOUTUBE_API_KEY
    ? [process.env.YOUTUBE_API_KEY]
    : [];

  if (API_KEYS.length === 0) {
    return res.status(500).json({
      error: "No YouTube API keys found in environment variables",
    });
  }

  // Set up key rotation - using static variable to persist between function calls
  let currentKeyIndex = 0;
  if (typeof handler.currentKeyIndex !== "undefined") {
    currentKeyIndex = handler.currentKeyIndex;
  }

  // Function to get the next API key in rotation
  function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    handler.currentKeyIndex = currentKeyIndex; // Save for next invocation
    return key;
  }

  try {
    console.log("Received YouTube API search request:", req.query);

    const queryParams = new URLSearchParams();

    // Add all query parameters from the request
    Object.entries(req.query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else if (value !== undefined) {
        queryParams.append(key, value);
      }
    });

    // Add the API key using rotation
    const apiKey = getNextApiKey();
    queryParams.append("key", apiKey);

    // Log which key is being used (first 4 chars only for security)
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

    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Proxy server error" });
  }
}
