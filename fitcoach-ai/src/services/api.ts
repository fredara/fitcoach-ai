import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No hay sesión activa de usuario');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const api = {
  // Chat con Coach IA (soporta texto y múltiples imágenes/visión)
  async sendChatMessage(messages: { role: 'user' | 'assistant'; content: string; image?: string; images?: string[] }[]) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: No se pudo comunicar con el Coach.`);
    }

    return response.json();
  },

  // Generar o actualizar Plan de Entrenamiento con IA
  async generatePlan(targetGoal: string, weeksCount: number = 8, daysPerWeek: number = 4) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/ai/generate-plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetGoal, weeksCount, daysPerWeek }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al generar el plan de entrenamiento.');
    }

    return response.json();
  },

  // Obtener plan activo desde backend / Supabase
  async getActivePlan() {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/plans/active`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  // Guardar o sincronizar plan activo en la nube
  async saveActivePlan(plan: any) {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/plans/active`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  // Analizar entrenamiento con IA
  async analyzeSession(sessionData: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: Error al analizar sesión.`);
    }

    return response.json();
  },

  // Obtener historial de sesiones desde backend
  async getSessions() {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al obtener sesiones.');
    }

    return response.json();
  },

  // Guardar nueva sesión
  async createSession(sessionData: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al guardar la sesión.');
    }

    return response.json();
  },

  // Obtener URL de autenticación con Huawei
  async getHuaweiAuthUrl() {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/huawei/auth-url`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Error al obtener URL de autenticación de Huawei');
    }

    return response.json();
  },

  // Obtener estado de conexión con Huawei Health
  async getHuaweiStatus() {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/huawei/status`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return { connected: false };
    }

    return response.json();
  },

  // Sincronizar datos del reloj Huawei Watch GT Pro 6
  async syncHuawei() {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/huawei/sync`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al sincronizar datos de Huawei');
    }

    return response.json();
  },

  // Parsear y registrar entrenamiento con IA (Lenguaje natural o Imágenes de Reloj)
  async parseAndLogSession(data: { text?: string; images?: string[]; image?: string; date?: string; defaultTitle?: string }) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/ai/parse-and-log-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al procesar el entrenamiento con IA');
    }

    return response.json();
  }
};
