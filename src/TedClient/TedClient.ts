import fs from "fs";
import { GraphQLClient } from "graphql-request";
import { tedQueries } from "./QueriesTypes";
import { TedVideoQL, VideosNode } from "./QueriesTypes/videos";

class TedClient {
  static readonly GRAPH_QL_URL: string = "https://graphql.ted.com/";
  static readonly VIDEOS_PER_PAGE = 50;

  client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(TedClient.GRAPH_QL_URL);
  }

  getFirstIndexInPagination = (pageNumber: number) => {
    if (pageNumber < 1) {
      return -1;
    }
    return (pageNumber - 1) * TedClient.VIDEOS_PER_PAGE;
  };

  getVideosDataAfterNumber = async (
    afterNumber: number
  ): Promise<TedVideoQL> => {
    const firstIndexInPagination = afterNumber.toString();
    const variable = {
      initialValue: firstIndexInPagination,
    };
    if (afterNumber < 0) {
      return {} as TedVideoQL;
    }
    try {
      const data = await this.client.request(tedQueries.videos, variable);
      return data;
    } catch (err: any) {
      return {} as TedVideoQL;
    }
  };

  saveDataToJson = (data: VideosNode[]) => {
    const newData = JSON.stringify(data, null, 2);
    fs.writeFileSync("ted_data.json", newData);
  };

  getAllVideosData = async (): Promise<VideosNode[]> => {
    let hasNextPage = true;
    let data;
    let videos: VideosNode[] = [];
    let afterNumber = 0;
    let newAfterNumber = 0;
    let pageNumber = 1;

    while (hasNextPage) {
      data = await this.getVideosDataAfterNumber(afterNumber);
      data?.data?.videos?.nodes?.map((value) => {
        videos.push(value);
      });
      hasNextPage = data?.data?.videos?.pageInfo?.hasNextPage || false;
      if (hasNextPage) {
        newAfterNumber = parseInt(
          data?.data?.videos?.pageInfo?.endCursor || "-1"
        );

        pageNumber++; // consider next page
        if (afterNumber >= newAfterNumber) {
          newAfterNumber = this.getFirstIndexInPagination(pageNumber);
        }
        afterNumber = newAfterNumber;
      }
    }
    return videos;
  };
}

export { TedClient };
