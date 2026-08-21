import { DiscordjsErrorCodes } from "discord.js";

import { PublicDiscordjsError } from "../utils/discordjs-errors";

export class HTTPInteractionAlreadyRepliedError extends PublicDiscordjsError {
  constructor() {
    super(DiscordjsErrorCodes.InteractionAlreadyReplied);
  }
}

export class HTTPInteractionNotRepliedError extends PublicDiscordjsError {
  constructor() {
    super(DiscordjsErrorCodes.InteractionNotReplied);
  }
}

export class HTTPInteractionCollectorError extends PublicDiscordjsError {
  constructor(reason: string) {
    super(
      DiscordjsErrorCodes.InteractionCollectorError,
      reason,
    );
  }
}
