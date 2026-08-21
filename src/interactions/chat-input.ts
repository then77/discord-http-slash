import {
  MessageFlags,
  REST,
} from "discord.js";
import {
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  Routes,
  type APIChatInputApplicationCommandInteraction,
  type APIMessage,
  type APIUser,
} from "discord-api-types/v10";

import {
  HTTPInteractionAlreadyRepliedError,
  HTTPInteractionNotRepliedError,
} from "../errors/interaction";
import type { ResolvedMember } from "../types/common";
import type {
  HTTPDeferReplyOptions,
  HTTPInitialInteractionResponse,
  HTTPInteractionOptions,
  HTTPInteractionReplyData,
} from "../types/interaction";
import { normalizeReplyPayload } from "../utils/normalize";
import { HTTPCommandInteractionOptionResolver } from "./option-resolver";

export class HTTPChatInputCommandInteraction {
  public readonly raw: APIChatInputApplicationCommandInteraction;

  public readonly id: string;
  public readonly applicationId: string;
  public readonly token: string;
  public readonly version: number;

  public readonly type = InteractionType.ApplicationCommand;
  public readonly commandType = ApplicationCommandType.ChatInput;

  public readonly commandId: string;
  public readonly commandName: string;

  public readonly guildId: string | null;
  public readonly channelId: string | null;

  public readonly locale: string;
  public readonly guildLocale: string | null;

  public readonly user: APIUser;
  public readonly member: ResolvedMember | null;

  public readonly options: HTTPCommandInteractionOptionResolver;

  public deferred = false;
  public replied = false;
  public ephemeral: boolean | null = null;

  private readonly rest: REST;

  // The initial callback is returned by the HTTP route, not sent through REST.
  private initialResponse: HTTPInitialInteractionResponse | null = null;

  constructor(
    raw: APIChatInputApplicationCommandInteraction,
    options: HTTPInteractionOptions = {},
  ) {
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
      throw new TypeError("Chat input interaction payload is missing a user.");
    }

    this.user = user;
    this.member = raw.member ?? null;

    this.options = new HTTPCommandInteractionOptionResolver(
      raw.data.options ?? [],
      raw.data.resolved,
    );

    this.rest = options.rest ?? new REST({ version: "10" });
  }

  get acknowledged(): boolean {
    return this.replied || this.deferred;
  }

  getInitialResponse(): HTTPInitialInteractionResponse | null {
    return this.initialResponse;
  }

  takeInitialResponse(): HTTPInitialInteractionResponse | null {
    const response = this.initialResponse;
    this.initialResponse = null;

    return response;
  }

  async reply(input: HTTPInteractionReplyData): Promise<void> {
    if (this.deferred || this.replied) {
      throw new HTTPInteractionAlreadyRepliedError();
    }

    const data = normalizeReplyPayload(input);

    this.ephemeral = Boolean(
      (data.flags ?? 0) & MessageFlags.Ephemeral,
    );

    this.replied = true;
    this.initialResponse = {
      type: InteractionResponseType.ChannelMessageWithSource,
      data,
    };
  }

  async deferReply(
    options: HTTPDeferReplyOptions = {},
  ): Promise<void> {
    if (this.deferred || this.replied) {
      throw new HTTPInteractionAlreadyRepliedError();
    }

    let flags = options.flags ?? 0;

    if (options.ephemeral) {
      flags |= MessageFlags.Ephemeral;
    }

    this.ephemeral = Boolean(flags & MessageFlags.Ephemeral);
    this.deferred = true;

    this.initialResponse = {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      ...(flags !== 0
        ? {
            data: { flags },
          }
        : {}),
    };
  }

  async editReply(
    input: HTTPInteractionReplyData,
  ): Promise<APIMessage> {
    this.assertAcknowledged();

    const result = await this.rest.patch(
      Routes.webhookMessage(
        this.applicationId,
        this.token,
        "@original",
      ),
      {
        auth: false,
        body: normalizeReplyPayload(input),
      },
    );

    this.replied = true;

    return result as APIMessage;
  }

  async followUp(
    input: HTTPInteractionReplyData,
  ): Promise<APIMessage> {
    this.assertAcknowledged();

    const result = await this.rest.post(
      Routes.webhook(this.applicationId, this.token),
      {
        auth: false,
        query: new URLSearchParams({ wait: "true" }),
        body: normalizeReplyPayload(input),
      },
    );

    return result as APIMessage;
  }

  async fetchReply(
    message: string | "@original" = "@original",
  ): Promise<APIMessage> {
    this.assertAcknowledged();

    const result = await this.rest.get(
      Routes.webhookMessage(
        this.applicationId,
        this.token,
        message,
      ),
      { auth: false },
    );

    return result as APIMessage;
  }

  async deleteReply(
    message: string | "@original" = "@original",
  ): Promise<void> {
    this.assertAcknowledged();

    await this.rest.delete(
      Routes.webhookMessage(
        this.applicationId,
        this.token,
        message,
      ),
      { auth: false },
    );
  }

  inGuild(): boolean {
    return this.guildId !== null;
  }

  isChatInputCommand(): true {
    return true;
  }

  isRepliable(): true {
    return true;
  }

  toJSON(): APIChatInputApplicationCommandInteraction {
    return this.raw;
  }

  private assertAcknowledged(): void {
    if (!this.deferred && !this.replied) {
      throw new HTTPInteractionNotRepliedError();
    }
  }
}
