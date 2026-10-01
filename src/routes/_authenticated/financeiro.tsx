import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Cpu,
  FileText, 
  Filter, 
  Inbox, 
  Layers,
  MoreHorizontal, 
  Plus, 
  UserCheck,
  Users,
  Wallet,
  Wrench
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoCartoes, CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { CartaoIndicador } from "@/components/comum/cartao-indicador";
import { SeloStatus } from "@/components/comum/selo-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarMoeda, formatarNumero } from "@/lib/formatadores";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Gestão Financeira & Lançamentos | Gestão BMs" },
      { name: "description", content: "Visão consolidada de caixa, recebimentos e pagamentos." },
    ],
  }),
  component: PaginaFinanceiro,
});

type TipoLancamento = "receber" | "pagar";
type SituacaoLancamento = "aberto" | "pago" | "atrasado" | "cancelado" | "parcial";

interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  categoria: string | null;
  subcategoria: string | null;
  quantidade_unidades: number | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  situacao: SituacaoLancamento;
  observacoes: string | null;
}

function CartaoFinanceiro({
  rotulo,
  valor,
  detalhe,
  corValor,
  icone: Icone,
  corIcone,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  corValor: string;
  icone: any;
  corIcone: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#141417] p-5 shadow-lg shadow-black/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/10",
        destaque ? "border-2 border-blue-500/80 shadow-[0_0_15px_rgba(0,102,255,0.15)]" : "border border-[#27272A]/40"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-base font-bold text-white uppercase tracking-tight">
          {rotulo}
        </span>
        <div className="flex size-10 items-center justify-center rounded-full bg-black/40 shadow-inner">
          <Icone className={cn("size-5", corIcone)} />
        </div>
      </div>

      <div className="mt-4 flex flex-col">
        <span className={cn("num text-3xl font-bold tracking-tighter", corValor)}>
          {valor}
        </span>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF]">
          <Clock className="size-3 opacity-60" />
          {detalhe}
        </div>
      </div>
    </div>
  );
}

const CATEGORIAS_OPCOES = [
  { valor: "Produção de BM / Insumos", rotulo: "Produção de BM / Insumos" },
  { valor: "vendas", rotulo: "Vendas Diretas" },
  { valor: "trafego", rotulo: "Tráfego Pago" },
  { valor: "ferramentas", rotulo: "Ferramentas / SaaS" },
  { valor: "operacional", rotulo: "Operacional" },
  { valor: "comissoes", rotulo: "Comissões" },
  { valor: "outros", rotulo: "Outros" },
];

function formatarCategoriaLabel(cat?: string | null): string {
  if (!cat) return "Geral";
  const c = cat.trim().toLowerCase();
  if (c === "produção de bm / insumos" || c === "custo_producao_bm" || c === "produção bm" || c === "producao bm" || c === "insumos") return "Produção de BM / Insumos";
  if (c === "vendas" || c === "venda_bm") return "Vendas Diretas";
  if (c === "trafego") return "Tráfego Pago";
  if (c === "ferramentas") return "Ferramentas / SaaS";
  if (c === "operacional") return "Operacional";
  if (c === "comissoes" || c === "comissões" || c === "custos_funcionarios") return "Comissões";
  if (c === "fornecedor_bm_ciro" || c === "fornecedor bm") return "Fornecedor BM (Ciro)";
  if (c === "outros" || c === "outras_receitas" || c === "outras_despesas_operacionais") return "Outros";
  return cat;
}

function PaginaFinanceiro() {
  const { empresa, session, fuso, temPermissao, permissoes } = useSessao();
  const queryClient = useQueryClient();

  const ocultarValores = useMemo(() => {
    return permissoes.find(p => p.modulo === 'financeiro')?.ocultar_valores === true;
  }, [permissoes]);

  
  const [aberto, setAberto] = useState(false);
  const [modalFuncionariosAberto, setModalFuncionariosAberto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  
  const [valores, setValores] = useState({
    tipo: "receber" as TipoLancamento,
    descricao: "",
    categoria: "Produção de BM / Insumos",
    subcategoria: "",
    quantidade_unidades: "0",
    valor: "0",
    data_vencimento: new Date().toISOString().slice(0, 10),
    data_pagamento: "",
    forma_pagamento: "",
    situacao: "aberto" as SituacaoLancamento,
    observacoes: "",
  });

  const consulta = useQuery({
    queryKey: ["financeiro-unificado", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .select("*")
        .eq("empresa_id", empresa!.id)
        .order("data_vencimento", { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Lancamento[];
    },
  });
  
  const consultaVendas = useQuery({
    queryKey: ["vendas-comissoes", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const [vendasRes, reposicoesRes, entregasRes] = await Promise.all([
        supabase
          .from("vendas")
          .select(`
            id, 
            numero_venda, 
            valor_total, 
            desconto,
            status,
            criado_por,
            data_venda,
            equipe_membros:criado_por (nome, email, cargo),
            comissao_percentual,
            observacoes,
            responsavel:perfis!vendas_responsavel_producao_id_fkey (nome),
            venda_itens (
              quantidade,
              preco_unitario,
              modalidades_bm (
                custo_producao_padrao,
                nome
              )
            )
          `)
          .eq("empresa_id", empresa!.id),
        supabase
          .from("reposicoes_perfis")
          .select("id, custo_reposicao, status, created_at")
          .eq("empresa_id", empresa!.id),
        supabase
          .from("entregas")
          .select("id, custo_reposicao, status, created_at")
          .eq("empresa_id", empresa!.id)
      ]);

      if (vendasRes.error) throw vendasRes.error;
      return {
        vendas: vendasRes.data || [],
        reposicoes: (reposicoesRes.data || []) as any[],
        entregas: (entregasRes.data || []) as any[],
      };
    }
  });

  const comissoesPendentes = useMemo(() => {
    const pagas = new Set(
      (consulta.data || [])
        .filter(l => l.observacoes)
        .flatMap(l => {
          const match = l.observacoes?.match(/\[COMISSAO_VENDA:([^\]]+)\]/g);
          return match ? match.map(m => m.replace("[COMISSAO_VENDA:", "").replace("]", "")) : [];
        })
    );

    const vendas = (consultaVendas.data?.vendas || []) as any[];
    const lista: any[] = [];

    vendas.forEach(v => {
      if (pagas.has(v.id)) return;
      if (v.status !== "confirmada") return;
      
      const obs = v.observacoes || "";
      const isCiro = obs.includes("[FORNECEDOR_CIRO]");
      
      const nomeFuncionario = v.responsavel?.nome || (isCiro ? "FORNECEDOR CIRO" : v.equipe_membros?.nome);
      if (!nomeFuncionario) return;
      
      const valorVenda = Number(v.valor_total || 0);
      const perc = Number(v.comissao_percentual);
      
      // Só entra na lista de pendências se tiver um percentual maior que zero definido
      if (!perc || perc <= 0) return;
      
      const comissao = valorVenda * (perc / 100);

      lista.push({
        vendaId: v.id,
        numero: v.numero_venda,
        data: v.data_venda,
        nome: nomeFuncionario,
        faturamento: valorVenda,
        comissao,
        perc
      });
    });

    return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [consultaVendas.data, consulta.data]);

  const pagarComissao = useMutation({
    mutationFn: async (item: any) => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      
      const payload = {
        empresa_id: empresa.id,
        tipo: "pagar",
        descricao: `Comissão Venda #${item.numero} - ${item.nome}`,
        categoria: item.nome.toLowerCase().includes("ciro") ? "fornecedor_bm_ciro" : "custos_funcionarios",
        valor: item.comissao,
        data_vencimento: new Date().toISOString().slice(0, 10),
        data_pagamento: new Date().toISOString().slice(0, 10),
        situacao: "pago",
        observacoes: `[COMISSAO_VENDA:${item.vendaId}] Pago ao funcionário ${item.nome}.`,
        criado_por: session?.user.id ?? null,
      };

      const { error } = await supabase.from("lancamentos_financeiros").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comissão paga com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["financeiro-unificado"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard_metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["financial_overview"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas-comissoes"] });
      void queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalComissoesDevidas = useMemo(() => {
    const lista = consulta.data || [];
    const lancamentosFuncPendentes = lista.filter(i => {
      const cat = (i.categoria || "").trim().toLowerCase();
      const tipo = (i.tipo || "").trim().toLowerCase();
      const sit = (i.situacao || "").trim().toLowerCase();
      const obs = (i.observacoes || "").toLowerCase();
      const ehFunc = (cat === "custos_funcionarios" || cat === "comissoes" || cat === "comissões" || cat === "funcionarios" || cat === "funcionários") && !obs.includes("[fornecedor_ciro]");
      const ehPagar = tipo === "pagar" || tipo === "saida" || tipo === "despesa";
      const ehPendente = sit === "aberto" || sit === "parcial" || sit === "pendente";
      return ehFunc && ehPagar && ehPendente;
    }).reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

    const comissoesEquipe = comissoesPendentes
      .filter(f => !f.nome.toLowerCase().includes("ciro"))
      .reduce((acc, f) => acc + (Number(f.comissao) || 0), 0);

    return lancamentosFuncPendentes + comissoesEquipe;
  }, [consulta.data, comissoesPendentes]);

  const fornecedorBmTotal = useMemo(() => {
    const lista = consulta.data || [];
    const lancamentosCiroPendentes = lista.filter(i => {
      const cat = (i.categoria || "").trim().toLowerCase();
      const tipo = (i.tipo || "").trim().toLowerCase();
      const sit = (i.situacao || "").trim().toLowerCase();
      const obs = (i.observacoes || "").toLowerCase();
      const ehCiro = cat === "fornecedor_bm_ciro" || cat === "fornecedor bm" || obs.includes("[fornecedor_ciro]");
      const ehPagar = tipo === "pagar" || tipo === "saida" || tipo === "despesa";
      const ehPendente = sit === "aberto" || sit === "parcial" || sit === "pendente";
      return ehCiro && ehPagar && ehPendente;
    }).reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

    const vendas = (consultaVendas.data?.vendas || []) as any[];
    const comissoesCiroPendentes = vendas.reduce((acc, v) => {
      const nomeResponsavel = v.responsavel?.nome?.toLowerCase() || "";
      const obs = v.observacoes || "";
      if (nomeResponsavel.includes("ciro") || obs.includes("[FORNECEDOR_CIRO]")) {
        const jaLancado = lista.some(l => l.observacoes?.includes(`[COMISSAO_VENDA:${v.id}]`));
        if (jaLancado) return acc;
        const percentual = Number(v.comissao_percentual || 0);
        const valorTotal = Number(v.valor_total || 0);
        return acc + (valorTotal * (percentual / 100));
      }
      return acc;
    }, 0);

    return lancamentosCiroPendentes + comissoesCiroPendentes;
  }, [consulta.data, consultaVendas.data]);

  const qtdVendasComComissao = comissoesPendentes.length;

  const dados = useMemo(() => {
    let lista = consulta.data || [];
    if (filtroTipo !== "todos") {
      if (filtroTipo === "custo_producao_bm" || filtroTipo === "Produção de BM / Insumos") {
        lista = lista.filter(item => {
          const cat = (item.categoria || "").trim().toLowerCase();
          return cat === "custo_producao_bm" || cat === "produção de bm / insumos" || cat === "produção bm" || cat === "producao bm" || cat === "insumos";
        });
      } else {
        lista = lista.filter(item => item.tipo === filtroTipo);
      }
    }
    if (filtroStatus !== "todos") {
      lista = lista.filter(item => item.situacao === filtroStatus);
    }
    return lista;
  }, [consulta.data, filtroTipo, filtroStatus]);

  const resumo = useMemo(() => {
    const lista = consulta.data || [];
    const hoje = new Date().toISOString().slice(0, 10);
    
    const aReceber = lista.filter(i => i.tipo === "receber" && (i.situacao === "aberto" || i.situacao === "parcial" || (i.situacao as any) === "pendente" || (i.situacao as any) === "a_vencer"));
    const aPagar = lista.filter(i => i.tipo === "pagar" && (i.situacao === "aberto" || i.situacao === "parcial" || (i.situacao as any) === "pendente" || (i.situacao as any) === "a_vencer"));
    const atrasados = lista.filter(i => i.situacao === "atrasado" || (i.situacao === "aberto" && i.data_vencimento < hoje));
    
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

    const producaoBM = lista.filter(i => {
      const categoria = (i.categoria || "").trim().toLowerCase();
      const tipo = (i.tipo || "").trim().toLowerCase();
      const ehCategoriaBM = categoriasProducaoBM.includes(categoria);
      const ehSaida = tipo === 'pagar' || tipo === 'saida' || tipo === 'saída' || tipo === 'despesa';
      return ehCategoriaBM && ehSaida;
    });

    const totalReceber = aReceber.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const totalPagar = aPagar.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const totalAtrasado = atrasados.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    
    // 1. Faturamento de Vendas Válidas
    const vendas = (consultaVendas.data?.vendas || []) as any[];
    const validas = vendas.filter((v: any) => !["rascunho", "cancelada", "reembolsada", "falta_pagamento"].includes(v.status));
    const faturamentoTotal = validas.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);

    // 2. Custo de produção BM (total das despesas da categoria de produção/insumos)
    const totalCustoProducaoBM = producaoBM.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

    // 3. Demais despesas registradas
    const outrasDespesas = lista.filter(i => {
      const tipo = (i.tipo || "").trim().toLowerCase();
      const cat = (i.categoria || "").trim().toLowerCase();
      const ehSaida = tipo === 'pagar' || tipo === 'saida' || tipo === 'saída' || tipo === 'despesa';
      const ehProducao = categoriasProducaoBM.includes(cat);
      return ehSaida && !ehProducao;
    }).reduce((acc: number, i: any) => acc + (Number(i.valor) || 0), 0);

    // 4. Custos de reposição
    const custoReposicoesPerfis = (consultaVendas.data?.reposicoes || []).reduce((acc: number, r: any) => acc + (Number(r.custo_reposicao) || 0), 0);
    const custoReposicoesEntregas = (consultaVendas.data?.entregas || []).reduce((acc: number, e: any) => acc + (Number(e.custo_reposicao) || 0), 0);
    const totalCustoReposicao = custoReposicoesPerfis + custoReposicoesEntregas;

    // 5. Custos totais e Lucro Real
    const custosTotais = Number(totalCustoProducaoBM) + Number(outrasDespesas) + Number(totalCustoReposicao);
    const lucroReal = Number(faturamentoTotal) - custosTotais;
    const roiCalculado = custosTotais > 0 ? ((lucroReal / custosTotais) * 100) : 0;
    const roiFormatado = `${roiCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;

    const totalUnidadesBM = producaoBM.reduce((acc, i) => acc + (Number(i.quantidade_unidades) || 0), 0);
    const custoMedioBM = totalUnidadesBM > 0 ? totalCustoProducaoBM / totalUnidadesBM : 0;

    return {
      receber: { valor: totalReceber, qtd: aReceber.length },
      pagar: { valor: totalPagar, qtd: aPagar.length },
      liquido: lucroReal,
      faturamento: faturamentoTotal,
      custosTotais,
      despesasProducao: totalCustoProducaoBM,
      roi: roiCalculado,
      roiFormatado,
      atrasado: { valor: totalAtrasado, qtd: atrasados.length },
      producao: { 
        valor: totalCustoProducaoBM, 
        qtd: producaoBM.length,
        unidades: totalUnidadesBM,
        custoMedio: custoMedioBM
      }
    };
  }, [consulta.data, consultaVendas.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      if (!valores.descricao) throw new Error("A descrição é obrigatória.");
      
      const payload = {
        empresa_id: empresa.id,
        tipo: valores.tipo,
        descricao: valores.descricao,
        categoria: valores.categoria || null,
        subcategoria: valores.subcategoria || null,
        quantidade_unidades: Number(valores.quantidade_unidades) || 0,
        valor: Number(valores.valor.toString().replace(",", ".")) || 0,
        data_vencimento: valores.data_vencimento,
        data_pagamento: valores.data_pagamento || null,
        forma_pagamento: valores.forma_pagamento || null,
        situacao: valores.situacao,
        observacoes: valores.observacoes || null,
        criado_por: session?.user.id ?? null,
        atualizado_por: session?.user.id ?? null
      };

      const { error } = await supabase.from("lancamentos_financeiros").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento registrado com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["financeiro-unificado"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard_metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["financial_overview"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas-comissoes"] });
      void queryClient.invalidateQueries({ queryKey: ["painel"] });
      void queryClient.invalidateQueries({ queryKey: ["financial_metrics"] });
      setAberto(false);
      setValores({
        tipo: "receber",
        descricao: "",
        categoria: "venda_bm",
        subcategoria: "",
        quantidade_unidades: "0",
        valor: "0",
        data_vencimento: new Date().toISOString().slice(0, 10),
        data_pagamento: "",
        forma_pagamento: "",
        situacao: "aberto",
        observacoes: "",
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        modulo="financeiro"
        titulo="Gestão Financeira & Lançamentos"
        descricao=""

        acoes={
          temPermissao('financeiro', 'criar') && (
            <Button onClick={() => setAberto(true)}>
              <Plus className="mr-2 size-4" />
              Novo Lançamento
            </Button>
          )

        }
      />

      {consulta.isLoading ? (
        <CarregandoCartoes />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Linha 1 Mobile / Grid Desktop */}
          <CartaoFinanceiro
            rotulo="Total a Receber"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(resumo.receber.valor)}
            detalhe={`${resumo.receber.qtd} títulos pendentes`}
            corValor="text-emerald-400"
            icone={ArrowUpCircle}
            corIcone="text-emerald-400"
            destaque
          />
          <CartaoFinanceiro
            rotulo="Total a Pagar"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(resumo.pagar.valor)}
            detalhe={`${resumo.pagar.qtd} contas pendentes`}
            corValor="text-red-500"
            icone={ArrowDownCircle}
            corIcone="text-red-500"
          />
          
          <CartaoFinanceiro
            rotulo="FORNECEDOR BM (CIRO)"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(fornecedorBmTotal)}
            detalhe="Comissões a pagar p/ Fornecedor"
            corValor="text-purple-400 font-bold text-2xl"
            icone={Cpu}
            corIcone="text-purple-400"
          />

          <CartaoFinanceiro
            rotulo="CUSTO PRODUÇÃO BM"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(resumo.producao.valor)}
            detalhe={resumo.producao.unidades > 0 ? `Custo médio: ${formatarMoeda(resumo.producao.custoMedio)} / BM` : `${resumo.producao.qtd} lançamentos`}
            corValor="text-amber-400 font-bold text-2xl"
            icone={Layers}
            corIcone="text-amber-400"
          />

          <CartaoFinanceiro
            rotulo="LUCRO LÍQUIDO (ROI)"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(resumo.liquido)}
            detalhe={ocultarValores ? "" : `ROI: ${resumo.roiFormatado} | Custos: ${formatarMoeda(resumo.custosTotais)}`}
            corValor={resumo.liquido >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}
            icone={Wallet}
            corIcone="text-blue-500"
          />

          <CartaoFinanceiro
            rotulo="Contas em Atraso"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(resumo.atrasado.valor)}
            detalhe={`${resumo.atrasado.qtd} títulos vencidos`}
            corValor="text-rose-500"
            icone={Clock}
            corIcone="text-rose-500"
          />

          <div 
            onClick={() => setModalFuncionariosAberto(true)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#141417] p-5 shadow-lg shadow-black/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/10 border border-[#27272A]/40 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-base font-bold text-white uppercase tracking-tight">
                CUSTOS DE FUNCIONÁRIOS
              </span>
              <div className="flex size-10 items-center justify-center rounded-full bg-black/40 shadow-inner">
                <Users className="size-5 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="mt-4 flex flex-col">
              <span className="num text-3xl font-bold tracking-tighter text-purple-400">
                {ocultarValores ? "R$ ***" : formatarMoeda(totalComissoesDevidas)}
              </span>
              <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#9CA3AF]">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="size-3 opacity-60" />
                  {qtdVendasComComissao} comissões geradas
                </div>
                <span className="text-purple-400 underline decoration-purple-400/30 underline-offset-2 group-hover:decoration-purple-400">Ver detalhes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filtroTipo} onValueChange={setFiltroTipo} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="receber">Entradas</TabsTrigger>
            <TabsTrigger value="pagar">Saídas</TabsTrigger>
            <TabsTrigger value="Produção de BM / Insumos" className="bg-amber-500/10 text-amber-500 data-[state=active]:bg-amber-500 data-[state=active]:text-black">Produção BM</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 size-4 opacity-50" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="aberto">Pendente</SelectItem>
              <SelectItem value="pago">Pago / Recebido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {consulta.isLoading ? (
          <div className="p-4">
            <CarregandoTabela colunas={6} />
          </div>
        ) : consulta.isError ? (
          <EstadoErro descricao={(consulta.error as Error).message} aoTentarNovamente={() => void consulta.refetch()} />
        ) : dados.length === 0 ? (
          <EstadoVazio 
            icone={<Inbox className="size-8 opacity-20" />}
            titulo="Nenhum lançamento encontrado"
            descricao="Utilize o botão acima para registrar sua primeira movimentação financeira."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.tipo === "receber" ? (
                        <ArrowUpCircle className="size-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="size-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {formatarCategoriaLabel(item.categoria)}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      item.situacao === "atrasado" || (item.situacao === "aberto" && item.data_vencimento < new Date().toISOString().slice(0, 10))
                        ? "text-destructive font-semibold"
                        : "text-muted-foreground"
                    )}>
                      {formatarData(item.data_vencimento, fuso)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right num font-semibold",
                      item.tipo === "receber" ? "text-success" : "text-destructive"
                    )}>
                      {item.tipo === "receber" ? "+" : "-"} {ocultarValores ? "R$ ***" : formatarMoeda(item.valor)}
                    </TableCell>
                    <TableCell>
                      <SeloStatus 
                        rotulo={item.situacao === "aberto" ? "Pendente" : item.situacao === "pago" ? "Pago" : item.situacao}
                        tom={
                          item.situacao === "pago" ? "positivo" : 
                          item.situacao === "atrasado" ? "negativo" : 
                          item.situacao === "cancelado" ? "neutro" : "alerta"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent 
          className="max-h-[88dvh] overflow-y-auto w-[95vw] sm:max-w-xl p-5 sm:p-6 bg-[#141417] border-[#27272A]/80 text-white rounded-2xl shadow-2xl overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <DialogHeader className="text-left pb-1">
            <DialogTitle className="text-lg font-bold text-white">Novo Lançamento Financeiro</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">Registre uma nova entrada ou saída de caixa.</DialogDescription>
          </DialogHeader>

          <Tabs 
            value={valores.tipo} 
            onValueChange={(v) => setValores(a => ({ 
              ...a, 
              tipo: v as TipoLancamento,
              categoria: v === "pagar" ? "Produção de BM / Insumos" : "vendas",
              subcategoria: ""
            }))}
            className="w-full mt-2"
          >
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="receber">Receita / A Receber</TabsTrigger>
              <TabsTrigger value="pagar">Despesa / A Pagar</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2 mt-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao" className="text-xs font-medium text-zinc-300">Descrição / Título</Label>
              <Input 
                id="descricao" 
                placeholder={valores.tipo === "pagar" ? "Ex: Pagamento Proxy, Insumo BM, Comissão..." : "Ex: Venda BM Matriz, Consultoria..."} 
                value={valores.descricao}
                onChange={e => setValores(a => ({ ...a, descricao: e.target.value }))}
                className="bg-black/30 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor" className="text-xs font-medium text-zinc-300">Valor (R$)</Label>
              <Input 
                id="valor" 
                placeholder="0,00"
                value={valores.valor}
                onChange={e => setValores(a => ({ ...a, valor: e.target.value }))}
                className="bg-black/30 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vencimento" className="text-xs font-medium text-zinc-300">Data de Vencimento</Label>
              <Input 
                id="vencimento" 
                type="date"
                value={valores.data_vencimento}
                onChange={e => setValores(a => ({ ...a, data_vencimento: e.target.value }))}
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-xs font-medium text-zinc-300">Categoria</Label>
              <Select 
                value={valores.categoria} 
                onValueChange={v => {
                  const isProd = v === "Produção de BM / Insumos" || v === "custo_producao_bm";
                  setValores(a => ({ 
                    ...a, 
                    categoria: v, 
                    tipo: isProd ? "pagar" : a.tipo,
                    subcategoria: isProd ? a.subcategoria : ""
                  }));
                }}
              >
                <SelectTrigger id="categoria" className="bg-black/30 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  {CATEGORIAS_OPCOES.map((cat) => (
                    <SelectItem key={cat.valor} value={cat.valor}>
                      {cat.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(valores.categoria === "Produção de BM / Insumos" || valores.categoria === "custo_producao_bm") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subcategoria" className="text-xs font-medium text-zinc-300">Tipo de Insumo (Opcional)</Label>
                  <Select value={valores.subcategoria} onValueChange={v => setValores(a => ({ ...a, subcategoria: v }))}>
                    <SelectTrigger id="subcategoria" className="bg-black/30 border-white/10 text-white">
                      <SelectValue placeholder="Selecione o insumo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-white/10 text-white">
                      <SelectItem value="Perfis / Contas de Aquecimento">Perfis / Contas de Aquecimento</SelectItem>
                      <SelectItem value="Proxies / IPs Residenciais">Proxies / IPs Residenciais</SelectItem>
                      <SelectItem value="Chips / SMS Virtual">Chips / SMS Virtual</SelectItem>
                      <SelectItem value="Cartões / Taxas de Gateway">Cartões / Taxas de Gateway</SelectItem>
                      <SelectItem value="Navegador Multilogin / Ferramentas">Navegador Multilogin / Ferramentas</SelectItem>
                      <SelectItem value="Outros Insumos">Outros Insumos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade_unidades" className="text-xs font-medium text-zinc-300">Qtd. BMs Produzidas (Opcional)</Label>
                  <Input 
                    id="quantidade_unidades" 
                    type="number"
                    placeholder="0"
                    value={valores.quantidade_unidades}
                    onChange={e => setValores(a => ({ ...a, quantidade_unidades: e.target.value }))}
                    className="bg-black/30 border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="forma" className="text-xs font-medium text-zinc-300">Forma de Pagamento</Label>
              <Select value={valores.forma_pagamento} onValueChange={v => setValores(a => ({ ...a, forma_pagamento: v }))}>
                <SelectTrigger id="forma" className="bg-black/30 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situacao" className="text-xs font-medium text-zinc-300">Status Inicial</Label>
              <Select value={valores.situacao} onValueChange={v => setValores(a => ({ ...a, situacao: v as SituacaoLancamento }))}>
                <SelectTrigger id="situacao" className="bg-black/30 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="aberto">Pendente</SelectItem>
                  <SelectItem value="pago">Já Pago / Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="obs" className="text-xs font-medium text-zinc-300">Observações (Opcional)</Label>
              <Textarea 
                id="obs" 
                placeholder="Detalhes adicionais do lançamento..." 
                value={valores.observacoes}
                onChange={e => setValores(a => ({ ...a, observacoes: e.target.value }))}
                className="bg-black/30 border-white/10 text-white placeholder:text-zinc-500 resize-none min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pb-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setAberto(false)} 
              className="text-zinc-400 hover:text-white h-11 sm:h-9"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={() => salvar.mutate()} 
              disabled={salvar.isPending}
              className="h-11 sm:h-9 font-semibold"
            >
              {salvar.isPending ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalFuncionariosAberto} onOpenChange={setModalFuncionariosAberto}>
        <DialogContent className="sm:max-w-2xl bg-[#0A0A0A] border-[#27272A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Detalhamento de Comissões</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Cálculo de comissão sobre as vendas baseadas no percentual definido na hora da venda.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#27272A] bg-black/20 max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-[#27272A] hover:bg-transparent">
                  <TableHead className="text-zinc-300">Funcionário</TableHead>
                  <TableHead className="text-zinc-300 text-center">Data</TableHead>
                  <TableHead className="text-zinc-300 text-center">Venda</TableHead>
                  <TableHead className="text-zinc-300 text-right">Faturamento</TableHead>
                  <TableHead className="text-zinc-300 text-right">Comissão</TableHead>
                  <TableHead className="text-zinc-300 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoesPendentes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      Nenhuma comissão pendente encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  comissoesPendentes.map((f, i) => (
                    <TableRow key={f.vendaId} className="border-[#27272A] hover:bg-white/5">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{f.nome}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-zinc-300 num">{formatarData(f.data, fuso)}</TableCell>
                      <TableCell className="text-center text-zinc-300 num">#{f.numero}</TableCell>
                      <TableCell className="text-right text-zinc-300 num">{formatarMoeda(f.faturamento)}</TableCell>
                      <TableCell className="text-right text-purple-400 font-bold num">
                        {formatarMoeda(f.comissao)} <span className="text-[10px] text-zinc-500 font-normal">({f.perc}%)</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white"
                          disabled={pagarComissao.isPending}
                          onClick={() => pagarComissao.mutate(f)}
                        >
                          OK (Pagar)
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-purple-500/10 p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
                <Users className="size-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-purple-300 font-medium">TOTAL CONSOLIDADO</p>
                <p className="text-lg font-bold text-white">Total de Comissões Devidas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-purple-400 num">
                {ocultarValores ? "R$ ***" : formatarMoeda(totalComissoesDevidas)}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setModalFuncionariosAberto(false)} className="bg-transparent border-[#27272A] text-zinc-400 hover:bg-zinc-900 hover:text-white">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
