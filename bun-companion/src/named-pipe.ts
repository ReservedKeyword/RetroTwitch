import { createServer } from "node:net";
import type { Configuration } from "./config";
import { logger as baseLogger } from "./logger";
import { chattersQueue, type ChatterQueueEntry } from "./queue";
import { exitWithPause } from "./utils";

type CreateAndStartPipeServerOptions = Pick<Configuration, "popQueueRandomly">;

const COMMAND_POP = "POP";
const PIPE_PATH = "\\\\.\\pipe\\RetroRewindCompanion";

const logger = baseLogger.getSubLogger({ name: "Named Pipe" });

export function createAndStartPipeServer({ popQueueRandomly }: CreateAndStartPipeServerOptions): void {
  logger.info("Is the queue popped randomly? ", popQueueRandomly);

  const pipeServer = createServer((connection) => {
    connection.on("data", (data) => {
      const command = data.toString().trim();

      if (command === COMMAND_POP) {
        const chatterQueueEntry = fetchChatterQueueEntry({ popQueueRandomly });

        if (chatterQueueEntry) {
          logger.info(`Sent "${chatterQueueEntry.displayName}" to game (${chattersQueue.length} remaining)`);
          connection.write(JSON.stringify(chatterQueueEntry) + "\n");
        } else {
          connection.write("\n");
        }
      } else {
        logger.warn(`Unknown pipe command received: ${command}, skipping...`);
      }
    });

    connection.on("error", (err) => {
      logger.warn(`Pipe connection error: ${err.message}`);
    });
  });

  pipeServer.on("error", async (err) => {
    logger.error(`Pipe server error: ${err.message}`);
    return await exitWithPause(1);
  });

  pipeServer.listen(PIPE_PATH, () => {
    logger.info(`Named pipe server is listening on ${PIPE_PATH}`);
  });
}

function fetchChatterQueueEntry({
  popQueueRandomly
}: Pick<CreateAndStartPipeServerOptions, "popQueueRandomly">): ChatterQueueEntry | null | undefined {
  if (chattersQueue.length === 0) {
    return null;
  }

  if (popQueueRandomly) {
    const randomIndex = Math.floor(Math.random() * chattersQueue.length);
    return chattersQueue.splice(randomIndex, 1)[0];
  }

  return chattersQueue.shift();
}
