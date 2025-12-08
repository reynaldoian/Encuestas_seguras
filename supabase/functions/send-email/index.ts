// ============================================
// EDGE FUNCTION: resend-email
// Path: supabase/functions/resend-email/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

interface InvitacionEmail {
  email: string
  link: string
}

interface RequestBody {
  correos: InvitacionEmail[]
  enlaceBase: string
}

// Función para enviar email usando Resend
async function enviarEmailResend(email: string, link: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
      from: 'Incorporación <invitacion@resend.dev>', // Opción con nombre 'Incorporación' y correo genérico, // ⚠️ CAMBIAR por tu dominio verificado
        to: [email],
        subject: '🗳️ Invitación para Participar en Encuesta',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación a Encuesta</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 15px 15px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🗳️</h1>
                        <h2 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">Invitación a Encuesta</h2>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          ¡Hola!
                        </p>
                        
                        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Has sido invitado/a a participar en una encuesta importante. Tu opinión es muy valiosa para nosotros.
                        </p>
                        
                        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          Haz clic en el botón de abajo para acceder a la encuesta:
                        </p>
                        
                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${link}" 
                                 style="display: inline-block; 
                                        padding: 16px 40px; 
                                        background: linear-gradient(135deg, #4f46e5, #7c3aed); 
                                        color: #ffffff; 
                                        text-decoration: none; 
                                        font-size: 18px; 
                                        font-weight: bold; 
                                        border-radius: 8px;
                                        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                                ✅ Responder Encuesta
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                          O copia este enlace en tu navegador:
                        </p>
                        
                        <p style="background-color: #f9fafb; 
                                  padding: 15px; 
                                  border-radius: 8px; 
                                  word-break: break-all; 
                                  font-size: 13px; 
                                  color: #4f46e5; 
                                  margin: 10px 0 0 0;
                                  text-align: center;">
                          ${link}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 15px 15px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                          ⏰ Este enlace expira en 7 días
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          Sistema de Encuestas &copy; ${new Date().getFullYear()}
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ Error Resend para ${email}:`, error)
      return false
    }

    console.log(`✅ Email enviado a ${email}`)
    return true

  } catch (error) {
    console.error(`❌ Error enviando email a ${email}:`, error)
    return false
  }
}

// Handler principal
serve(async (req) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Iniciando envío de emails...')

    // Parse request body
    const body: RequestBody = await req.json()
    const { correos, enlaceBase } = body

    // Validaciones
    if (!correos || !Array.isArray(correos) || correos.length === 0) {
      throw new Error('No se proporcionaron correos válidos')
    }

    if (!enlaceBase) {
      throw new Error('No se proporcionó el enlace base')
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada')
    }

    console.log(`📨 Enviando ${correos.length} emails...`)

    // Enviar emails en paralelo (máximo 10 a la vez para no saturar)
    const resultados = []
    const batchSize = 10

    for (let i = 0; i < correos.length; i += batchSize) {
      const batch = correos.slice(i, i + batchSize)
      
      const promises = batch.map(async (invitacion) => {
        const exito = await enviarEmailResend(invitacion.email, invitacion.link)
        return {
          email: invitacion.email,
          link: invitacion.link,
          enviado: exito
        }
      })

      const batchResults = await Promise.all(promises)
      resultados.push(...batchResults)

      // Pequeña pausa entre batches
      if (i + batchSize < correos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const exitosos = resultados.filter(r => r.enviado).length
    const fallidos = resultados.filter(r => !r.enviado).length

    console.log(`✅ Proceso completado: ${exitosos} exitosos, ${fallidos} fallidos`)

    return new Response(
      JSON.stringify({
        success: true,
        mensaje: `Emails enviados: ${exitosos}/${correos.length}`,
        resultados: resultados,
        estadisticas: {
          total: correos.length,
          exitosos,
          fallidos
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error en Edge Function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
