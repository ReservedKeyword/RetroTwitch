import { Logger } from "tslog";

export const logger = new Logger({
  name: "Retro Rewind Companion",
  prettyLogTemplate: "{{dateIsoStr}} {{logLevelName}} {{name}} "
});
