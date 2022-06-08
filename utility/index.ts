import { ImageMeta, fetchFile } from "./data";
import {
  authCheck as gcpAuthCheck,
  testImages as gcpTestImages,
} from "../fetch/gcp";

import {
  authCheck as awsAuthCheck,
  testImages as awsTestImages,
} from "../fetch/aws";

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
    let count = 0;
    while (count < imageCount) {
      result.push(
        this.imageNames[Math.floor(Math.random() * this.imageNames.length)]
      );
      count++;
    }
    return result;
  }

  private async runGCP(imageCount: number) {
    try {
      await gcpAuthCheck();
    } catch (e) {
      throw new Error("Client authentication failed");
    }

    const randomImageIds = this.getRandomImageId(imageCount);
    //const randomImageIds: string[] = ["a01-007"];

    try {
      await gcpTestImages(randomImageIds, this.imageMeta);
    } catch (e) {}
  }

  private async runAWS(imageCount: number) {
    try {
      await awsAuthCheck();
    } catch (e) {
      throw new Error("Client authentication failed");
    }

    const randomImageIds = this.getRandomImageId(imageCount);

    try {
      await awsTestImages(randomImageIds, this.imageMeta);
    } catch (e) {}
  }

  runTest(type: "aws" | "gcp", imageCount: number) {
    if (type === "aws") this.runAWS(imageCount);
    if (type === "gcp") this.runGCP(imageCount);
  }

  printStatus() {
    console.log(this.imageMeta);
    console.log(this.imageNames);
  }
}
