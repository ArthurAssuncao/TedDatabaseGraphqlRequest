import { gql } from "graphql-request";

export interface TedTranslationQL {
  translation?: Translation;
}

export interface Translation {
  paragraphs?: Paragraph[];
}

export interface Paragraph {
  cues?: Cue[];
}

export interface Cue {
  text?: string;
  time?: number;
}

const translationQuery = gql`
  {
    query
    translation(videoId: $id, language: "en") {
      paragraphs {
        cues {
          text
          time
        }
      }
    }
  }
`;

export { translationQuery };
