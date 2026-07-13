// lib/telegram.ts
//
// Funciones delgadas sobre la API HTTP de Telegram. No dependen de ninguna
// librería externa, solo de fetch.

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

if (!TELEGRAM_TOKEN) {
  console.warn(
    "⚠️ TELEGRAM_BOT_TOKEN no está configurado. El bot de Telegram no funcionará."
  );
}

type SendMessageResult = {
  ok: boolean;
  result?: { message_id: number };
};

/** Envía un mensaje de texto simple a un chat (usuario o grupo). */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyToMessageId?: number
): Promise<SendMessageResult> {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId,
      parse_mode: "HTML",
    }),
  });
  return res.json();
}

/**
 * Reenvía un mensaje del usuario al grupo de soporte, con un botón inline
 * "Tomar conversación". Devuelve el message_id del mensaje en el grupo,
 * que se usa luego para mapear group_message_id -> chat_id del usuario.
 */
export async function notifySupportGroup(
  groupChatId: number,
  userChatId: number,
  userName: string,
  text: string,
  mode: "bot" | "human"
): Promise<SendMessageResult> {
  const etiqueta = mode === "bot" ? "🤖 Modo bot" : "🧑‍💻 Modo humano";
  const body = `<b>${escapeHtml(userName)}</b> (chat <code>${userChatId}</code>) — ${etiqueta}\n\n${escapeHtml(
    text
  )}`;

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: groupChatId,
      text: body,
      parse_mode: "HTML",
      reply_markup:
        mode === "bot"
          ? {
              inline_keyboard: [
                [
                  {
                    text: "Tomar conversación",
                    callback_data: `take_${userChatId}`,
                  },
                ],
              ],
            }
          : undefined,
    }),
  });
  return res.json();
}

/** Responde a un callback_query (clic en botón inline) para quitar el "loading". */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

/** Edita un mensaje existente en el grupo (ej. para quitar el botón tras tomarlo). */
export async function editGroupMessage(
  groupChatId: number,
  messageId: number,
  newText: string
) {
  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: groupChatId,
      message_id: messageId,
      text: newText,
      parse_mode: "HTML",
    }),
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
