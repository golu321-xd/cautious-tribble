require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const express = require("express");

// ===== KEEP ALIVE =====
const app = express();
app.use(express.json());
app.get("/", (_, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000);

// ===== DISCORD =====
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ===== SUPABASE =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

const OWNER = process.env.OWNER_ID;

// ===== HELPERS =====
async function isAdmin(id) {
  if (id === OWNER) return true;
  const { data } = await supabase.from("admins").select("*").eq("discord_id", id).single();
  return !!data;
}

// ===== DISCORD READY =====
client.once("ready", () => {
  console.log("Bot Online ✅");
});

// ===== SLASH HANDLER =====
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;
  if (!(await isAdmin(i.user.id)))
    return i.reply({ content: "No permission", ephemeral: true });

  const embed = new EmbedBuilder().setColor("Green").setTimestamp();

  if (i.commandName === "giveaccess") {
    await supabase.from("access").insert({ userid: i.options.getString("userid") });
    embed.setTitle("Access Given");
  }

  if (i.commandName === "removeaccess") {
    await supabase.from("access").delete().eq("userid", i.options.getString("userid"));
    embed.setTitle("Access Removed");
  }

  if (i.commandName === "ban") {
    await supabase.from("bans").insert({
      type: i.options.getString("type"),
      value: i.options.getString("value")
    });
    embed.setTitle("User Banned");
  }

  if (i.commandName === "unban") {
    await supabase.from("bans")
      .delete()
      .eq("type", i.options.getString("type"))
      .eq("value", i.options.getString("value"));
    embed.setTitle("User Unbanned");
  }

  if (i.commandName === "addadmin") {
    await supabase.from("admins").insert({
      discord_id: i.options.getString("discordid")
    });
    embed.setTitle("Admin Added");
  }

  if (i.commandName === "history") {
    const { data } = await supabase
      .from("executions")
      .select("*")
      .eq("userid", i.options.getString("userid"));

    embed.setTitle("History")
      .setDescription(data.map(d => d.time).join("\n") || "No data");
  }

  i.reply({ embeds: [embed] });
});

// ===== ROBLOX API =====
app.post("/execute", async (req, res) => {
  const { userid, username, display, hwid, ip } = req.body;

  const banned = await supabase.from("bans").select("*").or(
    `value.eq.${userid},value.eq.${hwid},value.eq.${ip}`
  );
  if (banned.data.length) return res.status(403).json({ ok: false });

  const access = await supabase.from("access").select("*").eq("userid", userid).single();
  if (!access.data) return res.status(401).json({ ok: false });

  await supabase.from("executions").insert({
    userid, username, display, hwid, ip, time: new Date().toISOString()
  });

  res.json({ ok: true });
});

client.login(process.env.BOT_TOKEN);
