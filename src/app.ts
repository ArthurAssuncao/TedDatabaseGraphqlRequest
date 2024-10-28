import fs from "fs";
import { TedClient } from "./TedClient";
import { VideoWithTranslation } from "./TedClient/QueriesTypes/videos";

const FILE_OUTPUT: string = "ted_data.json";

const saveDataToJson = (data: VideoWithTranslation[], file: string) => {
  const newData = JSON.stringify(data, null, 2);
  fs.writeFileSync(file, newData);
};

const start = async () => {
  console.log("Ted Client Running...");

  const continueFromLastExecution = true;
  const initialAfter = 0;

  const tedClient: TedClient = new TedClient(
    continueFromLastExecution,
    initialAfter
  );
  const delaySeconds = 0; // 5 * 60 * 1000;

  // each 10 requisitions the app is delayed in 5 minutes
  const data = await tedClient.getAllVideosData(false, delaySeconds);

  // each 100 requisitions the app is delayed in 5 minutes
  // await tedClient.fillTranslationsOfVideos(delaySeconds);

  saveDataToJson(data, FILE_OUTPUT);

  console.log("Ted Client Finished...");
};

start();
