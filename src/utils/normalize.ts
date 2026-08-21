import type { APIInteractionResponseCallbackData } from "discord-api-types/v10";

import type { BuilderAware, JSONEncodable } from "../types/common";
import type { HTTPInteractionReplyData } from "../types/interaction";

function isJSONEncodable<T>(value: unknown): value is JSONEncodable<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "toJSON" in value &&
    typeof (value as JSONEncodable<T>).toJSON === "function"
  );
}

// Accept both raw API payloads and discord.js builders.
function normalizeJSON<T>(value: BuilderAware<T>): T {
  return isJSONEncodable<T>(value) ? value.toJSON() : value;
}

export function normalizeReplyPayload(
  input: HTTPInteractionReplyData,
): APIInteractionResponseCallbackData {
  if (typeof input === "string") {
    return { content: input };
  }

  return {
    ...input,
    embeds: input.embeds?.map((embed) => normalizeJSON(embed)),
    components: input.components?.map((component) => normalizeJSON(component)),
  };
}
