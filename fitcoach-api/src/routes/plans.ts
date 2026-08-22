import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Obtener plan activo del usuario
router.get('/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { data: plan, error } = await supabaseAdmin
      .from('training_plans')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Error consultando training_plans:', error.message);
    }

    return res.json({ plan: plan?.plan_data || null });
  } catch (error: any) {
    console.error('Error al obtener plan activo:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener plan' });
  }
});

// Guardar o actualizar plan activo
router.post('/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'Faltan datos del plan' });
    }

    // Intentar upsert en training_plans
    const { data, error } = await supabaseAdmin
      .from('training_plans')
      .upsert({
        user_id: userId,
        title: plan.title || 'Plan Sub 4:30/km',
        goal: plan.goal || 'Ritmo 4:30 min/km & Fútbol',
        weeks_count: plan.weeks_count || 8,
        days_per_week: plan.days_per_week || 4,
        plan_data: plan,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Advertencia en upsert training_plans:', error.message);
    }

    return res.json({ success: true, plan });
  } catch (error: any) {
    console.error('Error al guardar plan activo:', error);
    return res.status(500).json({ error: error.message || 'Error al guardar plan' });
  }
});

export default router;
