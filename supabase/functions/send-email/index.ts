// Edge Function: send-email
// Enviar correos usando Resend desde Supabase Edge Functions

import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  try {
    const { email, link } = await req.json();

    if (!email || !link) {
      return new Response(
        JSON.stringify({ error: "Missing email or link" }),
        { status: 400 }
      );
    }

    // Llamar al API de Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Sistema de Encuestas <noreply@tu-dominio.com>",
        to: [email],
        subject: "Invitación a Participar en la Encuesta",
        html: `
          <p>Hola,</p>
          <p>Haz clic en el siguiente enlace para participar en la encuesta:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Gracias.</p>
        `
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: "Resend error", detail: text }), {
        status: 500
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    console.error("Error en función send-email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
});
