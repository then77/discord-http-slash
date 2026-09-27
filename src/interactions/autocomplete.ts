import {
  InteractionType,
  type APIApplicationCommandAutocompleteInteraction,
  type APIUser,
} from "discord-api-types/v10";

import type { ResolvedMember } from "../types/common";
import { HTTPCommandInteractionOptionResolver } from "./option-resolver";

export interface HTTPAutocompleteFocusedOption {
  readonly name: string;
  readonly type: number;
  readonly value: string | number;
  readonly focused: true;
}

export class HTTPAutocompleteInteraction {
  public readonly raw: APIApplicationCommandAutocompleteInteraction;
  public readonly id: string;
  public readonly applicationId: string;
  public readonly token: string;
  public readonly version: number;
  public readonly type = InteractionType.ApplicationCommandAutocomplete;
  public readonly commandId: string;
  public readonly commandName: string;
  public readonly guildId: string | null;
  public readonly channelId: string | null;
  public readonly locale: string;
  public readonly guildLocale: string | null;
  public readonly user: APIUser;
  public readonly member: ResolvedMember | null;
  public readonly options: HTTPCommandInteractionOptionResolver;

  constructor(raw: APIApplicationCommandAutocompleteInteraction) {
    this.raw = raw;
    this.id = raw.id;
    this.applicationId = raw.application_id;
    this.token = raw.token;
    this.version = raw.version;
    this.commandId = raw.data.id;
    this.commandName = raw.data.name;
    this.guildId = raw.guild_id ?? null;
    this.channelId = raw.channel_id ?? null;
    this.locale = raw.locale;
    this.guildLocale = raw.guild_locale ?? null;

    const user = raw.member?.user ?? raw.user;

    if (!user) {
      throw new TypeError(
        "Autocomplete interaction payload is missing a user.",
      );
    }

    this.user = user;
    this.member = raw.member ?? null;
    this.options = new HTTPCommandInteractionOptionResolver(
      raw.data.options as ConstructorParameters<
        typeof HTTPCommandInteractionOptionResolver
      >[0],
    );
  }

  inGuild(): boolean {
    return this.guildId !== null;
  }

  isAutocomplete(): true {
    return true;
  }

  toJSON(): APIApplicationCommandAutocompleteInteraction {
    return this.raw;
  }
}
