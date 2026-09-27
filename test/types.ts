import { SlashCommandBuilder } from "@discordjs/builders";
import type { HTTPApplicationCommand } from "../src/index";

const command: HTTPApplicationCommand = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search items")
    .addStringOption((option) => option
      .setName("query")
      .setDescription("Search term")
      .setAutocomplete(true)),
  execute: (interaction) => interaction.reply("Ready"),
  autocomplete: {
    query: ({ focused, interaction }) => {
      const query: string | number = focused.value;
      interaction.options.getString("query");
      return [{ name: String(query), value: String(query) }];
    },
  },
  interaction: async (interaction) => {
    if (interaction.isMessageComponent()) {
      if (interaction.isButton()) {
        await interaction.deferUpdate();
      } else {
        await interaction.update("Selected");
      }
    } else if (interaction.isModalSubmit()) {
      const query: string = interaction.fields.getTextInputValue("query");
      await interaction.reply(query);
    }
  },
};

void command;
