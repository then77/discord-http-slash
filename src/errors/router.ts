export enum HTTPInteractionRouterErrorCode {
  UnsupportedInteractionType = "UnsupportedInteractionType",
  UnsupportedApplicationCommandType = "UnsupportedApplicationCommandType",
  UnknownApplicationCommand = "UnknownApplicationCommand",
  InteractionNotAcknowledged = "InteractionNotAcknowledged",
  DuplicateApplicationCommand = "DuplicateApplicationCommand",
}

export class HTTPInteractionRouterError<
  Code extends HTTPInteractionRouterErrorCode = HTTPInteractionRouterErrorCode,
> extends Error {
  public readonly code: Code;

  constructor(code: Code, message: string) {
    super(message);

    this.code = code;
    this.name = `HTTPInteractionRouterError [${code}]`;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnsupportedInteractionTypeError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.UnsupportedInteractionType
> {
  public readonly interactionType: number;

  constructor(interactionType: number) {
    super(
      HTTPInteractionRouterErrorCode.UnsupportedInteractionType,
      `Unsupported interaction type: ${interactionType}`,
    );

    this.interactionType = interactionType;
  }
}

export class UnsupportedApplicationCommandTypeError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.UnsupportedApplicationCommandType
> {
  public readonly commandType: number;

  constructor(commandType: number) {
    super(
      HTTPInteractionRouterErrorCode.UnsupportedApplicationCommandType,
      `Unsupported application command type: ${commandType}`,
    );

    this.commandType = commandType;
  }
}

export class UnknownApplicationCommandError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.UnknownApplicationCommand
> {
  public readonly commandName: string;

  constructor(commandName: string) {
    super(
      HTTPInteractionRouterErrorCode.UnknownApplicationCommand,
      `Unknown application command: "${commandName}"`,
    );

    this.commandName = commandName;
  }
}

export class InteractionNotAcknowledgedError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.InteractionNotAcknowledged
> {
  public readonly commandName: string;

  constructor(commandName: string) {
    super(
      HTTPInteractionRouterErrorCode.InteractionNotAcknowledged,
      `Application command "${commandName}" completed without replying or deferring.`,
    );

    this.commandName = commandName;
  }
}

export class DuplicateApplicationCommandError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.DuplicateApplicationCommand
> {
  public readonly commandName: string;

  constructor(commandName: string) {
    super(
      HTTPInteractionRouterErrorCode.DuplicateApplicationCommand,
      `Application command "${commandName}" was registered more than once.`,
    );

    this.commandName = commandName;
  }
}
