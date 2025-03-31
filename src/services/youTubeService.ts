export interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

class YouTubeService {
  private static instance: YouTubeService;
  private apiKey: string;

  private constructor() {
    this.apiKey =
      import.meta.env.VITE_YOUTUBE_API_KEY ||
      "AIzaSyDZnwNAyGq9WSiRv1563RUaF3FqaDnqi7Y";
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  public async getVideosByLocation(
    latitude: number,
    longitude: number,
    pageToken?: string
  ): Promise<{ videos: Video[]; nextPageToken?: string }> {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "15",
      location: `${latitude}, ${longitude}`,
      locationRadius: "100km",
      videoEmbeddable: "true",
      key: this.apiKey,
    });

    if (pageToken) {
      params.append("pageToken", pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    // Map to simplified video objects
    const videos = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || "",
    }));

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  }
}

export default YouTubeService;
