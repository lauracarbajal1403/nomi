// app/api/telegram/webhook/route.ts
//
// Endpoint que recibe TODOS los updates de Telegram (mensajes de usuarios,
// clics en botones, y mensajes del equipo dentro del grupo de soporte).
//
// Variables de entorno necesarias:
//   TELEGRAM_BOT_TOKEN     -> token de BotFather
//   TELEGRAM_SUPPORT_GROUP_ID -> chat_id del grupo interno de soporte (negativo, ej. -1001234567890)
//   OPENAI_API_KEY         -> ya la tenías, la reutiliza lib/nommyAssistant.ts

import { NextResponse } from "next/server";
import { askNommy } from "@/lib/nommyAssistant";
import {
  getOrCreateConversation,
  setMode,
  appendHistory,
  getHistory,
  linkGroupMessageToChat,
  getChatIdFromGroupMessage,
} from "@/lib/conversationStore";
import {
  sendTelegramMessage,
  notifySupportGroup,
  answerCallbackQuery,
  editGroupMessage,
} from "@/lib/telegram";

const SUPPORT_GROUP_ID = Number(process.env.TELEGRAM_SUPPORT_GROUP_ID);

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // ---------------------------------------------------------------
    // 1. Clic en el botón "Tomar conversación" (dentro del grupo)
    // ---------------------------------------------------------------
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------------
    // 2. Mensaje nuevo (puede venir del usuario en 1-a-1, o del equipo
    //    respondiendo dentro del grupo de soporte)
    // ---------------------------------------------------------------
    if (update.message) {
      const msg = update.message;

      // 2a. Mensaje que llega DESDE el grupo de soporte (el equipo respondiendo)
      if (SUPPORT_GROUP_ID && msg.chat.id === SUPPORT_GROUP_ID) {
        await handleGroupReply(msg);
        return NextResponse.json({ ok: true });
      }

      // 2b. Mensaje de un usuario final (chat 1-a-1)
      await handleUserMessage(msg);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en webhook de Telegram:", err);
    // Siempre respondemos 200 para que Telegram no reintente en bucle
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

// =====================================================================
// Manejo de mensajes de usuarios finales
// =====================================================================
async function handleUserMessage(msg: any) {
  const chatId: number = msg.chat.id;
  const text: string = msg.text ?? "";
  const userName: string = msg.from?.first_name ?? "Usuario";

  const conv = getOrCreateConversation(chatId, userName);

  // Comando explícito para pedir un humano directamente
  if (text.trim().toLowerCase() === "/agente") {
    setMode(chatId, "human");
    await sendTelegramMessage(
      chatId,
      "Listo, un miembro del equipo de soporte se pondrá en contacto contigo por aquí en breve."
    );
    const groupMsg = await notifySupportGroup(
      SUPPORT_GROUP_ID,
      chatId,
      userName,
      "(El usuario pidió hablar directamente con un agente con /agente)",
      "human"
    );
    if (groupMsg.ok && groupMsg.result) {
      linkGroupMessageToChat(groupMsg.result.message_id, chatId);
    }
    return;
  }

  if (text.trim().toLowerCase() === "/start") {
    await sendTelegramMessage(
      chatId,
      "Hola, soy el asistente de soporte de Nommy. Cuéntame en qué puedo ayudarte."
    );
    return;
  }

  // -------------------------------------------------------------
  // Modo humano: no se llama a GPT, solo se reenvía al grupo
  // -------------------------------------------------------------
  if (conv.mode === "human") {
    const groupMsg = await notifySupportGroup(
      SUPPORT_GROUP_ID,
      chatId,
      userName,
      text,
      "human"
    );
    if (groupMsg.ok && groupMsg.result) {
      linkGroupMessageToChat(groupMsg.result.message_id, chatId);
    }
    return;
  }

  // -------------------------------------------------------------
  // Modo bot: se llama a GPT con el prompt de Nommy (sin tocarlo)
  // -------------------------------------------------------------
  appendHistory(chatId, { role: "user", content: text });

  let reply: string;
  try {
    reply = await askNommy(getHistory(chatId));
  } catch (e) {
    console.error("Error llamando a askNommy:", e);
    reply =
      "Tuvimos un problema técnico procesando tu mensaje. Un momento por favor.";
  }

  appendHistory(chatId, { role: "assistant", content: reply });
  await sendTelegramMessage(chatId, reply);

  // Copia visible en el grupo para que el equipo pueda monitorear y,
  // si quiere, tomar la conversación en cualquier momento.
  const groupMsg = await notifySupportGroup(
    SUPPORT_GROUP_ID,
    chatId,
    userName,
    text,
    "bot"
  );
  if (groupMsg.ok && groupMsg.result) {
    linkGroupMessageToChat(groupMsg.result.message_id, chatId);
  }
}

// =====================================================================
// Manejo del botón "Tomar conversación"
// =====================================================================
async function handleCallbackQuery(callbackQuery: any) {
  const data: string = callbackQuery.data ?? "";
  const agentName: string = callbackQuery.from?.first_name ?? "Agente";
  const groupMessageId: number = callbackQuery.message?.message_id;
  const groupChatId: number = callbackQuery.message?.chat?.id;

  if (!data.startsWith("take_")) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  const userChatId = Number(data.replace("take_", ""));
  setMode(userChatId, "human");
  linkGroupMessageToChat(groupMessageId, userChatId);

  await answerCallbackQuery(callbackQuery.id, "Conversación tomada");

  await editGroupMessage(
    groupChatId,
    groupMessageId,
    `✅ Conversación tomada por <b>${agentName}</b>. Responde a este mensaje (reply) para hablar con el usuario.`
  );

  await sendTelegramMessage(
    userChatId,
    "Un miembro de nuestro equipo tomó tu conversación y te responderá en breve."
  );
}

// =====================================================================
// Manejo de respuestas del equipo dentro del grupo de soporte
// =====================================================================
async function handleGroupReply(msg: any) {
  // El agente debe responder ("reply") al mensaje reenviado del usuario
  // para que sepamos a qué chat_id enviar la respuesta.
  const repliedToId: number | undefined = msg.reply_to_message?.message_id;
  if (!repliedToId) return;

  const userChatId = getChatIdFromGroupMessage(repliedToId);
  if (!userChatId) return;

  const agentText: string = msg.text ?? "";
  if (!agentText) return;

  await sendTelegramMessage(userChatId, agentText);
}
