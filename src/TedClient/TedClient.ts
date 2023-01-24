import fs from "fs";
import { GraphQLClient } from "graphql-request";
import { setTimeout } from "timers/promises";
import { tedQueries } from "./QueriesTypes";
import { TedTranslationQL } from "./QueriesTypes/translation";
import { TedVideoQL, VideoWithTranslation } from "./QueriesTypes/videos";

import isEqual from "lodash/isEqual";
import uniqWith from "lodash/unionWith";

export const delay = async (time: number) => {
  await setTimeout(time);
};

class TedClient {
  static readonly GRAPH_QL_URL: string = "https://graphql.ted.com/";
  static readonly FILE_OUTPUT: string = "ted_data.json";
  static readonly FILE_OUTPUT_TRANSLATION: string =
    "ted_data_with_translation.json";
  static readonly VIDEOS_PER_PAGE = 50;

  client: GraphQLClient;

  constructor(continueFromLastExecution: boolean = false) {
    this.client = new GraphQLClient(TedClient.GRAPH_QL_URL);
    if (!continueFromLastExecution) {
      try {
        fs.unlinkSync(TedClient.FILE_OUTPUT);
      } catch (_) {}
    }
  }

  saveDataToJson = (data: VideoWithTranslation[], file: string) => {
    const newData = JSON.stringify(data, null, 2);
    fs.writeFileSync(file, newData);
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

  tedVideoQLtoVideoWithTranslation = (tedVideoQL: TedVideoQL) => {
    let videos: VideoWithTranslation[] = [];
    tedVideoQL?.videos?.nodes?.map((value) => {
      videos.push(value);
    });
    return videos;
  };

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

  getAllVideosData = async (
    inMemory: boolean = false,
    delaySeconds: number = 0
  ): Promise<VideoWithTranslation[]> => {
    let hasNextPage = true;
    let data;
    let videos: VideoWithTranslation[] = [];
    let afterNumber = 0;
    let newAfterNumber = 0;
    let pageNumber = 1;
    let counter = 0;
    const numberRequisitionToDelay = 10;

    while (hasNextPage) {
      console.log("Page ", counter + 1);
      data = await this.getVideosDataAfterNumber(afterNumber);

      if (inMemory) {
        data?.videos?.nodes?.map((value) => {
          videos.push(value);
        });
      } else {
        const dataBackup = this.getDataFromFile();
        data?.videos?.nodes?.map((value) => {
          dataBackup.push(value);
        });
        this.saveDataToJson(dataBackup, TedClient.FILE_OUTPUT);
      }
      hasNextPage = data?.videos?.pageInfo?.hasNextPage || false;
      if (hasNextPage) {
        newAfterNumber = parseInt(data?.videos?.pageInfo?.endCursor || "-1");

        pageNumber++; // consider next page
        if (afterNumber >= newAfterNumber) {
          newAfterNumber = this.getFirstIndexInPagination(pageNumber);
        }
        afterNumber = newAfterNumber;
      }
      counter++;

      if (delaySeconds > 0 && counter % numberRequisitionToDelay == 0) {
        await delay(delaySeconds);
      }
    }
    if (inMemory) {
      return videos;
    }
    return this.getDataFromFile();
  };

  getTranslationById = async (talkId: number): Promise<TedTranslationQL> => {
    const variable = {
      talkId: talkId.toString(),
    };
    if (talkId <= 0) {
      return {} as TedTranslationQL;
    }
    try {
      const data = await this.client.request(tedQueries.translation, variable);
      return data;
    } catch (err: any) {
      return {} as TedTranslationQL;
    }
  };

  fillTranslationsOfVideos = async (delaySeconds = 0) => {
    const dataBackup = this.getDataFromFile();
    const numberRequisitionToDelay = 10;
    let counter = 0;
    const total = dataBackup.length;
    const newDataBackup: VideoWithTranslation[] = [];
    for (let videoWithoutTranslation of dataBackup) {
      console.log(`Translation ${counter + 1} of ${total}`);
      if (
        delaySeconds > 0 &&
        counter > 0 &&
        counter % numberRequisitionToDelay == 0
      ) {
        await delay(delaySeconds);
      }

      const videoWithTranslation = videoWithoutTranslation;
      if (videoWithoutTranslation?.translation == undefined) {
        const talkId = videoWithTranslation.id;
        const translationData = await this.getTranslationById(
          parseInt(talkId || "-1")
        );

        if (translationData?.translation != undefined) {
          videoWithTranslation.translation = translationData?.translation;
        }
      }

      newDataBackup.push(videoWithTranslation);
      this.saveDataToJson(newDataBackup, TedClient.FILE_OUTPUT_TRANSLATION);
      counter++;
    }
    return newDataBackup;
  };

  removeDuplicates = (data: VideoWithTranslation[]): VideoWithTranslation[] => {
    let newData: VideoWithTranslation[] = uniqWith(data, isEqual);
    return newData;
  };
}

export { TedClient };
