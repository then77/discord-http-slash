import type { SlashCommandBuilder } from "@discordjs/builders";
import type { APIApplicationCommandOptionChoice } from "discord-api-types/v10";

import type {
  HTTPAutocompleteFocusedOption,
  HTTPAutocompleteInteraction,
} from "../interactions/autocomplete";
import type { HTTPChatInputCommandInteraction } from "../interactions/chat-input";
import type { HTTPMessageComponentInteraction } from "../interactions/component";
import type { HTTPModalSubmitInteraction } from "../interactions/modal-submit";
import type { HTTPInteractionOptions } from "./interaction";

export type Awaitable<T> = T | Promise<T>;

export interface HTTPAutocompleteContext {
  interaction: HTTPAutocompleteInteraction;
  focused: HTTPAutocompleteFocusedOption;
}

export type HTTPAutocompleteChoices =
  readonly APIApplicationCommandOptionChoice[];

export type HTTPAutocompleteHandler = (
  context: HTTPAutocompleteContext,
) => Awaitable<HTTPAutocompleteChoices>;

export type HTTPCommandAutocomplete =
  | HTTPAutocompleteHandler
  | Readonly<Record<string, HTTPAutocompleteHandler>>;

export type HTTPCommandInteraction =
  | HTTPMessageComponentInteraction
  | HTTPModalSubmitInteraction;

export type HTTPInteractionHandler = (
  interaction: HTTPCommandInteraction,
) => Awaitable<void>;

export interface HTTPApplicationCommand {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;

  execute(
    interaction: HTTPChatInputCommandInteraction,
  ): Awaitable<void>;

  autocomplete?: HTTPCommandAutocomplete;
  interaction?: HTTPInteractionHandler;
}

export interface HTTPInteractionCommandsOptions
  extends HTTPInteractionOptions {}
