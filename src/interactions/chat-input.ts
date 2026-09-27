import {
  ApplicationCommandType,
  InteractionResponseType,
  type APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";

import type {
  HTTPInteractionOptions,
  HTTPModalResponseData,
} from "../types/interaction";
import { normalizeJSON } from "../utils/normalize";
import { HTTPCommandInteractionOptionResolver } from "./option-resolver";
import { HTTPRepliableInteraction } from "./repliable";

export class HTTPChatInputCommandInteraction extends HTTPRepliableInteraction<APIChatInputApplicationCommandInteraction> {
  public readonly commandType = ApplicationCommandType.ChatInput;
  public readonly commandId: string;
  public readonly commandName: string;
  public readonly options: HTTPCommandInteractionOptionResolver;

  constructor(
    raw: APIChatInputApplicationCommandInteraction,
    options: HTTPInteractionOptions = {},
  ) {
    super(raw, options);

    this.commandId = raw.data.id;
    this.commandName = raw.data.name;
    this.options = new HTTPCommandInteractionOptionResolver(
      raw.data.options ?? [],
      raw.data.resolved,
    );
  }

  isChatInputCommand(): true {
    return true;
  }

  async showModal(input: HTTPModalResponseData): Promise<void> {
    this.setInitialResponse(
      {
        type: InteractionResponseType.Modal,
        data: normalizeJSON(input),
      },
      "replied",
    );
  }
}
