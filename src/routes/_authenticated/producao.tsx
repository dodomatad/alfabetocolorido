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
  Flame,
  Pencil,
  Plus,
  Rocket,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Info,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
    queryFn: async () => {
      const { data, error } = await tabela()
        .select("*")
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return (data as unknown as Registro[]) ?? [];
    },
  });

  const equipe = useQuery({
    queryKey: ["perfis-producao", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("perfis").select("id, nome").limit(200);
      if (error) throw error;
      return data ?? [];
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
    return permissoes.find(p => p.modulo === 'producao')?.ocultar_valores ?? false;
  }, [permissoes]);

  const criadas = soma("bms_criadas");
  const aquecidas = soma("bms_aquecidas");
  const subidas = soma("contas_subidas");
  const viradas = soma("contas_viradas");
  const bloqueios = soma("bloqueios");
  const aproveitamento = criadas > 0 ? (viradas / criadas) * 100 : 0;
  const perda = criadas > 0 ? (bloqueios / criadas) * 100 : 0;
  const metaDia = registros[0]?.meta_diaria ?? 10;

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

  const etapas = [
    { etapa: "Criadas", valor: criadas },
    { etapa: "Aquecidas", valor: aquecidas },
    { etapa: "Subidas", valor: subidas },
    { etapa: "Viradas / Ativas", valor: viradas },
  ].map((e, i, arr) => ({
    ...e,
    percentual: criadas > 0 ? (e.valor / criadas) * 100 : 0,
    queda: i === 0 ? 0 : (arr[i - 1]!.valor || 0) - e.valor,
  }));
  const maiorQueda = Math.max(...etapas.map((e) => e.queda));

  const vazio = {
    operador: "",
    data_registro: iso(new Date()),
    bms_criadas: "",
    bms_aquecidas: "",
    contas_subidas: "",
    contas_viradas: "",
    bloqueios: "",
    motivo_queda: "",
    meta_diaria: "10",
    observacoes: "",
  };
  const [form, setForm] = useState<Record<string, string>>(vazio);

  useEffect(() => {
    if (!aberto && !editando) {
      setForm(vazio);
    }
  }, [aberto, editando]);


  const abrirNovo = () => {
    setEditando(null);
    setForm(vazio);
    setAberto(true);
  };

  const abrirEdicao = (r: Registro) => {
    setEditando(r);
    setForm({
      operador: r.operador,
      data_registro: r.data_registro,
      bms_criadas: String(r.bms_criadas),
      bms_aquecidas: String(r.bms_aquecidas),
      contas_subidas: String(r.contas_subidas),
      contas_viradas: String(r.contas_viradas),
      bloqueios: String(r.bloqueios),
      motivo_queda: r.motivo_queda ?? "",
      meta_diaria: String(r.meta_diaria),
      observacoes: r.observacoes ?? "",
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
        bms_criadas: n("bms_criadas"),
        bms_aquecidas: n("bms_aquecidas"),
        contas_subidas: n("contas_subidas"),
        contas_viradas: n("contas_viradas"),
        bloqueios: n("bloqueios"),
        motivo_queda: (form["motivo_queda"] || null) as MotivoQueda | null,
        meta_diaria: n("meta_diaria") || 10,
        observacoes: form["observacoes"] || null,
        atualizado_por: session?.user.id ?? null,
      };

      if (editando) {
        const { error } = await tabela().update(dados).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await tabela().insert({
          ...dados,
          criado_por: session?.user.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editando ? "Registro atualizado." : "Produção registrada.");
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      setAberto(false);
      setEditando(null);
      setForm(vazio);
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

        <section className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <CartaoKpi
              rotulo="BMs Criadas"
              valor={fmtNumero(criadas)}
              icone={Factory}
              detalhe={ocultarValores ? "" : `Meta: ${metaDia}/dia`}
              destaque
            />
            <CartaoKpi
              rotulo="Contas Subidas"
              valor={fmtNumero(subidas)}
              icone={Rocket}
              corIcone="text-amber-500"
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
          </div>

          <div className="space-y-4">
            <CartaoKpi
              rotulo="BMs Aquecidas"
              valor={fmtNumero(aquecidas)}
              icone={Flame}
              corIcone="text-blue-500"
            />
            <CartaoKpi
              rotulo="Contas Viradas"
              valor={fmtNumero(viradas)}
              icone={Target}
              corValor="text-emerald-400"
            />
            <CartaoKpi
              rotulo="Bloqueios"
              valor={fmtNumero(bloqueios)}
              icone={AlertTriangle}
              corValor="text-red-500"
              detalhe={ocultarValores ? "" : `${perda.toFixed(1)}% de perda`}
            />
          </div>
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
                    <TableHead className="text-right">Aquecidas</TableHead>
                    <TableHead className="text-right">Subidas</TableHead>
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
                    const bateu = r.contas_viradas >= r.meta_diaria;
                    
                    return (
                      <TableRow key={r.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="num font-medium text-white">{formatarData(r.data_registro, fuso)}</TableCell>
                        <TableCell className="font-semibold text-white/90">{r.operador}</TableCell>
                        <TableCell className="num text-right font-bold text-white">{r.bms_criadas}</TableCell>
                        <TableCell className="num text-right text-blue-400 font-bold">{r.bms_aquecidas}</TableCell>
                        <TableCell className="num text-right font-bold text-white/90">{r.contas_subidas}</TableCell>
                        <TableCell className="num text-right">
                          <Badge 
                            className={cn(
                              "border-none font-bold px-3 py-1 rounded-md",
                              bateu ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "bg-emerald-500/10 text-emerald-400"
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
                            bateu ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/50 text-muted-foreground"
                          )}>
                            {bateu ? "Meta Batida" : "Abaixo Meta"}
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
                    {(equipe.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.nome}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Campo id="data_registro" rotulo="Data do registro" tipo="date" form={form} setForm={setForm} />
              <Campo id="bms_criadas" rotulo="BMs criadas" form={form} setForm={setForm} />
              <Campo id="bms_aquecidas" rotulo="BMs aquecidas" form={form} setForm={setForm} />
              <Campo id="contas_subidas" rotulo="Contas subidas" form={form} setForm={setForm} />
              <Campo id="contas_viradas" rotulo="Contas viradas" form={form} setForm={setForm} />
              <Campo id="bloqueios" rotulo="Bloqueios" form={form} setForm={setForm} />
              <Campo id="meta_diaria" rotulo="Meta diária" form={form} setForm={setForm} />
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
