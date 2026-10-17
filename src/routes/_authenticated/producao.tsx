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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
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

  const st = (item?.status_envio || item?.status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const ehIndisponivel = st.includes("vendida") || st.includes("entregue") || st.includes("reservada");
  const estaDisponivel =
    !ehIndisponivel &&
    (st.includes("disponivel") || st.includes("em_estoque") || st.includes("pronta")) &&
    Number(item?.quantidade_disponivel ?? 1) > 0;

  return {
    id: item?.id,
    nome: nomeExibicao,
    limite: limiteExtraido,
    responsavel,
    data,
    destinatario,
    estaDisponivel,
    status: item?.status || "disponivel",
    status_envio: item?.status_envio || "disponivel",
    producao_id: item?.producao_id || null,
    raw: item,
  };
}

function PaginaProducao() {
  const { empresa, session, fuso, temPermissao } = useSessao();
  const queryClient = useQueryClient();

  // Controle de Abas principais
  const [abaAtiva, setAbaAtiva] = useState<"producao" | "estoque">("producao");

  // SELETOR DINÂMICO DE MÊS E ANO
  const hoje = new Date();
  const [dataSelecionada, setDataSelecionada] = useState<Date>(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [popoverMesAberto, setPopoverMesAberto] = useState(false);

  const anoAtivo = dataSelecionada.getFullYear();
  const mesAtivo = dataSelecionada.getMonth(); // 0 a 11
  const mesAnoPrefixo = `${anoAtivo}-${String(mesAtivo + 1).padStart(2, "0")}`; // Ex: "2026-10"
  const rotuloMesAno = `Mês de ${NOMES_MESES[mesAtivo]} de ${anoAtivo}`;
  const ehMesAtual = hoje.getFullYear() === anoAtivo && hoje.getMonth() === mesAtivo;

  const mesAnterior = () => {
    setDataSelecionada((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const proximoMes = () => {
    setDataSelecionada((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const irParaMesAtual = () => {
    setDataSelecionada(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  };

  const selecionarMesAno = (novoMes: number, novoAno: number) => {
    setDataSelecionada(new Date(novoAno, novoMes, 1));
    setPopoverMesAberto(false);
  };

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

      const mapa = new Map<string, any>();
      listaRemota.forEach((item) => mapa.set(item.id, item));
      listaLocal.forEach((item) => {
        if (!mapa.has(item.id)) {
          mapa.set(item.id, item);
        } else {
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

  // FUNÇÃO AUXILIAR: Verifica se uma data pertence ao mês/ano selecionado
  const pertenceAoMesSelecionado = (dataStr: string | null | undefined): boolean => {
    if (!dataStr) return false;
    const limpo = dataStr.slice(0, 7);
    return limpo === mesAnoPrefixo;
  };

  // 4. ITENS DO MÊS SELECIONADO: Produções filtradas pelo mês ativo
  const producoesDoMes = useMemo(() => {
    return (producaoQuery.data || []).filter((prod) => {
      const dt = prod.data_registro || prod.data_criacao || prod.created_at;
      return pertenceAoMesSelecionado(dt);
    });
  }, [producaoQuery.data, mesAnoPrefixo]);

  // 5. ITENS DO MÊS SELECIONADO: BMs no Estoque filtradas pelo mês ativo
  const bmsDoMes = useMemo(() => {
    return (bmsEstoqueQuery.data || [])
      .map((raw) => extrairInfoBM(raw))
      .filter((item) => {
        return item.data ? pertenceAoMesSelecionado(item.data) : true;
      });
  }, [bmsEstoqueQuery.data, mesAnoPrefixo]);

  // 6. MÉTRICAS GERAIS CALCULADAS EXCLUSIVAMENTE PELO MÊS SELECIONADO
  const metricasProducao = useMemo(() => {
    const totalCriadas = producoesDoMes.reduce((acc, curr) => acc + Number(curr.bms_criadas || 0), 0);
    const totalViradas = producoesDoMes.reduce((acc, curr) => acc + Number(curr.contas_viradas || 0), 0);
    const totalBloqueios = producoesDoMes.reduce((acc, curr) => acc + Number(curr.bloqueios || 0), 0);
    const aproveitamentoMedio =
      totalCriadas > 0 ? Math.round((totalViradas / totalCriadas) * 100) : producoesDoMes.length > 0 ? 100 : 0;

    return {
      totalCriadas,
      totalViradas,
      totalBloqueios,
      aproveitamentoMedio,
      totalRegistros: producoesDoMes.length,
    };
  }, [producoesDoMes]);

  // 7. RESUMO POR LIMITE EM ESTOQUE NO MÊS SELECIONADO
  const resumoLimites = useMemo(() => {
    const contadores: Record<string, { disponivel: number; vendida: number }> = {
      "250": { disponivel: 0, vendida: 0 },
      "2k": { disponivel: 0, vendida: 0 },
      "10k": { disponivel: 0, vendida: 0 },
      "100k": { disponivel: 0, vendida: 0 },
      Ilimitada: { disponivel: 0, vendida: 0 },
    };

    bmsDoMes.forEach((info) => {
      const lim = info.limite;
      if (!contadores[lim]) {
        contadores[lim] = { disponivel: 0, vendida: 0 };
      }

      if (info.estaDisponivel) {
        contadores[lim].disponivel += 1;
      } else {
        contadores[lim].vendida += 1;
      }
    });

    return contadores;
  }, [bmsDoMes]);

  // Totais Gerais de Estoque no Mês
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
    // Se estiver navegando em outro mês, pré-preenche a data com o mês ativo
    if (!ehMesAtual) {
      setDataVirada(`${mesAnoPrefixo}-01`);
    }
    setModalAberto(true);
  };

  // 8. SALVAR PRODUÇÃO DIÁRIA & INSERIR NO ESTOQUE DE FORMA CONSOLIDADA
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

      // 1. Gera lista de BMs como itens únicos e serializados com IDs universais
      const bmsToInsert = nomesValidos.map((nome) => {
        const bmId = crypto.randomUUID();
        const lim = limiteBm.toUpperCase();
        return {
          id: bmId,
          empresa_id: empresa.id,
          nome_bm: nome.trim(),
          limite_bm: lim,
          tipo_ativo: `${nome.trim()} [${lim}]`,
          status: "disponivel",
          status_envio: "disponivel",
          origem: "producao",
          producao_id: producaoId,
          data_criacao: dataVirada || new Date().toISOString().slice(0, 10),
          tem_template: false,
          responsavel: operador.trim(),
          quantidade_disponivel: 1,
          quantidade_reservada: 0,
          custo_medio_unitario: 0,
        };
      });

      // 2. PERSISTIR LOCALMENTE COM DADOS COMPLETOS (SQLite via TanStack Start)
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
            bms_detalhadas: bmsToInsert.map((b) => ({
              id: b.id,
              nome_bm: b.nome_bm,
              limite_bm: b.limite_bm,
            })),
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

      // 3. SALVAR NO REGISTRO DE PRODUÇÃO DIÁRIA DO SUPABASE (Apenas colunas suportadas no schema remoto)
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

      // 4. INSERIR CADA BM INDIVIDUALMENTE NO ESTOQUE DO SUPABASE
      try {
        const { error: erroEstoque } = await supabase
          .from("estoque")
          .insert(bmsToInsert as any);

        if (erroEstoque) {
          console.warn("Aviso ao inserir no estoque remoto com colunas completas, tentando modo compatível:", erroEstoque);
          const fallbackRecords = bmsToInsert.map((b) => ({
            id: b.id,
            empresa_id: b.empresa_id,
            tipo_ativo: b.tipo_ativo,
            quantidade_disponivel: 1,
            quantidade_reservada: 0,
            custo_medio_unitario: 0,
            status: "disponivel",
          }));
          await supabase.from("estoque").insert(fallbackRecords as any);
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
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-disponivel-venda"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setModalAberto(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar produção.");
    },
  });

  // 9. Exclusão de Lançamento de Produção Diária (com estorno seguro das BMs geradas)
  const excluirProducaoMutation = useMutation({
    mutationFn: async ({ id, estornarEstoque = true }: { id: string; estornarEstoque?: boolean }) => {
      if (!empresa?.id) return;

      if (estornarEstoque) {
        try {
          await supabase
            .from("estoque")
            .delete()
            .eq("empresa_id", empresa.id)
            .eq("producao_id", id);
        } catch (errEst) {
          console.warn("Aviso ao estornar BMs do estoque:", errEst);
        }
      }

      try {
        await supabase
          .from("producao_diaria")
          .delete()
          .eq("id", id)
          .eq("empresa_id", empresa.id);
      } catch (errRemoto) {
        console.warn("Aviso ao remover do Supabase remoto:", errRemoto);
      }

      try {
        await excluirProducaoLocal({ data: { id, empresa_id: empresa.id } });
      } catch (errLoc) {
        console.warn("Aviso ao excluir local:", errLoc);
      }
    },
    onSuccess: () => {
      toast.success("Lançamento de produção removido com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["producao-diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-disponivel-venda"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  // 10. Exclusão individual de BM do Estoque (com atualização otimista instantânea dos contadores)
  const excluirBmMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!empresa?.id) return;

      // 1. Exclui no SQLite local
      try {
        await excluirItemEstoqueLocal({ data: { id, empresa_id: empresa.id } });
      } catch (errLocal) {
        console.warn("Aviso ao excluir item local:", errLocal);
      }

      // 2. Exclui no Supabase remoto
      try {
        const { error } = await supabase
          .from("estoque")
          .delete()
          .eq("id", id)
          .eq("empresa_id", empresa.id);
        if (error) console.warn("Aviso ao excluir do estoque Supabase:", error);
      } catch (errRemoto) {
        console.warn("Erro ao excluir do Supabase remoto:", errRemoto);
      }
    },
    onMutate: async (idExcluido: string) => {
      await queryClient.cancelQueries({ queryKey: ["estoque-producao-bms", empresa?.id] });
      const anterior = queryClient.getQueryData(["estoque-producao-bms", empresa?.id]);
      queryClient.setQueryData(["estoque-producao-bms", empresa?.id], (velho: any[] | undefined) => {
        if (!velho) return [];
        return velho.filter((item) => item.id !== idExcluido);
      });
      return { anterior };
    },
    onError: (err: Error, _id, context) => {
      if (context?.anterior) {
        queryClient.setQueryData(["estoque-producao-bms", empresa?.id], context.anterior);
      }
      toast.error(`Erro ao excluir BM: ${err.message}`);
    },
    onSuccess: () => {
      toast.success("BM excluída com sucesso.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-disponivel-venda"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["producao-diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Registros de Produção Filtrados (Mês Selecionado + Busca + Limite)
  const producoesFiltradas = useMemo(() => {
    return producoesDoMes.filter((prod) => {
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
  }, [producoesDoMes, busca, filtroLimite]);

  // BMs Filtradas para a Tabela de Estoque (Mês Selecionado + Busca + Limite + Status)
  const bmsFiltradas = useMemo(() => {
    return bmsDoMes.filter((info) => {
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
  }, [bmsDoMes, busca, filtroLimite, filtroStatus]);

  // Anos para seleção no Popover
  const anosDisponiveis = [anoAtivo - 1, anoAtivo, anoAtivo + 1];

  return (
    <div className="space-y-5">
      {/* CABEÇALHO DA PÁGINA (Botão adaptado no mobile com largura total) */}
      <CabecalhoPagina
        modulo="producao"
        titulo="Produção & Estoque de BMs"
        descricao="Lançamento diário de criação e viragem de BMs com entrada automática no Estoque"
        acoes={
          temPermissao("producao", "criar") && (
            <Button
              onClick={abrirModalNovo}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 w-full sm:w-auto h-11 sm:h-9 text-xs sm:text-sm justify-center"
            >
              <Plus className="size-4" />
              Lançar Produção & Viragem
            </Button>
          )
        }
      />

      {/* SELETOR DINÂMICO DE MÊS E ANO */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-blue-500/25 bg-blue-950/20 backdrop-blur shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
          {/* Botão Mês Anterior */}
          <Button
            variant="outline"
            size="icon"
            onClick={mesAnterior}
            className="size-9 rounded-lg border-border/60 hover:bg-white/10 text-slate-200"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {/* Popover Seletor de Mês e Ano */}
          <Popover open={popoverMesAberto} onOpenChange={setPopoverMesAberto}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 gap-2 font-bold text-xs sm:text-sm text-white border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 flex-1 sm:flex-none justify-center"
              >
                <CalendarDays className="size-4 text-blue-400" />
                <span>{rotuloMesAno}</span>
                <ChevronDown className="size-3.5 text-blue-400 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 bg-zinc-950 border-border/80" align="center">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Selecionar Mês</span>
                  <div className="flex gap-1">
                    {anosDisponiveis.map((a) => (
                      <button
                        key={a}
                        onClick={() => selecionarMesAno(mesAtivo, a)}
                        className={cn(
                          "px-2 py-0.5 text-xs font-bold rounded transition",
                          a === anoAtivo
                            ? "bg-blue-600 text-white"
                            : "text-muted-foreground hover:text-white hover:bg-white/10"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {NOMES_MESES.map((nome, idx) => {
                    const selecionado = idx === mesAtivo;
                    const esteMes = hoje.getFullYear() === anoAtivo && hoje.getMonth() === idx;

                    return (
                      <button
                        key={nome}
                        onClick={() => selecionarMesAno(idx, anoAtivo)}
                        className={cn(
                          "h-8 text-xs font-medium rounded-md transition text-center relative",
                          selecionado
                            ? "bg-blue-600 font-bold text-white shadow-xs"
                            : "text-slate-300 hover:bg-white/10 hover:text-white",
                          esteMes && !selecionado && "border border-blue-500/40 text-blue-400"
                        )}
                      >
                        {nome.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão Próximo Mês */}
          <Button
            variant="outline"
            size="icon"
            onClick={proximoMes}
            className="size-9 rounded-lg border-border/60 hover:bg-white/10 text-slate-200"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </Button>

          {/* Botão Mês Atual (quando navegando em outro período) */}
          {!ehMesAtual && (
            <Button
              variant="ghost"
              size="sm"
              onClick={irParaMesAtual}
              className="h-9 px-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 gap-1 ml-auto sm:ml-1"
            >
              <RotateCcw className="size-3" />
              <span>Hoje</span>
            </Button>
          )}
        </div>

        <div className="text-right sm:text-right text-[11px] text-muted-foreground">
          Exibindo dados de <strong className="text-blue-400 font-semibold">{NOMES_MESES[mesAtivo]} / {anoAtivo}</strong>
        </div>
      </section>

      {/* CARDS COM MÉTRICAS OPERACIONAIS DO MÊS ATIVO */}
      <section className="grid gap-2.5 sm:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3 sm:p-4 shadow-sm backdrop-blur">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Contas Viradas</span>
            <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-400" />
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{metricasProducao.totalViradas}</span>
            <span className="text-[10px] sm:text-xs text-emerald-300 font-semibold">no mês</span>
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
            {totalDisponiveis} prontas em estoque
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/25 bg-blue-950/20 p-3 sm:p-4 shadow-sm backdrop-blur">
          <p className="text-[11px] sm:text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span>BMs Criadas</span>
            <Layers className="size-3.5 sm:size-4 text-blue-400" />
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{metricasProducao.totalCriadas}</span>
            <span className="text-[10px] sm:text-xs text-blue-300 font-semibold">{metricasProducao.totalRegistros} lotes</span>
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-muted-foreground">registradas no período</p>
        </div>

        <div className="rounded-xl border border-red-500/25 bg-red-950/20 p-3 sm:p-4 shadow-sm backdrop-blur">
          <p className="text-[11px] sm:text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between">
            <span>Bloqueios / Quedas</span>
            <AlertTriangle className="size-3.5 sm:size-4 text-red-400" />
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{metricasProducao.totalBloqueios}</span>
            <span className="text-[10px] sm:text-xs text-red-300 font-semibold">perdas</span>
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-muted-foreground">quedas em esteira</p>
        </div>

        <div className="rounded-xl border border-purple-500/25 bg-purple-950/20 p-3 sm:p-4 shadow-sm backdrop-blur">
          <p className="text-[11px] sm:text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between">
            <span>Aproveitamento</span>
            <TrendingUp className="size-3.5 sm:size-4 text-purple-400" />
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">
              {metricasProducao.aproveitamentoMedio}%
            </span>
            <span className="text-[10px] sm:text-xs text-purple-300 font-semibold">taxa viragem</span>
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-muted-foreground">eficiência do mês</p>
        </div>

        <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-3 sm:p-4 shadow-sm backdrop-blur col-span-2 sm:col-span-1">
          <p className="text-[11px] sm:text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>Estoque Disponível</span>
            <Boxes className="size-3.5 sm:size-4 text-cyan-400" />
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white">{totalDisponiveis}</span>
            <span className="text-[10px] sm:text-xs text-cyan-300 font-semibold">{totalVendidas} vendidas</span>
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-muted-foreground">BMs prontas para envio</p>
        </div>
      </section>

      {/* CARDS RÁPIDOS POR LIMITE NO MÊS ATIVO */}
      <section className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {LIMITES_DISPONIVEIS.map((lim) => {
          const stats = resumoLimites[lim.valor] || { disponivel: 0, vendida: 0 };
          return (
            <div
              key={lim.valor}
              className="rounded-lg border border-border/50 bg-card/60 p-2.5 sm:p-3 shadow-xs backdrop-blur transition hover:border-blue-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase">{lim.rotulo}</span>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[9px] sm:text-[10px] font-bold px-1.5 py-0"
                >
                  {lim.valor.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-white">{stats.disponivel}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">prontas</span>
              </div>
              <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground">{stats.vendida} vendidas</p>
            </div>
          );
        })}
      </section>

      {/* FILTROS E BUSCA RESPONSIVOS TOUCH-FRIENDLY */}
      <section className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por operador, nome de BM, observações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-11 sm:h-9 text-xs sm:text-sm bg-card/50 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={filtroLimite} onValueChange={setFiltroLimite}>
            <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-9 text-xs sm:text-sm bg-card/50 font-medium">
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
              <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-9 text-xs sm:text-sm bg-card/50 font-medium">
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

      {/* ABAS RESPONSIVAS EM GRID (Evita compressão de texto no mobile) */}
      <Tabs value={abaAtiva} onValueChange={(v) => setAbaAtiva(v as any)} className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 w-full h-auto p-1 bg-muted/40 border border-border/40 rounded-xl gap-1">
          <TabsTrigger
            value="producao"
            className="gap-1.5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition"
          >
            <Activity className="size-3.5 sm:size-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Produção</span>
              <span className="hidden sm:inline">Lançamentos de Produção</span>
            </span>
            <Badge
              variant="secondary"
              className="ml-1 text-[10px] px-1.5 py-0 font-bold bg-white/10 text-white"
            >
              {producoesFiltradas.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="estoque"
            className="gap-1.5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition"
          >
            <Boxes className="size-3.5 sm:size-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Estoque BMs</span>
              <span className="hidden sm:inline">Inventário de BMs Prontas</span>
            </span>
            <Badge
              variant="secondary"
              className="ml-1 text-[10px] px-1.5 py-0 font-bold bg-white/10 text-white"
            >
              {bmsFiltradas.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* ABA 1: LANÇAMENTOS DE PRODUÇÃO DIÁRIA (Com cartões mobile & tabela desktop) */}
        {/* ========================================================================= */}
        <TabsContent value="producao" className="m-0">
          <section className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="p-3 sm:p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="size-4 text-blue-400" />
                  Histórico de Lançamentos de Produção ({NOMES_MESES[mesAtivo]}/{anoAtivo})
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  Lotes produzidos no mês selecionado: quantidades, perdas e aproveitamento.
                </p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                {producoesFiltradas.length} item(ns)
              </span>
            </div>

            {producaoQuery.isLoading ? (
              <div className="p-6">
                <CarregandoTabela colunas={8} />
              </div>
            ) : producoesFiltradas.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <Activity className="size-8 sm:size-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  Nenhum registro de produção encontrado em {NOMES_MESES[mesAtivo]} de {anoAtivo}.
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto">
                  Clique no botão "Lançar Produção & Viragem" para registrar o lote produzido neste período.
                </p>
              </div>
            ) : (
              <>
                {/* 1. VISUALIZAÇÃO EM CARTÕES PARA CELULAR / MOBILE (block md:hidden) */}
                <div className="block md:hidden divide-y divide-border/30">
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
                      <div key={prod.id} className="p-3.5 space-y-2.5 hover:bg-muted/20 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-blue-400" />
                            {prod.data_registro ? formatarData(prod.data_registro, fuso) : "—"}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold text-[11px]"
                            >
                              BM {lim.toUpperCase()}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-red-400"
                              onClick={() => {
                                if (window.confirm("Deseja realmente remover este lançamento de produção?")) {
                                  excluirProducaoMutation.mutate({ id: prod.id, estornarEstoque: true });
                                }
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                          <User className="size-3 text-blue-400" />
                          <span>Quem virou:</span>
                          <strong className="text-white">{prod.operador || prod.funcionario_nome || "—"}</strong>
                        </div>

                        {/* Grade compacta de métricas operacionais */}
                        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-card/60 border border-border/40 text-center">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Criadas</span>
                            <span className="text-xs font-bold text-slate-200">{criadas}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-400 block font-semibold">Viradas</span>
                            <span className="text-xs font-bold text-emerald-400">{viradas}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-red-400 block font-semibold">Bloqueios</span>
                            <span className="text-xs font-bold text-red-400">{bloq}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-purple-400 block font-semibold">Aprov.</span>
                            <span className="text-xs font-bold text-purple-300">{aproveitamento}%</span>
                          </div>
                        </div>

                        {(() => {
                          const bmsDoLote = bmsDoMes.filter(
                            (b) => b.producao_id === prod.id || (prod.nome_bm && prod.nome_bm.includes(b.nome))
                          );
                          return (
                            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/30 space-y-1">
                              {bmsDoLote.length > 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-semibold text-slate-300 block">BMs Geradas no Lote:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {bmsDoLote.map((b) => (
                                      <Badge
                                        key={b.id}
                                        variant="outline"
                                        className={cn(
                                          "gap-1 font-mono text-[10px] py-0.5 px-1.5 inline-flex items-center",
                                          b.estaDisponivel
                                            ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                                            : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
                                        )}
                                      >
                                        <span>{b.nome}</span>
                                        <span
                                          role="button"
                                          tabIndex={0}
                                          title={`Excluir BM ${b.nome}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Tem certeza de que deseja excluir a BM ${b.nome}?`)) {
                                              excluirBmMutation.mutate(b.id);
                                            }
                                          }}
                                          className="hover:text-red-400 text-muted-foreground/60 cursor-pointer ml-0.5 p-0.5 rounded transition"
                                        >
                                          <Trash2 className="size-2.5" />
                                        </span>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : prod.nome_bm ? (
                                <p className="font-mono text-blue-300 line-clamp-2">
                                  <strong>BMs:</strong> {prod.nome_bm}
                                </p>
                              ) : null}
                              {prod.motivo_queda && prod.motivo_queda !== "nenhum" && (
                                <p className="text-red-400 font-semibold">
                                  Queda: {prod.motivo_queda.replace(/_/g, " ")}
                                </p>
                              )}
                              {prod.observacoes && (
                                <p className="italic text-slate-400 line-clamp-2">{prod.observacoes}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* 2. VISUALIZAÇÃO EM TABELA COMPLETA COM SCROLL HORIZONTAL (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="whitespace-nowrap">Data</TableHead>
                        <TableHead className="whitespace-nowrap">Operador / Responsável</TableHead>
                        <TableHead className="whitespace-nowrap">Limite</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Criadas</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Viradas (Sucesso)</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Bloqueios</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Aproveitamento</TableHead>
                        <TableHead className="whitespace-nowrap">BMs Geradas / Observações</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Ação</TableHead>
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
                            <TableCell className="text-xs text-slate-200 font-medium whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <User className="size-3 text-blue-400" />
                                {prod.operador || prod.funcionario_nome || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
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
                            <TableCell className="text-xs max-w-sm">
                              {(() => {
                                const bmsDoLote = bmsDoMes.filter(
                                  (b) => b.producao_id === prod.id || (prod.nome_bm && prod.nome_bm.includes(b.nome))
                                );
                                return (
                                  <div className="space-y-1">
                                    {bmsDoLote.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 max-w-xs">
                                        {bmsDoLote.map((b) => (
                                          <Badge
                                            key={b.id}
                                            variant="outline"
                                            className={cn(
                                              "gap-1 font-mono text-[10px] py-0.5 px-1.5 inline-flex items-center",
                                              b.estaDisponivel
                                                ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                                                : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
                                            )}
                                          >
                                            <span>{b.nome}</span>
                                            <span
                                              role="button"
                                              tabIndex={0}
                                              title={`Excluir BM ${b.nome}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Tem certeza de que deseja excluir a BM ${b.nome}?`)) {
                                                  excluirBmMutation.mutate(b.id);
                                                }
                                              }}
                                              className="hover:text-red-400 text-muted-foreground/60 cursor-pointer ml-0.5 p-0.5 rounded transition"
                                            >
                                              <Trash2 className="size-2.5" />
                                            </span>
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : prod.nome_bm ? (
                                      <p className="font-mono text-[11px] text-blue-300 truncate" title={prod.nome_bm}>
                                        {prod.nome_bm}
                                      </p>
                                    ) : null}
                                    {prod.motivo_queda && prod.motivo_queda !== "nenhum" && (
                                      <p className="text-[11px] text-red-400 font-semibold">
                                        Queda: {prod.motivo_queda.replace(/_/g, " ")}
                                      </p>
                                    )}
                                    {prod.observacoes && (
                                      <p className="text-[11px] text-muted-foreground truncate" title={prod.observacoes}>
                                        {prod.observacoes}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-red-400"
                                title="Excluir lançamento de produção"
                                onClick={() => {
                                  if (window.confirm("Deseja realmente remover este lançamento de produção?")) {
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
              </>
            )}
          </section>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 2: INVENTÁRIO DE BMS PRONTAS (ESTOQUE) */}
        {/* ========================================================================= */}
        <TabsContent value="estoque" className="m-0">
          <section className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="p-3 sm:p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="size-4 text-blue-400" />
                  Inventário de BMs Prontas para Venda ({NOMES_MESES[mesAtivo]}/{anoAtivo})
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  Cada BM nominal possui limite específico pronta para entrega imediata.
                </p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                {bmsFiltradas.length} item(ns)
              </span>
            </div>

            {bmsEstoqueQuery.isLoading ? (
              <div className="p-6">
                <CarregandoTabela colunas={6} />
              </div>
            ) : bmsFiltradas.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <Boxes className="size-8 sm:size-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  Nenhuma BM encontrada em {NOMES_MESES[mesAtivo]} de {anoAtivo}.
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto">
                  Clique em "Lançar Produção & Viragem" para registrar e disponibilizar BMs no estoque.
                </p>
              </div>
            ) : (
              <>
                {/* 1. CARDS PARA CELULAR (block md:hidden) */}
                <div className="block md:hidden divide-y divide-border/30">
                  {bmsFiltradas.map((bm: any) => (
                    <div key={bm.id} className="p-3.5 space-y-2 hover:bg-muted/20 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{bm.nome}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold text-[11px]"
                          >
                            BM {bm.limite.toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-red-400"
                            onClick={() => {
                              if (window.confirm(`Tem certeza de que deseja excluir a BM ${bm.nome}?`)) {
                                excluirBmMutation.mutate(bm.id);
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Operador: <strong>{bm.responsavel}</strong></span>
                        <span className="text-muted-foreground">{bm.data ? formatarData(bm.data, fuso) : "—"}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs">
                        {bm.destinatario ? (
                          <span className="text-emerald-400 font-semibold truncate max-w-[180px]">
                            Para: {bm.destinatario}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">Aguardando venda</span>
                        )}

                        {bm.estaDisponivel ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] gap-1">
                            <CheckCircle2 className="size-3" />
                            DISPONÍVEL
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-bold text-[10px]">
                            VENDIDA
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. TABELA COMPLETA COM SCROLL HORIZONTAL (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="whitespace-nowrap">Nome da BM</TableHead>
                        <TableHead className="whitespace-nowrap">Limite Virado</TableHead>
                        <TableHead className="whitespace-nowrap">Quem Virou (Operador)</TableHead>
                        <TableHead className="whitespace-nowrap">Data de Entrada</TableHead>
                        <TableHead className="whitespace-nowrap">Destinatário / Enviado Para</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Status no Estoque</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bmsFiltradas.map((bm: any) => (
                        <TableRow
                          key={bm.id}
                          className="border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-bold text-white font-mono text-xs whitespace-nowrap">
                            {bm.nome}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold text-xs"
                            >
                              BM {bm.limite.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-300 whitespace-nowrap">{bm.responsavel}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {bm.data ? formatarData(bm.data, fuso) : "—"}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {bm.destinatario ? (
                              <span className="text-emerald-400 font-semibold">{bm.destinatario}</span>
                            ) : (
                              <span className="text-muted-foreground/50 italic">Aguardando venda</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
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
                          <TableCell className="text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-400"
                              onClick={() => {
                                if (window.confirm(`Tem certeza de que deseja excluir a BM ${bm.nome}?`)) {
                                  excluirBmMutation.mutate(bm.id);
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* MODAL: LANÇAR PRODUÇÃO & BM VIRADA */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <Sparkles className="size-5 text-blue-400" />
              Lançar Produção & BM Virada
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Cadastre a produção do lote. As informações ficarão salvas no histórico de produção e as BMs entrarão no estoque prontas para venda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    className="h-10 sm:h-9 text-xs sm:text-sm"
                  />
                ) : (
                  <Select value={operador} onValueChange={setOperador}>
                    <SelectTrigger id="op" className="h-10 sm:h-9 text-xs sm:text-sm">
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
                  className="h-10 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* LIMITE PARA O QUAL VIROU */}
            <div className="space-y-1.5">
              <Label htmlFor="lim" className="text-xs font-semibold">
                Para qual limite virou? *
              </Label>
              <Select value={limiteBm} onValueChange={setLimiteBm}>
                <SelectTrigger id="lim" className="h-10 sm:h-9 text-xs sm:text-sm font-bold text-blue-400">
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
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  (1 por linha para cadastrar lote)
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
            <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-border/40 pt-3">
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-[11px] text-muted-foreground">BMs Criadas</Label>
                <Input
                  type="number"
                  min="0"
                  value={bmsCriadas}
                  onChange={(e) => setBmsCriadas(e.target.value)}
                  className="h-9 sm:h-8 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold">Contas Viradas</Label>
                <Input
                  type="number"
                  min="0"
                  value={contasViradas}
                  onChange={(e) => setContasViradas(e.target.value)}
                  className="h-9 sm:h-8 text-xs font-bold text-emerald-400"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-[11px] text-red-400 font-semibold">Bloqueios</Label>
                <Input
                  type="number"
                  min="0"
                  value={bloqueios}
                  onChange={(e) => setBloqueios(e.target.value)}
                  className="h-9 sm:h-8 text-xs font-bold text-red-400"
                />
              </div>
            </div>

            {Number(bloqueios) > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-red-400">Motivo principal da queda</Label>
                <Select value={motivoQueda} onValueChange={setMotivoQueda}>
                  <SelectTrigger className="h-10 sm:h-9 text-xs sm:text-sm">
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
                className="h-10 sm:h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-3 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAberto(false)}
              disabled={salvarProducaoMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => salvarProducaoMutation.mutate()}
              disabled={salvarProducaoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold w-full sm:w-auto order-1 sm:order-2"
            >
              {salvarProducaoMutation.isPending ? "Salvando..." : "Salvar Produção & Enviar ao Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
