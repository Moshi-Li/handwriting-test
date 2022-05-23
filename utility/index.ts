import { readFileSync } from "fs";
import Path from "path";

interface DataUnit {
  words: string[];
  imageId: string;
}

const SENTENCE_FILE = "../tests/ascii/sentences.txt";
const SENTENCE_FILE_COMMENT_COUNT = 25;
const TARGET_TEST_CASE_COUNT = 10;

export const fetchFile = () => {
  const getImageIdFromSentenceId = (sentenceId: string) => {
    return `${sentenceId.split("-")[0]}-${sentenceId.split("-")[1]}`;
  };

  try {
    const data = readFileSync(Path.resolve(__dirname, SENTENCE_FILE), "utf-8");
    const rawSentences = data.split("\n");
    rawSentences.splice(0, SENTENCE_FILE_COMMENT_COUNT);

    const corruptedImageId: Record<string, boolean> = {};

    const trimmedSentences = rawSentences.map((item) => {
      const info = item.split(" ");

      if (info[2] !== "ok") {
        corruptedImageId[getImageIdFromSentenceId(info[0])] = true;
      }
      return info;
    });

    const testCases: Record<string, DataUnit> = {};
    trimmedSentences.forEach((item) => {
      const correspondingImageId = getImageIdFromSentenceId(item[0]);
      if (!corruptedImageId[correspondingImageId]) {
        if (!testCases[correspondingImageId]) {
          testCases[correspondingImageId] = {
            words: [],
            imageId: correspondingImageId,
          };
        }

        testCases[correspondingImageId].words = [
          ...testCases[correspondingImageId].words,
          ...item[9].split("|"),
        ];
      }
    });

    const validDataCount = Object.keys(testCases).length;
    const corruptedDataCount = Object.keys(corruptedImageId).length;
    console.log(`Valid Data Count: ${validDataCount}`);
    console.log(`Corrupted Data Count: ${corruptedDataCount}`);
    console.log(
      `Valid Data Percentage: ${
        validDataCount / (validDataCount + corruptedDataCount)
      }`
    );

    return testCases;
  } catch (e) {
    console.log(e);
  }
};
