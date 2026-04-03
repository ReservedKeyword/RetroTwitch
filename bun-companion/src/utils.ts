import { EOL } from "node:os";

export async function exitWithPause(exitCode: number): Promise<never> {
  console.log(`${EOL}Press Enter to exit...`);

  for await (const _ of console) {
    break;
  }

  process.exit(exitCode);
}
