import { useState, useEffect } from "react";
import YouTubeService, { Video } from "../services/youTubeService";

const useYouTubeAPI = (coords: [number, number] | null) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const [lastFetched, setLastFetched] = useState<string | null>(null);

  // Fetch videos when coordinates change
  useEffect(() => {
    const fetchVideos = async () => {
      // Don't fetch if there are no coordinates
      if (!coords) return;

      // Don't fetch for the same coordinates twice
      const coordsString = `${coords[0]},${coords[1]}`;
      if (coordsString === lastFetched) return;

      setIsLoading(true);
      setError(null);

      try {
        const service = YouTubeService.getInstance();
        const result = await service.getVideosByLocation(coords[0], coords[1]);

        setVideos(result.videos);
        setNextPageToken(result.nextPageToken || null);
        setLastFetched(coordsString);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching videos");
        console.error("YouTube API error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [coords, lastFetched]);

  // Load more videos
  const loadMoreVideos = async () => {
    if (!coords || !nextPageToken || isLoading) return;

    setIsLoading(true);

    try {
      const service = YouTubeService.getInstance();
      const result = await service.getVideosByLocation(
        coords[0],
        coords[1],
        nextPageToken
      );

      setVideos((prev) => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading more videos"
      );
      console.error("YouTube API error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    videos,
    isLoading,
    error,
    hasMore: !!nextPageToken,
    loadMoreVideos,
  };
};

export default useYouTubeAPI;
