import { TestTool } from "./utility";
import "./fetch/aws";

const runner = new TestTool();

const main = async () => {
  await runner.runTest("aws", 2);
  await runner.runTest("gcp", 2);
};

main();
