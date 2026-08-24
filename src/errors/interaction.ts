import { DiscordHTTPSlashError } from "./base";

export enum HTTPInteractionErrorCode {
  AlreadyReplied = "AlreadyReplied",
  NotReplied = "NotReplied",
  CollectorError = "CollectorError",
}

export class HTTPInteractionError<
  Code extends HTTPInteractionErrorCode = HTTPInteractionErrorCode,
> extends DiscordHTTPSlashError<Code> {}

export class HTTPInteractionAlreadyRepliedError extends HTTPInteractionError<
  HTTPInteractionErrorCode.AlreadyReplied
> {
  constructor() {
    super(
      HTTPInteractionErrorCode.AlreadyReplied,
      "The interaction has already been replied to or deferred.",
    );
  }
}

export class HTTPInteractionNotRepliedError extends HTTPInteractionError<
  HTTPInteractionErrorCode.NotReplied
> {
  constructor() {
    super(
      HTTPInteractionErrorCode.NotReplied,
      "The interaction has not been replied to or deferred.",
    );
  }
}

export class HTTPInteractionCollectorError extends HTTPInteractionError<
  HTTPInteractionErrorCode.CollectorError
> {
  public readonly reason: string;

  constructor(reason: string) {
    super(
      HTTPInteractionErrorCode.CollectorError,
      `Collector received no interactions before ending with reason: ${reason}`,
    );

    this.reason = reason;
  }
}
