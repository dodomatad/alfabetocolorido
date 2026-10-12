import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

let dbInstance: DatabaseSync | null = null;

export function getLocalDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "sca_local.db");
  const db = new DatabaseSync(dbPath);

  // Ativar WAL mode e chaves estrangeiras
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Criar tabelas locais com índices
  db.exec(`
    CREATE TABLE IF NOT EXISTS estoque (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      tipo_ativo TEXT NOT NULL,
      nome_bm TEXT,
      limite_bm TEXT,
      status_envio TEXT DEFAULT 'disponivel',
      tem_template INTEGER DEFAULT 0,
      data_criacao TEXT,
      responsavel TEXT,
      destinatario TEXT,
      origem TEXT DEFAULT 'producao',
      producao_id TEXT,
      venda_id TEXT,
      cliente_id TEXT,
      quantidade_disponivel REAL DEFAULT 1,
      quantidade_reservada REAL DEFAULT 0,
      custo_medio_unitario REAL DEFAULT 0,
      status TEXT DEFAULT 'disponivel',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_estoque_empresa ON estoque(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_estoque_status ON estoque(status, status_envio);
    CREATE INDEX IF NOT EXISTS idx_estoque_limite ON estoque(limite_bm);

    CREATE TABLE IF NOT EXISTS producao_diaria (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      data_registro TEXT,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
      funcionario_id TEXT,
      funcionario_nome TEXT,
      operador TEXT,
      tipo_ativo TEXT DEFAULT 'BM 250',
      tipo_bm TEXT DEFAULT 'BM 250',
      recebidas_fornecedor INTEGER DEFAULT 0,
      bms_criadas INTEGER DEFAULT 0,
      contas_viradas INTEGER DEFAULT 0,
      bloqueios INTEGER DEFAULT 0,
      prontas_estoque INTEGER DEFAULT 0,
      aproveitamento REAL DEFAULT 0,
      motivo_queda TEXT,
      observacoes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_producao_empresa ON producao_diaria(empresa_id);

    CREATE TABLE IF NOT EXISTS contas_enviadas (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      bm_id TEXT,
      venda_id TEXT,
      nome_bm TEXT NOT NULL,
      limite_bm TEXT,
      destinatario_cliente TEXT NOT NULL,
      responsavel_envio TEXT,
      data_envio TEXT,
      custo_unitario REAL DEFAULT 0,
      valor_venda REAL DEFAULT 0,
      status_envio TEXT DEFAULT 'enviada',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_contas_enviadas_empresa ON contas_enviadas(empresa_id);

    CREATE TABLE IF NOT EXISTS vendas (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      cliente_id TEXT,
      numero INTEGER NOT NULL,
      status TEXT DEFAULT 'efetuada',
      status_entrega TEXT DEFAULT 'entregue',
      delivery_status TEXT DEFAULT 'entregue',
      data_venda TEXT,
      data_entrega_prevista TEXT,
      desconto REAL DEFAULT 0,
      acrescimo REAL DEFAULT 0,
      valor_total REAL DEFAULT 0,
      observacoes TEXT,
      cliente_nome TEXT,
      responsavel_producao_id TEXT,
      criado_por TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vendas_empresa ON vendas(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_vendas_numero ON vendas(empresa_id, numero);

    CREATE TABLE IF NOT EXISTS venda_itens (
      id TEXT PRIMARY KEY,
      venda_id TEXT NOT NULL,
      modalidade_id TEXT,
      conta_id TEXT,
      quantidade REAL DEFAULT 1,
      preco_unitario REAL DEFAULT 0,
      desconto REAL DEFAULT 0,
      valor_total REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_venda_itens_venda ON venda_itens(venda_id);
  `);

  dbInstance = db;
  return dbInstance;
}
