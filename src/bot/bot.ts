import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

const createMainKeyboard = () => {
  return new InlineKeyboard()
    .webApp("⤵️ НАЧАТЬ АУДИТ", "https://doctor-chat-c-lient.vercel.app")
    .row()
    .text("📋 Как это работает", "how_it_works")
    .text("Гарантии и Правила", "payment_guarantee")
    .row()
    .text("СВЯЗАТЬСЯ С КООРДИНАТОРОМ", "coordinator");
};

bot.command("start", async (ctx) => {
  const payload = ctx.match;
  if (payload && typeof payload === "string" && payload.startsWith("chat_")) {
    const chatId = parseInt(payload.replace("chat_", ""), 10);
    const userId = ctx.from?.id;

    if (!userId) return;

    try {
      const { ChatRepo } = await import("../repositories/chatRepo");
      const { userRepo } = await import("../repositories/userRepo");

      const chat = await ChatRepo.getChatById(chatId);
      if (!chat) {
        await ctx.reply("❌ Чат не найден.");
        return;
      }

      const user = await userRepo.getUserByTelegramId(userId.toString());
      if (!user) {
        await ctx.reply("❌ Ваш профиль не найден на платформе.");
        return;
      }

      let partnerId;
      let partnerRole;

      if (chat.patientId === user.id) {
        const doctorUser = chat.doctor || Math.max(0, chat.doctorId);
        const fetchedDocUser = await userRepo.getUserById(chat.doctorId);
        partnerId = Number(fetchedDocUser?.telegramId);
        partnerRole = "Врач";
      } else if (chat.doctorId === user.id) {
        const patientUser = chat.patient || Math.max(0, chat.patientId);
        const fetchedPatUser = await userRepo.getUserById(chat.patientId);
        partnerId = Number(fetchedPatUser?.telegramId);
        partnerRole = "Пациент";
      } else {
        await ctx.reply("❌ У вас нет доступа к этому чату.");
        return;
      }

      if (!partnerId) {
        await ctx.reply(
          "❌ Пользователь-собеседник еще не подключил Telegram.",
        );
        return;
      }

      activeChats.set(userId, partnerId);
      activeChats.set(partnerId, userId);

      await ctx.api.sendMessage(
        userId,
        `✅ Вы успешно подключились к чату #${chatId}.\nВаш собеседник: ${partnerRole}.\nВы можете отправлять сообщения, фото и документы анонимно. Для завершения сеанса введите /stop`,
      );

      await ctx.api.sendMessage(
        partnerId,
        `🔔 Ваш ${partnerRole.toLowerCase()} подключился к чату #${chatId}! Теперь вы можете общаться. Для завершения сеанса введите /stop`,
      );

      return;
    } catch (error) {
      console.error(error);
      await ctx.reply("❌ Ошибка при подключении к чату.");
      return;
    }
  }

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
    `🚀 **С ЧЕГО НАЧАТЬ?**
(Ваши действия в приложении)

1️⃣ **СТАРТ** 🟢
Нажмите кнопку «Получить аудит» в главном меню. Откроется наше приложение.

2️⃣ **ВЫБОР** 👨‍🔬
Выберите нужного специалиста из списка (например, *Онкология, Кардиология, Неврология*).

3️⃣ **ОПЛАТА** 💳
Оплатите услугу удобным способом. Безопасность платежей гарантирована.

4️⃣ **ЧАТ** 💬
Сразу после оплаты открывается защищенный чат с европейским экспертом.

---
🔄 **ПРОЦЕСС АУДИТА**
(Асинхронный чат)

⌛️ **Срок ответа:** 24–72 часа.

1️⃣ **ЗАГРУЗКА** 📤
Вы отправляете медицинские данные, свой вопрос, МРТ и результаты анализов в этот чат.

2️⃣ **АНАЛИЗ И ДИАЛОГ** 🇪🇺
Европейский специалист изучает данные. Если нужны детали — эксперт задаст уточняющие вопросы прямо в переписке.

3️⃣ **ВЫЯВЛЕНИЕ** 🔍
Специалист анализирует данные на предмет возможных неточностей в первичном диагнозе, скрытых рисков или устаревших методов (согласно международным *Guidelines*).

4️⃣ **ЗАКЛЮЧЕНИЕ** 📄
Вы получаете PDF-файл с детальным аналитическим отчетом и рекомендациями, основанными на доказательной медицине Европы.

---
🏥 **ЧТО ДЕЛАТЬ С ЕВРОПЕЙСКИМ ЗАКЛЮЧЕНИЕМ?**
(Ваш следующий шаг)

Европейский эксперт предоставляет передовую аналитику, но выписка рецептов и назначение процедур остаются исключительно в компетенции вашего местного лечащего врача.

1️⃣ **ПОЛУЧЕНИЕ ОТЧЕТА** 📄
Вы скачиваете детальный PDF-файл с аналитикой от европейского специалиста.

2️⃣ **ВИЗИТ В КЛИНИКУ** 🏥
Вы предоставляете этот отчет вашему местному лечащему врачу на очном приеме в вашем городе.

3️⃣ **АДАПТАЦИЯ ТАКТИКИ** ⚖️
Ваш врач изучает европейскую аналитику и, опираясь на нее, может скорректировать текущий план лечения или выписать необходимые рецепты в рамках законодательства вашей страны.

✅ **РЕЗУЛЬТАТ**
Вы получаете уверенность в диагнозе и независимый аудит (*Second Opinion*), который помогает вам и вашему врачу выбрать наилучшую стратегию.`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .webApp(
          "👨‍⚕️ Получить аудит",
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
    `🛡️ **ГАРАНТИИ И ПРАВИЛА MED EXPERT EU**

💰 **Финансовые гарантии:**
Мы работаем по системе «Безопасная сделка» (Escrow).

1️⃣ Вы оплачиваете услугу в приложении.
2️⃣ Деньги замораживаются на счете платформы.
3️⃣ Эксперт получает оплату только после того, как предоставил вам готовое аналитическое заключение.

*Если специалист откажется от случая или не ответит в срок — 100% средств возвращаются вам автоматически.*

🔒 **Конфиденциальность:**
Ваши медицинские данные, снимки МРТ и переписка надежно защищены. Мы соблюдаем строгую политику конфиденциальности и европейские стандарты защиты информации (**DSGVO / GDPR**).

⚖️ **Юридическая сила:**
Заключение эксперта из ЕС носит статус «Независимого информационного аудита» (*Second Opinion*). Оно служит аналитической базой, но не заменяет очной консультации и не является прямым руководством к действию без участия вашего лечащего врача.

🚫 **Ограничения:**
Сервис предоставляет только информационно-аналитические услуги и не оказывает экстренную медицинскую помощь. При острой боли немедленно вызывайте Скорую помощь (**103 / 112**).

📄 [Читать текст Оферты](https://doctor-chat-backend-production.up.railway.app/uploads/pdfs/user-agreement-public-offer-med-expert-eu.pdf)
📄 [Читать текст Политики Конфиденциальности](https://doctor-chat-backend-production.up.railway.app/uploads/pdfs/privacy-policy-and-consent-to-data-processing.pdf)`,
    {
      parse_mode: "Markdown",
      // Если TS ругается на link_preview, значит версия @grammyjs/types устарела.
      // Используем [key: string]: any подход через приведение типа
      link_preview: {
        is_disabled: true,
      },
      reply_markup: new InlineKeyboard()
        .webApp(
          "👨‍⚕️ Начать аудит",
          "https://doctor-chat-c-lient.vercel.app",
        )
        .row()
        .text("🔙 Назад", "back_to_main"),
    } as any,
  );
});
bot.callbackQuery("coordinator", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📞 СЛУЖБА ЗАБОТЫ MED EXPERT EU

Мы понимаем, что каждый медицинский случай уникален. Если у вас возникли вопросы перед началом работы — мы рядом.

Чем поможет координатор:
🔹 Подскажет, подходит ли ваш случай для онлайн-аудита.
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

Ваш надежный сервис для получения независимого экспертного мнения от ведущих специалистов Европы.`,
    {
      reply_markup: createMainKeyboard(),
    },
  );
});
const activeChats = new Map<number, number>();

bot.command("stop", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const partnerId = clearActiveChat(userId);

  if (!partnerId) return;

  await ctx.api.sendMessage(
    userId,
    "🏁 Ваш текущий чат завершен. \n\nНадеемся, консультация была полезной! Если у вас возникнут новые вопросы, вы всегда можете начать новый аудит через главное меню.",
  );
  await ctx.api.sendMessage(
    partnerId,
    "🏁 Собеседник завершил текущий сеанс чата. \n\nЧат закрыт.",
  );
});

export function clearActiveChat(userId: number): number | null {
  const partnerId = activeChats.get(userId);
  if (partnerId) {
    activeChats.delete(userId);
    activeChats.delete(partnerId);
    return partnerId;
  }
  return null;
}

bot.command("help", async (ctx) => {
  await ctx.reply(
    `❓ Помощь по платформе MED EXPERT EU:

/start - Главное меню
/help - Эта справка

Наши услуги:
📊 Европейский медицинский аудит
🏥 Организация очного приема у партнеров
🛡️ Гарантия безопасности платежей`,
    {
      reply_markup: createMainKeyboard(),
      parse_mode: "Markdown",
    },
  );
});

bot.on("message", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const partnerId = activeChats.get(userId);

  if (partnerId) {
    // Don't forward commands
    if (ctx.message.text?.startsWith("/")) {
      return;
    }

    try {
      await ctx.copyMessage(partnerId);
    } catch (e) {
      console.error(e);
      await ctx.reply("❌ Ошибка при отправке сообщения собеседнику.");
    }
    return;
  }

  const message = ctx.message.text?.toLowerCase();
  if (!message) return;

  if (
    message.includes("аудит") ||
    message.includes("врач") ||
    message.includes("доктор")
  ) {
    await ctx.reply(
      "🔍 Начните медицинский аудит в нашем приложении! Это безопасно и профессионально.",
      {
        reply_markup: new InlineKeyboard().webApp(
        "⤵️ НАЧАТЬ АУДИТ",
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
      "🛡️ Мы гарантируем безопасность платежей через систему Escrow.",
      {
        reply_markup: new InlineKeyboard().text(
          "🛡️ Подробнее о гарантиях",
          "payment_guarantee",
        ),
      },
    );
  } else if (message.includes("помощь") || message.includes("help")) {
    await ctx.reply("Используйте кнопки меню или напишите /start");
  } else {
    await ctx.reply("🔍 Чем могу помочь? Перейдите к нашей платформе 👇", {
      reply_markup: new InlineKeyboard().webApp(
        "⤵️ НАЧАТЬ ЭКСПЕРТИЗУ",
        "https://doctor-chat-c-lient.vercel.app",
      ),
    });
  }
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
