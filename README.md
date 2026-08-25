# discord-http-slash

Use `discord.js`-style slash command definitions and handlers with Discord HTTP interactions.

`discord-http-slash` bridges the gap between the flexibility of `discord.js` slash command builders and the simpler request/response model used by Discord interaction webhooks. It is designed to be safe for serverless runtimes because the initial interaction response is returned from your HTTP route instead of requiring a long-running gateway client.

> [!NOTE]
> Only chat input slash commands are supported right now. User context menu commands and message context menu commands are not supported yet.

## Features

- Define commands with familiar `discord.js` `SlashCommandBuilder` objects.
- Handle Discord HTTP interaction payloads without running a gateway bot process.
- Supports immediate replies, deferred replies, editing the original reply, follow-ups, fetching replies, and deleting replies through interaction webhooks.
- Includes a `discord.js`-style command option resolver for chat input command options.
- TypeScript declarations are generated for package consumers.

## Installation

For the familiar `discord.js` builder and REST APIs:

```sh
npm install discord-http-slash discord.js discord-interactions
```

Or, if you do not need the full `discord.js` package, you can install only the smaller Discord packages used by the examples below:

```sh
npm install discord-http-slash @discordjs/builders @discordjs/rest discord-interactions
```

## Basic usage

```ts
import { SlashCommandBuilder } from "discord.js";
import { verifyKey } from "discord-interactions";
import { HTTPInteractionCommands } from "discord-http-slash";

const commands = new HTTPInteractionCommands([
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong"),

    async execute(interaction) {
      await interaction.reply("Pong!");
    },
  },
]);

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();

  if (
    !signature ||
    !timestamp ||
    !verifyKey(body, signature, timestamp, process.env.DISCORD_PUBLIC_KEY!)
  ) {
    return new Response("Invalid request signature", { status: 401 });
  }

  const response = await commands.handle(JSON.parse(body));

  return Response.json(response);
}
```

## Registering commands

`HTTPInteractionCommands#toJSON()` returns the command payloads from your `discord.js` builders, which you can pass to your preferred Discord command registration script.

```ts
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { HTTPInteractionCommands } from "discord-http-slash";

const commands = new HTTPInteractionCommands([
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong"),
    execute: (interaction) => interaction.reply("Pong!"),
  },
]);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

await rest.put(
  Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID!),
  { body: commands.toJSON() },
);
```

## Using smaller Discord packages

`discord-http-slash` does not require the full `discord.js` package at runtime. If you prefer a smaller install, command builders can come from `@discordjs/builders` and command registration can use `@discordjs/rest` directly.

```ts
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { HTTPInteractionCommands } from "discord-http-slash";

const commands = new HTTPInteractionCommands([
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong"),
    execute: (interaction) => interaction.reply("Pong!"),
  },
]);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

await rest.put(
  Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID!),
  { body: commands.toJSON() },
);
```

Signature verification is intentionally left up to your app. The examples use `discord-interactions`, but any Ed25519 verification implementation works.

## API overview

### `HTTPInteractionCommands`

Routes raw Discord interaction payloads to the matching chat input command.

```ts
const router = new HTTPInteractionCommands(commands, options);
const response = await router.handle(rawInteraction);
```

- Responds to Discord ping interactions automatically.
- Throws for unsupported interaction types, unsupported command types, duplicate commands, unknown commands, and commands that finish without replying or deferring.

### Command shape

```ts
interface HTTPApplicationCommand {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;
  execute(interaction: HTTPChatInputCommandInteraction): void | Promise<void>;
}
```

### Error responses

`commands.handle(...)` throws package errors for cases like unknown commands, unsupported interaction types, or commands that finish without replying or deferring. Package errors extend `DiscordHTTPSlashError` and can be turned into an immediate ephemeral Discord response with `error.toErrorResponse()`.

```ts
import {
  DiscordHTTPSlashError,
  HTTPInteractionCommands,
} from "discord-http-slash";

try {
  const response = await commands.handle(JSON.parse(body));

  return Response.json(response);
} catch (error) {
  if (error instanceof DiscordHTTPSlashError) {
    /**
     * Returns a JSON response like:
     * {
     *   "type": 4,
     *   "data": {
     *     "content": "Unknown application command: \"ping\"",
     *     "flags": 64
     *   }
     * }
     */
    return Response.json(error.toErrorResponse());
  }

  throw error;
}
```

### Interaction methods

`HTTPChatInputCommandInteraction` currently supports:

- `reply(input)`
- `deferReply(options?)`
- `editReply(input)`
- `followUp(input)`
- `fetchReply(message?)`
- `deleteReply(message?)`
- `options.getString(...)`, `getInteger(...)`, `getNumber(...)`, `getBoolean(...)`, `getUser(...)`, `getMember(...)`, `getRole(...)`, `getChannel(...)`, `getAttachment(...)`, `getMentionable(...)`, `getSubcommand(...)`, and `getSubcommandGroup(...)`

## Development

```sh
npm install
npm run typecheck
npm run build
```

## License

MIT
