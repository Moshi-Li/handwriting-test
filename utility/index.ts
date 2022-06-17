import { writeFileSync, openSync, closeSync } from "fs";
import Path from "path";
import { ImageMeta, fetchFile } from "./data";
import {
  authCheck as gcpAuthCheck,
  testImages as gcpTestImages,
} from "../fetch/gcp";

import {
  authCheck as awsAuthCheck,
  testImages as awsTestImages,
} from "../fetch/aws";

interface unifiedResult {
  imageId: string;
  testAnswer: string[];
  testResult: string[];
  accuracy: number;
}

export class TestTool {
  imageMeta: Record<string, ImageMeta>;
  imageNames: string[];

  constructor() {
    this.imageMeta = fetchFile();
    this.imageNames = Object.keys(this.imageMeta);
    console.log("\n===Initialization done===\n");
  }

  private getRandomImageId(imageCount: number) {
    const result: string[] = [];
    const map: Record<string, boolean> = {};
    let count = 0;
    while (count < imageCount) {
      const imageName =
        this.imageNames[Math.floor(Math.random() * this.imageNames.length)];

      if (!map[imageName]) {
        result.push(imageName);
        map[imageName] = true;
        count++;
      }
    }
    return result;
  }

  private async runGCP(imageIds: string[]) {
    try {
      await gcpAuthCheck();
    } catch (e) {
      throw new Error("GCP Client authentication failed");
    }

    try {
      return await gcpTestImages(imageIds, this.imageMeta);
    } catch (e) {}
  }

  private async runAWS(imageIds: string[]) {
    try {
      await awsAuthCheck();
    } catch (e) {
      throw new Error("AWS Client authentication failed");
    }

    try {
      return await awsTestImages(imageIds, this.imageMeta);
    } catch (e) {}
  }

  runTest(type: "aws" | "gcp", imageCount: number) {
    const randomImageIds = this.getRandomImageId(imageCount);
    if (type === "aws") return this.runAWS(randomImageIds);
    if (type === "gcp") return this.runGCP(randomImageIds);
  }

  async myTest(imageCount: number) {
    const randomImageIds = this.getRandomImageId(imageCount);

    const Map: Record<string, any> = {};

    const gcpResult = (await this.runGCP(randomImageIds)) as unifiedResult[];
    const awsResult = (await this.runAWS(randomImageIds)) as unifiedResult[];

    randomImageIds.forEach((imageId) => (Map[imageId] = {}));

    gcpResult?.forEach((item) => {
      Map[item?.imageId as string]["gcp"] = item;
    });
    awsResult?.forEach((item) => {
      Map[item?.imageId as string]["aws"] = item;
    });

    console.log("\n===Report===\n");
    console.log(`Number of images selected: ${randomImageIds.length}`);
    console.log(`GCP Success Req Count: ${gcpResult?.length}`);
    console.log(`AWS Success Req Count: ${awsResult?.length}`);

    console.log("\n ===AWS Accuracy Metrics===");
    const awsAccuracy = awsResult
      .sort((a, b) => {
        if (a.accuracy > b.accuracy) return 1;
        if (a.accuracy < b.accuracy) return -1;
        return 0;
      })
      .map((item) => item.accuracy);

    console.log(
      `High: ${awsAccuracy[awsAccuracy.length - 1].toFixed(
        2
      )}, Low: ${awsAccuracy[0].toFixed(2)}, Avg: ${(
        awsAccuracy.reduce((accumulator, a) => accumulator + a, 0) /
        awsAccuracy.length
      ).toFixed(2)}, Median: ${awsAccuracy[
        Math.floor(awsAccuracy.length / 2)
      ].toFixed(2)}\n`
    );

    console.log("\n ===GCP Accuracy Metrics===");

    const gcpAccuracy = gcpResult
      .sort((a, b) => {
        if (a.accuracy > b.accuracy) return 1;
        if (a.accuracy < b.accuracy) return -1;
        return 0;
      })
      .map((item) => item.accuracy);

    console.log(
      `High: ${gcpAccuracy[gcpAccuracy.length - 1].toFixed(
        2
      )}, Low: ${gcpAccuracy[0].toFixed(2)}, Avg: ${(
        gcpAccuracy.reduce((accumulator, a) => accumulator + a, 0) /
        gcpAccuracy.length
      ).toFixed(2)}, Median: ${gcpAccuracy[
        Math.floor(gcpAccuracy.length / 2)
      ].toFixed(2)}\n`
    );

    const path = Path.resolve(`./output/${new Date().getTime()}.json`);
    const file = openSync(path, "w");
    writeFileSync(file, JSON.stringify(Map));
    closeSync(file);
    console.log(`The detailed results are stored at ${path}\n`);
  }

  async printStatus() {
    console.log(`Meta data count: ${Object.keys(this.imageMeta).length}`);
    console.log(`Image names count: ${this.imageNames.length}`);

    try {
      await awsAuthCheck();
    } catch (e) {
      throw new Error("AWS Client authentication failed");
    }

    try {
      await gcpAuthCheck();
    } catch (e) {
      throw new Error("GCP Client authentication failed");
    }
  }
}
