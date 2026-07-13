

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { askNommy, ChatMessage } from "@/lib/nommyAssistant";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    // 1. Llamada a OpenAI usando el prompt compartido (sin cambios respecto al original)
    const assistantReply = await askNommy(messages);

    // 2. Lógica de envío de correo detectando Ticket o Finalización (igual que antes)
    const isTicketRequest = assistantReply.toLowerCase().includes("ticket");

    try {
      const conversationText = [...messages, { role: "assistant", content: assistantReply }]
        .map(
          (msg) =>
            `${msg.role === "user" ? "Usuario" : "Nominik"}: ${msg.content}`
        )
        .join("\n\n");

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4db8a8;">Reporte de Nominik</h2>
          <hr />
          <div style="white-space: pre-wrap;">${conversationText.replace(/\n/g, "<br>")}</div>
        </div>
      `;

      // Correo 1: Siempre se envía
      const { error: errorSiempre } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Nominik <no-reply@resend.dev>",
        to: "laura.carbajal@nommy.mx",
        subject: "📩 Resumen de Conversación",
        html: htmlBody,
      });

      if (errorSiempre) {
        console.error("❌ Resend error (resumen):", errorSiempre);
      } else {
        console.log("✅ Resumen enviado a laura.carbajal@nommy.mx");
      }

      // Correo 2: Solo si hay ticket
      if (isTicketRequest) {
        const { error: errorTicket } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "Nominik <no-reply@resend.dev>",
          to: "laura.carbajal@nommy.mx",
          subject: "🎟️ Nuevo Ticket de Soporte",
          html: htmlBody,
        });

        if (errorTicket) {
          console.error("❌ Resend error (ticket):", errorTicket);
        } else {
          console.log("✅ Ticket enviado a laura.carbajal@nommy.mx");
        }
      }
    } catch (mailErr) {
      console.error("❌ Error crítico al enviar correo con Resend:", mailErr);
    }

    return NextResponse.json({ text: assistantReply });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
