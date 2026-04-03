import { ChatClient } from "@twurple/chat";
import { parseEnvironment, REQUIRED_ENVIRONMENT_VARIABLES } from "./env";
import { namesQueue } from "./queue";

if (!parseEnvironment(Bun.env)) {
  console.error("One or more environment variable was missing.");
  console.error(JSON.stringify(REQUIRED_ENVIRONMENT_VARIABLES));
  process.exit(1);
}

const listenChannel = Bun.env.TWITCH_CHANNEL;
const chatClient = new ChatClient({ channels: [listenChannel] });

chatClient.connect();

const debugMode = Bun.env.DEBUG_MODE === "true";
const joinCommand = Bun.env.JOIN_COMMAND?.toLowerCase();

if (debugMode) {
  console.log(`Listening on #${listenChannel}. Debug mode enabled, join command is ignored.`);
} else {
  console.log(`Listening on #${listenChannel} for "${joinCommand}" command`);
}

if (!debugMode && !joinCommand) {
  console.error("JOIN_COMMAND is required when DEBUG_MODE is not enabled.");
  process.exit(1);
}

chatClient.onConnect(() => {
  console.log("Connected to Twitch IRC");
});

chatClient.onDisconnect((manually) => {
  if (!manually) {
    console.warn("Disconnected from Twitch IRC, attempting to reconnect...");
  }
});

chatClient.onMessage(async (_channel, _user, messageText, chatMessage) => {
  if (!debugMode && messageText.trim().toLowerCase() !== joinCommand) {
    return;
  }

  const chatterName = chatMessage.userInfo.displayName;

  if (namesQueue.includes(chatterName)) {
    return;
  }

  namesQueue.push(chatterName);
  console.log(`${chatterName} joined queue (${namesQueue.length} waiting)`);
});
