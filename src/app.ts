import { TedClient } from "./TedClient";

const start = async () => {
  console.log("Ted Client Running...");

  const continueFromLastExecution = true;

  const tedClient: TedClient = new TedClient(continueFromLastExecution);
  const delaySeconds = 5 * 60;

  // each 10 requisitions the app is delayed in 5 minutes
  const videosData = await tedClient.getAllVideosData(false, delaySeconds);

  // each 100 requisitions the app is delayed in 5 minutes
  const videosDataWithTranslation =
    tedClient.fillTranslationsOfVideos(delaySeconds);

  console.log("Ted Client Finished...");
};

start();
