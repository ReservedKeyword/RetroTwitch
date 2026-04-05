import { ChatClient } from "@twurple/chat";
import { loadConfiguration } from "./config";
import { logger as baseLogger } from "./logger";
import { createAndStartPipeServer } from "./named-pipe";
import { chattersQueue } from "./queue";

const { joinCommand, maxQueueSize, popQueueRandomly, showDisplayNameAboveHead, twitchChannel } =
  await loadConfiguration();

const chatClient = new ChatClient({ channels: [twitchChannel] });
const logger = baseLogger.getSubLogger({ name: "Main" });

chatClient.connect();
createAndStartPipeServer({ popQueueRandomly });

if (joinCommand) {
  logger.info(`Listening on #${twitchChannel} for "${joinCommand}" command.`);
} else {
  logger.info(`Listening on #${twitchChannel}, all chatters will be queued.`);
}

chatClient.onConnect(() => {
  logger.info("Connected to Twitch IRC");
});

chatClient.onDisconnect((manually) => {
  if (!manually) {
    logger.warn("Disconnected from Twitch IRC, attempting to reconnect...");
  }
});

chatClient.onMessage(async (_channel, _user, messageText, chatMessage) => {
  if (joinCommand && !messageText.trim().toLowerCase().includes(joinCommand)) {
    return;
  }

  const chatterName = chatMessage.userInfo.displayName;

  if (chattersQueue.length >= maxQueueSize) {
    return;
  }

  if (chattersQueue.some(({ displayName }) => chatterName === displayName)) {
    return;
  }

  chattersQueue.push({
    displayName: chatterName,
    showNameAboveHead: showDisplayNameAboveHead
  });

  logger.info(`${chatterName} joined queue (${chattersQueue.length} waiting)`);
});
