import { config } from '../config/env';
import { supabaseAdmin } from '../config/supabase';

const HUAWEI_OAUTH_AUTH_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/authorize';
const HUAWEI_OAUTH_TOKEN_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token';
const HUAWEI_HEALTH_BASE_URL = 'https://health-api.cloud.huawei.com/healthkit/v2';

// Scopes para vincular cuenta Huawei
export const BASE_SCOPES = ['openid', 'profile', 'email'].join(' ');
export const HEALTH_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.huawei.com/healthkit/activityrecord.read',
  'https://www.huawei.com/healthkit/heartrate.read',
  'https://www.huawei.com/healthkit/step.read',
].join(' ');

/**
 * Genera la URL de autorización para que el usuario inicie sesión con su Huawei ID
 */
export function getHuaweiAuthUrl(state: string, redirectUri: string, useHealthScopes: boolean = false): string {
  const scopes = useHealthScopes ? HEALTH_SCOPES : BASE_SCOPES;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.huaweiClientId,
    redirect_uri: redirectUri,
    scope: scopes,
    access_type: 'offline',
    state: state,
  });

  return `${HUAWEI_OAUTH_AUTH_URL}?${params.toString()}`;
}

/**
 * Canjea el código de autorización por Access Token y Refresh Token
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: config.huaweiClientId,
    client_secret: config.huaweiClientSecret,
    redirect_uri: redirectUri,
  });

  const response = await fetch(HUAWEI_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error canjeando token de Huawei:', response.status, errorText);
    throw new Error(`Error en token Huawei: ${errorText}`);
  }

  const tokenData = await response.json();
  return tokenData;
}

/**
 * Refresca el Access Token usando el Refresh Token
 */
export async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.huaweiClientId,
    client_secret: config.huaweiClientSecret,
  });

  const response = await fetch(HUAWEI_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Error al refrescar token de Huawei');
  }

  return response.json();
}

/**
 * Obtiene las sesiones de entrenamiento (Workouts) desde Huawei Health Cloud
 */
export async function fetchActivityRecords(accessToken: string, startTimeMs: number, endTimeMs: number) {
  const url = `${HUAWEI_HEALTH_BASE_URL}/activityRecords?startTime=${startTimeMs}&endTime=${endTimeMs}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn('Advertencia obteniendo activityRecords:', response.status, err);
    return [];
  }

  const data = await response.json();
  return data.activityRecords || [];
}

/**
 * Obtiene datos de frecuencia cardíaca o pasos
 */
export async function fetchSampleSets(accessToken: string, dataCollectorId: string, startTime: number, endTime: number) {
  const url = `${HUAWEI_HEALTH_BASE_URL}/sampleSets/${dataCollectorId}?startTime=${startTime}&endTime=${endTime}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.samplePoints || [];
}
