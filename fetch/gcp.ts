import GVision from "@google-cloud/vision";
import Path from "path";
import { ImageMeta } from "../utility/data";
import { compare } from "../utility/comparison";

const IMAGE_DIR_PATH = "../tests/images";

async function quickstart() {
  // Imports the Google Cloud client library

  // Creates a client
  const client = new GVision.ImageAnnotatorClient();

  try {
    const credential = await client.auth.getCredentials();
  } catch (e) {}

  // Performs label detection on the image file
  //const result = await client.textDetection(Path.resolve(__dirname, FILE_URL));
}

interface ResultGCP {
  imageId: string;
  success: boolean;
  value?: string;
  reason?: any;
}

export const testImages = async (
  randomImageIds: string[],
  imageMeta: Record<string, ImageMeta>
) => {
  const client = new GVision.ImageAnnotatorClient();

  const requests = randomImageIds.map((id) =>
    client.textDetection(Path.resolve(__dirname, `${IMAGE_DIR_PATH}/${id}.png`))
  );
  const responses = await Promise.allSettled(requests);

  const result: ResultGCP[] = responses.map((response, index) => {
    if (response.status === "fulfilled") {
      return {
        imageId: randomImageIds[index],
        success: true,
        value: response.value[0].fullTextAnnotation?.text as string,
      };
    } else {
      return {
        imageId: randomImageIds[index],
        success: false,
        reason: response.reason,
      };
    }
  });

  return result
    .map((item) => {
      if (item.success && item.value) {
        const { imageId } = item;
        const [, , ...lines] = item.value.split("-\n").join("").split("\n");
        //console.log(lines.join(" ").split(" "));
        //item.value.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ");
        const words = lines
          .join(" ")
          .replace(/[^\w\s\']|_/g, "")
          .replace(/\s+/g, " ")
          .split(" ");

        const testAnswer = words.slice(0, imageMeta[imageId].wordsCount);
        const testResult = words.slice(
          imageMeta[imageId].wordsCount,
          words.length
        );

        return {
          imageId,
          testAnswer,
          testResult,
          accuracy: compare(testResult as string[], testAnswer as string[]),
        };
      } else {
        return undefined;
      }
    })
    .filter((item) => item !== undefined);
};

export const authCheck = async () => {
  const client = new GVision.ImageAnnotatorClient();
  const credential = await client.auth.getCredentials();
  console.log(`Running with GCP user: ${credential.client_email}`);
  client.close();
};
