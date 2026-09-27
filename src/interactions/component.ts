import {
  ComponentType,
  InteractionResponseType,
  type APIMessageComponentButtonInteraction,
  type APIMessageComponentInteraction,
  type APIMessageComponentSelectMenuInteraction,
} from "discord-api-types/v10";

import type {
  HTTPInteractionOptions,
  HTTPInteractionReplyData,
  HTTPModalResponseData,
} from "../types/interaction";
import {
  normalizeJSON,
  normalizeReplyPayload,
} from "../utils/normalize";
import { HTTPRepliableInteraction } from "./repliable";
import type { HTTPModalSubmitInteraction } from "./modal-submit";

export class HTTPMessageComponentInteraction<
  Raw extends APIMessageComponentInteraction = APIMessageComponentInteraction,
> extends HTTPRepliableInteraction<Raw> {
  public readonly customId: string;
  public readonly componentType: Raw["data"]["component_type"];
  public readonly data: Raw["data"];
  public readonly message: Raw["message"];

  constructor(raw: Raw, options: HTTPInteractionOptions = {}) {
    super(raw, options);
    this.customId = raw.data.custom_id;
    this.componentType = raw.data.component_type;
    this.data = raw.data;
    this.message = raw.message;
  }

  get values(): readonly string[] {
    return "values" in this.data ? this.data.values : [];
  }

  async deferUpdate(): Promise<void> {
    this.setInitialResponse(
      { type: InteractionResponseType.DeferredMessageUpdate },
      "deferred",
    );
  }

  async update(input: HTTPInteractionReplyData): Promise<void> {
    this.setInitialResponse(
      {
        type: InteractionResponseType.UpdateMessage,
        data: normalizeReplyPayload(input),
      },
      "replied",
    );
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

  isButton(): this is HTTPMessageComponentInteraction<APIMessageComponentButtonInteraction> {
    return this.componentType === ComponentType.Button;
  }

  isSelectMenu(): this is HTTPMessageComponentInteraction<APIMessageComponentSelectMenuInteraction> {
    return "values" in this.data;
  }

  isMessageComponent(): this is HTTPMessageComponentInteraction {
    return true;
  }

  isModalSubmit(): this is HTTPModalSubmitInteraction {
    return false;
  }
}
