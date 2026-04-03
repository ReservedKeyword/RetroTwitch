import { ChatClient } from "@twurple/chat";
import { loadConfiguration } from "./config";
import { namesQueue } from "./queue";

const { joinCommand, twitchChannel } = await loadConfiguration();
const chatClient = new ChatClient({ channels: [twitchChannel] });

chatClient.connect();

if (joinCommand) {
  console.log(`Listening on #${twitchChannel} for "${joinCommand}" command`);
} else {
  console.log(`Listening on #${twitchChannel}, all chatters will be queued.`);
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
  if (joinCommand && messageText.trim().toLowerCase() !== joinCommand) {
    return;
  }

  const chatterName = chatMessage.userInfo.displayName;

  if (namesQueue.includes(chatterName)) {
    return;
  }

  namesQueue.push(chatterName);
  console.log(`${chatterName} joined queue (${namesQueue.length} waiting)`);
});
