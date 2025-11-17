import { supabase } from '../services/supabase';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  category: string;
  message: string;
  data?: any;
  level?: LogLevel;
}

/**
 * Production logger that writes to both console and Supabase
 * Useful for debugging production issues
 */
class Logger {
  private async writeToSupabase(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ): Promise<void> {
    // Disable Supabase logging for now (logs table not created in production)
    // TODO: Run migration: supabase/migrations/20251115T120000_add_logs_table.sql
    return;

    /* Disabled until logs table is created
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || null;

      await supabase.from('logs').insert({
        user_id: userId,
        level,
        category,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
      });
    } catch (error) {
      console.error('[LOGGER] Failed to write to Supabase:', error);
    }
    */
  }

  info(category: string, message: string, data?: any): void {
    console.log(`[${category}] ${message}`, data || '');
    this.writeToSupabase('info', category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    console.warn(`[${category}] ⚠️ ${message}`, data || '');
    this.writeToSupabase('warn', category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    console.error(`[${category}] ❌ ${message}`, data || '');
    this.writeToSupabase('error', category, message, data);
  }

  debug(category: string, message: string, data?: any): void {
    console.debug(`[${category}] 🐛 ${message}`, data || '');
    this.writeToSupabase('debug', category, message, data);
  }

  success(category: string, message: string, data?: any): void {
    console.log(`[${category}] ✅ ${message}`, data || '');
    this.writeToSupabase('info', category, `✅ ${message}`, data);
  }
}

export const logger = new Logger();
