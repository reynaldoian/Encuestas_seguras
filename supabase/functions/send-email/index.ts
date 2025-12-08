// ============================================
// Edge Function: resend-email (CON ENVÍO REAL)
// Ubicación: supabase/functions/resend-email/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { correos, enlaceBase } = await req.json();

    console.log('📧 Iniciando envío de emails:', {
      totalCorreos: correos?.length,
      tieneApiKey: !!RESEND_API_KEY
    });

    // Validar API key
    if (!RESEND_API_KEY) {
      throw new Error('❌ RESEND_API_KEY no está configurada en Supabase Secrets');
    }

    // Validar datos recibidos
    if (!correos || !Array.isArray(correos) || correos.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Se requiere un array de correos con email y link" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🚀 Enviando emails con Resend...');
    const resultados = [];
    
    for (const invitacion of correos) {
      try {
        console.log(`📤 Procesando: ${invitacion.email}`);

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Sistema de Encuestas <onboarding@resend.dev>',
            to: [invitacion.email],
            subject: '🗳️ Invitación para Participar en Encuesta',
            html: `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0;
                    background-color: #f4f4f4;
                  }
                  .email-container {
                    background-color: white;
                    margin: 20px auto;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                  }
                  .content {
                    padding: 40px 30px;
                  }
                  .content p {
                    margin: 0 0 15px 0;
                    color: #4a5568;
                  }
                  .button-container {
                    text-align: center;
                    margin: 35px 0;
                  }
                  .button {
                    display: inline-block;
                    padding: 16px 36px;
                    background: #4f46e5;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 16px;
                    box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
                    transition: all 0.3s ease;
                  }
                  .button:hover {
                    background: #4338ca;
                    box-shadow: 0 6px 12px rgba(79, 70, 229, 0.4);
                  }
                  .link-box {
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #4f46e5;
                    margin: 25px 0;
                  }
                  .link-box p {
                    margin: 0 0 10px 0;
                    font-weight: 600;
                    color: #2d3748;
                  }
                  .link-box code {
                    display: block;
                    word-break: break-all;
                    font-size: 12px;
                    color: #4f46e5;
                    background: white;
                    padding: 12px;
                    border-radius: 4px;
                  }
                  .warning {
                    background: #fff5f5;
                    border-left: 4px solid #ef4444;
                    padding: 15px;
                    margin: 25px 0;
                    border-radius: 4px;
                  }
                  .warning p {
                    margin: 0;
                    color: #991b1b;
                    font-size: 14px;
                  }
                  .footer {
                    background: #f7fafc;
                    padding: 25px 30px;
                    text-align: center;
                    color: #718096;
                    font-size: 14px;
                    border-top: 1px solid #e2e8f0;
                  }
                  .footer p {
                    margin: 5px 0;
                  }
                </style>
              </head>
              <body>
                <div class="email-container">
                  <div class="header">
                    <h1>🗳️ Invitación a Encuesta</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hola,</p>
                    <p>Has sido invitado a participar en nuestra encuesta. Tu opinión es muy importante para nosotros y nos ayudará a tomar mejores decisiones.</p>
                    
                    <div class="button-container">
                      <a href="${invitacion.link}" class="button">
                        📝 Completar Encuesta Ahora
                      </a>
                    </div>
                    
                    <div class="link-box">
                      <p>O copia y pega este enlace en tu navegador:</p>
                      <code>${invitacion.link}</code>
                    </div>
                    
                    <div class="warning">
                      <p>⚠️ <strong>Importante:</strong> Este enlace es personal e intransferible. No lo compartas con otras personas.</p>
                    </div>
                    
                    <p style="margin-top: 30px;">Gracias por tu colaboración,<br><strong>El Equipo de Encuestas</strong></p>
                  </div>
                  
                  <div class="footer">
                    <p>Sistema de Encuestas © ${new Date().getFullYear()}</p>
                    <p style="color: #a0aec0; font-size: 12px;">Este es un email automático, por favor no responder.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ Email enviado correctamente: ${invitacion.email}`);
          resultados.push({
            email: invitacion.email,
            status: 'enviado',
            link: invitacion.link,
            emailId: data.id
          });
        } else {
          console.error(`❌ Error al enviar a ${invitacion.email}:`, data);
          resultados.push({
            email: invitacion.email,
            status: 'error',
            error: data.message || 'Error desconocido de Resend',
            link: invitacion.link
          });
        }

      } catch (error) {
        console.error(`❌ Error crítico para ${invitacion.email}:`, error);
        resultados.push({
          email: invitacion.email,
          status: 'error',
          error: error.message,
          link: invitacion.link
        });
      }

      // Pequeña pausa entre emails para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const exitosos = resultados.filter(r => r.status === 'enviado').length;
    const fallidos = resultados.filter(r => r.status === 'error').length;

    console.log(`✅ Proceso completado:`);
    console.log(`   - Enviados: ${exitosos}`);
    console.log(`   - Fallidos: ${fallidos}`);
    console.log(`   - Total: ${resultados.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        modo: 'producción',
        enviados: exitosos,
        fallidos: fallidos,
        total: resultados.length,
        mensaje: exitosos > 0 
          ? `✅ ${exitosos} email(s) enviado(s) correctamente` 
          : '❌ No se pudo enviar ningún email',
        resultados: resultados
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error general en Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});