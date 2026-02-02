// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnlxfqncjzaflpfxjqpk.supabase.co';
const supabaseKey = 'sb_publishable_J1C_iH0RHwiFYtKola-wEQ_6Sc1BaHT';

export const supabase = createClient(supabaseUrl, supabaseKey);