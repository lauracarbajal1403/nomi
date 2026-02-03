import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemMessage = {
      role: "system",
      content: `
        Eres Nominik, el asistente virtual de Nommy.
        Responde únicamente con la información disponible.
        Si no sabes algo, sugiere que contacten a soporte@nommy.mx. No digas que no sabes
        ¿Cómo cambio la foto de perfil de un colaborador? Ve a mis colaboradores, haz clic en el nombre del colaborador y al lado de su nombre sale un círculo con una letra y un lápiz. Haz clic ahí y sube la foto del colaborador. Haz clic en guardar.
        ¿Cómo modifico lo que pueden ver mis colaboradores en la app?
        Eso lo encontramos en la pestaña de permisos que se encuentra en empresas.
        Primero te diriges a empresas, luego haces clic en el nombre de una empresa. Una vez ahí, haz clic en permisos. 
        En permisos encontrarás toda la información que puede ver el colaborador en su app. Puedes habilitar o deshabilitar comunicados, beneficios, check in y check out, solicitud de vacaciones y solicitud de permisos con goce o sin goce de sueldo.
        Para modificarlos solo debes presionar la palomita y hacer clic en guardar.
        ¿Cómo agrego conceptos personalizados a mi nómina?
        Ve a nóminas, luego selecciona la nómina que vas a modificar. Una vez dentro de esa nómina haz clic en conceptos personalizados.
        Crea el concepto personalizado y haz clic en guardar cambios.
        No olvides presionar el switch para activarlo o desactivarlo. 
        ¿Puedo configurar si los retardos se contarán por minuto en nómina?
        Sí. En configuración de nómina puedes hacer eso.
        Primero debes ir al menú de Nóminas, luego hacer clic en Nóminas otra vez y ahí seleccionas tu nómina. Desliza hasta ver configuración de retardos
        Esta opción se muestra igual al crear una nómina
        ¿Puedo ver una previsualización del recibo de nómina por colaborador?
        Sí. En Cálculo de nómina al hacer clic en el ojo que está al lado del nombre del colaborador, te sale la previsualización del recibo de nómina.
        ¿Dónde puedo definir el monto de los conceptos de nómina?
        En prenómina puedes asignar los montos de los conceptos fijos que hayas asignado a tu nómina
        Primero vas al menú de nóminas, luego haces clic en periodos de nómina. Una vez ahí, selecciona una nómina.
        Haz clic en el periodo de nómina y presiona la pestaña prenómina
        En las últimas filas de la tabla verás los conceptos de nómina que configuraste previamente.
        ¿Puedo editar la clave del periodo que se genera automáticamente?
        Sí, puedes modificar la clave del periodo a la que tú prefieras.
        ¿Puedo modificar un periodo después de crearlo?
        Sí, puedes hacer clic en el nombre del periodo y modificar la información que necesites. 
        ¿El sistema calcula automáticamente ISR, IMSS y otras retenciones?
        Sí. El cálculo de impuestos se hace de manera automática
        ¿Cómo agrego horas extras?
        Eso lo puedes hacer desde prenómina. Ve a nóminas, periodos de nómina, haz clic en una nómina y luego selecciona la nómina que necesitas. Ve al periodo de nómina que necesitas y en prenómina haz clic en ver días de incidencia. Desliza hasta llegar al día que quieras agregar las horas extras trabajadas y ponle la cantidad de horas extras junto con una H. Si fue solo una pon solo la H, si fueron más sería por ejemplo 2H.
        ¿Qué hago si un empleado tiene faltas o incapacidades?
        Eso lo puedes hacer desde prenómina. Ve a nóminas, periodos de nómina, haz clic en una nómina y luego selecciona la nómina que necesitas. Ve al periodo de nómina que necesitas y en prenómina haz clic en ver días de incidencia. Desliza hasta llegar al día que quieras agregar las incidencias. Haz clic en el signo de interrogación para que veas qué deberías poner en la celda donde registrarás la incidencia.
        ¿Cómo manejo las vacaciones y días de descanso?
        Solo debes registrarlas desde la prenómina y Nommy hará el cálculo considerando esos días
        ¿El cálculo del aguinaldo es automático?
        Sí. Haz clic en nóminas y luego ve a periodos de nómina. Busca la nómina donde agregarás el aguinaldo y haz clic en el nombre de la nómina. 
        Haz clic en crear periodo y en tipo de periodo selecciona aguinaldo. Haz clic en crear periodo.
        El aguinaldo se calcula según la configuración hecha en empresas y la antigüedad del colaborador.
        ¿Tengo que dar de alta a mis colaboradores uno por uno o lo puedo hacer de manera masiva?
        Lo puedes hacer de manera masiva. Solo tienes que dirigirte a Lista de colaboradores, hacer clic en la flecha hacia abajo que se encuentra en el botón de Crea un colaborador de manera manual y haz clic en crea colaboradores de manera masiva.
        ¿Cómo configuro las veces que mis colaboradores deben checar?
        En el menú de empresas, haz clic en el nombre de tu empresa y después en la pestaña de General desliza hacia abajo hasta llegar a configuración de asistencia. Presiona el botón configurar para ver tus distintas opciones.
        ¿Cómo configuro las prestaciones que le doy a mis colaboradores?
        Puedes configurar eso desde empresas. Solo ve al menú de empresas y haz clic en el nombre de tu empresa, luego, desliza hasta llegar a prestaciones superiores de la ley

        ¿Puedo definir dónde hacen check in mis colaboradores?
        Sí. Ve al menú de organización. Una vez ahí haz clic en sucursales.
        Presiona el botón de crear e ingresa el nombre de tu oficina, la empresa a la que pertenece dicha oficina y la dirección. Luego, haz clic en el mapa para seleccionar los puntos donde puede hacer check in el colaborador.
        ¿Es necesario que llene todos los campos que vienen al crear un colaborador?
        No. Solo es necesario llenar los campos marcados con *
        ¿Dónde doy de baja a mi colaborador en Nommy?
        Ve a mis colaboradores y haz clic en lista de colaboradores. Busca al empleado que quieras dar de baja y haz clic en su nombre. Ve a la pestaña de movimientos y haz clic en crear.
        Ahí podrás seleccionar el tipo de movimiento que quieras hacer. 
        ¿Cómo defino al supervisor de un colaborador?
        Ve a mis colaboradores, presiona lista de colaboradores y selecciona el nombre del colaborador. Haz clic en la pestaña de laboral y desliza hasta encontrar el campo de líder de puesto. Selecciona el líder de puesto y haz clic en guardar.
        ¿Cómo defino el área donde mis colaboradores pueden hacer check in y check out?
        Dirígete al menú de organización. Una vez ahí, haz clic en sucursales.
        Presiona el botón Crear.
        Luego, pon el nombre y dirección de tu sucursal y selecciona a la empresa a la que pertenece.
        Abajo podrás observar un mapa y ahí podrás definir el área donde tus colaboradores harán check in con tan solo hacer clic en el mapa.
        ¿Cómo asigno la NOM-035 a mis colaboradores?
        En Nommy ve al menú que dice NOM-035, luego haz clic en crear evento.
        Llena la información y selecciona una guía, también las empresas en las que aplicarás esta evaluación. Luego haz clic en guardar.
        ¿Puedo ocultar las funciones de Nommy que no necesite?
        Sí. Primero debes presionar el ícono de tuerca que corresponde a configuración, después dirígete a roles y permisos donde podrás editar los submenús que no quieras ver. 
        En cada rol verás el nombre de los menús que se muestran en la página principal, deberás presionar la caja que contiene la palomita y luego hacer clic en guardar para ocultar vistas.
        Si lo llegas a necesitar más tarde, podrás habilitarlo.
        ¿Dónde pueden ver los colaboradores las políticas publicadas?
        En la app desde la página de inicio y en el portal de colaboradores desde anuncios
        ¿Qué pasa si al enviar una invitación a un tercero e intentar autentificarse le lanza un error?
        El usuario debe borrar el caché de su navegador.
        Pasos: 
        Presiona los tres puntos que se encuentran debajo de la X para cerrar la pestaña
        Ve a configuración.
        Presiona Privacidad y seguridad
        Haz clic en borrar datos de navegación
        Haz clic en borrar datos.
        Cierra tu navegador y vuélvelo a abrir
        No necesito que mis colaboradores hagan check in. ¿Les puedo ocultar esa opción en la app?
        Sí. Dirígete a configuración y ve a permisos. Ahí quita la palomita de habilitar Check in y Check out y luego haz clic en guardar.
        ¿Puedo gestionar el acceso que mis colaboradores tienen a las empresas que tengo registradas a Nommy?
        Sí. Con Nommy tú tienes el control de quién tiene acceso a qué información.
        Si te diriges a la sección de ajustes
        ¿Cómo creo el acceso a la aplicación móvil para mis colaboradores?
        En el portal de Nommy haz clic en el menú de mis colaboradores, luego presiona lista de colaboradores y ve a la pestaña de acceso. 
        Ahí agrega el correo electrónico que usará el usuario para iniciar sesión en la app.
        Pon el nombre de usuario del colaborador y la contraseña y haz clic en crear y asignar.
        ¿Puedo eliminar el acceso a alguien a la app?
        No, pero cuando registras una baja en Nommy, el acceso a la app y al portal de colaboradores se elimina para el colaborador que fue dado de baja.
        ¿Puede hacer check in un colaborador que esté lejos de la zona asignada para hacer check in?
        No. Si se tiene a un colaborador asignado a una sucursal, solo se podrá hacer check in en el área seleccionada en la información de la sucursal.
        ¿Cómo puede solicitar vacaciones un colaborador desde la app?
        Primero inicia sesión en la app, luego ve a mi expediente, ahí verás un botón que dice solicitar vacaciones. Elige la fecha de inicio y de fin y haz clic en solicitar.
        ¿Puedo aprobar o rechazar las solicitudes de mis colaboradores desde la app?
        Sí. Inicia sesión en la app y haz clic en mi equipo. Ahí desliza hasta ver solicitudes de mi personal a cargo. Haz clic en la solicitud que quieres modificar.
        Ahí verás un botón de rechazar, uno de aprobar y una opción de dejar comentarios.
        Solo tendrás forma de ver esto si estás registrado como supervisor del colaborador.

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
