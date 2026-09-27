import { DiscordHTTPSlashError } from "./base";

export enum HTTPInteractionRouterErrorCode {
  UnsupportedInteractionType = "UnsupportedInteractionType",
  UnsupportedApplicationCommandType = "UnsupportedApplicationCommandType",
  UnknownApplicationCommand = "UnknownApplicationCommand",
  InteractionNotAcknowledged = "InteractionNotAcknowledged",
  InteractionHandlerNotAcknowledged = "InteractionHandlerNotAcknowledged",
  UnknownInteractionHandler = "UnknownInteractionHandler",
  InvalidAutocompleteConfiguration = "InvalidAutocompleteConfiguration",
  DuplicateApplicationCommand = "DuplicateApplicationCommand",
}

export class HTTPInteractionRouterError<
  Code extends HTTPInteractionRouterErrorCode = HTTPInteractionRouterErrorCode,
> extends DiscordHTTPSlashError<Code> {}

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

export class InteractionHandlerNotAcknowledgedError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.InteractionHandlerNotAcknowledged
> {
  public readonly customId: string;

  constructor(customId: string) {
    super(
      HTTPInteractionRouterErrorCode.InteractionHandlerNotAcknowledged,
      `Interaction handler for "${customId}" completed without replying or deferring.`,
    );

    this.customId = customId;
  }
}

export class UnknownInteractionHandlerError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.UnknownInteractionHandler
> {
  public readonly customId: string;

  constructor(customId: string) {
    super(
      HTTPInteractionRouterErrorCode.UnknownInteractionHandler,
      `No interaction handler found for custom ID: "${customId}".`,
    );

    this.customId = customId;
  }
}

export class InvalidAutocompleteConfigurationError extends HTTPInteractionRouterError<
  HTTPInteractionRouterErrorCode.InvalidAutocompleteConfiguration
> {
  public readonly commandName: string;

  constructor(commandName: string, details: string) {
    super(
      HTTPInteractionRouterErrorCode.InvalidAutocompleteConfiguration,
      `Invalid autocomplete configuration for command "${commandName}": ${details}.`,
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
