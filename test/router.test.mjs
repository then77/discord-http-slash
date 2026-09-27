import assert from "node:assert/strict";
import { test } from "node:test";

import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ApplicationCommandOptionType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";
import {
  DuplicateApplicationCommandError,
  HTTPInteractionAlreadyRepliedError,
  HTTPInteractionCommands,
  HTTPInteractionNotRepliedError,
  InteractionHandlerNotAcknowledgedError,
  InteractionNotAcknowledgedError,
  InvalidAutocompleteConfigurationError,
  UnknownApplicationCommandError,
  UnknownInteractionHandlerError,
  UnsupportedApplicationCommandTypeError,
} from "../dist/index.mjs";

const user = { id: "user-1", username: "tester", discriminator: "0", avatar: null };

function command(name = "demo", extras = {}) {
  return {
    data: new SlashCommandBuilder().setName(name).setDescription("A test command"),
    execute: (interaction) => interaction.reply("ok"),
    ...extras,
  };
}

function raw(type, data = {}) {
  return {
    type,
    id: "interaction-1",
    application_id: "app-1",
    token: "token-1",
    version: 1,
    locale: "en-US",
    channel_id: "channel-1",
    user,
    data,
  };
}

function slash(name = "demo", options = []) {
  return raw(InteractionType.ApplicationCommand, {
    id: "command-1",
    name,
    type: 1,
    options,
  });
}

function component(customId, componentType = ComponentType.Button, more = {}) {
  return {
    ...raw(InteractionType.MessageComponent, {
      custom_id: customId,
      component_type: componentType,
      ...more,
    }),
    message: { id: "message-1", content: "before" },
  };
}

function modal(customId, components) {
  return raw(InteractionType.ModalSubmit, { custom_id: customId, components });
}

test("existing command API: ping, lookup, registration and reply", async () => {
  const router = new HTTPInteractionCommands([command()]);
  assert.equal(router.size, 1);
  assert.equal(router.has("demo"), true);
  assert.equal(router.get("missing"), null);
  assert.equal(router.toJSON()[0].name, "demo");
  assert.deepEqual(await router.handle(raw(InteractionType.Ping)), {
    type: InteractionResponseType.Pong,
  });

  const response = await router.handle(slash());
  assert.equal(response.type, InteractionResponseType.ChannelMessageWithSource);
  assert.equal(response.data.content, "ok");
});

test("existing command API: option resolution and deferred ephemeral reply", async () => {
  const router = new HTTPInteractionCommands([
    command("warn", {
      execute: async (interaction) => {
        assert.equal(interaction.commandName, "warn");
        assert.equal(interaction.options.getSubcommand(), "add");
        assert.equal(interaction.options.getString("reason", true), "spam");
        assert.equal(interaction.user.id, user.id);
        await interaction.deferReply({ ephemeral: true });
        assert.equal(interaction.deferred, true);
        assert.equal(interaction.ephemeral, true);
      },
    }),
  ]);

  const response = await router.handle(slash("warn", [{
    type: ApplicationCommandOptionType.Subcommand,
    name: "add",
    options: [{ type: ApplicationCommandOptionType.String, name: "reason", value: "spam" }],
  }]));
  assert.equal(response.type, InteractionResponseType.DeferredChannelMessageWithSource);
  assert.equal(response.data.flags, MessageFlags.Ephemeral);
});

test("existing command API: registration and acknowledgement errors", async () => {
  assert.throws(() => new HTTPInteractionCommands([command(), command()]), DuplicateApplicationCommandError);
  const router = new HTTPInteractionCommands([command("silent", { execute() {} })]);
  await assert.rejects(router.handle(slash("unknown")), UnknownApplicationCommandError);
  await assert.rejects(router.handle(slash("silent")), InteractionNotAcknowledgedError);
  await assert.rejects(router.handle(raw(InteractionType.ApplicationCommand, {
    id: "command-1", name: "silent", type: 2,
  })), UnsupportedApplicationCommandTypeError);
});

test("existing webhook methods use the interaction token after a deferred reply", async () => {
  const calls = [];
  const rest = {
    patch: async (...args) => { calls.push(["patch", ...args]); return { id: "message-1" }; },
    post: async (...args) => { calls.push(["post", ...args]); return { id: "message-2" }; },
    get: async (...args) => { calls.push(["get", ...args]); return { id: "message-1" }; },
    delete: async (...args) => { calls.push(["delete", ...args]); },
  };
  const router = new HTTPInteractionCommands([command("webhook", {
    execute: async (interaction) => {
      await assert.rejects(interaction.editReply("too early"), HTTPInteractionNotRepliedError);
      await interaction.deferReply();
      assert.equal((await interaction.editReply("edited")).id, "message-1");
      assert.equal((await interaction.followUp("follow-up")).id, "message-2");
      assert.equal((await interaction.fetchReply()).id, "message-1");
      await interaction.deleteReply();
    },
  })], { rest });

  const response = await router.handle(slash("webhook"));
  assert.equal(response.type, InteractionResponseType.DeferredChannelMessageWithSource);
  assert.deepEqual(calls.map(([method]) => method), ["patch", "post", "get", "delete"]);
  assert.equal(calls[0][2].auth, false);
  assert.equal(calls[0][2].body.content, "edited");
  assert.equal(calls[1][2].body.content, "follow-up");
  assert.equal(calls[1][2].query.get("wait"), "true");
  assert.match(calls[0][1], /webhooks\/app-1\/token-1\/messages\/%40original/);
});

test("autocomplete routes focused options and caps results at 25", async () => {
  const data = new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addStringOption((option) => option
      .setName("reason")
      .setDescription("Reason")
      .setAutocomplete(true));
  const router = new HTTPInteractionCommands([{
    data,
    execute: (interaction) => interaction.reply("ok"),
    autocomplete: {
      reason: ({ interaction, focused }) => {
        assert.equal(interaction.commandName, "warn");
        assert.equal(interaction.options.getString("reason"), "sp");
        assert.equal(focused.name, "reason");
        assert.equal(focused.value, "sp");
        return Array.from({ length: 30 }, (_, index) => ({ name: `choice ${index}`, value: index }));
      },
    },
  }]);

  const response = await router.handle(raw(InteractionType.ApplicationCommandAutocomplete, {
    id: "command-1",
    name: "warn",
    type: 1,
    options: [{ type: ApplicationCommandOptionType.String, name: "reason", value: "sp", focused: true }],
  }));
  assert.equal(response.type, InteractionResponseType.ApplicationCommandAutocompleteResult);
  assert.equal(response.data.choices.length, 25);
  assert.deepEqual(response.data.choices[0], { name: "choice 0", value: 0 });
});

test("autocomplete registration requires matching handlers", () => {
  const data = new SlashCommandBuilder()
    .setName("find")
    .setDescription("Find a value")
    .addStringOption((option) => option.setName("query").setDescription("Query").setAutocomplete(true));
  assert.throws(() => new HTTPInteractionCommands([{ data, execute() {} }]), InvalidAutocompleteConfigurationError);
  assert.throws(() => new HTTPInteractionCommands([{
    data, execute() {}, autocomplete: { other: () => [] },
  }]), InvalidAutocompleteConfigurationError);
  assert.throws(() => new HTTPInteractionCommands([command("plain", {
    autocomplete: () => [],
  })]), InvalidAutocompleteConfigurationError);
});

test("button interaction can open a modal and modal input returns to its command", async () => {
  const router = new HTTPInteractionCommands([command("warn", {
    interaction: async (interaction) => {
      if (interaction.isMessageComponent()) {
        assert.equal(interaction.isButton(), true);
        assert.equal(interaction.message.id, "message-1");
        await interaction.showModal({
          custom_id: "warn:submit",
          title: "Warn member",
          components: [{
            type: ComponentType.ActionRow,
            components: [{ type: ComponentType.TextInput, custom_id: "reason", style: 1, label: "Reason" }],
          }],
        });
      } else {
        assert.equal(interaction.isModalSubmit(), true);
        assert.equal(interaction.fields.getTextInputValue("reason"), "spam");
        await interaction.reply("Saved warning");
      }
    },
  })]);

  const opening = await router.handle(component("warn:open"));
  assert.equal(opening.type, InteractionResponseType.Modal);
  assert.equal(opening.data.custom_id, "warn:submit");

  const submission = await router.handle(modal("warn:submit", [{
    type: ComponentType.ActionRow,
    components: [{ type: ComponentType.TextInput, custom_id: "reason", value: "spam" }],
  }]));
  assert.equal(submission.type, InteractionResponseType.ChannelMessageWithSource);
  assert.equal(submission.data.content, "Saved warning");
});

test("slash commands can open a modal directly", async () => {
  const router = new HTTPInteractionCommands([command("form", {
    execute: (interaction) => interaction.showModal({
      custom_id: "form:submit",
      title: "Complete form",
      components: [{
        type: ComponentType.ActionRow,
        components: [{ type: ComponentType.TextInput, custom_id: "answer", style: 1, label: "Answer" }],
      }],
    }),
  })]);

  const response = await router.handle(slash("form"));
  assert.equal(response.type, InteractionResponseType.Modal);
  assert.equal(response.data.custom_id, "form:submit");
});

test("select interaction exposes values and supports message update", async () => {
  const router = new HTTPInteractionCommands([command("poll", {
    interaction: async (interaction) => {
      assert.equal(interaction.isMessageComponent(), true);
      assert.equal(interaction.isSelectMenu(), true);
      assert.deepEqual(interaction.values, ["a", "b"]);
      await interaction.update("Updated");
      await assert.rejects(interaction.reply("again"), HTTPInteractionAlreadyRepliedError);
    },
  })]);
  const response = await router.handle(component("poll:vote", ComponentType.StringSelect, { values: ["a", "b"] }));
  assert.equal(response.type, InteractionResponseType.UpdateMessage);
  assert.equal(response.data.content, "Updated");
});

test("component deferUpdate and label-based modal fields are supported", async () => {
  const router = new HTTPInteractionCommands([command("form", {
    interaction: async (interaction) => {
      if (interaction.isMessageComponent()) {
        await interaction.deferUpdate();
      } else {
        assert.equal(interaction.fields.getTextInputValue("answer"), "yes");
        assert.deepEqual(interaction.fields.getValues("choices"), ["a"]);
        await interaction.reply("Received");
      }
    },
  })]);

  const deferred = await router.handle(component("form:next"));
  assert.deepEqual(deferred, { type: InteractionResponseType.DeferredMessageUpdate });

  const response = await router.handle(modal("form:submit", [
    { type: ComponentType.Label, label: "Answer", component: {
      type: ComponentType.TextInput, custom_id: "answer", value: "yes",
    } },
    { type: ComponentType.Label, label: "Choices", component: {
      type: ComponentType.StringSelect, custom_id: "choices", values: ["a"],
    } },
  ]));
  assert.equal(response.data.content, "Received");
});

test("custom interaction requires an owning command and an acknowledgement", async () => {
  const router = new HTTPInteractionCommands([command("poll", { interaction() {} })]);
  await assert.rejects(router.handle(component("unknown:vote")), UnknownInteractionHandlerError);
  await assert.rejects(router.handle(component("poll")), UnknownInteractionHandlerError);
  await assert.rejects(router.handle(component("poll:vote")), InteractionHandlerNotAcknowledgedError);
});
