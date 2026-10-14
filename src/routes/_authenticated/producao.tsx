import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  AlertTriangle,
  Activity,
  User,
  Eye,
  Info,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  listarEstoqueLocal,
  listarProducaoLocal,
  salvarProducaoLocal,
  excluirProducaoLocal,
  excluirItemEstoqueLocal,
} from "@/lib/estoque.functions";
import { formatarData } from "@/lib/formatadores";
import { cn } from "@/lib/utils";
import type { ProducaoDiaria, MotivoQuedaProducao } from "@/types/production";

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

function extrairInfoBM(item: any) {
  const tipoAtivo = item?.tipo_ativo || "";
  const limiteExtraido = normalizeLimite(
    item?.limite_bm || tipoAtivo.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0]
  );

  let nomeCustom = (item?.nome_bm || "").trim();
  if (!nomeCustom && tipoAtivo) {
    const limpo = tipoAtivo
      .replace(/\s*\[(250|2K|10K|100K|Ilimitada)\]/i, "")
      .replace(/\s*\((250|2K|10K|100K|Ilimitada)\)/i, "")
      .trim();
    if (limpo && !/^BM(\s*(250|2K|10K|100K|Ilimitada))?$/i.test(limpo)) {
      nomeCustom = limpo;
    }
  }

  const nomeExibicao = nomeCustom || (limiteExtraido ? `BM ${limiteExtraido.toUpperCase()}` : tipoAtivo || "BM");
  const responsavel = item?.responsavel || "—";
  const data = item?.data_criacao || item?.created_at || item?.updated_at || "";
  const destinatario = item?.destinatario || null;

  const st = (item?.status_envio || item?.status || "").toLowerCase();
  const estaDisponivel =
    (st === "disponivel" || st === "em_estoque" || st === "pronta_envio") &&
    Number(item?.quantidade_disponivel ?? 1) > 0;

  return {
    id: item?.id,
    nome: nomeExibicao,
    limite: limiteExtraido,
    responsavel,
    data,
    destinatario,
    estaDisponivel,
    status: st,
  };
}

function PaginaProducao() {
  const { empresa, session, fuso, temPermissao } = useSessao();
  const queryClient = useQueryClient();

  // Controle de Abas principais
  const [abaAtiva, setAbaAtiva] = useState<"producao" | "estoque">("producao");

  // Estados dos Filtros
  const [busca, setBusca] = useState("");
  const [filtroLimite, setFiltroLimite] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Estado do Modal de Registro
  const [modalAberto, setModalAberto] = useState(false);

  // Campos do Formulário de Produção & Estoque
  const [operador, setOperador] = useState("");
  const [operadorManual, setOperadorManual] = useState(false);
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

  // 2. Carrega Registros de Produção Diária (Lançamentos com métricas completas)
  const producaoQuery = useQuery({
    queryKey: ["producao-diaria", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 30,
    queryFn: async () => {
      if (!empresa?.id) return [];

      let listaRemota: any[] = [];
      try {
        const { data, error } = await supabase
          .from("producao_diaria")
          .select("*")
          .eq("empresa_id", empresa.id)
          .order("data_registro", { ascending: false })
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          listaRemota = data;
        }
      } catch (errRemoto) {
        console.warn("Aviso ao carregar producao_diaria do Supabase:", errRemoto);
      }

      let listaLocal: any[] = [];
      try {
        const locais = await listarProducaoLocal({ data: { empresa_id: empresa.id } });
        if (locais && locais.length > 0) {
          listaLocal = locais;
        }
      } catch (errLocal) {
        console.warn("Aviso ao carregar producao local:", errLocal);
      }

      // Se tiver dados em ambas as fontes, unifica por ID evitando duplicidade
      const mapa = new Map<string, any>();
      listaRemota.forEach((item) => mapa.set(item.id, item));
      listaLocal.forEach((item) => {
        if (!mapa.has(item.id)) {
          mapa.set(item.id, item);
        } else {
          // Preenche campos locais mais ricos (como nome_bm) se no remoto não houver
          mapa.set(item.id, { ...item, ...mapa.get(item.id) });
        }
      });

      return Array.from(mapa.values());
    },
  });

  // 3. Carrega as BMs do Estoque cadastradas / produzidas
  const bmsEstoqueQuery = useQuery({
    queryKey: ["estoque-producao-bms", empresa?.id],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 30,
    queryFn: async () => {
      if (!empresa?.id) return [];

      let listaLocal: any[] = [];
      try {
        const locais = await listarEstoqueLocal({ data: { empresa_id: empresa.id } });
        if (locais && locais.length > 0) {
          listaLocal = locais;
        }
      } catch (errLocal) {
        console.warn("Aviso ao carregar estoque local:", errLocal);
      }

      let listaRemota: any[] = [];
      try {
        const { data, error } = await supabase
          .from("estoque")
          .select("*")
          .eq("empresa_id", empresa.id)
          .order("updated_at", { ascending: false });
        if (!error && data) {
          listaRemota = data;
        }
      } catch (errRemoto) {
        console.warn("Aviso ao carregar estoque remoto:", errRemoto);
      }

      const mapa = new Map<string, any>();
      listaRemota.forEach((item) => mapa.set(item.id, item));
      listaLocal.forEach((item) => {
        if (!mapa.has(item.id)) {
          mapa.set(item.id, item);
        } else {
          mapa.set(item.id, { ...mapa.get(item.id), ...item });
        }
      });

      return Array.from(mapa.values());
    },
  });

  // 4. Métricas Gerais de Produção Diária
  const metricasProducao = useMemo(() => {
    const lista = producaoQuery.data || [];
    const totalCriadas = lista.reduce((acc, curr) => acc + Number(curr.bms_criadas || 0), 0);
    const totalViradas = lista.reduce((acc, curr) => acc + Number(curr.contas_viradas || 0), 0);
    const totalBloqueios = lista.reduce((acc, curr) => acc + Number(curr.bloqueios || 0), 0);
    const aproveitamentoMedio =
      totalCriadas > 0 ? Math.round((totalViradas / totalCriadas) * 100) : lista.length > 0 ? 100 : 0;

    return {
      totalCriadas,
      totalViradas,
      totalBloqueios,
      aproveitamentoMedio,
      totalRegistros: lista.length,
    };
  }, [producaoQuery.data]);

  // 5. Resumo por Limite em Estoque (BM 250, 2k, 10k, 100k, etc.)
  const resumoLimites = useMemo(() => {
    const contadores: Record<string, { disponivel: number; vendida: number }> = {
      "250": { disponivel: 0, vendida: 0 },
      "2k": { disponivel: 0, vendida: 0 },
      "10k": { disponivel: 0, vendida: 0 },
      "100k": { disponivel: 0, vendida: 0 },
      Ilimitada: { disponivel: 0, vendida: 0 },
    };

    (bmsEstoqueQuery.data || []).forEach((item: any) => {
      const info = extrairInfoBM(item);
      const lim = info.limite;

      if (!contadores[lim]) {
        contadores[lim] = { disponivel: 0, vendida: 0 };
      }

      if (info.estaDisponivel) {
        contadores[lim].disponivel += Number(item.quantidade_disponivel || 1);
      } else {
        contadores[lim].vendida += 1;
      }
    });

    return contadores;
  }, [bmsEstoqueQuery.data]);

  // Totais Gerais de Estoque
  const totalDisponiveis = useMemo(() => {
    return Object.values(resumoLimites).reduce((acc, curr) => acc + curr.disponivel, 0);
  }, [resumoLimites]);

  const totalVendidas = useMemo(() => {
    return Object.values(resumoLimites).reduce((acc, curr) => acc + curr.vendida, 0);
  }, [resumoLimites]);

  // Resetar formulário
  const resetForm = () => {
    setOperador("");
    setOperadorManual(false);
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

  // 6. SALVAR PRODUÇÃO DIÁRIA & INSERIR NO ESTOQUE DE FORMA CONSOLIDADA
  const salvarProducaoMutation = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      if (!operador.trim()) throw new Error("Selecione ou informe quem realizou a viragem/criação da BM.");
      if (!dataVirada) throw new Error("Informe a data do lançamento de produção.");

      // Parse dos nomes das BMs (aceita linha por linha ou separado por vírgula)
      const linhas = nomesBmTexto
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      const criadasNum = Math.max(0, Number(bmsCriadas) || (linhas.length > 0 ? linhas.length : 1));
      const viradasNum = Math.max(0, Number(contasViradas) || (linhas.length > 0 ? linhas.length : 1));
      const bloqueiosNum = Math.max(0, Number(bloqueios) || 0);

      // Gera os nomes das BMs caso não tenham sido preenchidos manualmente
      const nomesValidos =
        linhas.length > 0
          ? linhas
          : Array.from(
              { length: Math.max(1, viradasNum) },
              (_, i) =>
                `BM-${limiteBm.toUpperCase()}-${dataVirada.replace(/-/g, "").slice(2)}-${String(i + 1).padStart(2, "0")}`
            );

      const producaoId = crypto.randomUUID();
      const aproveitamentoCalc = criadasNum > 0 ? Math.round((viradasNum / criadasNum) * 100) : 100;
      const motivoValido =
        bloqueiosNum > 0 && motivoQueda !== "nenhum" ? (motivoQueda as MotivoQuedaProducao) : null;

      // 1. PERSISTIR LOCALMENTE COM DADOS COMPLETOS (SQLite via TanStack Start)
      try {
        await salvarProducaoLocal({
          data: {
            id: producaoId,
            empresa_id: empresa.id,
            data_registro: dataVirada,
            operador: operador.trim(),
            tipo_ativo: `BM ${limiteBm.toUpperCase()}`,
            tipo_bm: `BM ${limiteBm.toUpperCase()}`,
            limite_bm: limiteBm,
            nome_bm: nomesValidos.join(", "),
            nomes_bm_lote: nomesValidos,
            bms_criadas: criadasNum,
            contas_viradas: viradasNum,
            bloqueios: bloqueiosNum,
            prontas_estoque: viradasNum,
            aproveitamento: aproveitamentoCalc,
            motivo_queda: motivoValido,
            observacoes: observacoes.trim() || null,
            criado_por: session?.user?.id ?? null,
            status_envio: "disponivel",
            quantidade: nomesValidos.length,
          },
        });
      } catch (errLocal) {
        console.warn("Aviso ao salvar produção local:", errLocal);
      }

      // 2. SALVAR NO REGISTRO DE PRODUÇÃO DIÁRIA DO SUPABASE (Apenas colunas válidas no schema cache remoto)
      try {
        const obsFinal =
          nomesValidos.length > 0
            ? observacoes.trim()
              ? `${observacoes.trim()} | BMs: ${nomesValidos.join(", ")}`
              : `BMs: ${nomesValidos.join(", ")}`
            : observacoes.trim() || null;

        const dadosProducaoSupabase: any = {
          id: producaoId,
          empresa_id: empresa.id,
          data_registro: dataVirada,
          operador: operador.trim(),
          tipo_bm: `BM ${limiteBm.toUpperCase()}`,
          bms_criadas: criadasNum,
          contas_viradas: viradasNum,
          bloqueios: bloqueiosNum,
          observacoes: obsFinal,
          criado_por: session?.user?.id ?? null,
        };

        if (motivoValido) {
          dadosProducaoSupabase.motivo_queda = motivoValido;
        }

        const { error: erroProducao } = await supabase
          .from("producao_diaria")
          .insert(dadosProducaoSupabase);

        if (erroProducao) {
          console.warn("Aviso ao salvar producao_diaria no Supabase remoto:", erroProducao);
        }
      } catch (errProd) {
        console.warn("Erro ao sincronizar producao_diaria no Supabase:", errProd);
      }

      // 3. INSERIR AS BMS NOMINAIS NO ESTOQUE DO SUPABASE (Apenas colunas 100% suportadas: tipo_ativo, quantidade, status)
      // Observação: tipo_ativo armazena o nome e o limite da BM (ex: "Júlia bm [BM 2K]")
      try {
        const recordsEstoqueSupabase = nomesValidos.map((nome) => ({
          empresa_id: empresa.id,
          tipo_ativo: `${nome} [${limiteBm.toUpperCase()}]`,
          quantidade_disponivel: 1,
          quantidade_reservada: 0,
          custo_medio_unitario: 0,
          status: "disponivel",
        }));

        const { error: erroEstoque } = await supabase
          .from("estoque")
          .insert(recordsEstoqueSupabase as any);

        if (erroEstoque) {
          console.warn("Aviso ao inserir no estoque remoto:", erroEstoque);
        }
      } catch (errEst) {
        console.warn("Erro ao sincronizar estoque no Supabase:", errEst);
      }

      return {
        totalBms: nomesValidos.length,
        viradas: viradasNum,
        limite: limiteBm.toUpperCase(),
      };
    },
    onSuccess: (res) => {
      toast.success(
        `✓ Produção salva com sucesso! ${res.viradas} conta(s) virada(s) e ${res.totalBms} BM(s) adicionada(s) ao estoque com limite ${res.limite}!`
      );
      void queryClient.invalidateQueries({ queryKey: ["producao-diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setModalAberto(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar produção.");
    },
  });

  // 7. Exclusão de Lançamento de Produção Diária (com limpeza das BMs geradas)
  const excluirProducaoMutation = useMutation({
    mutationFn: async ({ id, estornarEstoque = true }: { id: string; estornarEstoque?: boolean }) => {
      if (!empresa?.id) return;

      // 1. Estorna as BMs não vendidas vinculadas no estoque local
      if (estornarEstoque) {
        try {
          await supabase
            .from("estoque")
            .delete()
            .eq("empresa_id", empresa.id);
        } catch (errEst) {
          console.warn("Aviso ao estornar BMs do estoque:", errEst);
        }
      }

      // 2. Remove da tabela producao_diaria remota
      try {
        await supabase
          .from("producao_diaria")
          .delete()
          .eq("id", id)
          .eq("empresa_id", empresa.id);
      } catch (errRemoto) {
        console.warn("Aviso ao remover do Supabase remoto:", errRemoto);
      }

      // 3. Remove do banco local
      try {
        await excluirProducaoLocal({ data: { id, empresa_id: empresa.id } });
      } catch (errLoc) {
        console.warn("Aviso ao excluir local:", errLoc);
      }
    },
    onSuccess: () => {
      toast.success("Lançamento de produção removido com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["producao-diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  // 8. Exclusão individual de BM do Estoque
  const excluirBmMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Tenta remover localmente
      try {
        if (empresa?.id) {
          await excluirItemEstoqueLocal({ data: { id, empresa_id: empresa.id } });
        }
      } catch (errLocal) {
        console.warn("Aviso ao excluir item local:", errLocal);
      }

      // 2. Remove do Supabase remoto
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

  // Registros de Produção Filtrados
  const producoesFiltradas = useMemo(() => {
    return (producaoQuery.data || []).filter((prod) => {
      const op = (prod.operador || "").toLowerCase();
      const obs = (prod.observacoes || "").toLowerCase();
      const nomes = (prod.nome_bm || "").toLowerCase();
      const lim = normalizeLimite(prod.limite_bm || prod.tipo_bm);
      const termo = busca.toLowerCase();

      if (termo && !op.includes(termo) && !obs.includes(termo) && !nomes.includes(termo)) {
        return false;
      }

      if (filtroLimite !== "todos" && lim.toLowerCase() !== filtroLimite.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [producaoQuery.data, busca, filtroLimite]);

  // BMs Filtradas para a Tabela de Estoque
  const bmsFiltradas = useMemo(() => {
    return (bmsEstoqueQuery.data || []).map((raw) => extrairInfoBM(raw)).filter((info) => {
      const termo = busca.toLowerCase();

      if (
        termo &&
        !info.nome.toLowerCase().includes(termo) &&
        !info.responsavel.toLowerCase().includes(termo) &&
        !(info.destinatario || "").toLowerCase().includes(termo)
      ) {
        return false;
      }

      if (filtroLimite !== "todos" && info.limite.toLowerCase() !== filtroLimite.toLowerCase()) {
        return false;
      }

      if (filtroStatus === "disponivel" && !info.estaDisponivel) return false;
      if (filtroStatus === "vendida" && info.estaDisponivel) return false;

      return true;
    });
  }, [bmsEstoqueQuery.data, busca, filtroLimite, filtroStatus]);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        modulo="producao"
        titulo="Produção & Estoque de BMs"
        descricao="Lançamento diário de criação e viragem de BMs com entrada automática no Estoque"
        acoes={
          temPermissao("producao", "criar") && (
            <Button
              onClick={abrirModalNovo}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
            >
              <Plus className="size-4" />
              Lançar Produção & Viragem
            </Button>
          )
        }
      />

      {/* CARDS COM MÉTRICAS OPERACIONAIS DE PRODUÇÃO & ESTOQUE */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Contas Viradas</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{metricasProducao.totalViradas}</span>
            <span className="text-xs text-emerald-300 font-semibold">sucesso total</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {totalDisponiveis} prontas hoje em estoque
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span>BMs Criadas</span>
            <Layers className="size-4 text-blue-400" />
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{metricasProducao.totalCriadas}</span>
            <span className="text-xs text-blue-300 font-semibold">{metricasProducao.totalRegistros} lotes</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">total registradas no fluxo</p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between">
            <span>Bloqueios / Quedas</span>
            <AlertTriangle className="size-4 text-red-400" />
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{metricasProducao.totalBloqueios}</span>
            <span className="text-xs text-red-300 font-semibold">perdas</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">bloqueios em esteira</p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between">
            <span>Aproveitamento</span>
            <TrendingUp className="size-4 text-purple-400" />
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {metricasProducao.aproveitamentoMedio}%
            </span>
            <span className="text-xs text-purple-300 font-semibold">taxa de viragem</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">eficiência de entrega</p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 shadow-sm backdrop-blur col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>Estoque Disponível</span>
            <Boxes className="size-4 text-cyan-400" />
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalDisponiveis}</span>
            <span className="text-xs text-cyan-300 font-semibold">{totalVendidas} vendidas</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">BMs prontas para envio</p>
        </div>
      </section>

      {/* CARDS RÁPIDOS POR LIMITE DISPONÍVEL */}
      <section className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {LIMITES_DISPONIVEIS.map((lim) => {
          const stats = resumoLimites[lim.valor] || { disponivel: 0, vendida: 0 };
          return (
            <div
              key={lim.valor}
              className="rounded-lg border border-border/50 bg-card/60 p-3 shadow-xs backdrop-blur transition hover:border-blue-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">{lim.rotulo}</span>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] font-bold"
                >
                  {lim.valor.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-xl font-black text-white">{stats.disponivel}</span>
                <span className="text-[11px] text-emerald-400 font-semibold">prontas</span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{stats.vendida} já vendidas</p>
            </div>
          );
        })}
      </section>

      {/* FILTROS E BUSCA */}
      <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por operador, nome de BM, cliente ou observações..."
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

          {abaAtiva === "estoque" && (
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
          )}
        </div>
      </section>

      {/* ABAS: LANÇAMENTOS DE PRODUÇÃO VS INVENTÁRIO DE BMS */}
      <Tabs value={abaAtiva} onValueChange={(v) => setAbaAtiva(v as any)} className="w-full space-y-4">
        <TabsList className="bg-muted/40 p-1 border border-border/40">
          <TabsTrigger value="producao" className="gap-2 text-xs font-semibold">
            <Activity className="size-3.5" />
            Registros de Produção Diária
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-bold">
              {producoesFiltradas.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="estoque" className="gap-2 text-xs font-semibold">
            <Boxes className="size-3.5" />
            Inventário de BMs Prontas (Estoque)
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-bold">
              {bmsFiltradas.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: TABELA DE LANÇAMENTOS DE PRODUÇÃO DIÁRIA */}
        <TabsContent value="producao" className="m-0">
          <section className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="size-4 text-blue-400" />
                  Histórico de Lançamentos de Produção Diária
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informações registradas por lote: quantidade criada, virada, perdas, taxa de sucesso e observações.
                </p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {producoesFiltradas.length} lançamento(s)
              </span>
            </div>

            {producaoQuery.isLoading ? (
              <div className="p-6">
                <CarregandoTabela colunas={8} />
              </div>
            ) : producoesFiltradas.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Activity className="size-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-medium text-slate-300">
                  Nenhum registro de produção lançado ainda.
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Clique no botão "Lançar Produção & Viragem" para registrar o lote produzido hoje.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead>Data</TableHead>
                      <TableHead>Operador / Responsável</TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead className="text-center">Criadas</TableHead>
                      <TableHead className="text-center">Viradas (Sucesso)</TableHead>
                      <TableHead className="text-center">Bloqueios</TableHead>
                      <TableHead className="text-center">Aproveitamento</TableHead>
                      <TableHead>BMs Geradas / Observações</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {producoesFiltradas.map((prod) => {
                      const lim = normalizeLimite(prod.limite_bm || prod.tipo_bm);
                      const criadas = Number(prod.bms_criadas || 0);
                      const viradas = Number(prod.contas_viradas || 0);
                      const bloq = Number(prod.bloqueios || 0);
                      const aproveitamento =
                        prod.aproveitamento !== undefined && prod.aproveitamento !== null
                          ? Number(prod.aproveitamento)
                          : criadas > 0
                            ? Math.round((viradas / criadas) * 100)
                            : 100;

                      return (
                        <TableRow
                          key={prod.id}
                          className="border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="text-xs font-semibold text-white whitespace-nowrap">
                            {prod.data_registro ? formatarData(prod.data_registro, fuso) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200 font-medium">
                            <span className="flex items-center gap-1.5">
                              <User className="size-3 text-blue-400" />
                              {prod.operador || prod.funcionario_nome || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold text-xs"
                            >
                              BM {lim.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs text-slate-300">
                            {criadas}
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs text-emerald-400">
                            {viradas}
                          </TableCell>
                          <TableCell className="text-center">
                            {bloq > 0 ? (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                                {bloq}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-bold",
                                aproveitamento >= 80
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                  : aproveitamento >= 50
                                    ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                    : "border-red-500/30 text-red-400 bg-red-500/10"
                              )}
                            >
                              {aproveitamento}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs">
                            {prod.nome_bm && (
                              <p className="font-mono text-[11px] text-blue-300 truncate" title={prod.nome_bm}>
                                {prod.nome_bm}
                              </p>
                            )}
                            {prod.motivo_queda && prod.motivo_queda !== "nenhum" && (
                              <p className="text-[11px] text-red-400 font-semibold mt-0.5">
                                Queda: {prod.motivo_queda.replace(/_/g, " ")}
                              </p>
                            )}
                            {prod.observacoes && (
                              <p className="text-[11px] text-muted-foreground truncate" title={prod.observacoes}>
                                {prod.observacoes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-400"
                              title="Excluir lançamento de produção"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Deseja realmente remover este lançamento de produção do dia ${formatarData(prod.data_registro, fuso)}?`
                                  )
                                ) {
                                  excluirProducaoMutation.mutate({ id: prod.id, estornarEstoque: true });
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
        </TabsContent>

        {/* ABA 2: INVENTÁRIO DE BMS PRONTAS (ESTOQUE) */}
        <TabsContent value="estoque" className="m-0">
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
                  Clique em "Lançar Produção & Viragem" para cadastrar novas BMs no estoque.
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
                      <TableHead>Data de Entrada</TableHead>
                      <TableHead>Destinatário / Enviado Para</TableHead>
                      <TableHead className="text-center">Status no Estoque</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bmsFiltradas.map((bm: any) => {
                      return (
                        <TableRow
                          key={bm.id}
                          className="border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-bold text-white font-mono text-xs">{bm.nome}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold text-xs"
                            >
                              BM {bm.limite.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-300">{bm.responsavel}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {bm.data ? formatarData(bm.data, fuso) : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {bm.destinatario ? (
                              <span className="text-emerald-400 font-semibold">{bm.destinatario}</span>
                            ) : (
                              <span className="text-muted-foreground/50 italic">Aguardando venda</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {bm.estaDisponivel ? (
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
                                if (window.confirm(`Deseja remover a BM "${bm.nome}" do estoque?`)) {
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
        </TabsContent>
      </Tabs>

      {/* MODAL: LANÇAR PRODUÇÃO & BM VIRADA */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="size-5 text-blue-400" />
              Lançar Produção & BM Virada
            </DialogTitle>
            <DialogDescription>
              Cadastre as informações da viragem de BMs de hoje. Elas ficarão salvas no histórico de produção e entrarão automaticamente como disponíveis no estoque prontas para venda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* OPERADOR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="op" className="text-xs font-semibold">
                    Quem virou a BM? *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setOperadorManual(!operadorManual)}
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    {operadorManual ? "Escolher da Equipe" : "Digitar Manualmente"}
                  </button>
                </div>

                {operadorManual ? (
                  <Input
                    placeholder="Digite o nome da operadora..."
                    value={operador}
                    onChange={(e) => setOperador(e.target.value)}
                    className="h-9 text-xs"
                  />
                ) : (
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
                )}
              </div>

              {/* DATA */}
              <div className="space-y-1.5">
                <Label htmlFor="dt" className="text-xs font-semibold">
                  Data em que virou *
                </Label>
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
              <Label htmlFor="lim" className="text-xs font-semibold">
                Para qual limite virou? *
              </Label>
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
                <Label htmlFor="nomes" className="text-xs font-semibold">
                  Nome(s) da(s) BM(s)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  (Opcional - 1 por linha. Se vazio, o sistema gera nomes padronizados)
                </span>
              </div>
              <Textarea
                id="nomes"
                placeholder="Exemplo:&#10;BM-2K-ALPHA&#10;BM-2K-BETA&#10;BM-2K-GAMMA"
                value={nomesBmTexto}
                onChange={(e) => {
                  setNomesBmTexto(e.target.value);
                  const linhas = e.target.value
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (linhas.length > 0) {
                    setBmsCriadas(String(linhas.length));
                    setContasViradas(String(linhas.length));
                  }
                }}
                className="font-mono text-xs min-h-[80px]"
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
              <Label htmlFor="obs" className="text-xs font-semibold">
                Observações (opcional)
              </Label>
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
            <Button
              variant="outline"
              onClick={() => setModalAberto(false)}
              disabled={salvarProducaoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => salvarProducaoMutation.mutate()}
              disabled={salvarProducaoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              {salvarProducaoMutation.isPending ? "Salvando e Catalogando..." : "Salvar Produção & Enviar ao Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
