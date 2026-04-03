import Ajv2020, { type JSONSchemaType } from "ajv/dist/2020";
import { EOL } from "node:os";
import { exitWithPause } from "./utils";

export interface Configuration {
  twitchChannel: string;
  joinCommand?: string | undefined;
}

const CONFIG_PATH = "companion.config.json";

const configSchema: JSONSchemaType<Configuration> = {
  type: "object",
  properties: {
    joinCommand: {
      type: "string",
      nullable: true,
      minLength: 1
    },
    twitchChannel: {
      type: "string",
      minLength: 1
    }
  },
  required: ["twitchChannel"],
  additionalProperties: false
};

const ajv = new Ajv2020();
const validateFn = ajv.compile(configSchema);

const DEFAULT_CONFIGURATION: Configuration = {
  joinCommand: "!join",
  twitchChannel: "ReservedKeyword"
};

export async function loadConfiguration(): Promise<Configuration> {
  const configFile = Bun.file(CONFIG_PATH);

  if (!(await configFile.exists())) {
    await Bun.write(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIGURATION, null, 2) + EOL);
    console.log(`Created ${CONFIG_PATH}. Fill in your settings and run again.`);
    return await exitWithPause(0);
  }

  const rawContents = await configFile.json();

  if (!validateFn(rawContents)) {
    console.error(`Invalid configuration in ${CONFIG_PATH}:`);

    for (const validationError of validateFn.errors ?? []) {
      console.error(`  ${validationError.instancePath ?? "/"}: ${validationError.message}`);
    }

    return await exitWithPause(1);
  }

  return rawContents;
}
