import GVision from "@google-cloud/vision";
import Path from "path";
import { fetchFile } from "../utility";

const FILE_URL = "../tests/images/a01-007.png";

async function quickstart() {
  // Imports the Google Cloud client library

  // Creates a client
  const client = new GVision.ImageAnnotatorClient();

  // Performs label detection on the image file
  const result = await client.textDetection(Path.resolve(__dirname, FILE_URL));
  console.log(
    result[0].textAnnotations
      ? result[0].textAnnotations.forEach((item) =>
          console.log(item.description)
        )
      : "error here"
  );
  const data = fetchFile();
  console.log(data ? data["a01-007u"] : "e");
}
quickstart();
