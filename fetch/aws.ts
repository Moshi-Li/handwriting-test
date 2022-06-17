import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";
import { readFileSync } from "fs";
import Path from "path";
import { ImageMeta } from "../utility/data";
import { compare } from "../utility/comparison";

const IMAGE_DIR_PATH = "../tests/images";

interface ResultAWS {
  imageId: string;
  success: boolean;
  value?: (string | undefined)[];
  reason?: any;
}

export const testImages = async (
  randomImageIds: string[],
  imageMeta: Record<string, ImageMeta>
) => {
  const client = new TextractClient({ region: "us-east-1" });

  const requests = randomImageIds.map((id) => {
    return client.send(
      new AnalyzeDocumentCommand({
        Document: {
          Bytes: readFileSync(
            Path.resolve(__dirname, `${IMAGE_DIR_PATH}/${id}.png`)
          ),
        },
        FeatureTypes: ["TABLES"],
      })
    );
  });

  const responses = await Promise.allSettled(requests);

  const result: ResultAWS[] = responses.map((response, index) => {
    if (response.status === "fulfilled") {
      return {
        imageId: randomImageIds[index],
        success: true,
        value: response.value.Blocks?.filter(
          (item) => item.BlockType === "WORD"
        )
          .map((item) => item.Text)
          .slice(3),
      };
    } else {
      return {
        imageId: randomImageIds[index],
        success: false,
        value: response.reason,
      };
    }
  });

  return result
    .map((item) => {
      if (item.success && item.value) {
        const { imageId } = item;
        const testAnswer = item.value.slice(0, imageMeta[imageId].wordsCount);
        const testResult = item.value.slice(
          imageMeta[imageId].wordsCount,
          item.value.length
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
  const client = new TextractClient({ region: "us-east-1" });
  const credential = await client.config.credentials();
  console.log(`Running with AWS user: ${credential.accessKeyId}`);
  client.destroy();
};
