import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getLocalDatabase } from "@/server/local-db";

export interface ItemEstoqueLocal {
  id: string;
  empresa_id: string;
  tipo_ativo: string;
  nome_bm?: string | null;
  limite_bm?: string | null;
  status_envio?: string | null;
  tem_template?: boolean | null;
  data_criacao?: string | null;
  responsavel?: string | null;
  destinatario?: string | null;
  origem?: string | null;
  producao_id?: string | null;
  venda_id?: string | null;
  cliente_id?: string | null;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  custo_medio_unitario: number | null;
  status: string;
  updated_at?: string;
  created_at?: string;
}

export interface ContaEnviadaLocal {
  id: string;
  empresa_id: string;
  bm_id?: string | null;
  venda_id?: string | null;
  nome_bm: string;
  limite_bm?: string | null;
  destinatario_cliente: string;
  responsavel_envio?: string | null;
  data_envio: string;
  custo_unitario?: number | null;
  valor_venda?: number | null;
  status_envio: string;
  created_at?: string;
}

// 1. Listar itens de estoque por empresa
export const listarEstoqueLocal = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ empresa_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const stmt = db.prepare(
      "SELECT * FROM estoque WHERE empresa_id = ? ORDER BY updated_at DESC"
    );
    const rows = stmt.all(data.empresa_id) as any[];
    return rows.map((r) => ({
      ...r,
      tem_template: Boolean(r.tem_template),
      quantidade_disponivel: Number(r.quantidade_disponivel || 0),
      quantidade_reservada: Number(r.quantidade_reservada || 0),
      custo_medio_unitario: r.custo_medio_unitario != null ? Number(r.custo_medio_unitario) : 0,
    })) as ItemEstoqueLocal[];
  });

// 2. Salvar ou atualizar item no estoque
export const salvarItemEstoqueLocal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      id: z.string().optional(),
      empresa_id: z.string(),
      tipo_ativo: z.string(),
      nome_bm: z.string().nullable().optional(),
      limite_bm: z.string().nullable().optional(),
      status_envio: z.string().nullable().optional(),
      tem_template: z.boolean().optional(),
      data_criacao: z.string().nullable().optional(),
      responsavel: z.string().nullable().optional(),
      destinatario: z.string().nullable().optional(),
      origem: z.string().nullable().optional(),
      producao_id: z.string().nullable().optional(),
      venda_id: z.string().nullable().optional(),
      cliente_id: z.string().nullable().optional(),
      quantidade_disponivel: z.number().default(1),
      quantidade_reservada: z.number().default(0),
      custo_medio_unitario: z.number().nullable().optional(),
      status: z.string().default("disponivel"),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO estoque (
        id, empresa_id, tipo_ativo, nome_bm, limite_bm, status_envio,
        tem_template, data_criacao, responsavel, destinatario, origem,
        producao_id, venda_id, cliente_id, quantidade_disponivel,
        quantidade_reservada, custo_medio_unitario, status, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tipo_ativo = excluded.tipo_ativo,
        nome_bm = excluded.nome_bm,
        limite_bm = excluded.limite_bm,
        status_envio = excluded.status_envio,
        tem_template = excluded.tem_template,
        data_criacao = excluded.data_criacao,
        responsavel = excluded.responsavel,
        destinatario = excluded.destinatario,
        origem = excluded.origem,
        producao_id = excluded.producao_id,
        venda_id = excluded.venda_id,
        cliente_id = excluded.cliente_id,
        quantidade_disponivel = excluded.quantidade_disponivel,
        quantidade_reservada = excluded.quantidade_reservada,
        custo_medio_unitario = excluded.custo_medio_unitario,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      id,
      data.empresa_id,
      data.tipo_ativo,
      data.nome_bm ?? null,
      data.limite_bm ?? null,
      data.status_envio ?? "disponivel",
      data.tem_template ? 1 : 0,
      data.data_criacao ?? now.slice(0, 10),
      data.responsavel ?? null,
      data.destinatario ?? null,
      data.origem ?? "producao",
      data.producao_id ?? null,
      data.venda_id ?? null,
      data.cliente_id ?? null,
      data.quantidade_disponivel,
      data.quantidade_reservada,
      data.custo_medio_unitario ?? 0,
      data.status,
      now,
      now
    );

    return { id, sucesso: true };
  });

// 3. Inserir lote de BMs geradas na produção
export const inserirLoteEstoqueLocal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      empresa_id: z.string(),
      items: z.array(
        z.object({
          id: z.string().optional(),
          tipo_ativo: z.string(),
          nome_bm: z.string().nullable().optional(),
          limite_bm: z.string().nullable().optional(),
          status_envio: z.string().nullable().optional(),
          tem_template: z.boolean().optional(),
          data_criacao: z.string().nullable().optional(),
          responsavel: z.string().nullable().optional(),
          destinatario: z.string().nullable().optional(),
          origem: z.string().nullable().optional(),
          producao_id: z.string().nullable().optional(),
          quantidade_disponivel: z.number().default(1),
          quantidade_reservada: z.number().default(0),
          status: z.string().default("disponivel"),
        })
      ),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO estoque (
        id, empresa_id, tipo_ativo, nome_bm, limite_bm, status_envio,
        tem_template, data_criacao, responsavel, destinatario, origem,
        producao_id, quantidade_disponivel, quantidade_reservada,
        status, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec("BEGIN TRANSACTION;");
    try {
      for (const item of data.items) {
        const id = item.id || crypto.randomUUID();
        insertStmt.run(
          id,
          data.empresa_id,
          item.tipo_ativo,
          item.nome_bm ?? null,
          item.limite_bm ?? null,
          item.status_envio ?? "disponivel",
          item.tem_template ? 1 : 0,
          item.data_criacao ?? now.slice(0, 10),
          item.responsavel ?? null,
          item.destinatario ?? null,
          item.origem ?? "producao",
          item.producao_id ?? null,
          item.quantidade_disponivel,
          item.quantidade_reservada,
          item.status,
          now,
          now
        );
      }
      db.exec("COMMIT;");
      return { sucesso: true, total: data.items.length };
    } catch (e) {
      db.exec("ROLLBACK;");
      throw e;
    }
  });

// 4. Alterar status rápido (contingência / liberação)
export const alterarStatusEstoqueLocal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      id: z.string(),
      empresa_id: z.string(),
      novoStatus: z.string(),
      novaOrigem: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const isDisp = data.novoStatus === "disponivel" || data.novoStatus === "pronta_envio";
    const statusGen = isDisp ? "em_estoque" : data.novoStatus === "reservada" ? "baixo_estoque" : "esgotado";
    const qtd = isDisp ? 1 : 0;
    const now = new Date().toISOString();

    if (data.novaOrigem) {
      db.prepare(`
        UPDATE estoque
        SET status_envio = ?, status = ?, quantidade_disponivel = ?, origem = ?, updated_at = ?
        WHERE id = ? AND empresa_id = ?
      `).run(data.novoStatus, statusGen, qtd, data.novaOrigem, now, data.id, data.empresa_id);
    } else {
      db.prepare(`
        UPDATE estoque
        SET status_envio = ?, status = ?, quantidade_disponivel = ?, updated_at = ?
        WHERE id = ? AND empresa_id = ?
      `).run(data.novoStatus, statusGen, qtd, now, data.id, data.empresa_id);
    }
    return { sucesso: true };
  });

// 5. Excluir item do estoque
export const excluirItemEstoqueLocal = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string(), empresa_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    db.prepare("DELETE FROM estoque WHERE id = ? AND empresa_id = ?").run(data.id, data.empresa_id);
    return { sucesso: true };
  });

// 6. Baixa transacional atômica de BMs na venda (equivalente local à RPC baixar_bms_venda)
export const baixarBmsVendaLocal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      empresa_id: z.string(),
      venda_id: z.string().nullable().optional(),
      cliente_id: z.string().nullable().optional(),
      destinatario: z.string().nullable().optional(),
      bms_ids: z.array(z.string()),
      status_envio: z.string().default("entregue"),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const idsUnicos = Array.from(new Set(data.bms_ids));
    if (idsUnicos.length === 0) {
      return { sucesso: true, afetadas: 0, mensagem: "Nenhuma BM informada para baixa." };
    }

    db.exec("BEGIN IMMEDIATE TRANSACTION;");
    try {
      // Verificar existência e disponibilidade de todas as BMs
      const placeholders = idsUnicos.map(() => "?").join(",");
      const stmtSelect = db.prepare(
        `SELECT id, nome_bm, tipo_ativo, status, status_envio, quantidade_disponivel 
         FROM estoque 
         WHERE id IN (${placeholders}) AND empresa_id = ?`
      );
      const rows = stmtSelect.all(...idsUnicos, data.empresa_id) as any[];

      if (rows.length < idsUnicos.length) {
        throw new Error(
          `Uma ou mais BMs solicitadas não existem no estoque da empresa (esperado: ${idsUnicos.length}, encontrado: ${rows.length}).`
        );
      }

      const indisponiveis = rows.filter((r) => {
        const st = (r.status_envio || r.status || "").toLowerCase();
        const disp = st === "disponivel" || st === "em_estoque" || st === "pronta_envio";
        return !disp || Number(r.quantidade_disponivel || 0) <= 0;
      });

      if (indisponiveis.length > 0) {
        const nomes = indisponiveis.map((i) => i.nome_bm || i.tipo_ativo || i.id).join(", ");
        throw new Error(`As seguintes BMs não estão mais disponíveis para venda: ${nomes}`);
      }

      // Executar baixa atômica
      const now = new Date().toISOString();
      const stmtUpdate = db.prepare(
        `UPDATE estoque 
         SET status = 'vendida', 
             quantidade_disponivel = 0, 
             status_envio = ?, 
             venda_id = ?, 
             cliente_id = ?, 
             destinatario = COALESCE(NULLIF(?, ''), destinatario), 
             updated_at = ?
         WHERE id = ? AND empresa_id = ? AND (status IN ('disponivel', 'em_estoque') OR quantidade_disponivel > 0)`
      );

      let afetadas = 0;
      for (const row of rows) {
        const res = stmtUpdate.run(
          data.status_envio,
          data.venda_id ?? null,
          data.cliente_id ?? null,
          data.destinatario ?? null,
          now,
          row.id,
          data.empresa_id
        );
        afetadas += Number(res.changes);
      }

      if (afetadas < idsUnicos.length) {
        throw new Error(
          `Operação cancelada por concorrência: esperava dar baixa em ${idsUnicos.length} BM(s), mas apenas ${afetadas} foram atualizadas.`
        );
      }

      db.exec("COMMIT;");
      return {
        sucesso: true,
        afetadas,
        mensagem: `Baixa concluída com sucesso em ${afetadas} BM(s).`,
      };
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  });

// 7. Listar histórico de contas enviadas local
export const listarContasEnviadasLocal = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ empresa_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const stmt = db.prepare(
      "SELECT * FROM contas_enviadas WHERE empresa_id = ? ORDER BY data_envio DESC, created_at DESC"
    );
    const rows = stmt.all(data.empresa_id) as any[];
    return rows as ContaEnviadaLocal[];
  });

// 8. Registrar conta enviada local
export const registrarContaEnviadaLocal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      empresa_id: z.string(),
      bm_id: z.string().nullable().optional(),
      venda_id: z.string().nullable().optional(),
      nome_bm: z.string(),
      limite_bm: z.string().nullable().optional(),
      destinatario_cliente: z.string(),
      responsavel_envio: z.string().nullable().optional(),
      data_envio: z.string(),
      custo_unitario: z.number().default(0),
      valor_venda: z.number().default(0),
      status_envio: z.string().default("enviada"),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const db = getLocalDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO contas_enviadas (
        id, empresa_id, bm_id, venda_id, nome_bm, limite_bm,
        destinatario_cliente, responsavel_envio, data_envio,
        custo_unitario, valor_venda, status_envio, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.empresa_id,
      data.bm_id ?? null,
      data.venda_id ?? null,
      data.nome_bm,
      data.limite_bm ?? null,
      data.destinatario_cliente,
      data.responsavel_envio ?? null,
      data.data_envio,
      data.custo_unitario,
      data.valor_venda,
      data.status_envio,
      now
    );

    return { id, sucesso: true };
  });
