import {
  ComponentType,
  InteractionResponseType,
  type APIModalSubmissionComponent,
  type APIModalSubmitInteraction,
  type ModalSubmitComponent,
} from "discord-api-types/v10";

import type {
  HTTPInteractionOptions,
  HTTPInteractionReplyData,
} from "../types/interaction";
import { normalizeReplyPayload } from "../utils/normalize";
import { HTTPRepliableInteraction } from "./repliable";
import type { HTTPMessageComponentInteraction } from "./component";

export class HTTPModalSubmitFields {
  private readonly fields = new Map<string, ModalSubmitComponent>();

  constructor(components: readonly APIModalSubmissionComponent[]) {
    for (const item of components) {
      if (item.type === ComponentType.ActionRow) {
        for (const component of item.components) {
          this.fields.set(component.custom_id, component);
        }
      } else if (item.type === ComponentType.Label) {
        this.fields.set(item.component.custom_id, item.component);
      }
    }
  }

  getTextInputValue(customId: string): string {
    const field = this.fields.get(customId);

    if (!field || field.type !== ComponentType.TextInput) {
      throw new TypeError(
        `No text input found for custom ID: "${customId}".`,
      );
    }

    return field.value;
  }

  getValues(customId: string): readonly string[] {
    const field = this.fields.get(customId);

    if (!field || !("values" in field)) {
      throw new TypeError(
        `No multi-value input found for custom ID: "${customId}".`,
      );
    }

    return field.values;
  }
}

export class HTTPModalSubmitInteraction extends HTTPRepliableInteraction<APIModalSubmitInteraction> {
  public readonly customId: string;
  public readonly components: readonly APIModalSubmissionComponent[];
  public readonly fields: HTTPModalSubmitFields;

  constructor(
    raw: APIModalSubmitInteraction,
    options: HTTPInteractionOptions = {},
  ) {
    super(raw, options);
    this.customId = raw.data.custom_id;
    this.components = raw.data.components;
    this.fields = new HTTPModalSubmitFields(this.components);
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

  isModalSubmit(): this is HTTPModalSubmitInteraction {
    return true;
  }

  isMessageComponent(): this is HTTPMessageComponentInteraction {
    return false;
  }
}
