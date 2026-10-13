import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  UserCheck,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela } from "@/components/comum/estados";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({
    meta: [
      { title: "Produção & Estoque de BMs | Gestão Central" },
      {
        name: "description",
        content: "Controle de criação, viragem de BMs e entrada direta no Estoque.",
      },
    ],
  }),
  component: PaginaProducao,
});

const LIMITES_DISPONIVEIS = [
  { valor: "250", rotulo: "BM 250" },
  { valor: "2k", rotulo: "BM 2K" },
  { valor: "10k", rotulo: "BM 10K" },
  { valor: "100k", rotulo: "BM 100K" },
  { valor: "Ilimitada", rotulo: "BM Ilimitada" },
];

const MOTIVOS_QUEDA = [
  { valor: "nenhum", rotulo: "Nenhum (Sucesso Total)" },
  { valor: "restricao_imediata", rotulo: "Restrição Imediata" },
  { valor: "checkpoint_identidade", rotulo: "Checkpoint de Identidade" },
  { valor: "erro_cartao", rotulo: "Erro de Cartão" },
  { valor: "bloqueio_ip", rotulo: "Bloqueio de IP / Proxy" },
  { valor: "outros", rotulo: "Outros" },
];

function normalizeLimite(val: string | null | undefined): string {
  if (!val) return "250";
  const s = val.toLowerCase();
  if (s.includes("100k")) return "100k";
  if (s.includes("10k")) return "10k";
  if (s.includes("2k")) return "2k";
  if (s.includes("ilimitada")) return "Ilimitada";
  return "250";
}

function PaginaProducao() {
  const { empresa, session, fuso, temPermissao } = useSessao();
  const queryClient = useQueryClient();

  // Estados dos Filtros
  const [busca, setBusca] = useState("");
  const [filtroLimite, setFiltroLimite] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Estado do Modal de Registro
  const [modalAberto, setModalAberto] = useState(false);

  // Campos do Formulário de Produção & Estoque
  const [operador, setOperador] = useState("");
  const [dataVirada, setDataVirada] = useState(() => new Date().toISOString().slice(0, 10));
  const [limiteBm, setLimiteBm] = useState("250");
  const [nomesBmTexto, setNomesBmTexto] = useState("");
  const [bmsCriadas, setBmsCriadas] = useState("1");
  const [contasViradas, setContasViradas] = useState("1");
  const [bloqueios, setBloqueios] = useState("0");
  const [motivoQueda, setMotivoQueda] = useState("nenhum");
  const [observacoes, setObservacoes] = useState("");

  // 1. Carrega Operadores da Equipe
  const equipeQuery = useQuery({
    queryKey: ["equipe-producao", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!empresa?.id) return [];
      try {
        const { data } = await supabase
          .from("perfis")
          .select("id, nome")
          .eq("empresa_id", empresa.id)
          .order("nome");
        return data || [];
      } catch {
        return [];
      }
    },
  });

  // 2. Carrega as BMs do Estoque cadastradas / produzidas
  const bmsEstoqueQuery = useQuery({
    queryKey: ["estoque-producao-bms", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 30,
    queryFn: async () => {
      if (!empresa?.id) return [];
      try {
        const { data, error } = await supabase
          .from("estoque")
          .select("*")
          .eq("empresa_id", empresa.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Aviso ao carregar BMs do estoque:", err);
        return [];
      }
    },
  });

  // 3. Resumo por Limite (BM 250, 2k, 10k, 100k, etc.)
  const resumoLimites = useMemo(() => {
    const contadores: Record<string, { disponivel: number; vendida: number }> = {
      "250": { disponivel: 0, vendida: 0 },
      "2k": { disponivel: 0, vendida: 0 },
      "10k": { disponivel: 0, vendida: 0 },
      "100k": { disponivel: 0, vendida: 0 },
      "Ilimitada": { disponivel: 0, vendida: 0 },
    };

    (bmsEstoqueQuery.data || []).forEach((item: any) => {
      const lim = normalizeLimite(item.limite_bm || item.tipo_ativo);
      const st = (item.status_envio || item.status || "").toLowerCase();
      const estaDisponivel = (st === "disponivel" || st === "em_estoque" || st === "pronta_envio") && Number(item.quantidade_disponivel || 0) > 0;

      if (!contadores[lim]) {
        contadores[lim] = { disponivel: 0, vendida: 0 };
      }

      if (estaDisponivel) {
        contadores[lim].disponivel += Number(item.quantidade_disponivel || 1);
      } else {
        contadores[lim].vendida += 1;
      }
    });

    return contadores;
  }, [bmsEstoqueQuery.data]);

  // Totais Gerais
  const totalDisponiveis = useMemo(() => {
    return Object.values(resumoLimites).reduce((acc, curr) => acc + curr.disponivel, 0);
  }, [resumoLimites]);

  const totalVendidas = useMemo(() => {
    return Object.values(resumoLimites).reduce((acc, curr) => acc + curr.vendida, 0);
  }, [resumoLimites]);

  // Resetar formulário
  const resetForm = () => {
    setOperador("");
    setDataVirada(new Date().toISOString().slice(0, 10));
    setLimiteBm("250");
    setNomesBmTexto("");
    setBmsCriadas("1");
    setContasViradas("1");
    setBloqueios("0");
    setMotivoQueda("nenhum");
    setObservacoes("");
  };

  const abrirModalNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  // 4. Salvar Produção & Inserir BMs Nominais no Estoque
  const salvarProducaoMutation = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      if (!operador.trim()) throw new Error("Selecione quem realizou a viragem/criação da BM.");
      if (!dataVirada) throw new Error("Informe a data em que a BM virou.");

      // Parse dos nomes das BMs (aceita linha por linha ou separado por vírgula)
      const linhas = nomesBmTexto
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      const nomesValidos = linhas.length > 0 ? linhas : [`BM-${limiteBm.toUpperCase()}-${Date.now().toString().slice(-4)}`];

      const criadasNum = Number(bmsCriadas) || nomesValidos.length;
      const viradasNum = Number(contasViradas) || nomesValidos.length;
      const bloqueiosNum = Number(bloqueios) || 0;

      // 1. Registra a linha diária de produção (schema limpo oficial)
      let producaoId: string | null = null;
      try {
        const payloadProducao: any = {
          empresa_id: empresa.id,
          data_registro: dataVirada,
          operador: operador.trim(),
          tipo_bm: `BM ${limiteBm.toUpperCase()}`,
          bms_criadas: criadasNum,
          contas_viradas: viradasNum,
          bloqueios: bloqueiosNum,
          motivo_queda: motivoQueda === "nenhum" ? null : motivoQueda,
          observacoes: observacoes.trim() || null,
          meta_diaria: 10,
          criado_por: session?.user?.id ?? null,
          atualizado_por: session?.user?.id ?? null,
        };

        const { data: novaProd } = await supabase
          .from("producao_diaria")
          .insert(payloadProducao)
          .select("id")
          .maybeSingle();

        producaoId = novaProd?.id ?? null;
      } catch (errProd) {
        console.warn("Aviso ao registrar producao_diaria:", errProd);
      }

      // 2. Insere CADA BM nominal individualmente no Estoque com o limite escolhido
      const recordsEstoque = nomesValidos.map((nome) => ({
        empresa_id: empresa.id,
        nome_bm: nome,
        limite_bm: limiteBm,
        tipo_ativo: `${nome} [${limiteBm.toUpperCase()}]`,
        status_envio: "disponivel",
        status: "disponivel",
        quantidade_disponivel: 1,
        quantidade_reservada: 0,
        responsavel: operador.trim(),
        data_criacao: dataVirada,
        origem: "producao",
        producao_id: producaoId,
        custo_medio_unitario: 0,
      }));

      const { error: erroEstoque } = await supabase
        .from("estoque")
        .insert(recordsEstoque as any);

      if (erroEstoque) {
        throw new Error(`Erro ao adicionar BMs ao Estoque: ${erroEstoque.message}`);
      }

      return { totalBms: nomesValidos.length };
    },
    onSuccess: (res) => {
      toast.success(`✓ ${res.totalBms} BM(s) adicionada(s) ao Estoque com limite ${limiteBm.toUpperCase()}!`);
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-disponivel-venda"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setModalAberto(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar produção.");
    },
  });

  // 5. Exclusão de BM do Estoque
  const excluirBmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estoque").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("BM removida do estoque.");
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  // BMs Filtradas para a Tabela
  const bmsFiltradas = useMemo(() => {
    return (bmsEstoqueQuery.data || []).filter((bm: any) => {
      const nome = (bm.nome_bm || bm.tipo_ativo || "").toLowerCase();
      const resp = (bm.responsavel || "").toLowerCase();
      const dest = (bm.destinatario || "").toLowerCase();
      const termo = busca.toLowerCase();

      if (termo && !nome.includes(termo) && !resp.includes(termo) && !dest.includes(termo)) {
        return false;
      }

      const lim = normalizeLimite(bm.limite_bm || bm.tipo_ativo);
      if (filtroLimite !== "todos" && lim.toLowerCase() !== filtroLimite.toLowerCase()) {
        return false;
      }

      const st = (bm.status_envio || bm.status || "").toLowerCase();
      const estaDisponivel = (st === "disponivel" || st === "em_estoque" || st === "pronta_envio") && Number(bm.quantidade_disponivel || 0) > 0;

      if (filtroStatus === "disponivel" && !estaDisponivel) return false;
      if (filtroStatus === "vendida" && estaDisponivel) return false;

      return true;
    });
  }, [bmsEstoqueQuery.data, busca, filtroLimite, filtroStatus]);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        modulo="producao"
        titulo="Produção & Estoque de BMs"
        descricao="Cadastre as BMs que viraram e acompanhe a disponibilidade nominal no estoque"
        acoes={
          temPermissao("producao", "criar") && (
            <Button onClick={abrirModalNovo} className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20">
              <Plus className="size-4" />
              Lançar BM Virada / Produção
            </Button>
          )
        }
      />

      {/* CARDS COM RESUMO DOS LIMITES DISPONÍVEIS NO ESTOQUE */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Total Disponível</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalDisponiveis}</span>
            <Boxes className="size-5 text-blue-400/60" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{totalVendidas} já enviadas/vendidas</p>
        </div>

        {LIMITES_DISPONIVEIS.map((lim) => {
          const stats = resumoLimites[lim.valor] || { disponivel: 0, vendida: 0 };
          return (
            <div key={lim.valor} className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm backdrop-blur transition hover:border-blue-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">{lim.rotulo}</span>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] font-bold">
                  {lim.valor.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{stats.disponivel}</span>
                <span className="text-[11px] text-emerald-400 font-semibold">prontas</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{stats.vendida} vendidas</p>
            </div>
          );
        })}
      </section>

      {/* FILTROS E BUSCA */}
      <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da BM, operador ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-xs bg-card/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filtroLimite} onValueChange={setFiltroLimite}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Limite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Limites</SelectItem>
              <SelectItem value="250">Limite 250</SelectItem>
              <SelectItem value="2k">Limite 2K</SelectItem>
              <SelectItem value="10k">Limite 10K</SelectItem>
              <SelectItem value="100k">Limite 100K</SelectItem>
              <SelectItem value="ilimitada">Ilimitada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="vendida">Vendida / Enviada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* TABELA DE BMS PRODUZIDAS & DISPONIBILIDADE NO ESTOQUE */}
      <section className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="size-4 text-blue-400" />
              Inventário de BMs Produzidas (Prontas para Venda)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cada BM possui seu nome único e limite específico. Ao vender, selecione-a para saber exatamente qual foi entregue.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {bmsFiltradas.length} item(ns)
          </span>
        </div>

        {bmsEstoqueQuery.isLoading ? (
          <div className="p-6">
            <CarregandoTabela colunas={6} />
          </div>
        ) : bmsFiltradas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="size-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium text-slate-300">Nenhuma BM encontrada com esses filtros.</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Clique em "Lançar BM Virada / Produção" para cadastrar novas BMs no estoque.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead>Nome da BM</TableHead>
                  <TableHead>Limite Virado</TableHead>
                  <TableHead>Quem Virou (Operador)</TableHead>
                  <TableHead>Data em que Virou</TableHead>
                  <TableHead>Destinatário / Enviado Para</TableHead>
                  <TableHead className="text-center">Status no Estoque</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bmsFiltradas.map((bm: any) => {
                  const st = (bm.status_envio || bm.status || "").toLowerCase();
                  const estaDisponivel = (st === "disponivel" || st === "em_estoque" || st === "pronta_envio") && Number(bm.quantidade_disponivel || 0) > 0;
                  const limite = normalizeLimite(bm.limite_bm || bm.tipo_ativo);
                  const nome = bm.nome_bm || bm.tipo_ativo;

                  return (
                    <TableRow key={bm.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-white">
                        {nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold text-xs">
                          BM {limite.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {bm.responsavel || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {bm.data_criacao ? formatarData(bm.data_criacao, fuso) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {bm.destinatario ? (
                          <span className="text-emerald-400 font-semibold">{bm.destinatario}</span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">Aguardando venda</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {estaDisponivel ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] gap-1">
                            <CheckCircle2 className="size-3" />
                            DISPONÍVEL
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-bold text-[11px]">
                            VENDIDA / ENVIADA
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-red-400"
                          onClick={() => {
                            if (window.confirm(`Deseja remover a BM "${nome}" do estoque?`)) {
                              excluirBmMutation.mutate(bm.id);
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* MODAL: LANÇAR BM VIRADA / PRODUÇÃO */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="size-5 text-blue-400" />
              Lançar BM Virada para o Estoque
            </DialogTitle>
            <DialogDescription>
              Cadastre as BMs que viraram hoje. Elas entrarão automaticamente como disponíveis no estoque prontas para venda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* OPERADOR */}
              <div className="space-y-1.5">
                <Label htmlFor="op" className="text-xs font-semibold">Quem virou a BM? *</Label>
                <Select value={operador} onValueChange={setOperador}>
                  <SelectTrigger id="op" className="h-9 text-xs">
                    <SelectValue placeholder="Selecione a operadora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fornecedor CIRO">🔧 Fornecedor CIRO</SelectItem>
                    {(equipeQuery.data || []).map((m) => (
                      <SelectItem key={m.id} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* DATA */}
              <div className="space-y-1.5">
                <Label htmlFor="dt" className="text-xs font-semibold">Data em que virou *</Label>
                <Input
                  id="dt"
                  type="date"
                  value={dataVirada}
                  onChange={(e) => setDataVirada(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* LIMITE PARA O QUAL VIROU */}
            <div className="space-y-1.5">
              <Label htmlFor="lim" className="text-xs font-semibold">Para qual limite virou? *</Label>
              <Select value={limiteBm} onValueChange={setLimiteBm}>
                <SelectTrigger id="lim" className="h-9 text-xs font-bold text-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMITES_DISPONIVEIS.map((l) => (
                    <SelectItem key={l.valor} value={l.valor}>
                      {l.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* NOMES DAS BMS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="nomes" className="text-xs font-semibold">Nome(s) da(s) BM(s) *</Label>
                <span className="text-[11px] text-muted-foreground">1 nome por linha para cadastrar em lote</span>
              </div>
              <Textarea
                id="nomes"
                placeholder="Exemplo:&#10;BM-2K-ALPHA&#10;BM-2K-BETA&#10;BM-2K-GAMMA"
                value={nomesBmTexto}
                onChange={(e) => {
                  setNomesBmTexto(e.target.value);
                  const linhas = e.target.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                  if (linhas.length > 0) {
                    setBmsCriadas(String(linhas.length));
                    setContasViradas(String(linhas.length));
                  }
                }}
                className="font-mono text-xs min-h-[90px]"
              />
            </div>

            {/* MÉTRICAS OPERACIONAIS */}
            <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">BMs Criadas</Label>
                <Input
                  type="number"
                  min="0"
                  value={bmsCriadas}
                  onChange={(e) => setBmsCriadas(e.target.value)}
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-emerald-400 font-semibold">Contas Viradas</Label>
                <Input
                  type="number"
                  min="0"
                  value={contasViradas}
                  onChange={(e) => setContasViradas(e.target.value)}
                  className="h-8 text-xs font-bold text-emerald-400"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-red-400 font-semibold">Bloqueios / Quedas</Label>
                <Input
                  type="number"
                  min="0"
                  value={bloqueios}
                  onChange={(e) => setBloqueios(e.target.value)}
                  className="h-8 text-xs font-bold text-red-400"
                />
              </div>
            </div>

            {Number(bloqueios) > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-red-400">Motivo principal da queda</Label>
                <Select value={motivoQueda} onValueChange={setMotivoQueda}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_QUEDA.map((m) => (
                      <SelectItem key={m.valor} value={m.valor}>
                        {m.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="obs" className="text-xs font-semibold">Observações (opcional)</Label>
              <Input
                id="obs"
                placeholder="Ex: Farmadas com proxy dedicada, aquecidas por 3 dias"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={salvarProducaoMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvarProducaoMutation.mutate()}
              disabled={salvarProducaoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              {salvarProducaoMutation.isPending ? "Salvando e Catalogando..." : "Salvar e Enviar ao Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
