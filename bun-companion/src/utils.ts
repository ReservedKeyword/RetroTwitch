import { EOL } from "node:os";
import { logger as baseLogger } from "./logger";

const logger = baseLogger.getSubLogger({ name: "Utility" });

export async function exitWithPause(exitCode: number): Promise<never> {
  logger.info(`${EOL}Press Enter to exit...`);

  for await (const _ of console) {
    break;
  }

  process.exit(exitCode);
}
