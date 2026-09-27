export type { JSONEncodable } from "./types/common";

export type {
  HTTPDeferReplyOptions,
  HTTPInitialInteractionResponse,
  HTTPInteractionOptions,
  HTTPInteractionReplyData,
  HTTPInteractionReplyOptions,
  HTTPModalResponseData,
} from "./types/interaction";

export type {
  HTTPApplicationCommand,
  HTTPInteractionCommandsOptions,
  HTTPAutocompleteChoices,
  HTTPAutocompleteContext,
  HTTPAutocompleteHandler,
  HTTPCommandAutocomplete,
  HTTPCommandInteraction,
  HTTPInteractionHandler,
} from "./types/command";

export type { HTTPAutocompleteFocusedOption } from "./interactions/autocomplete";

export {
  DiscordHTTPSlashError,
} from "./errors/base";

export {
  HTTPInteractionAlreadyRepliedError,
  HTTPInteractionCollectorError,
  HTTPInteractionError,
  HTTPInteractionErrorCode,
  HTTPInteractionNotRepliedError,
} from "./errors/interaction";

export {
  HTTPInteractionOptionEmptyError,
  HTTPInteractionOptionNotFoundError,
  HTTPInteractionOptionResolverError,
  HTTPInteractionOptionResolverErrorCode,
  HTTPInteractionOptionTypeMismatchError,
  HTTPInteractionSubcommandGroupNotFoundError,
  HTTPInteractionSubcommandNotFoundError,
} from "./errors/option-resolver";

export {
  DuplicateApplicationCommandError,
  HTTPInteractionRouterError,
  HTTPInteractionRouterErrorCode,
  InteractionNotAcknowledgedError,
  InteractionHandlerNotAcknowledgedError,
  InvalidAutocompleteConfigurationError,
  UnknownApplicationCommandError,
  UnknownInteractionHandlerError,
  UnsupportedApplicationCommandTypeError,
  UnsupportedInteractionTypeError,
} from "./errors/router";

export {
  HTTPCommandInteractionOptionResolver,
} from "./interactions/option-resolver";

export {
  HTTPChatInputCommandInteraction,
} from "./interactions/chat-input";

export { HTTPAutocompleteInteraction } from "./interactions/autocomplete";
export { HTTPMessageComponentInteraction } from "./interactions/component";
export { HTTPModalSubmitFields, HTTPModalSubmitInteraction } from "./interactions/modal-submit";

export {
  HTTPInteractionCommands,
} from "./commands/router";
