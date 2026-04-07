import { ChatClient } from "@twurple/chat";
import { loadConfiguration } from "./config";
import { logger as baseLogger } from "./logger";
import { createAndStartPipeServer } from "./named-pipe";
import { chattersQueue } from "./queue";

const {
  allowModeratorsToClearQueue,
  joinCommand,
  keepChattersInQueue,
  maxQueueSize,
  popQueueRandomly,
  showDisplayNameAboveHead,
  twitchChannel
} = await loadConfiguration();

const chatClient = new ChatClient({ channels: [twitchChannel] });
const logger = baseLogger.getSubLogger({ name: "Main" });

chatClient.connect();
createAndStartPipeServer({ keepChattersInQueue, popQueueRandomly });

if (joinCommand) {
  logger.info(`Listening on #${twitchChannel} for "${joinCommand}" command.`);
} else {
  logger.info(`Listening on #${twitchChannel}, all chatters will be queued.`);
}

if (keepChattersInQueue) {
  logger.warn("keepChattersInQueue is currently enabled.");
  logger.warn("This means that chatters who are removed from the queue are immediately re-added,");
  logger.warn("potentially meaning that if you're at the maximum queue size you've defined, then");
  logger.warn("new chatters may not get added. Please ensure this is the behavior you want.");
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
  const trimmedMessage = messageText.trim().toLowerCase();

  if (
    allowModeratorsToClearQueue &&
    trimmedMessage === "!clearqueue" &&
    (chatMessage.userInfo.isBroadcaster || chatMessage.userInfo.isMod)
  ) {
    const previousQueueSize = chattersQueue.length;
    chattersQueue.length = 0;
    logger.info(`Queue cleared by ${chatMessage.userInfo.displayName} (${previousQueueSize} chatter[s] removed)`);
    return;
  }

  if (joinCommand && !trimmedMessage.includes(joinCommand)) {
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
