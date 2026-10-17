import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitário resiliente para operações no Supabase.
 * Corrige automaticamente incompatibilidades temporárias de schema cache
 * (ex: "Could not find the 'xyz' column in the schema cache") removendo o campo
 * inexistente do payload e tentando novamente sem interromper o usuário.
 */
export async function resilientInsert<T = any>(
  table: string,
  records: any | any[],
  options?: { select?: boolean }
): Promise<{ data: T | null; error: any }> {
  let isArray = Array.isArray(records);
  let currentPayload = isArray
    ? records.map((r: any) => ({ ...r }))
    : { ...records };

  const MAX_RETRIES = 6;
  let lastError: any = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let query = (supabase.from(table as any) as any).insert(currentPayload);
      if (options?.select) {
        query = query.select();
      }

      const { data, error } = await query;
      if (!error) {
        return { data: isArray ? data : (data?.[0] ?? data), error: null };
      }

      lastError = error;
      const msg = error.message || error.details || "";

      // Detecta coluna ausente no cache do PostgREST
      const matchSchemaCache = msg.match(/Could not find the '([^']+)' column of '[^']+' in the schema cache/i);
      const matchColNotExist = msg.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
      const missingCol = matchSchemaCache?.[1] || matchColNotExist?.[1];

      if (missingCol) {
        console.warn(`[SupabaseResilient] Coluna '${missingCol}' ausente no schema cache de '${table}'. Removendo do payload e reexecutando tentativa ${attempt + 1}...`);
        if (Array.isArray(currentPayload)) {
          currentPayload = currentPayload.map((item: any) => {
            const copy = { ...item };
            delete copy[missingCol];
            return copy;
          });
        } else {
          delete currentPayload[missingCol];
        }
        continue;
      }

      // Se o erro for outro (ex: RLS, restrição), encerra e retorna o erro
      break;
    } catch (err: any) {
      lastError = err;
      break;
    }
  }

  return { data: null, error: lastError };
}

export async function resilientUpdate<T = any>(
  table: string,
  record: any,
  matchColumn: string,
  matchValue: any
): Promise<{ data: T | null; error: any }> {
  let currentPayload = { ...record };
  const MAX_RETRIES = 6;
  let lastError: any = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let query = (supabase.from(table as any) as any)
        .update(currentPayload)
        .eq(matchColumn, matchValue);

      const { data, error } = await query;
      if (!error) {
        return { data, error: null };
      }

      lastError = error;
      const msg = error.message || error.details || "";

      const matchSchemaCache = msg.match(/Could not find the '([^']+)' column of '[^']+' in the schema cache/i);
      const matchColNotExist = msg.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
      const missingCol = matchSchemaCache?.[1] || matchColNotExist?.[1];

      if (missingCol) {
        console.warn(`[SupabaseResilient] Coluna '${missingCol}' ausente no schema cache de '${table}'. Removendo do payload e reexecutando tentativa ${attempt + 1}...`);
        delete currentPayload[missingCol];
        continue;
      }

      break;
    } catch (err: any) {
      lastError = err;
      break;
    }
  }

  return { data: null, error: lastError };
}
