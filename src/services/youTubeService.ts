export interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

class YouTubeService {
  private static instance: YouTubeService;
  private apiKey: string;
  private useFakeData: boolean;

  private constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "";
    this.useFakeData = import.meta.env.VITE_USE_FAKE_DATA === "true";
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  private getFakeVideoData(): { videos: Video[]; nextPageToken?: string } {
    return {
      videos: [
        {
          id: "1lBnHKD0A_g",
          title: "Sample Video 1 - Location Based",
          thumbnail: "https://i.ytimg.com/vi/1lBnHKD0A_g/mqdefault.jpg",
        },
        {
          id: "nLOc1ejA8oo",
          title: "Sample Video 2 - From This Location",
          thumbnail: "https://i.ytimg.com/vi/nLOc1ejA8oo/mqdefault.jpg",
        },
        {
          id: "_dlPsEemkGo",
          title: "Sample Video 3 - Nearby Content",
          thumbnail: "https://i.ytimg.com/vi/_dlPsEemkGo/mqdefault.jpg",
        },
      ],
      nextPageToken: "fakepagetoken123",
    };
  }

  public async getVideosByLocation(
    latitude: number,
    longitude: number,
    pageToken?: string
  ): Promise<{ videos: Video[]; nextPageToken?: string }> {
    // Return fake data if the flag is set
    if (this.useFakeData) {
      console.log(`Using fake data for location: ${latitude}, ${longitude}`);

      // If this is a "next page" request, return different videos to simulate pagination
      if (pageToken) {
        return {
          videos: [
            {
              id: "7EoiLZwvHE0",
              title: "Page 2 - Sample Video 1",
              thumbnail: "https://i.ytimg.com/vi/7EoiLZwvHE0/mqdefault.jpg",
            },
            {
              id: "kJQP7kiw5Fk",
              title: "Page 2 - Sample Video 2",
              thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg",
            },
          ],
          nextPageToken: "", // No more pages
        };
      }

      return this.getFakeVideoData();
    }

    // Original API call logic
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
    const videos = data.items.map(
      (item: {
        id: { videoId: string };
        snippet: { title: string; thumbnails: { medium: { url: string } } };
      }) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || "",
      })
    );

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  }
}

export default YouTubeService;
