import { addSeconds, differenceInSeconds } from "date-fns";
import { Client, Message, MessageEmbed } from "discord.js";
import pino from "pino";
import { prefixes, secondsToJoin, flatColors } from "../config";
import { actions, getAllActiveGames } from "..";
import { ButtonStyle, ComponentContext } from "slash-create";
import { ExtendedTextChannel } from "../../../extension";

const logger = pino({ prettyPrint: process.env.NODE_ENV !== "production" });

export const join = (message: Message) => {
  const joinAction = actions.find((a) => a.commands.includes("join"))!;

  const channelId = message.channel.id;

  const activeGames = getAllActiveGames();

  if (!activeGames[channelId]?.joinable) {
    const embed = new MessageEmbed()
      .setDescription(`The game is not joinable. ${message.author}`)
      .setColor(flatColors.red);

    message.reply(embed).catch((e) => {
      logger.error(e);
    });

    return;
  }

  if (activeGames[channelId]) {
    if (activeGames[channelId]!.userIds.includes(message.author.id)) {
      return;
    }

    activeGames[channelId] = {
      ...activeGames[channelId]!,
      userIds: [...activeGames[channelId]!.userIds, message.author.id],
      playerLives: {
        ...activeGames[channelId]!.playerLives,
        [message.author.id]: activeGames[channelId]!.maxLives,
      },
    };

    const embed = new MessageEmbed()
      .setDescription(`${message.author} joined the game.`)
      .addField(
        "How to join",
        `Send \`${prefixes[0]}${joinAction.commands[0]}\` or \`${prefixes[0]}${
          joinAction.commands[joinAction.commands.length - 1]
        }\` here in this channel to join`,
      )
      .addField(
        "Time left to join",
        `${differenceInSeconds(
          addSeconds(activeGames[channelId]!.gameStartedAt, secondsToJoin),
          new Date(),
        )} seconds`,
      )
      .setColor(flatColors.green);

    const channel = message.channel as ExtendedTextChannel;

    channel
      .sendWithComponents({
        content: "",
        options: { embed },
        components: [
          {
            components: [
              {
                type: 2,
                label: "Lemme join too!",
                custom_id: "join_word_chain",
                style: ButtonStyle.PRIMARY,
              },
            ],
          },
        ],
      })
      .catch((e) => {
        logger.error(e);
      });
  }
};

export const joinUsingButton = (ctx: ComponentContext, client: Client) => {
  const joinAction = actions.find((a) => a.commands.includes("join"))!;

  const channelId = ctx.channelID;

  const channel = client.channels.cache.get(channelId) as ExtendedTextChannel;

  const player = ctx.user;

  const activeGames = getAllActiveGames();

  if (!activeGames[channelId]?.joinable) {
    const embed = new MessageEmbed()
      .setDescription(`The game is not joinable. ${player.mention}`)
      .setColor(flatColors.red);

    channel.send({ embed, content: `${player.mention}` }).catch((e) => {
      logger.error(e);
    });

    return;
  }

  if (activeGames[channelId]) {
    if (activeGames[channelId]!.userIds.includes(player.id)) {
      return;
    }

    activeGames[channelId] = {
      ...activeGames[channelId]!,
      userIds: [...activeGames[channelId]!.userIds, player.id],
      playerLives: {
        ...activeGames[channelId]!.playerLives,
        [player.id]: activeGames[channelId]!.maxLives,
      },
    };

    const embed = new MessageEmbed()
      .setDescription(`${player.mention} joined the game.`)
      .addField(
        "How to join",
        `Send \`${prefixes[0]}${joinAction.commands[0]}\` or \`${prefixes[0]}${
          joinAction.commands[joinAction.commands.length - 1]
        }\` here in this channel to join`,
      )
      .addField(
        "Time left to join",
        `${differenceInSeconds(
          addSeconds(activeGames[channelId]!.gameStartedAt, secondsToJoin),
          new Date(),
        )} seconds`,
      )
      .setColor(flatColors.green);

    channel
      .sendWithComponents({
        content: "",
        options: { embed },
        components: [
          {
            components: [
              {
                type: 2,
                label: "Lemme join too!",
                custom_id: "join_word_chain",
                style: ButtonStyle.PRIMARY,
              },
            ],
          },
        ],
      })
      .catch((e) => {
        logger.error(e);
      });
  }
};
