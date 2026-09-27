import type { REST } from "@discordjs/rest";
import {
  InteractionResponseType,
  type APIInteractionResponse,
  type APIInteractionResponseCallbackData,
  type APIModalInteractionResponseCallbackData,
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

export type HTTPModalResponseData =
  BuilderAware<APIModalInteractionResponseCallbackData>;

export type HTTPInitialInteractionResponse = Extract<
  APIInteractionResponse,
  {
    type:
      | InteractionResponseType.ChannelMessageWithSource
      | InteractionResponseType.DeferredChannelMessageWithSource
      | InteractionResponseType.DeferredMessageUpdate
      | InteractionResponseType.UpdateMessage
      | InteractionResponseType.Modal;
  }
>;
