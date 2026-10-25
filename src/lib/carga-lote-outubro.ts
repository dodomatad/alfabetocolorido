import { supabase } from "@/integrations/supabase/client";
import {
  inserirLoteEstoqueLocal,
  salvarVendaLocal,
  registrarContaEnviadaLocal,
  salvarProducaoLocal,
} from "@/lib/estoque.functions";

export interface DadosBmVenda {
  nome: string;
  limite: "BM 2K" | "BM 250";
  cliente: string;
  data: string; // YYYY-MM-DD
  valor: number;
  observacao?: string;
}

export interface DadosBmEstoque {
  nome: string;
  limite: "BM 2K" | "BM 250";
}

// 16 BMs Vendidas informadas pelo usuário (Faturamento: R$ 3.550,00)
export const BMS_VENDIDAS_LOTE: DadosBmVenda[] = [
  // 3 BMs 2K - Juliano (reposição) a R$ 300,00 cada = R$ 900,00
  {
    nome: "Nova Profhel Industria e Comercio de Esquadrias e Materiais Para Construção",
    limite: "BM 2K",
    cliente: "Juliano (Reposição)",
    data: "2026-10-15",
    valor: 300,
    observacao: "enviado para juliano reposição",
  },
  {
    nome: "Bruna Monteiro de Araújo",
    limite: "BM 2K",
    cliente: "Juliano (Reposição)",
    data: "2026-10-17",
    valor: 300,
    observacao: "reposição juliano",
  },
  {
    nome: "Jessyk Barbosa Vieir",
    limite: "BM 2K",
    cliente: "Juliano (Reposição)",
    data: "2026-10-17",
    valor: 300,
    observacao: "reposição juliano",
  },

  // 6 BMs 2K - Hugo a R$ 250,00 cada = R$ 1.500,00
  {
    nome: "Ed Souzas Design de Moveis LTDA",
    limite: "BM 2K",
    cliente: "Hugo",
    data: "2026-10-15",
    valor: 250,
    observacao: "hugo (15-10-2026)",
  },
  {
    nome: "Alumiglass Esquadrias de Aluminio LTDA",
    limite: "BM 2K",
    cliente: "Hugo",
    data: "2026-10-15",
    valor: 250,
    observacao: "2k hugo (15-10-2026)",
  },
  {
    nome: "Nova Profhel Industria e Comercio de Esquadrias e Materiais Para Construcao 2k",
    limite: "BM 2K",
    cliente: "Hugo",
    data: "2026-10-15",
    valor: 250,
    observacao: "2k hugo (15-10-2026)",
  },
  {
    nome: "Datline Comercio e Fabricacao de Esquadrias em Pvc LTDA",
    limite: "BM 2K",
    cliente: "Hugo",
    data: "2026-10-15",
    valor: 250,
    observacao: "hugo (15-10-2026)",
  },
  {
    nome: "Miranda Moveis LTDA",
    limite: "BM 2K",
    cliente: "Hugo",
    data: "2026-10-15",
    valor: 250,
    observacao: "hugo (15-10-2026)",
  },
  {
    nome: "Acotubo Solucoes Em Acos Ltda",
    limite: "BM 2K",
    cliente: "Hugo",
    data: "2026-10-16",
    valor: 250,
    observacao: "hugo (16-10-2026)",
  },

  // 2 BMs 2K - O Patrão / Antonio a R$ 250,00 cada = R$ 500,00
  {
    nome: "Sky Marcenaria LTDA",
    limite: "BM 2K",
    cliente: "O Patrão • Contingência",
    data: "2026-10-15",
    valor: 250,
    observacao: "antonio - 15/10/2026",
  },
  {
    nome: "Gezita Store Variedades e Modas Comercio de Roupas em Geral LTDA",
    limite: "BM 2K",
    cliente: "O Patrão • Contingência",
    data: "2026-10-16",
    valor: 250,
    observacao: "o antonio o patrao (16-10-2026)",
  },

  // 2 BMs 2K - Adsflow a R$ 250,00 cada = R$ 500,00
  {
    nome: "Shekinah Vidraçaria LTDA",
    limite: "BM 2K",
    cliente: "Adsflow",
    data: "2026-10-15",
    valor: 250,
    observacao: "adsflow 15/10/2026",
  },
  {
    nome: "Pantuzzo Ferragens Portas E Janelas Ltda",
    limite: "BM 2K",
    cliente: "Adsflow",
    data: "2026-10-17",
    valor: 250,
    observacao: "adsflow (17-10-2026)",
  },

  // 3 BMs 250 - Adsflow a R$ 50,00 cada = R$ 150,00
  {
    nome: "Ana Julia Barros",
    limite: "BM 250",
    cliente: "Adsflow",
    data: "2026-10-14",
    valor: 50,
    observacao: "adsflow 14/10/2026",
  },
  {
    nome: "Maria Laura Macedo",
    limite: "BM 250",
    cliente: "Adsflow",
    data: "2026-10-15",
    valor: 50,
    observacao: "ENVIADO ADS FLOW",
  },
  {
    nome: "Nicole da Paz",
    limite: "BM 250",
    cliente: "Adsflow",
    data: "2026-10-15",
    valor: 50,
    observacao: "ENVIADO ADS FLOW",
  },
];

// 44 BMs Disponíveis em Estoque informadas pelo usuário
export const BMS_ESTOQUE_DISPONIVEL: DadosBmEstoque[] = [
  // 24 BMs de limite BM 250
  { nome: "Pazefer Industria e Comercio de Ferros LTDA", limite: "BM 250" },
  { nome: "M. Pozenato LTDA", limite: "BM 250" },
  { nome: "Compensados Bonardi LTDA", limite: "BM 250" },
  { nome: "Linea Office Comercio de Moveis Para Escritorio LTDA", limite: "BM 250" },
  { nome: "Bonneville Vidros e Cristais LTDA", limite: "BM 250" },
  { nome: "Baianao Moveis e Eletrodomesticos", limite: "BM 250" },
  { nome: "Macoe Portas e Janelas LTDA", limite: "BM 250" },
  { nome: "R&R Comercio de Moveis e Ambientes LTDA", limite: "BM 250" },
  { nome: "loja luxo", limite: "BM 250" },
  { nome: "Serena Puxadores LTDA", limite: "BM 250" },
  { nome: "Estofados Columbia LTDA.", limite: "BM 250" },
  { nome: "Homezy Brasil LTDA", limite: "BM 250" },
  { nome: "Qualitemper Esquadrias E Vidros Ltda", limite: "BM 250" },
  { nome: "Correa Aluminios E Vidros Ltda", limite: "BM 250" },
  { nome: "NET METAL Metalurgica LTDA", limite: "BM 250" },
  { nome: "Saarinen Moveis E Decoracoes Ltda", limite: "BM 250" },
  { nome: "C & B Moveis E Decoracoes Ltda", limite: "BM 250" },
  { nome: "Maria Liz Azevedo", limite: "BM 250" },
  { nome: "Hermínia Moraes", limite: "BM 250" },
  { nome: "Esmeralda Leite", limite: "BM 250" },
  { nome: "Ana Vitória das Neves", limite: "BM 250" },
  { nome: "Ana Sophia Lima", limite: "BM 250" },
  { nome: "Ana Sophia Casa Grande", limite: "BM 250" },
  { nome: "Ana Vitória Pastor", limite: "BM 250" },

  // 20 BMs de limite BM 2K
  { nome: "Archi Comercio de Puxadores Ltda", limite: "BM 2K" },
  { nome: "Tendbom Moveis de Madeira LTDa", limite: "BM 2K" },
  { nome: "Santos Andira Industria De Moveis Ltda", limite: "BM 2K" },
  { nome: "Fvt Ferragens E Acessorios Para Vidro Temperado Ltda", limite: "BM 2K" },
  { nome: "ALLO Esquadrias LTDA", limite: "BM 2K" },
  { nome: "Moveis RIPKE LTDA", limite: "BM 2K" },
  { nome: "A P a Comercio De Moveis Ltda", limite: "BM 2K" },
  { nome: "Madeireira Vilela LTDA", limite: "BM 2K" },
  { nome: "Pink Group Servicos de Marketing Digital e Publicidade", limite: "BM 2K" },
  { nome: "Al Distribuidora E Comercio De Pias E Cubas Ltda", limite: "BM 2K" },
  { nome: "Stella das Neves", limite: "BM 2K" },
  { nome: "Ana Vitória Vargas", limite: "BM 2K" },
  { nome: "Ana Sophia da Rosa", limite: "BM 2K" },
  { nome: "Marina da Cruz", limite: "BM 2K" },
  { nome: "Maria Helena Fernandes", limite: "BM 2K" },
  { nome: "Melissa Sanches", limite: "BM 2K" },
  { nome: "Ana Júlia Camargo", limite: "BM 2K" },
  { nome: "Ana Sophia Sales", limite: "BM 2K" },
  { nome: "Ana Cecília Guerra", limite: "BM 2K" },
  { nome: "Letícia da Costa", limite: "BM 2K" },
];

export async function processarLoteOficial({
  empresaId,
  usuarioId,
}: {
  empresaId: string;
  usuarioId?: string | null | undefined;
}) {
  if (!empresaId) throw new Error("ID da empresa é obrigatório.");

  const now = new Date().toISOString();

  // 1. Criar registro de Produção Diária (Lote Outubro)
  const producaoId = crypto.randomUUID();
  try {
    const { error: erroProd } = await supabase.from("producao_diaria").insert({
      id: producaoId,
      empresa_id: empresaId,
      data_registro: "2026-10-15",
      operador: "Produção Central",
      bms_criadas: 60,
      contas_viradas: 60,
      bloqueios: 0,
      bms_aquecidas: 0,
      contas_subidas: 0,
      meta_diaria: 60,
      tipo_bm: "BM 2K",
      observacoes: "Lançamento oficial em lote: 60 BMs (44 Disponíveis e 16 Vendidas).",
      criado_por: usuarioId || null,
    });
    if (erroProd) {
      console.warn("Aviso ao inserir producao_diaria no Supabase:", erroProd);
    }
  } catch (eProdSupabase) {
    console.warn("Aviso ao criar producao_diaria no Supabase:", eProdSupabase);
  }

  try {
    await salvarProducaoLocal({
      data: {
        id: producaoId,
        empresa_id: empresaId,
        data_registro: "2026-10-15",
        quantidade_gerada: 60,
        quantidade_aprovada: 60,
        quantidade_rejeitada: 0,
        responsavel: "Produção Central",
        observacoes: "Lançamento oficial em lote: 60 BMs (44 Disponíveis e 16 Vendidas).",
        criado_por: usuarioId || null,
      },
    });
  } catch (eProdLocal) {
    console.warn("Aviso ao criar producao_diaria local:", eProdLocal);
  }

  // 2. Montar as 44 BMs disponíveis para inserção no Estoque
  const bmsEstoqueDisponivelParaInserir = BMS_ESTOQUE_DISPONIVEL.map((bm) => {
    const id = crypto.randomUUID();
    return {
      id,
      empresa_id: empresaId,
      tipo_ativo: bm.limite, // BM 250 ou BM 2K
      nome_bm: bm.nome,
      limite_bm: bm.limite,
      status: "disponivel",
      status_envio: "em_estoque",
      quantidade_disponivel: 1,
      quantidade_reservada: 0,
      destinatario: null as string | null,
      tem_template: true,
      origem: "producao",
      producao_id: producaoId,
      responsavel: "Produção Central",
      data_criacao: "2026-10-15T00:00:00.000Z",
      created_at: now,
      updated_at: now,
    };
  });

  // 3. Montar as 16 BMs Vendidas para inserção no Estoque (com status 'vendida' e quantidade_disponivel 0)
  const bmsVendidasParaInserir = BMS_VENDIDAS_LOTE.map((v) => {
    const id = crypto.randomUUID();
    return {
      id,
      empresa_id: empresaId,
      tipo_ativo: v.limite, // BM 250 ou BM 2K
      nome_bm: v.nome,
      limite_bm: v.limite,
      status: "vendida",
      status_envio: "entregue",
      quantidade_disponivel: 0,
      quantidade_reservada: 0,
      destinatario: v.cliente,
      tem_template: true,
      origem: "producao",
      producao_id: producaoId,
      responsavel: "Produção Central",
      data_criacao: `${v.data}T00:00:00.000Z`,
      created_at: now,
      updated_at: now,
      dadosVendaOriginal: v,
    };
  });

  const todasBmsParaEstoque = [
    ...bmsEstoqueDisponivelParaInserir,
    ...bmsVendidasParaInserir.map(({ dadosVendaOriginal, ...resto }) => resto),
  ];

  // Inserir todas as 60 BMs no Supabase respeitando o schema exato
  try {
    const { error: erroSupabaseEstoque } = await supabase.from("estoque").insert(
      todasBmsParaEstoque.map((bm) => ({
        id: bm.id,
        empresa_id: bm.empresa_id,
        tipo_ativo: bm.tipo_ativo,
        nome_bm: bm.nome_bm,
        limite_bm: bm.limite_bm,
        status: bm.status,
        status_envio: bm.status_envio,
        quantidade_disponivel: bm.quantidade_disponivel,
        quantidade_reservada: bm.quantidade_reservada,
        destinatario: bm.destinatario || null,
        tem_template: bm.tem_template,
        origem: bm.origem,
        producao_id: bm.producao_id,
        responsavel: bm.responsavel,
        data_criacao: bm.data_criacao,
      }))
    );
    if (erroSupabaseEstoque) {
      console.error("Erro ao inserir lote de estoque no Supabase:", erroSupabaseEstoque);
    }
  } catch (errSupEst) {
    console.error("Exceção ao inserir estoque remoto:", errSupEst);
  }

  // Inserir no banco local SQLite
  try {
    await inserirLoteEstoqueLocal({
      data: {
        empresa_id: empresaId,
        itens: todasBmsParaEstoque.map((bm) => ({
          id: bm.id,
          tipo_ativo: bm.tipo_ativo,
          nome_bm: bm.nome_bm,
          limite_bm: bm.limite_bm,
          status_envio: bm.status_envio,
          tem_template: bm.tem_template,
          data_criacao: bm.data_criacao,
          responsavel: bm.responsavel,
          destinatario: bm.destinatario || null,
          origem: bm.origem,
          producao_id: bm.producao_id,
          quantidade_disponivel: bm.quantidade_disponivel,
          quantidade_reservada: bm.quantidade_reservada,
          status: bm.status,
        })),
      },
    });
  } catch (errLocEst) {
    console.warn("Aviso ao inserir estoque local:", errLocEst);
  }

  // Obter próximo número sequencial de venda
  let numVendaAtual = 2000;
  try {
    const { data: proximoNum } = await (supabase as any).rpc("proximo_numero_venda", {
      _empresa: empresaId,
    });
    if (proximoNum && Number(proximoNum) > 0) {
      numVendaAtual = Number(proximoNum);
    }
  } catch {
    // fallback
  }

  // 4. Inserir as 16 Vendas, Venda Itens, Contas Enviadas e Lançamentos Financeiros (Faturamento: R$ 3.550,00)
  for (const itemVendida of bmsVendidasParaInserir) {
    const vendaId = crypto.randomUUID();
    const dadosVenda = itemVendida.dadosVendaOriginal;
    const numVenda = numVendaAtual++;

    // Criar a Venda no Supabase com campos estritamente válidos
    try {
      const { error: errVenda } = await supabase.from("vendas").insert({
        id: vendaId,
        empresa_id: empresaId,
        numero: numVenda,
        cliente: dadosVenda.cliente,
        status: "confirmada",
        status_entrega: "entregue",
        data_venda: dadosVenda.data,
        subtotal: dadosVenda.valor,
        valor_total: dadosVenda.valor,
        desconto: 0,
        acrescimo: 0,
        observacoes: `[LOTE_OFICIAL] BM: ${dadosVenda.nome} (${dadosVenda.limite}) - ${dadosVenda.observacao || ""}`,
        criado_por: usuarioId || null,
      });

      if (errVenda) {
        console.error(`Erro ao inserir venda ${vendaId} no Supabase:`, errVenda);
      }

      // Inserir item da venda
      await supabase.from("venda_itens").insert({
        venda_id: vendaId,
        quantidade: 1,
        preco_unitario: dadosVenda.valor,
        desconto: 0,
        valor_total: dadosVenda.valor,
        conta_id: itemVendida.id,
      });

      // Vincular venda_id na BM do estoque
      await supabase
        .from("estoque")
        .update({
          destinatario: dadosVenda.cliente,
          status: "vendida",
          status_envio: "entregue",
          quantidade_disponivel: 0,
        })
        .eq("id", itemVendida.id);

      // Inserir contas_enviadas para rastreabilidade
      await supabase.from("contas_enviadas").insert({
        empresa_id: empresaId,
        bm_id: itemVendida.id,
        venda_id: vendaId,
        nome_bm: dadosVenda.nome,
        limite_bm: dadosVenda.limite,
        destinatario_cliente: dadosVenda.cliente,
        responsavel_envio: "Produção Central",
        data_envio: dadosVenda.data,
        valor_venda: dadosVenda.valor,
        status_envio: "enviada",
      });

      // Inserir Lançamento Financeiro de Receita (Sobe o Saldo no Financeiro)
      await supabase.from("lancamentos_financeiros").insert({
        empresa_id: empresaId,
        tipo: "receber",
        categoria: "vendas",
        descricao: `Venda BM ${dadosVenda.limite} - ${dadosVenda.cliente}`,
        valor: dadosVenda.valor,
        valor_pago: dadosVenda.valor,
        data_vencimento: dadosVenda.data,
        data_pagamento: dadosVenda.data,
        forma_pagamento: "PIX",
        situacao: "pago",
        venda_id: vendaId,
        observacoes: `[LOTE_OFICIAL_VENDA:${vendaId}] BM: ${dadosVenda.nome}`,
        criado_por: usuarioId || null,
      });
    } catch (errRemotoVenda) {
      console.error(`Erro ao processar venda ${vendaId} no Supabase:`, errRemotoVenda);
    }

    // Persistir Venda e Conta Enviada localmente no SQLite
    try {
      await salvarVendaLocal({
        data: {
          id: vendaId,
          empresa_id: empresaId,
          cliente_nome: dadosVenda.cliente,
          status: "confirmada",
          status_entrega: "entregue",
          delivery_status: "entregue",
          data_venda: dadosVenda.data,
          valor_total: dadosVenda.valor,
          desconto: 0,
          acrescimo: 0,
          observacoes: `[LOTE_OFICIAL] BM: ${dadosVenda.nome} (${dadosVenda.limite})`,
          criado_por: usuarioId || null,
          itens: [
            {
              modalidade_id: "",
              conta_id: itemVendida.id,
              quantidade: 1,
              preco_unitario: dadosVenda.valor,
              desconto: 0,
              valor_total: dadosVenda.valor,
            },
          ],
        },
      });

      await registrarContaEnviadaLocal({
        data: {
          empresa_id: empresaId,
          bm_id: itemVendida.id,
          venda_id: vendaId,
          nome_bm: dadosVenda.nome,
          limite_bm: dadosVenda.limite,
          destinatario_cliente: dadosVenda.cliente,
          responsavel_envio: "Produção Central",
          data_envio: dadosVenda.data,
          valor_venda: dadosVenda.valor,
          status_envio: "enviada",
        },
      });
    } catch (errLocalVenda) {
      console.warn("Aviso ao salvar venda local:", errLocalVenda);
    }
  }

  return {
    sucesso: true,
    totalBms: todasBmsParaEstoque.length,
    disponiveis: bmsEstoqueDisponivelParaInserir.length,
    vendidas: bmsVendidasParaInserir.length,
    faturamentoTotal: 3550,
  };
}
