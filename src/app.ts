import { TedClient } from "./TedClient";

const start = async () => {
  console.log("Ted Client Running...");

  const tedClient: TedClient = new TedClient();

  // each 100 requisitions the app is delayed in 5 minutes
  const videosData = await tedClient.getAllVideosData(false, 5 * 60);

  const videosDataWithTranslation = tedClient.fillTranslationsOfVideos();

  // tedClient.saveDataToJson(videosDataWithTranslation);
  console.log("Ted Client Finished...");
};

start();
