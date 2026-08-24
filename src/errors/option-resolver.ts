import { ApplicationCommandOptionType } from "discord-api-types/v10";

import { DiscordHTTPSlashError } from "./base";

export enum HTTPInteractionOptionResolverErrorCode {
  OptionEmpty = "OptionEmpty",
  OptionNotFound = "OptionNotFound",
  OptionTypeMismatch = "OptionTypeMismatch",
  SubcommandNotFound = "SubcommandNotFound",
  SubcommandGroupNotFound = "SubcommandGroupNotFound",
}

export class HTTPInteractionOptionResolverError<
  Code extends HTTPInteractionOptionResolverErrorCode =
    HTTPInteractionOptionResolverErrorCode,
> extends DiscordHTTPSlashError<Code> {}

export class HTTPInteractionOptionNotFoundError extends HTTPInteractionOptionResolverError<
  HTTPInteractionOptionResolverErrorCode.OptionNotFound
> {
  public readonly optionName: string;

  constructor(optionName: string) {
    super(
      HTTPInteractionOptionResolverErrorCode.OptionNotFound,
      `Required option "${optionName}" was not found.`,
    );

    this.optionName = optionName;
  }
}

export class HTTPInteractionOptionTypeMismatchError extends HTTPInteractionOptionResolverError<
  HTTPInteractionOptionResolverErrorCode.OptionTypeMismatch
> {
  public readonly optionName: string;
  public readonly actualType: ApplicationCommandOptionType;
  public readonly expectedTypes: readonly ApplicationCommandOptionType[];

  constructor(
    optionName: string,
    actualType: ApplicationCommandOptionType,
    expectedTypes: readonly ApplicationCommandOptionType[],
  ) {
    super(
      HTTPInteractionOptionResolverErrorCode.OptionTypeMismatch,
      `Option "${optionName}" was type ${actualType}, expected ${expectedTypes.join(", ")}.`,
    );

    this.optionName = optionName;
    this.actualType = actualType;
    this.expectedTypes = expectedTypes;
  }
}

export class HTTPInteractionOptionEmptyError extends HTTPInteractionOptionResolverError<
  HTTPInteractionOptionResolverErrorCode.OptionEmpty
> {
  public readonly optionName: string;
  public readonly optionType: ApplicationCommandOptionType;

  constructor(optionName: string, optionType: ApplicationCommandOptionType) {
    super(
      HTTPInteractionOptionResolverErrorCode.OptionEmpty,
      `Required option "${optionName}" of type ${optionType} was empty.`,
    );

    this.optionName = optionName;
    this.optionType = optionType;
  }
}

export class HTTPInteractionSubcommandNotFoundError extends HTTPInteractionOptionResolverError<
  HTTPInteractionOptionResolverErrorCode.SubcommandNotFound
> {
  constructor() {
    super(
      HTTPInteractionOptionResolverErrorCode.SubcommandNotFound,
      "Required subcommand was not found.",
    );
  }
}

export class HTTPInteractionSubcommandGroupNotFoundError extends HTTPInteractionOptionResolverError<
  HTTPInteractionOptionResolverErrorCode.SubcommandGroupNotFound
> {
  constructor() {
    super(
      HTTPInteractionOptionResolverErrorCode.SubcommandGroupNotFound,
      "Required subcommand group was not found.",
    );
  }
}
