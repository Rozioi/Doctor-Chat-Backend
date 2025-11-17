import { Bot, InlineKeyboard } from "grammy";
const bot = new Bot("8322768927:AAHy9zUG5Li0bFgW6gVYcvNKIQ_2r2bfaIc");
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    "Open Mini App",
    "https://rozioi.pro",
  );

  await ctx.reply("Здравствуйт , дорогой пользователь", {
    reply_markup: keyboard,
  });
});

export function startBot() {
  try {
    console.log("Starting bot...");
    bot.start();
  } catch (error) {
    console.error(error);
  }
}

export default bot;
