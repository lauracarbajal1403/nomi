// lib/conversationStore.ts
//
// Guarda, por chat de Telegram: el modo actual (bot | human), un historial
// corto de mensajes (para darle contexto a GPT) y el mapeo entre mensajes
// reenviados al grupo de soporte y el chat_id del usuario (para poder
// enrutar la respuesta del agente humano de vuelta al usuario correcto).
//
// IMPORTANTE — LIMITACIÓN DE ESTE STORE:
// Es un Map en memoria. Funciona bien si tu backend corre como un proceso
// Node persistente con UNA sola instancia (ej. Render Web Service, "next start").
// Se pierde si:
//   - el proceso se reinicia o se redeploya,
//   - corres varias instancias/réplicas en paralelo,
//   - usas funciones serverless "sin estado" (ej. Vercel Functions clásicas).
// Para producción real, reemplaza este archivo por una tabla en Supabase o
// un store en Upstash Redis, manteniendo la misma interfaz de funciones.

import { ChatMessage } from "./nommyAssistant";

export type ConversationMode = "bot" | "human";

type Conversation = {
  chatId: number;
  mode: ConversationMode;
  history: ChatMessage[]; // últimos N mensajes, para dar contexto a GPT
  userName?: string;
};

const MAX_HISTORY = 12;

const conversations = new Map<number, Conversation>();

// messageId (del mensaje reenviado en el grupo) -> chatId del usuario original.
// Sirve para saber a quién responder cuando el agente contesta en el grupo.
const groupMessageToChatId = new Map<number, number>();

export function getOrCreateConversation(chatId: number, userName?: string): Conversation {
  let conv = conversations.get(chatId);
  if (!conv) {
    conv = { chatId, mode: "bot", history: [], userName };
    conversations.set(chatId, conv);
  } else if (userName) {
    conv.userName = userName;
  }
  return conv;
}

export function setMode(chatId: number, mode: ConversationMode) {
  const conv = getOrCreateConversation(chatId);
  conv.mode = mode;
}

export function appendHistory(chatId: number, message: ChatMessage) {
  const conv = getOrCreateConversation(chatId);
  conv.history.push(message);
  if (conv.history.length > MAX_HISTORY) {
    conv.history = conv.history.slice(-MAX_HISTORY);
  }
}

export function getHistory(chatId: number): ChatMessage[] {
  return getOrCreateConversation(chatId).history;
}

export function linkGroupMessageToChat(groupMessageId: number, chatId: number) {
  groupMessageToChatId.set(groupMessageId, chatId);
}

export function getChatIdFromGroupMessage(groupMessageId: number): number | undefined {
  return groupMessageToChatId.get(groupMessageId);
}
