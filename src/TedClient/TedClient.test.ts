import fs from "fs";
import { GraphQLClient } from "graphql-request";
import path from "path";
import { TedClient } from "./TedClient";

describe("TedClint", () => {
  let tedClient: TedClient;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    tedClient = new TedClient();
  });

  const loadVideosDataFileFirst = () => {
    const filePath = path.resolve(__dirname, "./mocks/videos_page_first.json");
    const jsonData = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(jsonData);
  };

  const loadVideosDataFileLast = () => {
    const filePath = path.resolve(__dirname, "./mocks/videos_page_last.json");
    const jsonData = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(jsonData);
  };

  const loadTranslationDataFile = (talkId: number) => {
    const filePath = path.resolve(
      __dirname,
      `./mocks/translation_${talkId}.json`
    );
    const jsonData = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(jsonData);
  };

  const loadVideosCompleteFirstPageDataFile = () => {
    const filePath = path.resolve(
      __dirname,
      `./mocks/videos_first_page_with_translations.json`
    );
    const jsonData = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(jsonData);
  };

  const loadVideosWithFieldTranslationFirstDataFile = () => {
    const filePath = path.resolve(
      __dirname,
      `./mocks/videos_first_page_in_type_videos_with_translation.json`
    );
    const jsonData = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(jsonData);
  };

  test("should return -1 when page number is zero", () => {
    const pageNumber = 0;
    const firstIndex = tedClient.getFirstIndexInPagination(pageNumber);

    expect(firstIndex).toBe(-1);
  });

  test("should return -1 when page number is negative", () => {
    const pageNumber = -1000;
    const firstIndex = tedClient.getFirstIndexInPagination(pageNumber);

    expect(firstIndex).toBe(-1);
  });

  test("should return correct index of first video in pagination", () => {
    let pageNumber = 1;
    let firstIndexCorerct = 0;
    let firstIndex = tedClient.getFirstIndexInPagination(pageNumber);

    expect(firstIndex).toBe(firstIndexCorerct);

    pageNumber = 2;
    firstIndexCorerct = 50;
    firstIndex = tedClient.getFirstIndexInPagination(pageNumber);

    expect(firstIndex).toBe(firstIndexCorerct);

    pageNumber = 10;
    firstIndexCorerct = 450;
    firstIndex = tedClient.getFirstIndexInPagination(pageNumber);

    expect(firstIndex).toBe(firstIndexCorerct);
  });

  test("should return empty list of videos on error", async () => {
    jest.spyOn(GraphQLClient.prototype, "request").mockRejectedValue({});

    const result = await tedClient.getVideosDataAfterNumber(0);

    expect(result).toStrictEqual({});
  });

  test("should return all videos of a page", async () => {
    const jsonData = loadVideosDataFileFirst();

    jest.spyOn(GraphQLClient.prototype, "request").mockResolvedValue(jsonData);

    const result = await tedClient.getVideosDataAfterNumber(0);

    expect(result.videos?.nodes?.length).toBeGreaterThanOrEqual(
      TedClient.VIDEOS_PER_PAGE
    );

    expect(result).toStrictEqual(jsonData);
  });

  test("should return all videos of the last page", async () => {
    const jsonData = loadVideosDataFileLast();
    const TOTAL_VIDEOS_LAST_PAGE = 39;

    jest.spyOn(GraphQLClient.prototype, "request").mockResolvedValue(jsonData);

    const result = await tedClient.getVideosDataAfterNumber(0);

    expect(result.videos?.nodes?.length).toBeGreaterThanOrEqual(
      TOTAL_VIDEOS_LAST_PAGE
    );

    expect(result).toStrictEqual(jsonData);
  });

  test("should return 139 videos", async () => {
    const MAX_END_CURSOR_CURRENTLY = 100;
    const TOTAL_VIDEOS_CURRENTLY = 139;
    const jsonDataFirst = loadVideosDataFileFirst();
    const jsonDataLast = loadVideosDataFileLast();

    tedClient.getVideosDataAfterNumber = jest
      .fn()
      .mockImplementation((afterNumber: number) => {
        if (afterNumber < MAX_END_CURSOR_CURRENTLY) {
          return jsonDataFirst;
        }
        return jsonDataLast;
      });

    const result = await tedClient.getAllVideosData();

    expect(result.length).toBe(TOTAL_VIDEOS_CURRENTLY);
  });

  test("should return 4189 videos", async () => {
    const MAX_END_CURSOR_CURRENTLY = 4150;
    const TOTAL_VIDEOS_CURRENTLY = 4189;
    const jsonDataFirst = loadVideosDataFileFirst();
    const jsonDataLast = loadVideosDataFileLast();

    tedClient.getVideosDataAfterNumber = jest
      .fn()
      .mockImplementation((afterNumber: number) => {
        if (afterNumber < MAX_END_CURSOR_CURRENTLY) {
          return jsonDataFirst;
        }
        return jsonDataLast;
      });

    const result = await tedClient.getAllVideosData();

    expect(result.length).toBe(TOTAL_VIDEOS_CURRENTLY);
  });

  test("should return empty object on error", async () => {
    jest.spyOn(GraphQLClient.prototype, "request").mockRejectedValue({});
    const validId = 99754;

    const result = await tedClient.getTranslationById(validId);

    expect(result).toStrictEqual({});
  });

  test("should return empty object when id is invalid", async () => {
    const invalidId = -1;
    const validId = 99754;
    const jsonData = loadTranslationDataFile(validId);

    jest.spyOn(GraphQLClient.prototype, "request").mockResolvedValue(jsonData);

    const result = await tedClient.getTranslationById(invalidId);

    expect(result).toStrictEqual({});
  });

  test("should return complete translation of video when id is valid", async () => {
    const validId = 99754;
    const jsonData = loadTranslationDataFile(validId);

    jest.spyOn(GraphQLClient.prototype, "request").mockResolvedValue(jsonData);

    const result = await tedClient.getTranslationById(validId);

    expect(result).toStrictEqual(jsonData);
  });

  test("should return videoWithTranslation", () => {
    const videosData = loadVideosDataFileFirst();
    const videosWithTranslationData =
      loadVideosWithFieldTranslationFirstDataFile();
    const videos = tedClient.tedVideoQLtoVideoWithTranslation(videosData);

    expect(videos).toStrictEqual(videosWithTranslationData);
  });

  test("should return complete video data including translation", async () => {
    const validId = 99754;
    tedClient.getDataFromFile = jest.fn().mockImplementation(() => {
      return loadVideosWithFieldTranslationFirstDataFile();
    });

    tedClient.getTranslationById = jest.fn().mockImplementation(() => {
      return loadTranslationDataFile(validId);
    });

    const result = await tedClient.fillTranslationsOfVideos();
    const resultCorrect = loadVideosCompleteFirstPageDataFile();

    expect(result).toStrictEqual(resultCorrect);
  });
});
