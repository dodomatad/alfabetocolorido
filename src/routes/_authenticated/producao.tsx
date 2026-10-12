import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip as TooltipRecharts,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Factory,
  PackageCheck,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Info,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BmOperationalForm } from "@/components/comum/bm-operational-form";

import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";


import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/formatadores";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({
    meta: [
      { title: "Produção & Contingência | Gestão BMs" },
      {
        name: "description",
        content: "Desempenho da equipe e controle operacional de BMs.",
      },
      { property: "og:title", content: "Produção & Contingência | Gestão BMs" },
      {
        property: "og:description",
        content: "Desempenho da equipe e controle operacional de BMs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

type Registro = Database["public"]["Tables"]["producao_diaria"]["Row"];
type MotivoQueda = Database["public"]["Enums"]["motivo_queda"];


const MOTIVOS: Array<{ valor: MotivoQueda; rotulo: string }> = [
  { valor: "erro_cartao", rotulo: "Erro de Cartão" },
  { valor: "checkpoint_identidade", rotulo: "Checkpoint de Identidade" },
  { valor: "bloqueio_ip", rotulo: "Bloqueio de IP/Proxy" },
  { valor: "restricao_imediata", rotulo: "Restrição Imediata" },
  { valor: "outros", rotulo: "Outros" },
];

const PERIODOS = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "ontem", rotulo: "Ontem" },
  { valor: "7", rotulo: "Últimos 7 dias" },
  { valor: "30", rotulo: "Últimos 30 dias" },
  { valor: "tudo", rotulo: "Todo o período" },
];

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const AZUL = "#3B82F6";
const VERDE = "#10B981";

const tabela = () => supabase.from("producao_diaria");


const iso = (d: Date) => d.toISOString().slice(0, 10);

function limiteInferior(periodo: string): { de?: string; ate?: string } {
  const hoje = new Date();
  if (periodo === "hoje") return { de: iso(hoje), ate: iso(hoje) };
  if (periodo === "ontem") {
    const o = new Date(hoje);
    o.setDate(o.getDate() - 1);
    return { de: iso(o), ate: iso(o) };
  }
  if (periodo === "tudo") return {};
  const dias = Number(periodo);
  const de = new Date(hoje);
  de.setDate(de.getDate() - (dias - 1));
  return { de: iso(de), ate: iso(hoje) };
}

const rotuloMotivo = (m: string | null) =>
  MOTIVOS.find((x) => x.valor === m)?.rotulo ?? "—";

function Pagina() {
  const { empresa, session, fuso, temPermissao, permissoes } = useSessao();
  const queryClient = useQueryClient();
  const [operador, setOperador] = useState("todos");
  const [periodo, setPeriodo] = useState("7");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Registro | null>(null);

  const consulta = useQuery({
    queryKey: ["producao_diaria", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const query = tabela().select("*");
      
      const { data: usuario } = await supabase.auth.getUser();
      const p = permissoes.find(x => x.modulo === 'producao');
      
      if (usuario.user && p?.ocultar_valores) {
        // Se ocultar_valores for true na produção, interpretamos como "Ver apenas a própria produção"
        query.eq("criado_por", usuario.user.id);
      }

      const { data, error } = await query.order("data_registro", { ascending: false });
      if (error) throw error;
      return (data as unknown as Registro[]) ?? [];
    },
  });

  const equipe = useQuery({
    queryKey: ["perfis-producao", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase.from("perfis").select("id, nome").limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const consultaClientes = useQuery({
    queryKey: ["clientes-producao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) return [];
      return data || [];
    },
  });

  const registros = useMemo(() => {
    const { de, ate } = limiteInferior(periodo);
    return (consulta.data ?? []).filter((r) => {
      if (operador !== "todos" && r.operador !== operador) return false;
      if (de && r.data_registro < de) return false;
      if (ate && r.data_registro > ate) return false;
      return true;
    });
  }, [consulta.data, operador, periodo]);

  const soma = (chave: keyof Registro) =>
    registros.reduce((s, r) => s + (Number(r[chave]) || 0), 0);

  const ocultarValores = useMemo(() => {
    return permissoes.find(p => p.modulo === 'producao')?.ocultar_valores === true;
  }, [permissoes]);

  const criadas = soma("bms_criadas");
  const viradas = soma("contas_viradas");
  const bloqueios = soma("bloqueios");
  const recebidasFornecedor = soma("recebidas_fornecedor" as keyof Registro);
  const aproveitamento = criadas > 0 ? (viradas / criadas) * 100 : 0;
  const perda = criadas > 0 ? (bloqueios / criadas) * 100 : 0;

  const fmtNumero = (v: number | string) => (ocultarValores ? "***" : v);
  const fmtPercentual = (v: number) => (ocultarValores ? "***%" : `${v.toFixed(1)}%`);

  const porDia = useMemo(() => {
    const base = DIAS.map((dia) => ({ dia, criadas: 0, viradas: 0 }));
    for (const r of registros) {
      const d = new Date(`${r.data_registro}T12:00:00Z`);
      const i = d.getUTCDay();
      base[i]!.criadas += Number(r.bms_criadas) || 0;
      base[i]!.viradas += Number(r.contas_viradas) || 0;
    }
    return [...base.slice(1), base[0]!];
  }, [registros]);

  const { etapas, maiorQueda } = useMemo(() => {
    const et = [
      { etapa: "BMs Criadas", valor: criadas },
      { etapa: "Contas Viradas", valor: viradas },
    ].map((e, i, arr) => ({
      ...e,
      percentual: criadas > 0 ? (e.valor / criadas) * 100 : 0,
      queda: i === 0 ? 0 : (arr[i - 1]!.valor || 0) - e.valor,
    }));
    const mq = Math.max(0, ...et.map((e) => e.queda));
    return { etapas: et, maiorQueda: mq };
  }, [criadas, viradas]);

  const criarFormVazio = () => ({
    operador: "",
    data_registro: iso(new Date()),
    tipo_bm: "BM 250",
    bms_criadas: "",
    contas_viradas: "",
    bloqueios: "",
    motivo_queda: "",
    recebidas_fornecedor: "0",
    observacoes: "",
    nome_bm: "",
    limite_bm: "250",
    tem_template: "false",
    data_criacao: iso(new Date()),
    destinatario: "",
    status_envio: "disponivel",
    quantidade: "1",
  });
  const [form, setForm] = useState<Record<string, string>>(criarFormVazio);

  useEffect(() => {
    if (!aberto && !editando) {
      setForm(criarFormVazio());
    }
  }, [aberto, editando]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(criarFormVazio());
    setAberto(true);
  };

  const abrirEdicao = (r: Registro) => {
    setEditando(r);
    setForm({
      operador: r.operador,
      data_registro: r.data_registro,
      tipo_bm: (r as any).tipo_bm || "BM 250",
      bms_criadas: String(r.bms_criadas),
      contas_viradas: String(r.contas_viradas),
      bloqueios: String(r.bloqueios),
      recebidas_fornecedor: String((r as any).recebidas_fornecedor || 0),
      motivo_queda: r.motivo_queda ?? "",
      observacoes: r.observacoes ?? "",
      nome_bm: (r as any).nome_bm ?? "",
      limite_bm: (r as any).limite_bm ?? "250",
      tem_template: String((r as any).tem_template ?? false),
      data_criacao: (r as any).data_criacao ?? r.data_registro ?? iso(new Date()),
      destinatario: (r as any).destinatario ?? "",
      status_envio: (r as any).status_envio ?? "disponivel",
      quantidade: String((r as any).quantidade ?? 1),
    });
    setAberto(true);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      if (!form["operador"]?.trim()) throw new Error("Selecione a funcionária/operador.");
      const n = (c: string) => Number(form[c] || 0) || 0;

      const dados = {
        empresa_id: empresa.id,
        data_registro: form["data_registro"] || iso(new Date()),
        operador: form["operador"],
        tipo_bm: form["tipo_bm"] || "BM 250",
        bms_criadas: n("bms_criadas"),
        bms_aquecidas: 0,
        contas_subidas: 0,
        contas_viradas: n("contas_viradas"),
        bloqueios: n("bloqueios"),
        recebidas_fornecedor: n("recebidas_fornecedor"),
        motivo_queda: (form["motivo_queda"] || null) as MotivoQueda | null,
        meta_diaria: 10,
        observacoes: form["observacoes"] || null,
        atualizado_por: session?.user.id ?? null,
        nome_bm: form["nome_bm"] || null,
        limite_bm: form["limite_bm"] || null,
        tem_template: form["tem_template"] === "true",
        data_criacao: form["data_criacao"] || form["data_registro"] || iso(new Date()),
        destinatario: form["destinatario"] || null,
        status_envio: form["status_envio"] || "disponivel",
        quantidade: n("quantidade") || 1,
      };

      const isBM = (dados.tipo_bm || "").startsWith("BM");

      // Ativos líquidos prontos para disponibilidade imediata no Estoque
      const unidadesLiquidas = dados.contas_viradas > 0
        ? dados.contas_viradas
        : Math.max(0, dados.bms_criadas - dados.bloqueios);
      const totalLiquidoEstoque = unidadesLiquidas + (dados.recebidas_fornecedor || 0);

      if (editando) {
        const { error } = await tabela().update(dados as any).eq("id", editando.id);
        if (error) throw error;
        
        // Atualiza estoque com a diferença líquida (delta)
        const prevViradas = Number(editando.contas_viradas || 0);
        const prevCriadas = Number(editando.bms_criadas || 0);
        const prevBloqueios = Number(editando.bloqueios || 0);
        const prevRecebidas = Number((editando as any).recebidas_fornecedor || 0);
        const prevLiquido = (prevViradas > 0 ? prevViradas : Math.max(0, prevCriadas - prevBloqueios)) + prevRecebidas;
        const diffTotal = totalLiquidoEstoque - prevLiquido;
        
        if (diffTotal !== 0) {
          const { data: estoqueAtual } = await supabase
            .from("estoque")
            .select("id, quantidade_disponivel")
            .eq("tipo_ativo", dados.tipo_bm)
            .is("nome_bm", null)
            .maybeSingle();

          if (estoqueAtual) {
            await supabase
              .from("estoque")
              .update({
                quantidade_disponivel: Math.max(0, Number(estoqueAtual.quantidade_disponivel) + diffTotal),
                status: Number(estoqueAtual.quantidade_disponivel) + diffTotal > 0 ? "em_estoque" : "esgotado",
                updated_at: new Date().toISOString(),
              })
              .eq("id", estoqueAtual.id);
          } else if (diffTotal > 0) {
            await supabase.from("estoque").insert({
              empresa_id: empresa.id,
              tipo_ativo: dados.tipo_bm,
              limite_bm: dados.limite_bm || dados.tipo_bm.replace("BM ", ""),
              quantidade_disponivel: diffTotal,
              quantidade_reservada: 0,
              status: "em_estoque",
            } as any);
          }
        }
      } else {
        const { data: novoReg, error } = await tabela().insert({
          ...dados,
          criado_por: session?.user.id ?? null,
        } as any).select("id").maybeSingle();
        if (error) throw error;
        
        const producaoId = novoReg?.id || null;

        // Cadastra individualmente no Estoque se for BM com nome específico
        if (isBM && dados.nome_bm) {
          const nomeClean = dados.nome_bm.trim();
          const limite = dados.limite_bm || dados.tipo_bm.replace("BM ", "");
          const tipoAtivoFinal = nomeClean.toLowerCase().includes(limite.toLowerCase())
            ? nomeClean
            : `${nomeClean} [${limite}]`;

          const payloadEstoque: any = {
            empresa_id: empresa.id,
            tipo_ativo: tipoAtivoFinal,
            nome_bm: nomeClean,
            limite_bm: limite,
            tem_template: dados.tem_template,
            data_criacao: dados.data_criacao,
            responsavel: dados.operador,
            destinatario: dados.destinatario,
            status_envio: dados.status_envio,
            quantidade_disponivel: (dados.status_envio === "disponivel" || dados.status_envio === "pronta_envio") ? (dados.quantidade || 1) : 0,
            quantidade_reservada: dados.status_envio === "reservada" ? (dados.quantidade || 1) : 0,
            status: dados.status_envio === "enviada" ? "esgotado" : "em_estoque",
            custo_medio_unitario: 0,
            origem: "producao",
            producao_id: producaoId,
          };

          let { error: errEst } = await supabase.from("estoque").insert(payloadEstoque);
          if (errEst && (errEst.message?.includes("origem") || errEst.message?.includes("producao_id") || errEst.message?.includes("nome_bm") || (errEst as any).code === "PGRST204")) {
            const { origem, producao_id, contingencia_id, ...payloadFallback } = payloadEstoque;
            await supabase.from("estoque").insert(payloadFallback as any);
          }
        }

        // Atualiza ou insere saldo agregado de estoque para reflexo imediato no dashboard
        const qtdParaPool = (isBM && dados.nome_bm)
          ? Math.max(0, totalLiquidoEstoque - (dados.quantidade || 1))
          : totalLiquidoEstoque;

        if (qtdParaPool > 0) {
          const { data: estoqueAtual } = await supabase
            .from("estoque")
            .select("id, quantidade_disponivel")
            .eq("tipo_ativo", dados.tipo_bm)
            .is("nome_bm", null)
            .maybeSingle();

          if (estoqueAtual) {
            await supabase
              .from("estoque")
              .update({
                quantidade_disponivel: Number(estoqueAtual.quantidade_disponivel) + qtdParaPool,
                status: "em_estoque",
                updated_at: new Date().toISOString(),
              })
              .eq("id", estoqueAtual.id);
          } else {
            await supabase.from("estoque").insert({
              empresa_id: empresa.id,
              tipo_ativo: dados.tipo_bm,
              limite_bm: dados.limite_bm || dados.tipo_bm.replace("BM ", ""),
              quantidade_disponivel: qtdParaPool,
              quantidade_reservada: 0,
              status: "em_estoque",
              origem: "producao",
              producao_id: producaoId,
            } as any);
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(editando ? "Registro atualizado." : "Produção registrada.");
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["contingencia"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
      setAberto(false);
      setEditando(null);
      setForm(criarFormVazio());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tabela().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído.");
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <CabecalhoPagina
          modulo="producao"
          titulo="Produção & Contingência"
          descricao="Desempenho da equipe e controle operacional de BMs"

          acoes={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={operador} onValueChange={setOperador}>
                <SelectTrigger className="w-48" aria-label="Funcionária/Operador">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os operadores</SelectItem>
                  <SelectItem value="Fornecedor CIRO">🔧 Fornecedor CIRO</SelectItem>
                  {(equipe.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.nome}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-44" aria-label="Período">
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
              {temPermissao('producao', 'criar') && (
                <Button onClick={abrirNovo}>
                  <Plus className="size-4" aria-hidden="true" />
                  Registrar Produção Diária
                </Button>
              )}

            </div>
          }
        />

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <CartaoKpi
            rotulo="Fornecedor (Recebidas)"
            valor={fmtNumero(recebidasFornecedor)}
            icone={Factory}
            corIcone="text-purple-500"
            detalhe={ocultarValores ? "" : "Enviadas pelo fornecedor"}
          />
          <CartaoKpi
            rotulo="BMs Criadas"
            valor={fmtNumero(criadas)}
            icone={Factory}
            detalhe={ocultarValores ? "" : "Criação da equipe"}
            destaque
          />
          <CartaoKpi
            rotulo="Contas Viradas"
            valor={fmtNumero(viradas)}
            icone={Target}
            corValor="text-emerald-400"
          />
          <CartaoKpi
            rotulo="Prontas p/ Estoque"
            valor={fmtNumero(Math.max(0, viradas > 0 ? viradas : criadas - bloqueios) + recebidasFornecedor)}
            icone={PackageCheck}
            corIcone="text-cyan-400"
            corValor="text-cyan-400"
            detalhe={ocultarValores ? "" : "Disponível para venda/entrega"}
          />
          <CartaoKpi
            rotulo="Bloqueios"
            valor={fmtNumero(bloqueios)}
            icone={AlertTriangle}
            corValor="text-red-500"
            detalhe={ocultarValores ? "" : `${perda.toFixed(1)}% de perda`}
          />
          <CartaoKpi
            rotulo="Aproveitamento"
            valor={fmtPercentual(aproveitamento)}
            icone={aproveitamento >= 50 ? TrendingUp : TrendingDown}
            corValor={
              ocultarValores ? "text-white" :
              aproveitamento >= 50
                ? "text-emerald-400"
                : aproveitamento < 30
                ? "text-red-500"
                : "text-amber-500"
            }
            detalhe={ocultarValores ? "" : "Viradas / Criadas"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 shadow-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Produção Diária vs. Viradas</h2>
                <p className="text-xs text-muted-foreground">Volume de criação e ativação por dia</p>
              </div>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AZUL} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={AZUL} stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorViradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={VERDE} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={VERDE} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242429" vertical={false} />
                  <XAxis 
                    dataKey="dia" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#AAAAAA", fontSize: 12 }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#AAAAAA", fontSize: 12 }} 
                    allowDecimals={false} 
                  />
                  <TooltipRecharts
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#141417",
                      border: "1px solid #242429",
                      borderRadius: 12,
                      color: "#fff",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    wrapperStyle={{ fontSize: 12, paddingBottom: 20 }} 
                  />
                  <Bar 
                    dataKey="criadas" 
                    name="BMs Criadas" 
                    fill="url(#colorCriadas)" 
                    radius={[4, 4, 0, 0]} 
                    isAnimationActive={false} 
                    minPointSize={2} 
                  />
                  <Bar 
                    dataKey="viradas" 
                    name="Contas Viradas" 
                    fill="url(#colorViradas)" 
                    radius={[4, 4, 0, 0]} 
                    isAnimationActive={false} 
                    minPointSize={2} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Funil da Esteira de Contingência</h2>
                <p className="text-xs text-muted-foreground">Taxa de sobrevivência entre etapas</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={etapas} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFunil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AZUL} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={AZUL} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <TooltipRecharts
                    contentStyle={{
                      background: "#141417",
                      border: "1px solid #242429",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(v: number, name: string) => [
                      name === "percentual" ? `${v.toFixed(1)}%` : v,
                      name === "percentual" ? "Aproveitamento" : "Volume"
                    ]}
                  />
                  <XAxis 
                    dataKey="etapa" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#AAAAAA", fontSize: 11 }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="percentual"
                    stroke={AZUL}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFunil)"
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="valor"
                      position="top"
                      offset={15}
                      style={{ fill: "#ffffff", fontSize: 12, fontWeight: "bold" }}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {etapas.slice(1).map((e) => (
                <div key={e.etapa} className="rounded-lg bg-muted/30 p-3 border border-border/50">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <span>Queda {e.etapa}</span>
                    {e.queda === maiorQueda && <Badge className="h-4 px-1 text-[9px] bg-destructive/20 text-destructive border-none">Gargalo</Badge>}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-200">{e.queda}</span>
                    <span className="text-xs text-muted-foreground">contas perdidas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          {consulta.isLoading ? (
            <div className="p-4">
              <CarregandoTabela colunas={6} />
            </div>
          ) : consulta.isError ? (
            <div className="p-4">
              <EstadoErro
                descricao={(consulta.error as Error).message}
                aoTentarNovamente={() => void consulta.refetch()}
              />
            </div>
          ) : registros.length === 0 ? (
            <div className="p-4">
              <EstadoVazio
                titulo="Nenhum registro de produção"
                descricao="Lance a produção diária da equipe para acompanhar a esteira de contingência."
                className="border-0"
                acao={<Button onClick={abrirNovo}>Registrar Produção Diária</Button>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionária / Operador</TableHead>
                    <TableHead className="text-right">Criadas</TableHead>
                    <TableHead className="text-right">Viradas</TableHead>
                    <TableHead>Quedas / Motivo</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((r) => {
                    const taxa = r.bms_criadas > 0 ? (r.contas_viradas / r.bms_criadas) * 100 : 0;
                    const sucesso = r.contas_viradas > 0;
                    
                    return (
                      <TableRow key={r.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="num font-medium text-white">{formatarData(r.data_registro, fuso)}</TableCell>
                        <TableCell className="font-semibold text-white/90">{r.operador}</TableCell>
                        <TableCell className="num text-right font-bold text-white">{r.bms_criadas}</TableCell>
                        <TableCell className="num text-right">
                          <Badge 
                            className={cn(
                              "border-none font-bold px-3 py-1 rounded-md",
                              sucesso ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "bg-emerald-500/10 text-emerald-400"
                            )}
                          >
                            {r.contas_viradas}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.bloqueios > 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-red-500/10 text-red-500 border-none cursor-default font-bold rounded-md px-2">
                                  {r.bloqueios} · {rotuloMotivo(r.motivo_queda)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                {r.observacoes || `Motivo principal: ${rotuloMotivo(r.motivo_queda)}`}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs italic">Nenhuma perda</span>
                          )}
                        </TableCell>
                        <TableCell className="num text-right">
                          <span className={cn(
                            "text-sm font-black",
                            taxa >= 50 ? "text-emerald-500" : taxa < 30 ? "text-red-500" : "text-amber-500"
                          )}>
                            {taxa.toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "border-none font-bold rounded-md px-2",
                            sucesso ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/50 text-muted-foreground"
                          )}>
                            {sucesso ? "Viradas" : "Em Produção"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar registro"
                              onClick={() => abrirEdicao(r)}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Excluir registro"
                              onClick={() => excluir.mutate(r.id)}
                            >
                              <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editando ? "Editar produção diária" : "Registrar Produção Diária"}
              </DialogTitle>
              <DialogDescription>
                Lance os números da esteira de contingência do dia.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="operador">Funcionária / Operador</Label>
                <Select
                  value={form['operador'] ?? ""}
                  onValueChange={(v) => setForm((a) => ({ ...a, operador: v }))}
                >
                  <SelectTrigger id="operador">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fornecedor CIRO">🔧 Fornecedor CIRO</SelectItem>
                    {(equipe.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.nome}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Campo id="data_registro" rotulo="Data do registro" tipo="date" form={form} setForm={setForm} />
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tipo_bm">Tipo de Ativo (BM / Perfil)</Label>
                <Select
                  value={form['tipo_bm'] ?? "BM 250"}
                  onValueChange={(v) => {
                    const lim = v.startsWith("BM ") ? v.replace("BM ", "") : "250";
                    setForm((a) => ({ ...a, tipo_bm: v, limite_bm: lim }));
                  }}
                >
                  <SelectTrigger id="tipo_bm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BM 250">BM 250</SelectItem>
                    <SelectItem value="BM 2K">BM 2K</SelectItem>
                    <SelectItem value="BM 10K">BM 10K</SelectItem>
                    <SelectItem value="BM 100K">BM 100K</SelectItem>
                    <SelectItem value="BM Ilimitada">BM Ilimitada</SelectItem>
                    <SelectItem value="Perfil Farmado">Perfil Farmado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(form['tipo_bm'] ?? "").startsWith("BM") && (
                <div className="sm:col-span-2">
                  <BmOperationalForm
                    data={{
                      nomeBm: form["nome_bm"] || "",
                      limiteBm: form["limite_bm"] || (form["tipo_bm"]?.replace("BM ", "") || "250"),
                      temTemplate: form["tem_template"] === "true",
                      dataCriacao: form["data_criacao"] || form["data_registro"] || iso(new Date()),
                      responsavel: form["operador"] || "",
                      destinatario: form["destinatario"] || "",
                      statusEnvio: form["status_envio"] || "disponivel",
                      quantidade: form["quantidade"] || "1",
                    }}
                    onChange={(campo, val) => {
                      if (campo === "nomeBm") setForm((a) => ({ ...a, nome_bm: val as string }));
                      else if (campo === "limiteBm") {
                        setForm((a) => ({
                          ...a,
                          limite_bm: val as string,
                          tipo_bm: `BM ${val}`,
                        }));
                      }
                      else if (campo === "temTemplate") setForm((a) => ({ ...a, tem_template: String(val) }));
                      else if (campo === "dataCriacao") setForm((a) => ({ ...a, data_criacao: val as string }));
                      else if (campo === "responsavel") setForm((a) => ({ ...a, operador: val as string }));
                      else if (campo === "destinatario") setForm((a) => ({ ...a, destinatario: val as string }));
                      else if (campo === "statusEnvio") setForm((a) => ({ ...a, status_envio: val as string }));
                      else if (campo === "quantidade") setForm((a) => ({ ...a, quantidade: String(val) }));
                    }}
                    equipeOptions={equipe.data || []}
                    clientesOptions={consultaClientes.data || []}
                    mostrarQuantidade={true}
                    mostrarCusto={false}
                    datalistSuffix="producao"
                  />
                </div>
              )}

              <Campo id="recebidas_fornecedor" rotulo="Recebidas do Fornecedor" form={form} setForm={setForm} />
              <Campo id="bms_criadas" rotulo="BMs criadas" form={form} setForm={setForm} />
              <Campo id="contas_viradas" rotulo="Contas viradas" form={form} setForm={setForm} />
              <Campo id="bloqueios" rotulo="Bloqueios" form={form} setForm={setForm} />
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="motivo_queda">Motivo principal das quedas</Label>
                <Select
                  value={form['motivo_queda'] ?? ""}
                  onValueChange={(v) => setForm((a) => ({ ...a, motivo_queda: v }))}
                >
                  <SelectTrigger id="motivo_queda">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((m) => (
                      <SelectItem key={m.valor} value={m.valor}>
                        {m.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="observacoes">Observações / anotações rápidas</Label>
                <Textarea
                  id="observacoes"
                  rows={3}
                  value={form['observacoes'] ?? ""}
                  onChange={(e) => setForm((a) => ({ ...a, observacoes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAberto(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                {salvar.isPending ? "Salvando..." : "Salvar produção"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function Campo({
  id,
  rotulo,
  tipo = "number",
  form,
  setForm,
}: {
  id: string;
  rotulo: string;
  tipo?: string;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        type={tipo}
        inputMode={tipo === "number" ? "numeric" : undefined}
        value={form[id] ?? ""}
        onChange={(e) => setForm((a) => ({ ...a, [id]: e.target.value }))}
      />
    </div>
  );
}

function CartaoKpi({
  rotulo,
  valor,
  icone: Icone,
  corIcone = "text-muted-foreground/60",
  corValor = "text-foreground",
  detalhe,
  destaque = false,
  explicacao,
}: {
  rotulo: string;
  valor: string | number;
  icone: any;
  corIcone?: string;
  corValor?: string;
  detalhe?: string;
  destaque?: boolean;
  explicacao?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-[#141417] p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/40 border-[#27272A]/40",
        destaque ? "border-blue-500/80 shadow-[0_0_15px_rgba(0,102,255,0.15)]" : "hover:border-primary/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-white mb-3">
            {rotulo}
          </p>
          <p className={cn("font-bold text-2xl tracking-tight", corValor)}>
            {valor}
          </p>
        </div>
        <div className={cn("rounded-full bg-secondary/30 p-2.5 transition-colors group-hover:bg-secondary/50", corIcone)}>
          <Icone className="size-5" />
        </div>
        
        {explicacao && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute top-2 right-2 text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs">{explicacao}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {detalhe && (
        <p className="mt-4 text-xs text-[#9CA3AF] font-medium flex items-center gap-1.5">
          <Info className="size-3 opacity-50" />
          {detalhe}
        </p>
      )}
    </div>
  );
}


function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
