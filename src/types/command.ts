import type { SlashCommandBuilder } from "discord.js";

import type { HTTPChatInputCommandInteraction } from "../interactions/chat-input";
import type { HTTPInteractionOptions } from "./interaction";

export interface HTTPApplicationCommand {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;

  execute(
    interaction: HTTPChatInputCommandInteraction,
  ): void | Promise<void>;
}

export interface HTTPInteractionCommandsOptions
  extends HTTPInteractionOptions {}
