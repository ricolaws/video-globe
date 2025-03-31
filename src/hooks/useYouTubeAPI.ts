import { useState, useEffect, useCallback } from "react";
import YouTubeService from "../services/youTubeService";

// Video data structure
export interface Video {
  id: string;
  views: string;
  location: string | null;
  title: string;
  thumbnail: string;
}

interface YouTubeApiState {
  videos: Video[];
  isLoading: boolean;
  error: Error | null;
  nextPageToken: string | null;
  quotaExceeded: boolean;
}

interface UseYouTubeAPIProps {
  coords: [number, number] | null;
  onError?: () => void;
}

/**
 * Custom hook for fetching YouTube videos based on geographic coordinates
 */
const useYouTubeAPI = ({ coords, onError }: UseYouTubeAPIProps) => {
  const [state, setState] = useState<YouTubeApiState>({
    videos: [],
    isLoading: false,
    error: null,
    nextPageToken: null,
    quotaExceeded: false,
  });

  // Get the YouTube service instance
  const youTubeService = YouTubeService.getInstance({
    proxyUrl:
      import.meta.env.VITE_YOUTUBE_PROXY_URL ||
      "http://localhost:3001/api/youtube",
  });

  // Function to fetch videos based on coordinates
  const fetchVideos = useCallback(
    async (pageToken?: string) => {
      if (!coords || state.quotaExceeded) {
        return;
      }

      const [lat, lon] = coords;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Search for videos
        const searchResponse = await youTubeService.searchVideos(
          lat,
          lon,
          pageToken
        );
        const listItems = searchResponse.items;

        if (!listItems || listItems.length === 0) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error("No videos found for this location"),
          }));
          return;
        }

        const videoIdArray = listItems.map((item) => item.id.videoId);

        // Get additional details for each video
        const detailsResponse = await youTubeService.getVideoDetails(
          videoIdArray
        );

        const newVideos: Video[] = videoIdArray.map((id, index) => {
          const detailsItem = detailsResponse.items.find(
            (item) => item.id === id
          );
          const searchItem = searchResponse.items[index];

          return {
            id,
            views: detailsItem?.statistics.viewCount || "0",
            location:
              detailsItem?.recordingDetails?.locationDescription || null,
            title: searchItem?.snippet.title || "",
            thumbnail: searchItem?.snippet.thumbnails.medium.url || "",
          };
        });

        setState((prev) => ({
          videos: pageToken ? [...prev.videos, ...newVideos] : newVideos,
          isLoading: false,
          error: null,
          nextPageToken: searchResponse.nextPageToken || null,
          quotaExceeded: false,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error fetching videos:", error);

        // Check if this is a quota exceeded error
        if (error.message && error.message.includes("429 Too Many Requests")) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error(
              "YouTube API quota exceeded. Please try again later."
            ),
            quotaExceeded: true,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }));
        }

        if (onError) onError();
      }
    },
    [coords, youTubeService, onError, state.quotaExceeded]
  );

  // Fetch videos when coordinates change
  useEffect(() => {
    if (coords && !state.quotaExceeded) {
      fetchVideos();
    }
  }, [coords, fetchVideos, state.quotaExceeded]);

  // Function to load more videos
  const loadMoreVideos = useCallback(() => {
    if (state.nextPageToken && !state.quotaExceeded) {
      fetchVideos(state.nextPageToken);
    }
  }, [state.nextPageToken, fetchVideos, state.quotaExceeded]);

  return {
    videos: state.videos,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: !!state.nextPageToken,
    loadMoreVideos,
    quotaExceeded: state.quotaExceeded,
  };
};

export default useYouTubeAPI;
