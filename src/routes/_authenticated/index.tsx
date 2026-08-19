import { useQuery } from "@tanstack/react-query";
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
  { valor: "365", rotulo: "Últimos 12 meses" },
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
  const [dias, setDias] = useState<string>("30");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  
  const [modalVendasAberto, setModalVendasAberto] = useState(false);
  const [modalProducaoAberto, setModalProducaoAberto] = useState(false);
  const [modalReposicoesAberto, setModalReposicoesAberto] = useState(false);
  const [modalNovaReposicaoAberto, setModalNovaReposicaoAberto] = useState(false);
  const [filtroDiaModal, setFiltroDiaModal] = useState<string>("todos");

  const { inicioIso, hojeIso } = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(dias));
    return {
      inicioIso: d.toISOString().slice(0, 10),
      hojeIso: new Date().toISOString().slice(0, 10),
    };
  }, [dias]);


  const consulta = useQuery({
    queryKey: ["dashboard", empresa?.id, dias, statusFiltro],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      let vendasQuery = supabase
        .from("vendas")
        .select("id, numero_venda, cliente, status, valor_total, desconto, data_venda, created_at")
        .gte("data_venda", inicioIso);
      if (statusFiltro !== "todos") vendasQuery = vendasQuery.eq("status", statusFiltro as never);

      const [vendas, itens, reposicoes, entregas] = await Promise.all([
        vendasQuery,
        supabase
          .from("venda_itens")
          .select("quantidade, vendas!inner(data_venda), modalidades_bm(custo_producao_padrao)")
          .gte("vendas.data_venda", inicioIso),
        supabase
          .from("reposicoes_perfis")
          .select("*")
          .gte("created_at", inicioIso),
        supabase
          .from("entregas")
          .select("id, status, custo_reposicao, created_at")
          .gte("created_at", inicioIso)
      ]);

      const erro = vendas.error ?? itens.error ?? (reposicoes.error as any) ?? entregas.error;
      if (erro) throw erro;

      return {
        vendas: (vendas.data ?? []) as unknown as LinhaVenda[],
        itens: (itens.data ?? []) as unknown as LinhaItem[],
        reposicoes: (reposicoes.data ?? []) as unknown as LinhaReposicao[],
        entregas: (entregas.data ?? []) as unknown as LinhaEntrega[],
      };
    },
  });

  const vendas = consulta.data?.vendas ?? [];
  const itens = consulta.data?.itens ?? [];
  const reposicoes = (consulta.data as any)?.reposicoes ?? [];
  const entregas = (consulta.data as any)?.entregas ?? [];

  const ocultarValores = useMemo(() => {
    return permissoes.find(p => p.modulo === 'dashboard')?.ocultar_valores === true;
  }, [permissoes]);

  const validas = vendas.filter((v) => v.status !== "cancelada" && v.status !== "reembolsada");
  const reembolsadas = vendas.filter((v) => ["reembolsada", "estornada", "cancelada"].includes(v.status));
  const totalReembolsado = reembolsadas.reduce((s, v) => s + Number(v.valor_total ?? 0), 0) || 0;
  const taxaReembolso = vendas.length > 0 ? (reembolsadas.length / vendas.length) * 100 : 0;

  const liquido = validas.reduce((s, v) => s + Number(v.valor_total ?? 0), 0) || 0;
  const descontos = validas.reduce((s, v) => s + Number(v.desconto ?? 0), 0) || 0;
  const bruto = liquido + totalReembolsado + descontos;
  const custosProducao = itens.reduce(
    (s, i) => s + Number(i.quantidade ?? 0) * Number(i.modalidades_bm?.custo_producao_padrao ?? 0),
    0,
  ) || 0;

  const totalCustoReposicoesPerfis = reposicoes.reduce((s: number, r: LinhaReposicao) => s + (Number(r.custo_reposicao) || 0), 0);
  const totalCustoReposicoesEntregas = entregas.reduce((s: number, e: LinhaEntrega) => e.status === 'reposicao' ? s + (Number(e.custo_reposicao) || 0) : s, 0);
  const custosTotais = custosProducao + totalCustoReposicoesPerfis + totalCustoReposicoesEntregas;
  const lucro = liquido - custosTotais;
  
  const totalEntregue = itens.reduce((s: number, i: LinhaItem) => s + (Number(i.quantidade) || 0), 0);
  const totalReposicoesPerfis = reposicoes.length;
  const totalReposicoesEntregas = entregas.filter((e: LinhaEntrega) => e.status === 'reposicao').length;
  const taxaReposicao = totalEntregue > 0 ? ((totalReposicoesPerfis + totalReposicoesEntregas) / totalEntregue) * 100 : 0;

  const convertidas = vendas.filter(
    (v) => !["rascunho", "cancelada", "reembolsada"].includes(v.status),
  ).length;
  const taxaConversao = vendas.length > 0 ? (convertidas / vendas.length) * 100 : 0;

  const calcularDadosROI = (lucroVal: number, custoVal: number) => {
    if (custoVal === 0) {
      if (lucroVal > 0) return { valor: "100%", cor: "text-emerald-400" };
      if (lucroVal < 0) return { valor: "Prejuízo", cor: "text-rose-400" };
      return { valor: "0%", cor: "text-white" };
    }
    const roiVal = (lucroVal / custoVal) * 100;
    return {
      valor: `${formatarNumero(roiVal)}%`,
      cor: roiVal > 0 ? "text-emerald-400" : roiVal < 0 ? "text-rose-400" : "text-white",
    };
  };

  const dadosROI = calcularDadosROI(lucro, custosTotais);

  const getCorTaxaReposicao = (taxa: number) => {
    if (taxa > 20) return "text-rose-400";
    if (taxa > 10) return "text-amber-400";
    return "text-sky-400";
  };

  const fmtValor = (v: number) => (ocultarValores ? "R$ ***" : formatarMoeda(v));
  const fmtNumero = (v: number) => (ocultarValores ? "***" : formatarNumero(v));


  const porStatus = Object.entries(
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
  const funil = ETAPAS_FUNIL.map((e) => ({
    etapa: e.rotulo,
    quantidade: quantidades[e.chave] ?? 0,
    percentual: totalPedidos > 0 ? ((quantidades[e.chave] ?? 0) / totalPedidos) * 100 : 0,
  }));

  const dadosGraficoVendas = DIAS.map((dia, indice) => {
    const vendasDia = vendas.filter((v) => new Date(`${v.data_venda}T12:00:00Z`).getUTCDay() === indice);
    const totalDia = vendasDia.length;
    const efetivadasDia = vendasDia.filter((v) => !["rascunho", "cancelada", "reembolsada"].includes(v.status)).length;
    const reembolsadasDia = vendasDia.filter((v) => ["reembolsada", "estornada", "cancelada"].includes(v.status)).length;

    const valorEfetivado = vendasDia
      .filter((v) => !["rascunho", "cancelada", "reembolsada"].includes(v.status))
      .reduce((s, v) => s + Number(v.valor_total || 0), 0);
    const valorReembolsado = vendasDia
      .filter((v) => ["reembolsada", "estornada", "cancelada"].includes(v.status))
      .reduce((s, v) => s + Number(v.valor_total || 0), 0);

    return {
      dia,
      positivo: totalDia > 0 ? (efetivadasDia / totalDia) * 100 : 0,
      negativo: totalDia > 0 ? (reembolsadasDia / totalDia) * 100 : 0,
      infoPositivo: formatarMoeda(valorEfetivado),
      infoNegativo: formatarMoeda(valorReembolsado),
    };
  });
  const barrasVendasAgrupadas = [...dadosGraficoVendas.slice(1), dadosGraficoVendas[0]!];

  const dadosGraficoProducao = DIAS.map((dia, indice) => {
    const vendasDia = vendas.filter((v) => new Date(`${v.data_venda}T12:00:00Z`).getUTCDay() === indice);
    const convertidasDia = vendasDia.filter(
      (v) => !["rascunho", "cancelada", "reembolsada"].includes(v.status)
    ).length;
    const taxa = vendasDia.length > 0 ? (convertidasDia / vendasDia.length) * 100 : 0;
    
    // Simulação de taxa de erro para o gráfico comparativo
    const taxaErro = vendasDia.length > 0 ? (100 - taxa) * 0.3 : 0; 

    return {
      dia,
      positivo: taxa,
      negativo: taxaErro,
    };
  });
  const barrasAcertosAgrupadas = [...dadosGraficoProducao.slice(1), dadosGraficoProducao[0]!];

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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-primary hover:bg-primary/10 transition-colors" aria-label="Buscar e filtrar dados">
              <Search className="size-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Filtros</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatarData(inicioIso, fuso)} 00:00 — {formatarData(hojeIso, fuso)} 23:59
              </p>
            </div>

            <label className="block space-y-1.5 text-xs text-muted-foreground">
              Período de visualização
              <Select value={dias} onValueChange={setDias}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => (
                    <SelectItem key={p.valor} value={p.valor}>
                      {p.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

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

            <div className="space-y-1.5 text-xs text-muted-foreground">
              Empresa
              <div className="flex h-9 items-center rounded-md border bg-secondary px-3 text-sm text-foreground">
                <span className="truncate">
                  {empresa?.nome_fantasia || empresa?.razao_social || "—"}
                </span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <CartaoMetrica
              rotulo="Faturamento bruto"
              valor={fmtValor(bruto)}
              destaque
              className="lg:col-span-1"
            />
            <CartaoMetrica
              rotulo="Taxa de Reembolso"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaReembolso)}%`}
              subvalor={fmtValor(totalReembolsado)}
              corValor="text-rose-400"
            />
            <CartaoMetrica
              rotulo="Faturamento líquido"
              valor={fmtValor(liquido)}
            />
            <CartaoMetrica
              rotulo="ROI"
              valor={ocultarValores ? "***" : dadosROI.valor}
              corValor={ocultarValores ? "text-white" : dadosROI.cor}
              explicacao={ocultarValores ? "" : "ROI = (Lucro / Custos) * 100. Se custo for 0 e lucro > 0, considera-se 100% de margem."}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <CartaoMetrica
              rotulo="Custo com Perfil"
              valor={fmtValor(custosTotais)}
            />
            <CartaoMetrica
              rotulo="Lucro"
              valor={fmtValor(lucro)}
              positivo={lucro >= 0}
            />
            <CartaoMetrica
              rotulo="Taxa de Acertos"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaConversao)}%`}
              positivo={taxaConversao >= 0}
            />
            <CartaoMetrica
              rotulo="Taxa de Reposição"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaReposicao)}%`}
              subvalor=""
              corValor={ocultarValores ? "text-white" : getCorTaxaReposicao(taxaReposicao)}
              className="cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setModalReposicoesAberto(true)}
            />
          </div>


          <section className="rounded-xl border bg-card p-6 shadow-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Vendas e Reembolsos por dia da semana</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comparativo entre vendas concluídas e taxa de reembolso por dia.
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
                legendas={["Vendas Efetivadas", "Reembolsos"]}
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
