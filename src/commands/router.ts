import {
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteractionDataOption,
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  type APIInteractionResponse,
  type APIMessageComponentInteraction,
  type APIModalSubmitInteraction,
} from "discord-api-types/v10";

import {
  DuplicateApplicationCommandError,
  InteractionHandlerNotAcknowledgedError,
  InteractionNotAcknowledgedError,
  InvalidAutocompleteConfigurationError,
  UnknownApplicationCommandError,
  UnknownInteractionHandlerError,
  UnsupportedApplicationCommandTypeError,
  UnsupportedInteractionTypeError,
} from "../errors/router";
import {
  HTTPAutocompleteInteraction,
  type HTTPAutocompleteFocusedOption,
} from "../interactions/autocomplete";
import { HTTPChatInputCommandInteraction } from "../interactions/chat-input";
import { HTTPMessageComponentInteraction } from "../interactions/component";
import { HTTPModalSubmitInteraction } from "../interactions/modal-submit";
import type {
  HTTPApplicationCommand,
  HTTPCommandInteraction,
  HTTPInteractionCommandsOptions,
} from "../types/command";
import type {
  HTTPInitialInteractionResponse,
  HTTPInteractionOptions,
} from "../types/interaction";

function findFocusedOption(
  options: readonly APIApplicationCommandInteractionDataOption[],
): HTTPAutocompleteFocusedOption | null {
  for (const option of options) {
    if ("focused" in option && option.focused === true && "value" in option) {
      return option as HTTPAutocompleteFocusedOption;
    }

    if ("options" in option && option.options) {
      const focused = findFocusedOption(option.options);
      if (focused) return focused;
    }
  }

  return null;
}

function autocompleteOptionNames(
  options: readonly { name: string; autocomplete?: boolean; options?: readonly unknown[] }[],
): string[] {
  const names: string[] = [];

  for (const option of options) {
    if (option.autocomplete) names.push(option.name);
    if (option.options) {
      names.push(...autocompleteOptionNames(option.options as typeof options));
    }
  }

  return names;
}

export class HTTPInteractionCommands {
  public readonly commands: ReadonlyMap<string, HTTPApplicationCommand>;
  private readonly interactionOptions: HTTPInteractionOptions;

  constructor(
    commandList: readonly HTTPApplicationCommand[],
    options: HTTPInteractionCommandsOptions = {},
  ) {
    const commands = new Map<string, HTTPApplicationCommand>();

    for (const command of commandList) {
      const name = command.data.name;
      if (commands.has(name)) throw new DuplicateApplicationCommandError(name);

      const enabled = new Set(autocompleteOptionNames(command.data.toJSON().options ?? []));
      const handlers = command.autocomplete;

      if (enabled.size && !handlers) {
        throw new InvalidAutocompleteConfigurationError(name, "autocomplete-enabled options require a handler");
      }
      if (!enabled.size && handlers) {
        throw new InvalidAutocompleteConfigurationError(name, "a handler was provided without autocomplete-enabled options");
      }
      if (handlers && typeof handlers !== "function") {
        const configured = Object.keys(handlers);
        const missing = [...enabled].filter((option) => !(option in handlers));
        const unknown = configured.filter((option) => !enabled.has(option));
        if (missing.length || unknown.length) {
          throw new InvalidAutocompleteConfigurationError(
            name,
            [
              missing.length ? `missing handlers for ${missing.join(", ")}` : "",
              unknown.length ? `unknown handlers for ${unknown.join(", ")}` : "",
            ].filter(Boolean).join("; "),
          );
        }
      }

      commands.set(name, command);
    }

    this.commands = commands;
    this.interactionOptions = { rest: options.rest };
  }

  get size(): number {
    return this.commands.size;
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }

  get(name: string): HTTPApplicationCommand | null {
    return this.commands.get(name) ?? null;
  }

  toJSON(): ReturnType<HTTPApplicationCommand["data"]["toJSON"]>[] {
    return Array.from(this.commands.values(), (command) => command.data.toJSON());
  }

  async handle(raw: APIInteraction): Promise<APIInteractionResponse> {
    switch (raw.type) {
      case InteractionType.Ping:
        return { type: InteractionResponseType.Pong };
      case InteractionType.ApplicationCommand:
        return this.handleApplicationCommand(raw);
      case InteractionType.ApplicationCommandAutocomplete:
        return this.handleAutocomplete(raw);
      case InteractionType.MessageComponent:
        return this.handleCustomInteraction(raw);
      case InteractionType.ModalSubmit:
        return this.handleCustomInteraction(raw);
      default:
        throw new UnsupportedInteractionTypeError((raw as APIInteraction).type);
    }
  }

  private async handleApplicationCommand(
    raw: Extract<APIInteraction, { type: InteractionType.ApplicationCommand }>,
  ): Promise<HTTPInitialInteractionResponse> {
    if (raw.data.type !== ApplicationCommandType.ChatInput) {
      throw new UnsupportedApplicationCommandTypeError(raw.data.type);
    }

    const interaction = raw as APIChatInputApplicationCommandInteraction;
    const command = this.commands.get(interaction.data.name);
    if (!command) throw new UnknownApplicationCommandError(interaction.data.name);

    const wrapped = new HTTPChatInputCommandInteraction(interaction, this.interactionOptions);
    await command.execute(wrapped);
    const response = wrapped.takeInitialResponse();
    if (!response) throw new InteractionNotAcknowledgedError(interaction.data.name);
    return response;
  }

  private async handleAutocomplete(
    raw: APIApplicationCommandAutocompleteInteraction,
  ): Promise<APIInteractionResponse> {
    const command = this.commands.get(raw.data.name);
    if (!command) throw new UnknownApplicationCommandError(raw.data.name);

    const focused = findFocusedOption(raw.data.options as APIApplicationCommandInteractionDataOption[]);
    if (!focused) {
      throw new InvalidAutocompleteConfigurationError(raw.data.name, "payload has no focused option");
    }

    const autocomplete = command.autocomplete;
    if (!autocomplete) {
      throw new InvalidAutocompleteConfigurationError(raw.data.name, `no handler for ${focused.name}`);
    }

    const handler = typeof autocomplete === "function"
      ? autocomplete
      : autocomplete[focused.name];
    if (!handler) {
      throw new InvalidAutocompleteConfigurationError(raw.data.name, `no handler for ${focused.name}`);
    }

    const choices = await handler({
      interaction: new HTTPAutocompleteInteraction(raw),
      focused,
    });
    return {
      type: InteractionResponseType.ApplicationCommandAutocompleteResult,
      data: { choices: [...choices].slice(0, 25) },
    };
  }

  private async handleCustomInteraction(
    raw: APIMessageComponentInteraction | APIModalSubmitInteraction,
  ): Promise<HTTPInitialInteractionResponse> {
    const customId = raw.data.custom_id;
    const separator = customId.indexOf(":");
    const command = separator > 0
      ? this.commands.get(customId.slice(0, separator))
      : undefined;

    if (!command?.interaction) throw new UnknownInteractionHandlerError(customId);

    const wrapped: HTTPCommandInteraction = raw.type === InteractionType.MessageComponent
      ? new HTTPMessageComponentInteraction(raw, this.interactionOptions)
      : new HTTPModalSubmitInteraction(raw, this.interactionOptions);

    await command.interaction(wrapped);
    const response = wrapped.takeInitialResponse();
    if (!response) throw new InteractionHandlerNotAcknowledgedError(customId);
    return response;
  }
}
