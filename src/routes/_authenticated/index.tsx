import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Search, Menu, History, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";


import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


import { CarregandoCartoes, EstadoErro } from "@/components/comum/estados";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";
import {
  CORES_GRAFICO,
  GraficoBarrasAgrupadas,
  GraficoFunil,
  GraficoRosca,
} from "@/components/dashboard/graficos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarMoeda, formatarNumero, formatarDataHora } from "@/lib/formatadores";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModalAdicionarReposicao } from "@/components/dashboard/modal-adicionar-reposicao";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Gestão BMs" },
      {
        name: "description",
        content:
          "Painel financeiro e operacional com faturamento, custos, lucro, ROI e conversão de vendas.",
      },
      { property: "og:title", content: "Dashboard | Gestão BMs" },
      {
        property: "og:description",
        content: "Faturamento, custos, lucro, ROI e conversão de vendas em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaDashboard,
});

const PERIODOS = [
  { valor: "7", rotulo: "Últimos 7 dias" },
  { valor: "30", rotulo: "Últimos 30 dias" },
  { valor: "90", rotulo: "Últimos 90 dias" },
  { valor: "mes_atual", rotulo: "Este Mês" },
  { valor: "mes_passado", rotulo: "Mês Passado" },
  { valor: "ano_atual", rotulo: "Este Ano" },
  { valor: "tudo", rotulo: "Todo o período" },
  { valor: "personalizado", rotulo: "Personalizado" },
] as const;

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  confirmada: "Confirmada",
  em_producao: "Em produção",
  pronta: "Pronta",
  parcialmente_entregue: "Parcialmente entregue",
  entregue: "Entregue",
  cancelada: "Cancelada",
  reembolsada: "Reembolsada",
  reposicao: "Reposição",
  pendente: "Pendente",
  em_rota: "Em rota",
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ETAPAS_FUNIL: Array<{ chave: string; rotulo: string }> = [
  { chave: "total", rotulo: "Pedidos" },
  { chave: "confirmada", rotulo: "Confirmados" },
  { chave: "producao", rotulo: "Em produção" },
  { chave: "pronta", rotulo: "Prontos" },
  { chave: "entregue", rotulo: "Entregues" },
];

type LinhaVenda = {
  id: string;
  numero_venda?: number;
  cliente?: string;
  clientes?: { nome: string };
  status: string;
  valor_total: number | string;
  desconto: number | string;
  data_venda: string;
  created_at: string;
};

type LinhaItem = {
  quantidade: number | string;
  modalidades_bm: { custo_producao_padrao: number | string } | null;
  vendas?: { data_venda: string };
};

type LinhaReposicao = {
  id: string;
  cliente_nome: string;
  tipo_perfil: string;
  motivo_reposicao: string;
  custo_reposicao: number | string;
  status: string;
  created_at: string;
  venda_id: string | null;
};

type LinhaEntrega = {
  id: string;
  status: string;
  custo_reposicao: number | string;
  created_at: string;
};

function PaginaDashboard() {
  const { empresa, fuso, permissoes } = useSessao();
  const queryClient = useQueryClient();
  const [dias, setDias] = useState<string>("30");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [sheetFiltrosAberto, setSheetFiltrosAberto] = useState(false);
  
  const [modalVendasAberto, setModalVendasAberto] = useState(false);
  const [modalProducaoAberto, setModalProducaoAberto] = useState(false);
  const [modalReposicoesAberto, setModalReposicoesAberto] = useState(false);
  const [modalNovaReposicaoAberto, setModalNovaReposicaoAberto] = useState(false);
  const [filtroDiaModal, setFiltroDiaModal] = useState<string>("todos");

  const { inicioIso, hojeIso } = useMemo(() => {
    const d = new Date();
    const hoje = new Date().toISOString().slice(0, 10);
    
    if (dias === "tudo") {
      return { inicioIso: "2000-01-01", hojeIso: "2099-12-31" };
    }
    if (dias === "mes_atual") {
      const primeiroDia = new Date(d.getFullYear(), d.getMonth(), 1);
      const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { 
        inicioIso: primeiroDia.toISOString().slice(0, 10), 
        hojeIso: ultimoDia.toISOString().slice(0, 10) 
      };
    }
    if (dias === "mes_passado") {
      const primeiroDia = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const ultimoDia = new Date(d.getFullYear(), d.getMonth(), 0);
      return { 
        inicioIso: primeiroDia.toISOString().slice(0, 10), 
        hojeIso: ultimoDia.toISOString().slice(0, 10) 
      };
    }
    if (dias === "ano_atual") {
      const primeiroDia = new Date(d.getFullYear(), 0, 1);
      const ultimoDia = new Date(d.getFullYear(), 11, 31);
      return { 
        inicioIso: primeiroDia.toISOString().slice(0, 10), 
        hojeIso: ultimoDia.toISOString().slice(0, 10) 
      };
    }
    if (dias === "personalizado") {
      return {
        inicioIso: dataInicioPersonalizada || hoje,
        hojeIso: dataFimPersonalizada || hoje,
      };
    }
    
    d.setDate(d.getDate() - Number(dias));
    return {
      inicioIso: d.toISOString().slice(0, 10),
      hojeIso: hoje,
    };
  }, [dias, dataInicioPersonalizada, dataFimPersonalizada]);


  const consulta = useQuery({
    queryKey: ["dashboard", empresa?.id, inicioIso, hojeIso, statusFiltro],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60,
    queryFn: async () => {
      let vendasQuery = supabase
        .from("vendas")
        .select("id, numero_venda, cliente, status, valor_total, desconto, data_venda, created_at, clientes(nome)")
        .eq("empresa_id", empresa!.id)
        .gte("data_venda", inicioIso)
        .lte("data_venda", hojeIso);
      if (statusFiltro !== "todos") vendasQuery = vendasQuery.eq("status", statusFiltro as never);

      const [vendas, itens, reposicoes, entregas, lancamentos, vendasTotais] = await Promise.all([
        vendasQuery,
        supabase
          .from("venda_itens")
          .select("quantidade, venda_id, vendas!inner(empresa_id, data_venda, status), modalidades_bm(custo_producao_padrao)")
          .eq("vendas.empresa_id", empresa!.id)
          .gte("vendas.data_venda", inicioIso)
          .lte("vendas.data_venda", hojeIso),
        supabase
          .from("reposicoes_perfis")
          .select("*")
          .eq("empresa_id", empresa!.id)
          .gte("created_at", inicioIso)
          .lte("created_at", hojeIso + "T23:59:59.999Z"),
        supabase
          .from("entregas")
          .select("id, status, custo_reposicao, created_at, empresa_id")
          .eq("empresa_id", empresa!.id)
          .gte("created_at", inicioIso)
          .lte("created_at", hojeIso + "T23:59:59.999Z"),
        supabase
          .from("lancamentos_financeiros")
          .select("*")
          .eq("empresa_id", empresa!.id),
        supabase
          .from("vendas")
          .select("valor_total, desconto, status")
          .eq("empresa_id", empresa!.id)
      ]);

      const erro = vendas.error ?? itens.error ?? (reposicoes.error as any) ?? entregas.error ?? lancamentos.error ?? vendasTotais.error;
      if (erro) throw erro;

      return {
        vendas: (vendas.data ?? []) as unknown as LinhaVenda[],
        itens: (itens.data ?? []) as unknown as LinhaItem[],
        reposicoes: (reposicoes.data ?? []) as unknown as LinhaReposicao[],
        entregas: (entregas.data ?? []) as unknown as LinhaEntrega[],
        lancamentosFinanceiros: lancamentos.data ?? [],
        vendasTotais: (vendasTotais.data ?? []) as any[],
      };
    },
  });

  const vendas = useMemo(() => consulta.data?.vendas ?? [], [consulta.data?.vendas]);
  const itens = useMemo(() => consulta.data?.itens ?? [], [consulta.data?.itens]);
  const reposicoes = useMemo(() => (consulta.data as any)?.reposicoes ?? [], [consulta.data]);
  const entregas = useMemo(() => (consulta.data as any)?.entregas ?? [], [consulta.data]);
  const vendasTotaisData = useMemo(() => (consulta.data as any)?.vendasTotais ?? [], [consulta.data]);
  
  const {
    totalReembolsadoGeral,
    faturamentoLiquidoGeral,
    descontosGeral,
    brutoGeral,
  } = useMemo(() => {
    const validasTotais = vendasTotaisData.filter((v: any) => !["rascunho", "cancelada", "reembolsada", "falta_pagamento"].includes(v.status));
    const reembolsadasTotais = vendasTotaisData.filter((v: any) => ["reembolsada", "estornada", "cancelada"].includes(v.status));
    const totalReemb = reembolsadasTotais.reduce((s: number, v: any) => s + Number(v.valor_total ?? 0), 0) || 0;
    const fatLiq = validasTotais.reduce((s: number, v: any) => s + Number(v.valor_total ?? 0), 0) || 0;
    const desc = validasTotais.reduce((s: number, v: any) => s + Number(v.desconto ?? 0), 0) || 0;
    return {
      totalReembolsadoGeral: totalReemb,
      faturamentoLiquidoGeral: fatLiq,
      descontosGeral: desc,
      brutoGeral: fatLiq + totalReemb + desc,
    };
  }, [vendasTotaisData]);

  const ocultarValores = useMemo(() => {
    return permissoes.find(p => p.modulo === 'dashboard')?.ocultar_valores === true;
  }, [permissoes]);

  const {
    validas,
    reembolsadas,
    totalReembolsado,
    taxaReembolso,
    faturamentoLiquido,
    descontos,
    bruto,
    custosProducaoPadrao,
    custosProducaoTotal,
    custoReposicaoTotal,
    custosTotais,
    lucro,
    taxaReposicao,
    taxaConversao,
    dadosROI,
  } = useMemo(() => {
    const val = vendas.filter((v) => !["rascunho", "cancelada", "reembolsada", "falta_pagamento"].includes(v.status));
    const reemb = vendas.filter((v) => ["reembolsada", "estornada", "cancelada"].includes(v.status));
    const totReemb = reemb.reduce((s, v) => s + Number(v.valor_total ?? 0), 0) || 0;
    const txReemb = vendas.length > 0 ? (reemb.length / vendas.length) * 100 : 0;

    const fatLiq = val.reduce((s, v) => s + Number(v.valor_total ?? 0), 0) || 0;
    const desc = val.reduce((s, v) => s + Number(v.desconto ?? 0), 0) || 0;
    const brt = fatLiq + totReemb + desc;

    // 1. Despesas operacionais e custos de produção do financeiro dentro do período
    const todosLancamentos = (consulta.data as any)?.lancamentosFinanceiros ?? [];
    const lancamentosPeriodo = todosLancamentos.filter((l: any) => {
      const dt = l.data_vencimento || l.created_at?.slice(0, 10) || "";
      if (!dt) return true;
      return dt >= inicioIso && dt <= hojeIso;
    });

    const categoriasProducaoBM = [
      'custo_producao_bm',
      'produção de bm / insumos',
      'produção bm', 
      'producao bm', 
      'insumos',
      'ferramentas',
      'saldo bot',
      'saldo do bot',
      'operacional'
    ];

    const cProducaoTotal = lancamentosPeriodo
      .filter((l: any) => {
        const categoria = (l.categoria || "").trim().toLowerCase();
        const tipo = (l.tipo || "").trim().toLowerCase();
        const ehSaida = tipo === 'pagar' || tipo === 'saida' || tipo === 'saída' || tipo === 'despesa';
        const ehCategoriaBM = categoriasProducaoBM.includes(categoria);
        return ehSaida && ehCategoriaBM;
      })
      .reduce((acc: number, l: any) => acc + Number(l.valor || 0), 0);

    const outrasDespesasPeriodo = lancamentosPeriodo
      .filter((l: any) => {
        const categoria = (l.categoria || "").trim().toLowerCase();
        const tipo = (l.tipo || "").trim().toLowerCase();
        const ehSaida = tipo === 'pagar' || tipo === 'saida' || tipo === 'saída' || tipo === 'despesa';
        const ehCategoriaBM = categoriasProducaoBM.includes(categoria);
        return ehSaida && !ehCategoriaBM;
      })
      .reduce((acc: number, l: any) => acc + Number(l.valor || 0), 0);

    // 2. Custos de reposição (reposicoes_perfis + entregas com custo de reposição)
    const custoReposicoesPerfis = reposicoes.reduce((s: number, r: any) => s + (Number(r.custo_reposicao) || 0), 0);
    const custoReposicoesEntregas = entregas.reduce((s: number, e: any) => s + (Number(e.custo_reposicao) || 0), 0);
    const cReposicaoTotal = custoReposicoesPerfis + custoReposicoesEntregas;

    // 3. Custos Totais e Lucro Real
    const cTotais = Number(cProducaoTotal) + Number(cReposicaoTotal) + Number(outrasDespesasPeriodo);
    const luc = Number(fatLiq) - cTotais;

    const totalEntregue = itens.reduce((s: number, i: LinhaItem) => s + (Number(i.quantidade) || 0), 0);
    const totalReposicoesPerfis = reposicoes.length;
    const totalReposicoesEntregas = entregas.filter((e: LinhaEntrega) => e.status === 'reposicao').length;
    const totalReposicoesQtd = totalReposicoesPerfis + totalReposicoesEntregas;
    const txReposicao = totalEntregue > 0 ? (totalReposicoesQtd / totalEntregue) * 100 : 0;

    const convertidas = vendas.filter(
      (v) => !["rascunho", "cancelada", "reembolsada", "falta_pagamento"].includes(v.status),
    ).length;
    const txConversao = vendas.length > 0 ? (convertidas / vendas.length) * 100 : 0;

    // 4. ROI Exato
    const roiCalculado = cTotais > 0 
      ? ((Number(luc) / cTotais) * 100) 
      : 0;

    const roiFormatado = `${roiCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;

    const dROI = {
      valor: roiFormatado,
      cor: roiCalculado > 0 ? "text-emerald-400" : roiCalculado < 0 ? "text-rose-400" : "text-white",
    };

    return {
      validas: val,
      reembolsadas: reemb,
      totalReembolsado: totReemb,
      taxaReembolso: txReemb,
      faturamentoLiquido: fatLiq,
      descontos: desc,
      bruto: brt,
      custosProducaoPadrao: cProducaoTotal,
      custosProducaoTotal: cProducaoTotal,
      custoReposicaoTotal: cReposicaoTotal,
      custosTotais: cTotais,
      lucro: luc,
      taxaReposicao: txReposicao,
      taxaConversao: txConversao,
      dadosROI: dROI,
    };
  }, [vendas, itens, reposicoes, entregas, consulta.data, inicioIso, hojeIso]);

  const getCorTaxaReposicao = (taxa: number) => {
    if (taxa > 20) return "text-rose-400";
    if (taxa > 10) return "text-amber-400";
    return "text-sky-400";
  };

  const fmtValor = (v: number) => (ocultarValores ? "R$ ***" : formatarMoeda(v));
  const fmtNumero = (v: number) => (ocultarValores ? "***" : formatarNumero(v));

  const { porStatus, funil } = useMemo(() => {
    const pStatus = Object.entries(
      vendas.reduce<Record<string, number>>((acc, v) => {
        acc[v.status] = (acc[v.status] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([status, valor], i) => ({
      nome: ROTULO_STATUS[status] ?? status,
      valor,
      cor: CORES_GRAFICO[i % CORES_GRAFICO.length] as string,
    }));

    const contarStatus = (...lista: string[]) =>
      vendas.filter((v) => lista.includes(v.status)).length;
    const totalPedidos = vendas.length;
    const quantidades: Record<string, number> = {
      total: totalPedidos,
      confirmada: contarStatus(
        "confirmada",
        "em_producao",
        "pronta",
        "parcialmente_entregue",
        "entregue",
      ),
      producao: contarStatus("em_producao", "pronta", "parcialmente_entregue", "entregue"),
      pronta: contarStatus("pronta", "parcialmente_entregue", "entregue"),
      entregue: contarStatus("entregue"),
    };
    const fnl = ETAPAS_FUNIL.map((e) => ({
      etapa: e.rotulo,
      quantidade: quantidades[e.chave] ?? 0,
      percentual: totalPedidos > 0 ? ((quantidades[e.chave] ?? 0) / totalPedidos) * 100 : 0,
    }));

    return { porStatus: pStatus, funil: fnl };
  }, [vendas]);

  const dadosGraficoVendas = useMemo(() => {
    // 1. Inicializar estrutura dos 7 dias da semana
    const diasSemanaMap: Record<number, { 
      dia: string; 
      vendasValor: number; 
      vendasQtd: number; 
      reembolsosValor: number; 
      reembolsosQtd: number;
    }> = {
      0: { dia: 'Dom', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
      1: { dia: 'Seg', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
      2: { dia: 'Ter', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
      3: { dia: 'Qua', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
      4: { dia: 'Qui', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
      5: { dia: 'Sex', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
      6: { dia: 'Sáb', vendasValor: 0, vendasQtd: 0, reembolsosValor: 0, reembolsosQtd: 0 },
    };

    // 2. Agrupar Vendas e Reembolsos da tabela `vendas`
    vendas.forEach((venda) => {
      const dataVenda = new Date(venda.data_venda || venda.created_at);
      const diaIndex = dataVenda.getDay();
      const valor = Number(venda.valor_total || 0);
      const status = (venda.status || "").toLowerCase();

      if (diasSemanaMap[diaIndex]) {
        if (['reembolsada', 'reembolso', 'estornada', 'cancelada'].includes(status)) {
          diasSemanaMap[diaIndex].reembolsosValor += valor;
          diasSemanaMap[diaIndex].reembolsosQtd += 1;
        } else {
          diasSemanaMap[diaIndex].vendasValor += valor;
          diasSemanaMap[diaIndex].vendasQtd += 1;
        }
      }
    });

    // 3. Somar custos de reposições registradas na semana (perfis)
    reposicoes.forEach((rep: LinhaReposicao) => {
      const dataRep = new Date(rep.created_at);
      const diaIndex = dataRep.getDay();
      const custo = Number(rep.custo_reposicao || 0);

      if (diasSemanaMap[diaIndex]) {
        diasSemanaMap[diaIndex].reembolsosValor += custo;
        diasSemanaMap[diaIndex].reembolsosQtd += 1;
      }
    });

    // 4. Somar custos de reposições em entregas
    entregas.forEach((ent: LinhaEntrega) => {
      if (ent.status === 'reposicao') {
        const dataEnt = new Date(ent.created_at);
        const diaIndex = dataEnt.getDay();
        const custo = Number(ent.custo_reposicao || 0);

        if (diasSemanaMap[diaIndex]) {
          diasSemanaMap[diaIndex].reembolsosValor += custo;
          diasSemanaMap[diaIndex].reembolsosQtd += 1;
        }
      }
    });

    // 5. Formatar array final e calcular percentuais para o gráfico
    const ordem = [1, 2, 3, 4, 5, 6, 0]; // Seg -> Dom
    return ordem.map(idx => {
      const dia = diasSemanaMap[idx]!;
      const totalValor = dia.vendasValor + dia.reembolsosValor;
      const totalQtd = dia.vendasQtd + dia.reembolsosQtd;
      const taxaReembolso = totalValor > 0 ? (dia.reembolsosValor / totalValor) * 100 : 0;

      return {
        dia: dia.dia,
        positivo: totalQtd > 0 ? (dia.vendasQtd / totalQtd) * 100 : 0,
        negativo: totalQtd > 0 ? (dia.reembolsosQtd / totalQtd) * 100 : 0,
        vendasValor: formatarMoeda(dia.vendasValor),
        vendasQtd: dia.vendasQtd,
        reembolsosValor: formatarMoeda(dia.reembolsosValor),
        reembolsosQtd: dia.reembolsosQtd,
        taxaReembolso: `${taxaReembolso.toFixed(1)}%`,
      };
    });
  }, [vendas, reposicoes, entregas]);

  const barrasVendasAgrupadas = dadosGraficoVendas;

  const barrasAcertosAgrupadas = useMemo(() => {
    const dadosGraficoProducao = DIAS.map((dia, indice) => {
      const vendasDia = vendas.filter((v) => {
        const dataStr = v.data_venda || v.created_at;
        if (!dataStr) return false;
        try {
          return new Date(`${dataStr.slice(0, 10)}T12:00:00Z`).getUTCDay() === indice;
        } catch {
          return false;
        }
      });
      const convertidasDia = vendasDia.filter(
        (v) => !["rascunho", "cancelada", "reembolsada", "falta_pagamento"].includes(v.status)
      ).length;
      const falhasDia = vendasDia.filter(
        (v) => ["cancelada", "reembolsada", "estornada"].includes(v.status)
      ).length;
      const taxa = vendasDia.length > 0 ? (convertidasDia / vendasDia.length) * 100 : 0;
      const taxaErro = vendasDia.length > 0 ? (falhasDia / vendasDia.length) * 100 : 0;

      return {
        dia,
        positivo: taxa,
        negativo: taxaErro,
      };
    });
    return [...dadosGraficoProducao.slice(1), dadosGraficoProducao[0] || { dia: "Dom", positivo: 0, negativo: 0 }];
  }, [vendas]);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground/50 hover:text-primary transition-colors">
              <Menu className="size-4" />
            </Button>
          </SidebarTrigger>
          <h1 className="text-lg font-semibold tracking-tight text-foreground/90 sm:text-xl ml-1">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-3">
            {dias === "personalizado" && (
              <div className="flex items-center gap-2 mr-2">
                <Input type="date" value={dataInicioPersonalizada} onChange={e => setDataInicioPersonalizada(e.target.value)} className="h-9 text-xs w-32" />
                <span className="text-muted-foreground text-xs">até</span>
                <Input type="date" value={dataFimPersonalizada} onChange={e => setDataFimPersonalizada(e.target.value)} className="h-9 text-xs w-32" />
              </div>
            )}
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-2" aria-label="Mais filtros">
                  <Search className="size-3.5" aria-hidden="true" />
                  Mais Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold">Filtros Avançados</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatarData(inicioIso, fuso)} 00:00 — {formatarData(hojeIso, fuso)} 23:59
                  </p>
                </div>

                <label className="block space-y-1.5 text-xs text-muted-foreground">
                  Status do pedido
                  <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* MOBILE */}
          <div className="md:hidden">
            <Sheet open={sheetFiltrosAberto} onOpenChange={setSheetFiltrosAberto}>
              <SheetTrigger asChild>
                <Button variant="default" size="icon" className="h-9 w-9 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800" aria-label="Filtros">
                  <Search className="size-4" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl h-[85vh] sm:h-auto overflow-y-auto pb-8">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Filtros do Dashboard</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Período</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PERIODOS.map((p) => (
                        <Button 
                          key={p.valor} 
                          variant={dias === p.valor ? "default" : "outline"}
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setDias(p.valor)}
                        >
                          {p.rotulo}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {dias === "personalizado" && (
                    <div className="space-y-3 bg-muted/50 p-3 rounded-lg border border-border">
                      <Label className="text-xs font-semibold text-muted-foreground">Intervalo Personalizado</Label>
                      <div className="flex flex-col gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase">Data Inicial</Label>
                          <Input type="date" value={dataInicioPersonalizada} onChange={e => setDataInicioPersonalizada(e.target.value)} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase">Data Final</Label>
                          <Input type="date" value={dataFimPersonalizada} onChange={e => setDataFimPersonalizada(e.target.value)} className="h-9" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Status do Pedido</Label>
                    <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                          <SelectItem key={valor} value={valor}>
                            {rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-8">
                  <Button className="w-full h-11 text-sm font-semibold" onClick={() => setSheetFiltrosAberto(false)}>
                    Aplicar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>


      {consulta.isLoading ? (
        <CarregandoCartoes />
      ) : consulta.isError ? (
        <EstadoErro
          descricao={(consulta.error as Error).message}
          aoTentarNovamente={() => void consulta.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 bg-primary/5 border border-primary/20 p-4 rounded-xl">
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider flex items-center gap-2">
                Faturamento Bruto <Badge variant="secondary" className="text-[9px] py-0">Geral da Empresa</Badge>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{fmtValor(brutoGeral)}</p>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider flex items-center gap-2">
                Faturamento Líquido <Badge variant="secondary" className="text-[9px] py-0">Geral da Empresa</Badge>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-emerald-400">{fmtValor(faturamentoLiquidoGeral)}</p>
            </div>
          </div>

          <h2 className="text-sm font-semibold mb-3">Métricas do Período ({PERIODOS.find(p => p.valor === dias)?.rotulo || "Personalizado"})</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 mb-6">
            <CartaoMetrica
              rotulo="Lucro"
              valor={fmtValor(lucro)}
              positivo={lucro >= 0}
              destaque
            />
            <CartaoMetrica
              rotulo="ROI"
              valor={ocultarValores ? "***" : dadosROI.valor}
              corValor={ocultarValores ? "text-white" : dadosROI.cor}
              explicacao={ocultarValores ? "" : "ROI = (Lucro / Custos) * 100. Se custo for 0 e lucro > 0, considera-se 100% de margem."}
            />
            <CartaoMetrica
              rotulo="Custo de Produção"
              valor={fmtValor(custosProducaoTotal)}
              subvalor={custoReposicaoTotal > 0 ? `+ ${fmtValor(custoReposicaoTotal)} reposição` : undefined}
            />
            <CartaoMetrica
              rotulo="Taxa de Acertos"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaConversao)}%`}
              positivo={taxaConversao >= 0}
            />
            <CartaoMetrica
              rotulo="Taxa de Reembolso"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaReembolso)}%`}
              subvalor={fmtValor(totalReembolsado)}
              corValor="text-rose-400"
            />
            <CartaoMetrica
              rotulo="Taxa de Reposição"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaReposicao)}%`}
              subvalor={ocultarValores ? "" : (custoReposicaoTotal > 0 ? fmtValor(custoReposicaoTotal) : undefined)}
              corValor={ocultarValores ? "text-white" : getCorTaxaReposicao(taxaReposicao)}
              className="cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setModalReposicoesAberto(true)}
            />
          </div>


          <section className="rounded-xl border bg-card p-6 shadow-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Vendas e Reembolsos/Reposições por dia da semana</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comparativo diário entre vendas concluídas e taxas de reembolso/reposição de garantia.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFiltroDiaModal("todos"); setModalVendasAberto(true); }}
                className="hover:bg-white/10 text-muted-foreground hover:text-white rounded-lg p-1.5 text-xs transition-colors h-8"
              >
                <History className="size-3.5 mr-1.5" />
                <span className="hidden sm:inline">Ver Histórico</span>
              </Button>
            </div>
            {vendas.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada no período.
              </p>
            ) : (
              <GraficoBarrasAgrupadas 
                dados={barrasVendasAgrupadas} 
                cores={["#0066ff", "#EF4444"]}
                legendas={["Vendas Efetivadas", "Reembolsos/Reposição"]}
                onBarClick={(data) => {
                  setFiltroDiaModal(data.dia);
                  setModalVendasAberto(true);
                }}
              />
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Taxa de Acertos vs. Perfis Não Aprovados</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Desempenho de aprovação e taxa de erros/bloqueios de perfis por dia.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFiltroDiaModal("todos"); setModalProducaoAberto(true); }}
                className="hover:bg-white/10 text-muted-foreground hover:text-white rounded-lg p-1.5 text-xs transition-colors h-8"
              >
                <History className="size-3.5 mr-1.5" />
                <span className="hidden sm:inline">Ver Histórico</span>
              </Button>
            </div>
            {vendas.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada no período.
              </p>
            ) : (
              <GraficoBarrasAgrupadas 
                dados={barrasAcertosAgrupadas} 
                cores={["#22C55E", "#F59E0B"]}
                legendas={["Aprovados / Acertos", "Erros / Reprovados"]}
                onBarClick={(data) => {
                  setFiltroDiaModal(data.dia);
                  setModalProducaoAberto(true);
                }}
              />
            )}
          </section>

          {/* Modal Histórico de Vendas */}
          <Dialog open={modalVendasAberto} onOpenChange={setModalVendasAberto}>
            <DialogContent className="max-w-4xl bg-[#141417] border-[#27272A]/50 text-white max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Histórico de Vendas e Reembolsos</DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <Select value={filtroDiaModal} onValueChange={setFiltroDiaModal}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todo o Período</SelectItem>
                      {DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resumo no Modal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Vendas Concluídas</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-xl font-bold text-emerald-400">
                        {vendas.filter(v => 
                          (filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal) &&
                          !["rascunho", "cancelada", "reembolsada"].includes(v.status)
                        ).length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatarMoeda(vendas.filter(v => 
                          (filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal) &&
                          !["rascunho", "cancelada", "reembolsada"].includes(v.status)
                        ).reduce((acc, v) => acc + Number(v.valor_total || 0), 0))}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Total Reembolsos</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-xl font-bold text-rose-400">
                        {vendas.filter(v => 
                          (filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal) &&
                          ["reembolsada", "estornada", "cancelada"].includes(v.status)
                        ).length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatarMoeda(vendas.filter(v => 
                          (filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal) &&
                          ["reembolsada", "estornada", "cancelada"].includes(v.status)
                        ).reduce((acc, v) => acc + Number(v.valor_total || 0), 0))}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Taxa de Reembolso</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {(() => {
                        const vds = vendas.filter(v => filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal);
                        const rmb = vds.filter(v => ["reembolsada", "estornada", "cancelada"].includes(v.status)).length;
                        return vds.length > 0 ? `${((rmb / vds.length) * 100).toFixed(1)}%` : "0%";
                      })()}
                    </p>
                  </div>
                </div>

                <ScrollArea className="h-[400px] border rounded-md">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Nº Pedido</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendas
                        .filter(v => filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal)
                        .map(v => (
                          <TableRow key={v.id} className="hover:bg-white/5 border-white/5">
                            <TableCell className="text-xs">{formatarData(v.data_venda)}</TableCell>
                            <TableCell className="font-mono text-xs">#{v.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs">{formatarMoeda(Number(v.valor_total))}</TableCell>
                            <TableCell>
                              <Badge variant={["reembolsada", "cancelada"].includes(v.status) ? "destructive" : "default"} className="text-[10px] py-0">
                                {ROTULO_STATUS[v.status] || v.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Histórico de Produção (Simplificado com dados de vendas para exemplo) */}
          <Dialog open={modalProducaoAberto} onOpenChange={setModalProducaoAberto}>
            <DialogContent className="max-w-4xl bg-[#141417] border-[#27272A]/50 text-white max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Detalhamento de Produção e Acertos</DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <Select value={filtroDiaModal} onValueChange={setFiltroDiaModal}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todo o Período</SelectItem>
                      {DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Contas Aprovadas</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                      {vendas.filter(v => 
                        (filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal) &&
                        !["rascunho", "cancelada", "reembolsada"].includes(v.status)
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Bloqueios / Erros</p>
                    <p className="text-xl font-bold text-amber-500 mt-1">
                      {vendas.filter(v => 
                        (filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal) &&
                        ["rascunho", "cancelada", "reembolsada"].includes(v.status)
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Aproveitamento</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {(() => {
                        const vds = vendas.filter(v => filtroDiaModal === "todos" || DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal);
                        const ok = vds.filter(v => !["rascunho", "cancelada", "reembolsada"].includes(v.status)).length;
                        return vds.length > 0 ? `${((ok / vds.length) * 100).toFixed(1)}%` : "0%";
                      })()}
                    </p>
                  </div>
                </div>

                <ScrollArea className="h-[400px] border rounded-md">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>BMs Criadas</TableHead>
                        <TableHead>Aprovadas</TableHead>
                        <TableHead>Taxa de Sucesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DIAS.filter(d => filtroDiaModal === "todos" || d === filtroDiaModal).map(dia => {
                        const vdsDia = vendas.filter(v => DIAS[new Date(`${v.data_venda}T12:00:00Z`).getUTCDay()] === dia);
                        if (vdsDia.length === 0 && filtroDiaModal !== dia) return null;
                        const ok = vdsDia.filter(v => !["rascunho", "cancelada", "reembolsada"].includes(v.status)).length;
                        return (
                          <TableRow key={dia} className="hover:bg-white/5 border-white/5">
                            <TableCell className="text-xs font-medium">{dia}</TableCell>
                            <TableCell className="text-xs">{vdsDia.length}</TableCell>
                            <TableCell className="text-xs">{ok}</TableCell>
                            <TableCell className="text-xs">
                              {vdsDia.length > 0 ? `${((ok / vdsDia.length) * 100).toFixed(1)}%` : "0%"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Histórico de Reposições */}
          <Dialog open={modalReposicoesAberto} onOpenChange={setModalReposicoesAberto}>
            <DialogContent className="max-w-4xl bg-[#141417] border-[#27272A]/50 text-white max-h-[90vh] flex flex-col">
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle>Histórico de Reposições (Garantia)</DialogTitle>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-xs mr-8"
                  onClick={() => setModalNovaReposicaoAberto(true)}
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Nova Reposição
                </Button>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <Select value={filtroDiaModal} onValueChange={setFiltroDiaModal}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todo o Período</SelectItem>
                      {DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Total Reposições</p>
                    <p className="text-xl font-bold text-sky-400 mt-1">
                      {reposicoes.filter((r: LinhaReposicao) => 
                        (filtroDiaModal === "todos" || DIAS[new Date(`${r.created_at}`).getUTCDay()] === filtroDiaModal)
                      ).length + entregas.filter((e: LinhaEntrega) => 
                        e.status === 'reposicao' && (filtroDiaModal === "todos" || DIAS[new Date(`${e.created_at}`).getUTCDay()] === filtroDiaModal)
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Custo Garantia</p>
                    <p className="text-xl font-bold text-rose-400 mt-1">
                      {formatarMoeda(
                        reposicoes.filter((r: LinhaReposicao) => 
                          (filtroDiaModal === "todos" || DIAS[new Date(`${r.created_at}`).getUTCDay()] === filtroDiaModal)
                        ).reduce((acc: number, r: LinhaReposicao) => acc + (Number(r.custo_reposicao) || 0), 0) +
                        entregas.filter((e: LinhaEntrega) => 
                          e.status === 'reposicao' && (filtroDiaModal === "todos" || DIAS[new Date(`${e.created_at}`).getUTCDay()] === filtroDiaModal)
                        ).reduce((acc: number, e: LinhaEntrega) => acc + (Number(e.custo_reposicao) || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">Taxa no Período</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {(() => {
                        const vds = itens.filter((i: LinhaItem) => 
                          i.vendas && (filtroDiaModal === "todos" || DIAS[new Date(`${i.vendas.data_venda}T12:00:00Z`).getUTCDay()] === filtroDiaModal)
                        ).reduce((acc: number, i: LinhaItem) => acc + (Number(i.quantidade) || 0), 0);
                        const rpsPerfis = reposicoes.filter((r: LinhaReposicao) => 
                          filtroDiaModal === "todos" || DIAS[new Date(`${r.created_at}`).getUTCDay()] === filtroDiaModal
                        ).length;
                        const rpsEntregas = entregas.filter((e: LinhaEntrega) => 
                          e.status === 'reposicao' && (filtroDiaModal === "todos" || DIAS[new Date(`${e.created_at}`).getUTCDay()] === filtroDiaModal)
                        ).length;
                        return vds > 0 ? `${(((rpsPerfis + rpsEntregas) / vds) * 100).toFixed(1)}%` : "0%";
                      })()}
                    </p>
                  </div>
                </div>

                <ScrollArea className="h-[400px] border rounded-md">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente/Venda</TableHead>
                        <TableHead>Perfil/BM</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const listaReposicoes = reposicoes
                          .filter((r: LinhaReposicao) => filtroDiaModal === "todos" || DIAS[new Date(`${r.created_at}`).getUTCDay()] === filtroDiaModal)
                          .map((r: LinhaReposicao) => ({
                            id: r.id,
                            data: r.created_at,
                            info: r.cliente_nome || (r.venda_id ? `Venda #${r.venda_id.slice(0, 8)}` : "—"),
                            tipo: r.tipo_perfil || "—",
                            motivo: r.motivo_reposicao || "—",
                            custo: Number(r.custo_reposicao),
                            status: r.status,
                            origem: "Perfis"
                          }));
                        
                        const listaEntregas = entregas
                          .filter((e: LinhaEntrega) => e.status === 'reposicao' && (filtroDiaModal === "todos" || DIAS[new Date(`${e.created_at}`).getUTCDay()] === filtroDiaModal))
                          .map((e: LinhaEntrega) => ({
                            id: e.id,
                            data: e.created_at,
                            info: `Entrega #${e.id.slice(0, 8)}`,
                            tipo: "BM (Entrega)",
                            motivo: "Garantia Operacional",
                            custo: Number(e.custo_reposicao),
                            status: e.status,
                            origem: "Entregas"
                          }));

                        const combinada = [...listaReposicoes, ...listaEntregas].sort((a, b) => 
                          new Date(b.data).getTime() - new Date(a.data).getTime()
                        );

                        if (combinada.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Nenhuma reposição encontrada.
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return combinada.map((item) => (
                          <TableRow key={item.id} className="hover:bg-white/5 border-white/5">
                            <TableCell className="text-xs">{formatarData(item.data)}</TableCell>
                            <TableCell className="text-xs">{item.info}</TableCell>
                            <TableCell className="text-xs">{item.tipo}</TableCell>
                            <TableCell className="text-xs">{item.motivo}</TableCell>
                            <TableCell className="text-xs text-rose-400 font-medium">{formatarMoeda(item.custo)}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === "cancelada" ? "destructive" : "default"} className="text-[10px] py-0">
                                {item.status}
                              </Badge>
                              {item.origem === "Entregas" && (
                                <span className="ml-2 text-[8px] text-muted-foreground uppercase opacity-50">Entregas</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          <ModalAdicionarReposicao 
            aberto={modalNovaReposicaoAberto} 
            aoFechar={() => setModalNovaReposicaoAberto(false)} 
            vendasDisponiveis={vendas}
          />
        </>
      )}
    </div>
  );
}
