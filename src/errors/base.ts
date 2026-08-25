import {
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

import type { HTTPInitialInteractionResponse } from "../types/interaction";

export class DiscordHTTPSlashError<Code extends string = string> extends Error {
  public readonly code: Code;

  constructor(code: Code, message: string) {
    super(message);

    this.code = code;
    this.name = `${new.target.name} [${code}]`;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  toErrorResponse(): HTTPInitialInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: this.message,
        flags: MessageFlags.Ephemeral,
      },
    };
  }
}
