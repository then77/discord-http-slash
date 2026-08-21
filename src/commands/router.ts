import {
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  type APIInteractionResponse,
} from "discord-api-types/v10";

import {
  DuplicateApplicationCommandError,
  InteractionNotAcknowledgedError,
  UnknownApplicationCommandError,
  UnsupportedApplicationCommandTypeError,
  UnsupportedInteractionTypeError,
} from "../errors/router";
import { HTTPChatInputCommandInteraction } from "../interactions/chat-input";
import type {
  HTTPApplicationCommand,
  HTTPInteractionCommandsOptions,
} from "../types/command";
import type {
  HTTPInitialInteractionResponse,
  HTTPInteractionOptions,
} from "../types/interaction";

export class HTTPInteractionCommands {
  public readonly commands: ReadonlyMap<
    string,
    HTTPApplicationCommand
  >;

  private readonly interactionOptions: HTTPInteractionOptions;

  constructor(
    commandList: readonly HTTPApplicationCommand[],
    options: HTTPInteractionCommandsOptions = {},
  ) {
    const commands = new Map<
      string,
      HTTPApplicationCommand
    >();

    for (const command of commandList) {
      const name = command.data.name;

      if (commands.has(name)) {
        throw new DuplicateApplicationCommandError(name);
      }

      commands.set(name, command);
    }

    this.commands = commands;
    this.interactionOptions = {
      rest: options.rest,
    };
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

  toJSON(): ReturnType<
    HTTPApplicationCommand["data"]["toJSON"]
  >[] {
    return Array.from(
      this.commands.values(),
      (command) => command.data.toJSON(),
    );
  }

  async handle(
    raw: APIInteraction,
  ): Promise<APIInteractionResponse> {
    switch (raw.type) {
      case InteractionType.Ping:
        return {
          type: InteractionResponseType.Pong,
        };

      case InteractionType.ApplicationCommand:
        return this.handleApplicationCommand(raw);

      default:
        throw new UnsupportedInteractionTypeError(raw.type);
    }
  }

  private async handleApplicationCommand(
    raw: Extract<
      APIInteraction,
      { type: InteractionType.ApplicationCommand }
    >,
  ): Promise<HTTPInitialInteractionResponse> {
    if (raw.data.type !== ApplicationCommandType.ChatInput) {
      throw new UnsupportedApplicationCommandTypeError(
        raw.data.type,
      );
    }

    const interaction =
      raw as APIChatInputApplicationCommandInteraction;

    const command = this.commands.get(
      interaction.data.name,
    );

    if (!command) {
      throw new UnknownApplicationCommandError(
        interaction.data.name,
      );
    }

    const wrapped = new HTTPChatInputCommandInteraction(
      interaction,
      this.interactionOptions,
    );

    await command.execute(wrapped);

    // Discord expects this object as the HTTP response to the interaction request.
    const response = wrapped.takeInitialResponse();

    if (!response) {
      throw new InteractionNotAcknowledgedError(
        interaction.data.name,
      );
    }

    return response;
  }
}
