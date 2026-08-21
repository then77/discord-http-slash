import type { REST } from "discord.js";
import {
  InteractionResponseType,
  type APIInteractionResponseCallbackData,
} from "discord-api-types/v10";

import type { APIComponent, APIEmbed, BuilderAware } from "./common";

export type HTTPInteractionReplyOptions = Omit<
  APIInteractionResponseCallbackData,
  "embeds" | "components"
> & {
  embeds?: readonly BuilderAware<APIEmbed>[];
  components?: readonly BuilderAware<APIComponent>[];
};

export type HTTPInteractionReplyData =
  | string
  | HTTPInteractionReplyOptions;

export interface HTTPDeferReplyOptions {
  flags?: number;
  ephemeral?: boolean;
}

export interface HTTPInteractionOptions {
  // Interaction webhook routes authenticate with the interaction token.
  rest?: REST;
}

export type HTTPInitialInteractionResponse =
  | {
      type: InteractionResponseType.ChannelMessageWithSource;
      data: APIInteractionResponseCallbackData;
    }
  | {
      type: InteractionResponseType.DeferredChannelMessageWithSource;
      data?: APIInteractionResponseCallbackData;
    };
