import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

const createMainKeyboard = () => {
  return new InlineKeyboard()
    .webApp("⤵️ НАЧАТЬ ЭКСПЕРТИЗУ", "https://doctor-chat-c-lient.vercel.app")
    .row()
    .text("📋 Как это работает", "how_it_works")
    .text("Гарантии и Правила", "payment_guarantee")
    .row()
    .text("СВЯЗАТЬСЯ С КООРДИНАТОРОМ", "coordinator");
};

bot.command("start", async (ctx) => {
  const welcomeText = `👋 Добро пожаловать в MED EXPERT EU!

Ваш доступ ĸ «Золотому стандарту европейсĸой медицины». Получите независимое «Второе мнение» от эĸспертов из ЕС онлайн.

Наши задачи:
✅ Предоставить эĸспертную стратегию лечения из Европы.
✅ Подобрать врача-партнера в вашем городе для реализации реĸомендаций и выписĸи рецептов.`;

  await ctx.reply(welcomeText, {
    reply_markup: createMainKeyboard(),
  });
});

bot.callbackQuery("how_it_works", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `🚀 С ЧЕГО НАЧАТЬ?
(Ваши действия в приложении)

1️⃣ СТАРТ 🟢
Нажмите кнопку «👨‍⚕️ Получить экспертизу» в главном меню. Откроется наше приложение.

2️⃣ ВЫБОР 👨‍⚕️
Выберите нужного специалиста из списка (например, *Онкология, Кардиология, Неврология*).

3️⃣ ОПЛАТА 💳
Оплатите услугу удобным способом. Безопасность платежей гарантирована.

4️⃣ ЧАТ 💬
Сразу после оплаты открывается защищенный чат с врачом.

---
🔄 ПРОЦЕСС АУДИТА
(Асинхронный чат)

⌛️ **Срок ответа:** 24–72 часа.

1️⃣ ЗАГРУЗКА 📤
Вы отправляете данные, свой вопрос, МРТ и результаты анализов в этот чат.

2️⃣ АНАЛИЗ И ДИАЛОГ 🇪🇺
Европейский Эксперт изучает данные. Если нужны детали — врач задаст уточняющие вопросы прямо в переписке.

3️⃣ ВЫЯВЛЕНИЕ 🔍
Врач находит возможные ошибки в диагнозе, скрытые риски или устаревшие методы (согласно международным Guidelines).

4️⃣ ЗАКЛЮЧЕНИЕ 📄
Вы получаете PDF-файл с четкой стратегией лечения, основанной на доказательной медицине Европы.

---
🏥 АДАПТАЦИЯ РЕКОМЕНДАЦИЙ
(Очный прием)

❓ Что делать с европейским заключением?
Европейский эксперт дает стратегию, но рецепты и направления действуют только от местного врача. Мы организовали этот мост.

1️⃣ ЗАПИСЬ 🗓
Наш координатор подбирает для вас лицензированного Врача-Партнера в вашем городе и согласовывает время.

2️⃣ ОЧНЫЙ ПРИЕМ 🏥
Вы приходите на консультацию в клинику. Это официальный визит к доктору, который уже уведомлен о вашем случае.

3️⃣ ЛЕГАЛИЗАЦИЯ ⚖️
Врач-партнер изучает отчет Med Expert. Он переводит европейские протоколы в правовое поле вашей страны.

✅ РЕЗУЛЬТАТ
Вы выходите из кабинета с официальными документами:
• Действующие рецепты на лекарства.
• Направления на процедуры и обследования.
• План лечения под контролем местного специалиста.

‼️ ВАЖНО:
С нашей формой экспертизы работают только врачи-партнеры MED EXPERT EU.`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp(
          "👨‍⚕️ Получить экспертизу",
          "https://doctor-chat-c-lient.vercel.app",
        )
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});

bot.callbackQuery("payment_guarantee", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `🛡️ ГАРАНТИИ И ПРАВИЛА MED EXPERT EU

💰 Финансовые гарантии:
Мы работаем по системе «Безопасная сделка» (Escrow).
1. Вы оплачиваете услугу в приложении.
2. Деньги замораживаются на счете сервиса.
3. Врач получает оплату только после того, как предоставил вам заключение.
*Если врач откажется от случая или не ответит в срок — 100% средств возвращаются вам автоматически.*

🔒 Конфиденциальность:
Ваши медицинские данные, снимки МРТ и переписка защищены. Мы соблюдаем врачебную тайну.

⚖️ Юридическая сила:
Заключение эксперта из ЕС носит статус «Консультативного мнения» (Second Opinion). Оно служит стратегией, но не является прямым руководством к действию без очного врача.

🚫 Ограничения:
Сервис не оказывает экстренную медицинскую помощь. При острой боли немедленно вызывайте Скорую помощь (103 / 112).

📄 [Читать текст Оферты](https://doctor-chat-backend-production.up.railway.app/uploads/pdfs/user-agreement-public-offer-med-expert-eu.pdf)
📄 [Читать текст Политики Конфиденциальности](https://doctor-chat-backend-production.up.railway.app/uploads/pdfs/                    "privacy-policy-and-consent-to-data-processing.pdf")`
,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp(
          "👨‍⚕️ Начать экспертизу",
          "https://doctor-chat-c-lient.vercel.app",
        )
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});

bot.callbackQuery("coordinator", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📞 СЛУЖБА ЗАБОТЫ MED EXPERT EU

Мы понимаем, что каждый медицинский случай уникален. Если у вас возникли вопросы перед началом работы — мы рядом.

Чем поможет координатор:
🔹 Подскажет, подходит ли ваш случай для онлайн-экспертизы.
🔹 Поможет с загрузкой больших файлов (МРТ/КТ).
🔹 Решит вопросы с оплатой.

🕒 Режим работы:
Ежедневно с 09:00 до 21:00 (по МСК).
В остальное время вы можете оставить сообщение, и мы ответим утром первым делом.

👇 Нажмите на ссылку ниже, чтобы открыть диалог с живым оператором:
https://t.me/m/ZEH5m-TsMTMy`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .url("📧 Написать оператору", "https://t.me/m/ZEH5m-TsMTMy")
        .row()
        .text("🔙 Назад", "back_to_main"),
    },
  );
});
bot.callbackQuery("back_to_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `👋 С возвращением в MED EXPERT EU!

Ваш надежный посредник в получении экспертного медицинского мнения из Европы.`,
    {
      reply_markup: createMainKeyboard(),
    },
  );
});

bot.on("message", async (ctx) => {
  const message = ctx.message.text?.toLowerCase();

  if (!message) return;

  if (
    message.includes("экспертиз") ||
    message.includes("врач") ||
    message.includes("доктор")
  ) {
    await ctx.reply(
      "🔍 Начните медицинскую экспертизу в нашем приложении! Это безопасно и профессионально.",
      {
        reply_markup: new InlineKeyboard().webApp(
          "⤵️ НАЧАТЬ ЭКСПЕРТИЗУ",
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
      "🛡️ Мы гарантируем безопасность платежей через систему Escrow. Средства защищены до получения заключения.",
      {
        reply_markup: new InlineKeyboard().text(
          "🛡️ Подробнее о гарантиях",
          "payment_guarantee",
        ),
      },
    );
  } else if (message.includes("помощь") || message.includes("help")) {
    await ctx.reply(
      "Используйте кнопки меню для навигации или напишите /start",
    );
  } else {
    await ctx.reply(
      "🔍 Чем могу помочь? Перейдите к нашей платформе для связи с европейскими экспертами 👇",
      {
        reply_markup: new InlineKeyboard().webApp(
          "⤵️ НАЧАТЬ ЭКСПЕРТИЗУ",
          "https://doctor-chat-c-lient.vercel.app",
        ),
      },
    );
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `❓ Помощь по платформе MED EXPERT EU:

/start - Главное меню
/help - Эта справка

Наши услуги:
📊 Европейская медицинская экспертиза
🏥 Организация очного приема у партнеров
🛡️ Гарантия безопасности платежей`,
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
