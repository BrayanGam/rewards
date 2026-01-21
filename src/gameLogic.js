import { supabase } from './supabase';

/**
 * Gets the number of rewards claimed in the last 7 days
 * @returns {Promise<number>}
 */
export async function getWeeklyRewardCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Calibrar el inicio de la "semana actual" (Lunes)
    const now = new Date();
    const day = now.getDay(); // 0 (Dom) - 6 (Sab)
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que el Lunes sea el día 1
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
        .from('user_coupons')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString());

    if (error) {
        console.error('Error fetching weekly count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Gets the date of the next weekly reset (Next Monday at 00:00)
 * @returns {Date}
 */
export function getNextResetDate() {
    const now = new Date();
    const result = new Date(now);
    result.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Checks if the user can claim a reward (limit 2 per week)
 * @returns {Promise<boolean>}
 */
export async function checkWeeklyLimit() {
    const count = await getWeeklyRewardCount();
    return count < 2; // Returns true if they can still earn a reward
}

/**
 * Claims a random reward from the pool based on tier
 * @param {number} tier - 1, 2 or 3
 * @returns {Promise<object|null>}
 */
export async function claimReward(tier = 1) {
    const canEarn = await checkWeeklyLimit();
    if (!canEarn) {
        throw new Error('Límite semanal alcanzado (2 cupones por semana). ¡Vuelve pronto!');
    }

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Get pool for the tier (using numeric tiers: 1, 2, 3)
    const { data: pool, error: poolError } = await supabase
        .from('coupons_pool')
        .select('*')
        .eq('tier', tier);

    if (poolError || !pool || pool.length === 0) {
        throw new Error('Lo siento mi amor, no hay cupones disponibles en este nivel por ahora.');
    }

    // 2. Select random coupon
    const randomCoupon = pool[Math.floor(Math.random() * pool.length)];

    // 3. Insert into user_coupons
    const { data, error: insertError } = await supabase
        .from('user_coupons')
        .insert([
            {
                user_id: user.id,
                coupon_id: randomCoupon.id,
                status: 'active'
            }
        ])
        .select('*, coupons_pool(*)');

    if (insertError) {
        throw insertError;
    }

    return data[0];
}
