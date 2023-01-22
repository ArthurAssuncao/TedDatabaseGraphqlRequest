import { gql } from "graphql-request";
import { Translation } from "./translation";

export interface TedVideoQL {
  data?: Data;
}

export interface Data {
  videos?: Videos;
}

export interface Videos {
  pageInfo?: PageInfo;
  nodes?: VideosNode[];
}

export interface VideosNode {
  audioInternalLanguageCode?: string;
  canonicalUrl?: string;
  description?: string;
  duration?: number;
  id?: string;
  primaryImageSet?: PrimaryImageSet[];
  language?: string;
  presenterDisplayName?: string;
  speakers?: Speakers;
  title?: string;
  topics?: Topics;
  type?: Type;
  viewedCount?: number;
}

export interface PrimaryImageSet {
  url?: string;
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
      }
      nodes {
        audioInternalLanguageCode
        canonicalUrl
        description
        duration
        id
        language
        presenterDisplayName
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
