import { DiscordjsErrorCodes } from "discord.js";
import {
  ApplicationCommandOptionType,
  type APIApplicationCommandInteractionDataBasicOption,
  type APIApplicationCommandInteractionDataOption,
  type APIAttachment,
  type APIInteractionDataResolved,
  type APIRole,
  type APIUser,
} from "discord-api-types/v10";

import type {
  ResolvedChannel,
  ResolvedMember,
} from "../types/common";
import { PublicDiscordjsTypeError } from "../utils/discordjs-errors";

export class HTTPCommandInteractionOptionResolver {
  public readonly data: readonly APIApplicationCommandInteractionDataOption[];
  public readonly resolved: Readonly<APIInteractionDataResolved> | null;

  private readonly hoistedOptions:
    readonly APIApplicationCommandInteractionDataOption[];

  private readonly subcommand: string | null;
  private readonly subcommandGroup: string | null;

  constructor(
    options: readonly APIApplicationCommandInteractionDataOption[] = [],
    resolved?: APIInteractionDataResolved,
  ) {
    this.data = Object.freeze([...options]);
    this.resolved = resolved ? Object.freeze(resolved) : null;

    let hoisted: readonly APIApplicationCommandInteractionDataOption[] =
      options;
    let subcommand: string | null = null;
    let subcommandGroup: string | null = null;

    // Hoist nested options so getters behave like discord.js inside subcommands.
    const first = hoisted[0];

    if (first?.type === ApplicationCommandOptionType.SubcommandGroup) {
      subcommandGroup = first.name;
      hoisted = first.options ?? [];
    }

    const nested = hoisted[0];

    if (nested?.type === ApplicationCommandOptionType.Subcommand) {
      subcommand = nested.name;
      hoisted = nested.options ?? [];
    }

    this.hoistedOptions = hoisted;
    this.subcommand = subcommand;
    this.subcommandGroup = subcommandGroup;
  }

  private getBasicOption(
    name: string,
  ): APIApplicationCommandInteractionDataBasicOption | undefined {
    return this.hoistedOptions.find(
      (
        option,
      ): option is APIApplicationCommandInteractionDataBasicOption =>
        option.name === name &&
        option.type !== ApplicationCommandOptionType.Subcommand &&
        option.type !== ApplicationCommandOptionType.SubcommandGroup,
    );
  }

  get(
    name: string,
    required: true,
  ): APIApplicationCommandInteractionDataBasicOption;

  get(
    name: string,
    required?: false,
  ): APIApplicationCommandInteractionDataBasicOption | null;

  get(
    name: string,
    required = false,
  ): APIApplicationCommandInteractionDataBasicOption | null {
    const option = this.getBasicOption(name);

    if (!option) {
      if (required) {
        throw new PublicDiscordjsTypeError(
          DiscordjsErrorCodes.CommandInteractionOptionNotFound,
          name,
        );
      }

      return null;
    }

    return option;
  }

  private getTypedOption(
    name: string,
    allowedTypes: readonly ApplicationCommandOptionType[],
    required: boolean,
  ): APIApplicationCommandInteractionDataBasicOption | null {
    const option = this.getBasicOption(name);

    if (!option) {
      if (required) {
        throw new PublicDiscordjsTypeError(
          DiscordjsErrorCodes.CommandInteractionOptionNotFound,
          name,
        );
      }

      return null;
    }

    const optionType = option.type;

    if (!allowedTypes.includes(optionType)) {
      throw new PublicDiscordjsTypeError(
        DiscordjsErrorCodes.CommandInteractionOptionType,
        name,
        optionType,
        allowedTypes.join(", "),
      );
    }

    if (required && !("value" in option)) {
      throw new PublicDiscordjsTypeError(
        DiscordjsErrorCodes.CommandInteractionOptionEmpty,
        name,
        optionType,
      );
    }

    return option;
  }

  private requireResolved<T>(
    name: string,
    optionType: ApplicationCommandOptionType,
    value: T | null | undefined,
  ): T {
    if (value !== null && value !== undefined) {
      return value;
    }

    throw new PublicDiscordjsTypeError(
      DiscordjsErrorCodes.CommandInteractionOptionEmpty,
      name,
      optionType,
    );
  }

  getString(name: string, required: true): string;
  getString(name: string, required?: false): string | null;

  getString(name: string, required = false): string | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.String],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.String) {
      return null;
    }

    return option.value;
  }

  getInteger(name: string, required: true): number;
  getInteger(name: string, required?: false): number | null;

  getInteger(name: string, required = false): number | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.Integer],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.Integer) {
      return null;
    }

    return Number(option.value);
  }

  getNumber(name: string, required: true): number;
  getNumber(name: string, required?: false): number | null;

  getNumber(name: string, required = false): number | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.Number],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.Number) {
      return null;
    }

    return Number(option.value);
  }

  getBoolean(name: string, required: true): boolean;
  getBoolean(name: string, required?: false): boolean | null;

  getBoolean(name: string, required = false): boolean | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.Boolean],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.Boolean) {
      return null;
    }

    return option.value;
  }

  getUser(name: string, required: true): APIUser;
  getUser(name: string, required?: false): APIUser | null;

  getUser(name: string, required = false): APIUser | null {
    const option = this.getTypedOption(
      name,
      [
        ApplicationCommandOptionType.User,
        ApplicationCommandOptionType.Mentionable,
      ],
      required,
    );

    if (
      !option ||
      (
        option.type !== ApplicationCommandOptionType.User &&
        option.type !== ApplicationCommandOptionType.Mentionable
      )
    ) {
      return null;
    }

    const value = this.resolved?.users?.[option.value];

    return required
      ? this.requireResolved(name, option.type, value)
      : value ?? null;
  }

  getMember(name: string): ResolvedMember | null {
    const option = this.getTypedOption(
      name,
      [
        ApplicationCommandOptionType.User,
        ApplicationCommandOptionType.Mentionable,
      ],
      false,
    );

    if (
      !option ||
      (
        option.type !== ApplicationCommandOptionType.User &&
        option.type !== ApplicationCommandOptionType.Mentionable
      )
    ) {
      return null;
    }

    return this.resolved?.members?.[option.value] ?? null;
  }

  getRole(name: string, required: true): APIRole;
  getRole(name: string, required?: false): APIRole | null;

  getRole(name: string, required = false): APIRole | null {
    const option = this.getTypedOption(
      name,
      [
        ApplicationCommandOptionType.Role,
        ApplicationCommandOptionType.Mentionable,
      ],
      required,
    );

    if (
      !option ||
      (
        option.type !== ApplicationCommandOptionType.Role &&
        option.type !== ApplicationCommandOptionType.Mentionable
      )
    ) {
      return null;
    }

    const value = this.resolved?.roles?.[option.value];

    return required
      ? this.requireResolved(name, option.type, value)
      : value ?? null;
  }

  getChannel(name: string, required: true): ResolvedChannel;
  getChannel(name: string, required?: false): ResolvedChannel | null;

  getChannel(name: string, required = false): ResolvedChannel | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.Channel],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.Channel) {
      return null;
    }

    const value = this.resolved?.channels?.[option.value];

    return required
      ? this.requireResolved(name, option.type, value)
      : value ?? null;
  }

  getAttachment(name: string, required: true): APIAttachment;
  getAttachment(name: string, required?: false): APIAttachment | null;

  getAttachment(name: string, required = false): APIAttachment | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.Attachment],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.Attachment) {
      return null;
    }

    const value = this.resolved?.attachments?.[option.value];

    return required
      ? this.requireResolved(name, option.type, value)
      : value ?? null;
  }

  getMentionable(
    name: string,
    required: true,
  ): ResolvedMember | APIUser | APIRole;

  getMentionable(
    name: string,
    required?: false,
  ): ResolvedMember | APIUser | APIRole | null;

  getMentionable(
    name: string,
    required = false,
  ): ResolvedMember | APIUser | APIRole | null {
    const option = this.getTypedOption(
      name,
      [ApplicationCommandOptionType.Mentionable],
      required,
    );

    if (!option || option.type !== ApplicationCommandOptionType.Mentionable) {
      return null;
    }

    const id = option.value;
    const value =
      this.resolved?.members?.[id] ??
      this.resolved?.users?.[id] ??
      this.resolved?.roles?.[id] ??
      null;

    return required
      ? this.requireResolved(name, option.type, value)
      : value;
  }

  getSubcommand(required: true): string;
  getSubcommand(required?: false): string | null;

  getSubcommand(required = true): string | null {
    if (required && !this.subcommand) {
      throw new PublicDiscordjsTypeError(
        DiscordjsErrorCodes.CommandInteractionOptionNoSubcommand,
      );
    }

    return this.subcommand;
  }

  getSubcommandGroup(required: true): string;
  getSubcommandGroup(required?: false): string | null;

  getSubcommandGroup(required = false): string | null {
    if (required && !this.subcommandGroup) {
      throw new PublicDiscordjsTypeError(
        DiscordjsErrorCodes.CommandInteractionOptionNoSubcommandGroup,
      );
    }

    return this.subcommandGroup;
  }
}
