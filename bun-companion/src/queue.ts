import { createServer } from "node:net";
import { exitWithPause } from "./utils";

const COMMAND_COUNT = "COUNT";
const COMMAND_POP = "POP";
const PIPE_PATH = "\\\\.\\pipe\\RetroRewindCompanion";

export const namesQueue: string[] = [];

export function createAndStartPipeServer() {
  const pipeServer = createServer((connection) => {
    connection.on("data", (data) => {
      const command = data.toString().trim();

      if (command === COMMAND_COUNT) {
        connection.write(namesQueue.length.toString() + "\n");
      } else if (command === COMMAND_POP) {
        const chatterName = namesQueue.shift() ?? "";

        if (chatterName) {
          console.log(`Sent "${chatterName}" to game (${namesQueue.length} remaining)`);
        }

        connection.write(chatterName + "\n");
      } else {
        console.warn(`Unknown pipe command received: ${command}, skipping...`);
      }
    });

    connection.on("error", (err) => {
      console.warn(`Pipe connection error: ${err.message}`);
    });
  });

  pipeServer.on("error", async (err) => {
    if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
      console.error("Another instance is already running. Close it and try again.");
    } else {
      console.error(`Pipe server error: ${err.message}`);
    }

    return await exitWithPause(1);
  });

  pipeServer.listen(PIPE_PATH, () => {
    console.log(`Named pipe server is listening on ${PIPE_PATH}`);
  });
}
