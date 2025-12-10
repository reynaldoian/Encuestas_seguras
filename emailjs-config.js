// ============================================
// EMAILJS CONFIGURACIÓN - EMAILJS + SUPABASE
// ============================================

// Configuración de EmailJS (tus credenciales reales)
const emailjsConfig = {
  serviceID: 'service_c8mykiy',           // ✅ Tu Service ID real
  templateID: 'template_dd5qzlq',         // ✅ Tu Template ID real
  publicKey: 'DKLmstEK3OXZar938'      // ✅ Tu Public Key real
};

// Inicializar EmailJS
emailjs.init(emailjsConfig.publicKey);

// ============================================
// FUNCIÓN COMPLETA DE EMAIL
// ============================================

async function enviarEmailEmailJS(email, link) {
  try {
    console.log('📧 Enviando email con EmailJS...');
    console.log('📧 Para:', email);
    console.log('🔗 Link:', link);
    console.log('📧 From: Incorporación <reynaldoian0596@gmail.com>');
    console.log('📧 Service ID:', emailjsConfig.serviceID);
    console.log('📧 Template ID:', emailjsConfig.templateID);

    // Parámetros para el template
    const templateParams = {
      to_email: email,
      link: link,
      from_name: 'Incorporación',
      year: new Date().getFullYear(),
      reply_to: 'reynaldoian0596@gmail.com'
    };

    // Enviar con EmailJS
    const response = await emailjs.send(
      emailjsConfig.serviceID,
      emailjsConfig.templateID,
      templateParams
    );

    console.log('✅ Email enviado con EmailJS:', response);
    return { 
      success: true, 
      id: response.id,
      mensaje: 'Email enviado correctamente con EmailJS'
    };

  } catch (error) {
    console.error('❌ Error con EmailJS:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}