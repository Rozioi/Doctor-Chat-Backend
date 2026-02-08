import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

const createMainKeyboard = () => {
  return new InlineKeyboard()
    .webApp("👨‍⚕️ Найти врача", "https://doctor-chat-c-lient.vercel.app")
    .row()
    .text("📋 Как это работает", "how_it_works")
    .text("💳 Гарантия оплаты", "payment_guarantee")
    .row()
    .text("👥 Для врачей", "for_doctors")
    .text("📞 Контакты", "contacts");
};

bot.command("start", async (ctx) => {
  const welcomeText = `👋 Добро пожаловать на медицинскую платформу MED EXPERT EU!

Мы — надежный посредник между пациентами и врачами:

✅ Гарантия безопасных платежей
✅ Подбор проверенных специалистов
✅ Защита обеих сторон
Начните поиск подходящего врача прямо сейчас!`;

  await ctx.reply(welcomeText, {
    reply_markup: createMainKeyboard(),
  });
});

bot.callbackQuery("how_it_works", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `🔄 Как работает наша платформа:

*Для пациентов:*
1. 🔍 Выбираете подходящего врача
2. 💬 Обсуждаете детали консультации
3. 💳 Оплачиваете через безопасную систему
4. 🩺 Проходите консультацию
5. ✅ Подтверждаете получение услуги
6. 💰 Врач получает оплату

*Наша роль:*
• Гарант честной сделки
• Защита от недобросовестных специалистов
• Обеспечение качества услуг`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp("👨‍⚕️ Найти врача", "https://doctor-chat-c-lient.vercel.app")
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});

bot.callbackQuery("payment_guarantee", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `🛡️ Система гарантий и оплаты:

*Безопасность платежей:*
• Средства хранятся на защищенном счете
• Оплата передается врачу только после вашего подтверждения
• Возврат при некачественной услуге

*Процесс оплаты:*
1. Вы вносите оплату на платформу
2. Получаете консультацию
3. Подтверждаете удовлетворенность услугой
4. Врач получает оплату

*Для врачей:*
• Гарантия получения оплаты за работу
• Защита от недобросовестных пациентов`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()

        .webApp("👨‍⚕️ Начать поиск", "https://doctor-chat-c-lient.vercel.app")
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});

bot.callbackQuery("for_doctors", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `👨‍⚕️ Для медицинских специалистов:

*Преимущества работы через нашу платформу:*

✅ Гарантия оплаты за каждую консультацию
✅ Постоянный поток пациентов
✅ Никаких рисков неоплаты
✅ Техническая поддержка 24/7
✅ Удобный личный кабинет

*Как подключиться:*
1. Зарегистрируйтесь как врач
2. Пройдите верификацию
3. Начните принимать пациентов
4. Получайте оплату без задержек
`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .url(
          "📝 Регистрация врача",
          "https://doctor-chat-c-lient.vercel.app/doctor-registration",
        )
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});
bot.callbackQuery("contacts", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `<b>📞 Контактная информация</b>

<b>Для пациентов и врачей:</b>
📧 : doctor_chat@mail.ru
🕒 Поддержка: 24/7

<b>По вопросам сотрудничества:</b>
📧 : doctor_chat@mail.ru

Мы всегда на связи!`,
    {
      parse_mode: "HTML", // Меняем на HTML
      reply_markup: new InlineKeyboard()
        .webApp(
          "👨‍⚕️ Перейти к платформе",
          "https://doctor-chat-c-lient.vercel.app",
        )
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});
bot.callbackQuery("back_to_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `👋 С возвращением на медицинскую платформу MED EXPERT EU!

Ваш надежный посредник в поиске врачей и гарант безопасных расчетов.`,
    {
      reply_markup: createMainKeyboard(),
    },
  );
});

bot.on("message", async (ctx) => {
  const message = ctx.message.text?.toLowerCase();

  if (!message) return;

  if (
    message.includes("врач") ||
    message.includes("специалист") ||
    message.includes("доктор")
  ) {
    await ctx.reply(
      "🔍 Найдем подходящего врача для вас! Используйте нашу платформу для безопасного подключения.",
      {
        reply_markup: new InlineKeyboard().webApp(
          "👨‍⚕️ Найти врача",
          "https://doctor-chat-c-lient.vercel.app",
        ),
      },
    );
  } else if (
    message.includes("оплат") ||
    message.includes("гарант") ||
    message.includes("безопасн")
  ) {
    await ctx.reply(
      "🛡️ Мы гарантируем безопасность платежей! Средства хранятся у нас до подтверждения качества консультации.",
      {
        reply_markup: new InlineKeyboard().text(
          "💳 Подробнее о гарантиях",
          "payment_guarantee",
        ),
      },
    );
  } else if (
    message.includes("я врач") ||
    message.includes("медик") ||
    message.includes("специалист")
  ) {
    await ctx.reply(
      "👨‍⚕️ Отлично! Для подключения к платформе как врач напишите на doctors@rozioi.pro или посетите наш сайт.",
      {
        reply_markup: new InlineKeyboard().url(
          "📝 Регистрация врача",
          "https://doctor-chat-c-lient.vercel.app/doctor-registration",
        ),
      },
    );
  } else if (message.includes("помощь") || message.includes("help")) {
    await ctx.reply(
      "Используйте кнопки меню для навигации или напишите /start",
    );
  } else {
    await ctx.reply(
      "🔍 Чем могу помочь? Используйте нашу платформу для безопасного подключения к врачам 👇",
      {
        reply_markup: new InlineKeyboard().webApp(
          "👨‍⚕️ Перейти к платформе",
          "https://doctor-chat-c-lient.vercel.app",
        ),
      },
    );
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `❓ Помощь по платформе:

/start - Главное меню
/help - Эта справка

*Наша роль:* безопасный посредник между вами и врачами
*Гарантия:* оплата только после качественной консультации`,
    {
      reply_markup: createMainKeyboard(),
      parse_mode: "Markdown",
    },
  );
});

export function startBot() {
  try {
    console.log("🏥 Starting medical platform bot...");
    bot.start();
    console.log("✅ Platform bot started successfully!");
  } catch (error) {
    console.error("❌ Error starting bot:", error);
  }
}

export default bot;
