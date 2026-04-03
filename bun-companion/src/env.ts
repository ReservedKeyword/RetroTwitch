export const ENVIRONMENT_VARIABLES = ["DEBUG_MODE", "JOIN_COMMAND", "TWITCH_CHANNEL"] as const satisfies string[];

export const REQUIRED_ENVIRONMENT_VARIABLES = [
  "JOIN_COMMAND",
  "TWITCH_CHANNEL"
] as const satisfies (typeof ENVIRONMENT_VARIABLES)[number][];

type AllEnvironmentKeys = (typeof ENVIRONMENT_VARIABLES)[number];
type RequiredEnvironmentKeys = (typeof REQUIRED_ENVIRONMENT_VARIABLES)[number];

export type ParsedEnvironment = {
  [K in RequiredEnvironmentKeys]: string;
} & {
  [K in Exclude<AllEnvironmentKeys, RequiredEnvironmentKeys>]?: string;
};

export function parseEnvironment(
  environment: Record<string, string | undefined>
): environment is ParsedEnvironment & Record<string, string | undefined> {
  return REQUIRED_ENVIRONMENT_VARIABLES.every((key) => typeof environment[key] !== "undefined");
}
