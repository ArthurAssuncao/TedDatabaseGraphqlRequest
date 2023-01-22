import fs from "fs";
import { GraphQLClient } from "graphql-request";
import { tedQueries } from "./QueriesTypes";
import { TedVideoQL, VideoWithTranslation } from "./QueriesTypes/videos";

class TedClient {
  static readonly GRAPH_QL_URL: string = "https://graphql.ted.com/";
  static readonly FILE_OUTPUT: string = "ted_data.json";
  static readonly VIDEOS_PER_PAGE = 50;

  client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(TedClient.GRAPH_QL_URL);
    fs.unlinkSync(TedClient.FILE_OUTPUT);
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

  saveDataToJson = (data: VideoWithTranslation[]) => {
    const newData = JSON.stringify(data, null, 2);
    fs.writeFileSync(TedClient.FILE_OUTPUT, newData);
  };

  getDataFromFile = (): VideoWithTranslation[] => {
    try {
      const data = fs.readFileSync(TedClient.FILE_OUTPUT, {
        encoding: "utf8",
        flag: "r",
      });
      const json: VideoWithTranslation[] = JSON.parse(data);
      return json;
    } catch {
      return [];
    }
  };

  getAllVideosData = async (
    inMemory: boolean = false
  ): Promise<VideoWithTranslation[]> => {
    let hasNextPage = true;
    let data;
    let videos: VideoWithTranslation[] = [];
    let afterNumber = 0;
    let newAfterNumber = 0;
    let pageNumber = 1;

    while (hasNextPage) {
      data = await this.getVideosDataAfterNumber(afterNumber);
      if (inMemory) {
        data?.data?.videos?.nodes?.map((value) => {
          videos.push(value);
        });
      } else {
        const dataBackup = this.getDataFromFile();
        data?.data?.videos?.nodes?.map((value) => {
          dataBackup.push(value);
        });
        this.saveDataToJson(dataBackup);
      }
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
    if (inMemory) {
      return videos;
    }
    return this.getDataFromFile();
  };
}

export { TedClient };
