import { gql } from "graphql-request";
import { Translation } from "./translation";

export interface TedVideoQL {
  videos?: Videos;
}

export interface Videos {
  pageInfo?: PageInfo;
  nodes?: VideosNode[];
}

export interface VideosNode {
  primaryImageSet?: PrimaryImageSet[];
  videoDownloads?: VideoDownloads;
  audioInternalLanguageCode?: string;
  canonicalUrl?: string;
  description?: string;
  duration?: number;
  id?: string;
  language?: string;
  presenterDisplayName?: string;
  publishedAt?: Date;
  recordedOn?: Date;
  hasTranslations?: boolean;
  nativeDownloads?: NativeDownloads;
  speakers?: Speakers;
  title?: string;
  topics?: Topics;
  type?: Type;
  viewedCount?: number;
}

export interface NativeDownloads {
  low?: string;
  medium?: string;
  high?: string;
}

export interface PrimaryImageSet {
  url?: string;
  aspectRatioName?: string;
}

export interface Speakers {
  nodes?: SpeakersNode[];
}

export interface SpeakersNode {
  description?: string;
  id?: string;
  firstname?: string;
  lastname?: string;
  photoUrl?: string;
  slug?: string;
}

export interface Topics {
  nodes?: Type[];
}

export interface Type {
  name?: string;
}

export interface VideoDownloads {
  nodes?: VideoDownloadsNode[];
}

export interface VideoDownloadsNode {
  url?: string;
}

export interface PageInfo {
  endCursor?: string;
  hasNextPage?: boolean;
}

export interface VideoWithTranslation extends VideosNode {
  translation?: Translation;
}

const videosQuery = gql`
  query getVideos($initialValue: String!) {
    videos(isPublished: true, after: $initialValue) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        primaryImageSet {
          url
          aspectRatioName
        }
        videoDownloads {
          nodes {
            url
          }
        }
        audioInternalLanguageCode
        canonicalUrl
        description
        duration
        id
        language
        presenterDisplayName
        publishedAt
        recordedOn
        hasTranslations
        nativeDownloads {
          low
          medium
          high
        }
        speakers {
          nodes {
            description
            id
            firstname
            lastname
            photoUrl
            slug
          }
        }
        title
        topics {
          nodes {
            name
          }
        }
        type {
          name
        }
        viewedCount
      }
    }
  }
`;

export { videosQuery };
