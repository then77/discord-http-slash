import type {
  APIInteractionDataResolved,
  APIInteractionResponseCallbackData,
} from "discord-api-types/v10";

export interface JSONEncodable<T> {
  toJSON(): T;
}

export type BuilderAware<T> = T | JSONEncodable<T>;

export type ResolvedMember =
  NonNullable<APIInteractionDataResolved["members"]>[string];

export type ResolvedChannel =
  NonNullable<APIInteractionDataResolved["channels"]>[string];

export type APIEmbed =
  NonNullable<APIInteractionResponseCallbackData["embeds"]>[number];

export type APIComponent =
  NonNullable<APIInteractionResponseCallbackData["components"]>[number];
