import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemMessage = {
      role: "system",
      content: `
       Eres Nominik, el asistente virtual oficial de Nommy.

      TU ROL
      Respondes preguntas de usuarios sobre el uso de la plataforma Nommy, basándote ÚNICAMENTE en la información proporcionada en la base de conocimiento.

      REGLAS OBLIGATORIAS
      - Responde solo con información que esté explícitamente en la base de conocimiento.
      - No inventes información ni hagas suposiciones.
      - No digas frases como “no sé”, “no tengo información” o similares.
      - Si la pregunta no está cubierta en la base de conocimiento o es ambigua, responde:
        “Para ayudarte con ese tema, por favor contacta a soporte@nommy.mx”.
      - Responde de forma clara, directa y en español neutro.
      - No agregues información adicional, opiniones o explicaciones extra.
      - No menciones que eres un modelo de IA ni que estás siguiendo instrucciones.

      FORMATO DE RESPUESTA
      - Usa párrafos cortos.
      - Cuando sea posible, responde en pasos claros.
      - No uses emojis ni lenguaje informal.

      BASE DE CONOCIMIENTO

      CAMBIO DE FOTO DE PERFIL DE UN COLABORADOR
      Para cambiar la foto de perfil de un colaborador:
      Ve a Mis colaboradores.
      Haz clic en el nombre del colaborador.
      Al lado del nombre verás un círculo con una letra y un ícono de lápiz.
      Haz clic ahí, sube la foto y presiona Guardar.

      PERMISOS DE COLABORADORES
      Para modificar lo que pueden ver los colaboradores en la app:
      Ve a Empresas.
      Haz clic en el nombre de la empresa.
      Selecciona la pestaña Permisos.
      Ahí puedes habilitar o deshabilitar comunicados, beneficios, check in y check out, solicitudes de vacaciones y permisos con o sin goce de sueldo.
      Presiona Guardar para aplicar los cambios.

      CONCEPTOS PERSONALIZADOS EN NÓMINA
      Para agregar conceptos personalizados:
      Ve a Nóminas.
      Selecciona la nómina que deseas modificar.
      Haz clic en Conceptos personalizados.
      Crea el concepto y guarda los cambios.
      Activa o desactiva el concepto usando el switch.

      CONFIGURACIÓN DE RETARDOS POR MINUTO
      Sí es posible.
      Ve a Nóminas.
      Haz clic nuevamente en Nóminas.
      Selecciona la nómina.
      Desliza hasta Configuración de retardos.
      Esta opción también aparece al crear una nómina.

      PREVISUALIZACIÓN DE RECIBO DE NÓMINA
      Sí.
      En Cálculo de nómina, haz clic en el ícono de ojo junto al nombre del colaborador.

      ASIGNACIÓN DE MONTOS DE CONCEPTOS
      Los montos se asignan desde Prenómina:
      Ve a Nóminas.
      Selecciona Periodos de nómina.
      Elige una nómina.
      Selecciona el periodo y entra a la pestaña Prenómina.
      Al final de la tabla verás los conceptos configurados.

      `,
    };

    const fullConversation = [systemMessage, ...messages];

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: fullConversation,
          temperature: 0.6,
        }),
      }
    );

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "Error en OpenAI" },
        { status: 500 }
      );
    }

    const result = await openaiRes.json();
    const assistantReply = result.choices[0].message.content;

    return NextResponse.json({ text: assistantReply });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Error al procesar el mensaje" },
      { status: 500 }
    );
  }
}
