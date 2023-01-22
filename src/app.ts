import { TedClient } from "./TedClient";

const start = async () => {
  console.log("Ted Client Running...");

  const tedClient: TedClient = new TedClient();

  const videosData = await tedClient.getAllVideosData();

  tedClient.saveDataToJson(videosData);
};
