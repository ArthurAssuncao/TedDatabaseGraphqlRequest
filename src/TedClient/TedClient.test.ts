import fs from "fs";
import { GraphQLClient } from "graphql-request";
import path from "path";
import { TedClient } from "./TedClient";

describe("TedClint", () => {
  const tedClient = new TedClient();

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

  afterEach(() => {
    jest.clearAllMocks();
  });

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

    expect(result.data?.videos?.nodes?.length).toBeGreaterThanOrEqual(
      TedClient.VIDEOS_PER_PAGE
    );

    expect(result).toStrictEqual(jsonData);
  });

  test("should return all videos of the last page", async () => {
    const jsonData = loadVideosDataFileLast();
    const TOTAL_VIDEOS_LAST_PAGE = 39;

    jest.spyOn(GraphQLClient.prototype, "request").mockResolvedValue(jsonData);

    const result = await tedClient.getVideosDataAfterNumber(0);

    expect(result.data?.videos?.nodes?.length).toBeGreaterThanOrEqual(
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
});
