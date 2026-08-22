import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  
  // AI Config (Compatible con Fireworks, Groq, OpenRouter u OpenAI)
  aiApiKey: process.env.FIREWORKS_API_KEY || process.env.AI_API_KEY || process.env.GROQ_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || 'https://api.fireworks.ai/inference/v1/chat/completions',
  aiModel: process.env.AI_MODEL || 'accounts/fireworks/models/llama-v3p3-70b-instruct',

  // Huawei Health Kit
  huaweiClientId: process.env.HUAWEI_CLIENT_ID || '',
  huaweiClientSecret: process.env.HUAWEI_CLIENT_SECRET || '',
};

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  console.warn('⚠️ Advertencia: Variables de Supabase no configuradas completamente en el backend.');
}

if (!config.aiApiKey) {
  console.warn('⚠️ Advertencia: Llave de IA no configurada.');
}
