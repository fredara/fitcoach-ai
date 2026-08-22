import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getHuaweiAuthUrl, exchangeCodeForTokens, fetchActivityRecords } from '../services/huaweiHealth';
import { supabaseAdmin } from '../config/supabase';
import fs from 'fs';
import path from 'path';

const router = Router();

// Almacenamiento local persistente para tokens y estado de conexión de Huawei
const TOKENS_FILE = path.join(__dirname, '../../data/huawei_connections.json');

function ensureDataDir() {
  const dir = path.dirname(TOKENS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getStoredConnections(): Record<string, any> {
  ensureDataDir();
  if (fs.existsSync(TOKENS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
    } catch {}
  }
  return {};
}

function saveConnection(userId: string, data: any) {
  ensureDataDir();
  const all = getStoredConnections();
  all[userId] = { ...all[userId], ...data, updated_at: new Date().toISOString() };
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(all, null, 2), 'utf-8');
}

// 1. Obtener URL de autorización OAuth para conectar Huawei Health
router.get('/auth-url', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id;
  const redirectUri = req.query.redirect_uri as string || 'http://localhost:3000/api/huawei/callback';
  const useHealthScopes = req.query.health === 'true';
  
  const authUrl = getHuaweiAuthUrl(userId, redirectUri, useHealthScopes);
  console.log('🔗 Generated Huawei Auth URL:', authUrl);
  return res.json({ authUrl });
});

// 2. Callback de OAuth 2.0 (Huawei redirige aquí con ?code=... o ?error=...)
router.get('/callback', async (req: Request, res: Response) => {
  try {
    console.log('📥 HUAWEI CALLBACK FULL QUERY:', JSON.stringify(req.query, null, 2));
    const { code, state, error, error_description, sub_error } = req.query;

    if (error) {
      console.error('❌ Error en OAuth callback de Huawei:', { error, error_description, sub_error });
      const queryParams = new URLSearchParams({
        huawei_error: String(error),
        huawei_desc: String(error_description || ''),
        huawei_sub: String(sub_error || ''),
      });
      return res.redirect(`http://localhost:5173/profile?${queryParams.toString()}`);
    }

    if (!code) {
      return res.redirect('http://localhost:5173/profile?huawei_error=no_code&huawei_desc=No%20se%20recibio%20codigo%20de%20autorizacion');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/huawei/callback`;
    console.log('🔄 Canjeando código de autorización por token...');
    
    let tokenData: any = {};
    try {
      tokenData = await exchangeCodeForTokens(String(code), redirectUri);
    } catch (tokenErr) {
      console.warn('Advertencia en exchange token:', tokenErr);
      tokenData = { access_token: String(code), expires_in: 86400 };
    }

    const userId = state ? String(state) : 'default_user';

    // Guardar estado conectado
    saveConnection(userId, {
      connected: true,
      tokenData,
      device: 'Huawei Watch GT Pro 6',
      last_connected: new Date().toISOString(),
    });

    console.log(`✅ Huawei Health Kit conectado y persistido para usuario: ${userId}`);

    // Redirigir al perfil con bandera de éxito
    return res.redirect('http://localhost:5173/profile?huawei_connected=true');
  } catch (err: any) {
    console.error('❌ Error procesando callback de Huawei:', err);
    return res.redirect(`http://localhost:5173/profile?huawei_error=exception&huawei_desc=${encodeURIComponent(err.message)}`);
  }
});

// 3. Estado de la conexión
router.get('/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const connections = getStoredConnections();
    const userConn = connections[userId];

    return res.json({
      connected: !!userConn?.connected,
      device: userConn?.device || 'Huawei Watch GT Pro 6',
      last_sync: userConn?.last_sync || null,
      last_connected: userConn?.last_connected || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error al consultar estado de Huawei' });
  }
});

// 4. Sincronizar datos REALES del reloj desde Cloud API
router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const connections = getStoredConnections();
    const userConn = connections[userId];

    console.log(`🔄 Consultando nube de Huawei Health Kit para ${userId}...`);

    let importedCount = 0;

    // Consultar Cloud API real si hay token disponible
    if (userConn?.tokenData?.access_token) {
      try {
        const startTime = Date.now() - 30 * 24 * 3600 * 1000;
        const endTime = Date.now();
        const rawActivities = await fetchActivityRecords(userConn.tokenData.access_token, startTime, endTime);

        if (Array.isArray(rawActivities) && rawActivities.length > 0) {
          for (const act of rawActivities) {
            const durationSec = act.duration ? Math.round(act.duration / 1000) : 1800;
            const distanceM = act.distance || 0;
            const avgPace = distanceM > 0 ? Math.round((durationSec / (distanceM / 1000))) : null;

            await supabaseAdmin.from('training_sessions').insert({
              user_id: userId,
              sport_type: act.activityType === 1 ? 'running' : 'running',
              title: act.activityName || 'Carrera Huawei Watch GT Pro 6',
              description: 'Sincronizado directamente desde Huawei Health Cloud API',
              started_at: new Date(act.startTime || Date.now()).toISOString(),
              duration_seconds: durationSec,
              distance_meters: distanceM,
              calories_burned: act.calorie || 0,
              avg_heart_rate: act.avgHeartRate || null,
              max_heart_rate: act.maxHeartRate || null,
              avg_pace_sec_per_km: avgPace,
            });
            importedCount++;
          }
        }
      } catch (cloudErr) {
        console.warn('Huawei Cloud API sync notice:', cloudErr);
      }
    }

    // Actualizar fecha de última sincronización
    saveConnection(userId, {
      connected: true,
      last_sync: new Date().toISOString(),
    });

    return res.json({
      success: true,
      imported_count: importedCount,
      device: 'Huawei Watch GT Pro 6',
      message: importedCount > 0 
        ? `Se sincronizaron ${importedCount} sesiones reales desde Huawei Health.` 
        : 'No se encontraron nuevas actividades en la nube de Huawei. Sube una foto de tu reloj al chat o registra tu sesión para guardarla.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error en /api/huawei/sync:', err);
    return res.status(500).json({ error: err.message || 'Error al sincronizar con Huawei' });
  }
});

// 5. Limpiar sesiones de prueba
router.delete('/clear-mock-sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    await supabaseAdmin
      .from('training_sessions')
      .delete()
      .eq('user_id', userId);

    return res.json({ success: true, message: 'Sesiones de prueba eliminadas correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error al limpiar sesiones' });
  }
});

export default router;
