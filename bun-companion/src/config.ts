import Ajv2020, { type JSONSchemaType } from "ajv/dist/2020";
import { EOL } from "node:os";
import { logger as baseLogger } from "./logger";
import { exitWithPause } from "./utils";

export interface Configuration {
  twitchChannel: string;
  popQueueRandomly: boolean;
  joinCommand?: string | undefined;
}

const CONFIG_PATH = "companion.config.json";
const logger = baseLogger.getSubLogger({ name: "Config" });

const configSchema: JSONSchemaType<Configuration> = {
  type: "object",
  properties: {
    joinCommand: {
      type: "string",
      nullable: true,
      minLength: 1
    },
    popQueueRandomly: {
      type: "boolean"
    },
    twitchChannel: {
      type: "string",
      minLength: 1
    }
  },
  required: ["popQueueRandomly", "twitchChannel"],
  additionalProperties: false
};

const ajv = new Ajv2020();
const validateFn = ajv.compile(configSchema);

const DEFAULT_CONFIGURATION: Configuration = {
  joinCommand: "!join",
  popQueueRandomly: false,
  twitchChannel: "ReservedKeyword"
};

export async function loadConfiguration(): Promise<Configuration> {
  const configFile = Bun.file(CONFIG_PATH);

  if (!(await configFile.exists())) {
    await Bun.write(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIGURATION, null, 2) + EOL);
    logger.info(`Created ${CONFIG_PATH}. Fill in your settings and run again.`);
    return await exitWithPause(0);
  }

  const rawContents = await configFile.json();

  if (!validateFn(rawContents)) {
    logger.error(`Invalid configuration in ${CONFIG_PATH}:`);

    for (const validationError of validateFn.errors ?? []) {
      logger.error(`  ${validationError.instancePath ?? "/"}: ${validationError.message}`);
    }

    return await exitWithPause(1);
  }

  return rawContents;
}
