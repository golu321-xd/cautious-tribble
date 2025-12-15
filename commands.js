const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("giveaccess")
    .setDescription("Give script access")
    .addStringOption(o => o.setName("userid").setRequired(true)),

  new SlashCommandBuilder()
    .setName("removeaccess")
    .setDescription("Remove script access")
    .addStringOption(o => o.setName("userid").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban user")
    .addStringOption(o =>
      o.setName("type").setRequired(true)
        .addChoices(
          { name: "userid", value: "userid" },
          { name: "hwid", value: "hwid" },
          { name: "ip", value: "ip" }
        ))
    .addStringOption(o => o.setName("value").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban user")
    .addStringOption(o => o.setName("type").setRequired(true))
    .addStringOption(o => o.setName("value").setRequired(true)),

  new SlashCommandBuilder()
    .setName("history")
    .setDescription("User execution history")
    .addStringOption(o => o.setName("userid").setRequired(true)),

  new SlashCommandBuilder()
    .setName("addadmin")
    .setDescription("Add admin")
    .addStringOption(o => o.setName("discordid").setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("Slash commands registered ✅");
})();
