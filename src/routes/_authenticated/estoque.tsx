import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  User,
  Send,
  Building2,
  Calendar,
  History,
  DollarSign,
  ExternalLink,
  Factory,
  Shield,
  Info
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/use-sessao";
import {
  listarEstoqueLocal,
  salvarItemEstoqueLocal,
  alterarStatusEstoqueLocal,
  excluirItemEstoqueLocal,
  listarContasEnviadasLocal,
  registrarContaEnviadaLocal,
} from "@/lib/estoque.functions";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CarregandoTabela, EstadoVazio } from "@/components/comum/estados";
import { formatarMoeda, formatarData } from "@/lib/formatadores";
import { BmOperationalForm } from "@/components/comum/bm-operational-form";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque | Gestão BMs" },
      { name: "description", content: "Controle de saldo, ativos operacionais e disponibilidade de BMs, Perfis e Contas." },
      { property: "og:title", content: "Estoque | Gestão BMs" },
      { property: "og:description", content: "Controle de saldo e ativos disponíveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEstoque,
});

type ItemEstoque = {
  id: string;
  empresa_id: string;
  tipo_ativo: string;
  nome_bm?: string | null;
  limite_bm?: string | null;
  tem_template?: boolean | null;
  data_criacao?: string | null;
  responsavel?: string | null;
  destinatario?: string | null;
  status_envio?: string | null;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  custo_medio_unitario: number | null;
  status: string;
  origem?: string | null;
  producao_id?: string | null;
  contingencia_id?: string | null;
  updated_at?: string;
};

type ContaEnviada = {
  id: string;
  empresa_id: string;
  bm_id?: string | null;
  venda_id?: string | null;
  nome_bm: string;
  limite_bm?: string | null;
  destinatario_cliente: string;
  responsavel_envio?: string | null;
  data_envio: string;
  custo_unitario?: number | null;
  valor_venda?: number | null;
  status_envio: string;
  created_at?: string;
};

const LIMITES_BM = ["250", "2K", "10K", "100K"] as const;

const TIPOS_ATIVO = [
  { valor: "BM", rotulo: "BM (Business Manager)" },
  { valor: "BM 250", rotulo: "BM 250" },
  { valor: "BM 2K", rotulo: "BM 2K" },
  { valor: "BM 10K", rotulo: "BM 10K" },
  { valor: "BM 100K", rotulo: "BM 100K" },
  { valor: "BM Ilimitada", rotulo: "BM Ilimitada" },
  { valor: "Perfil Farmado", rotulo: "Perfil Farmado" },
  { valor: "Outro", rotulo: "Outro Tipo de Ativo" },
];

function extrairInfoBM(item: Partial<ItemEstoque> & { tipo_ativo: string }) {
  const limiteExtraido = item.limite_bm || (item.tipo_ativo?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0]?.toUpperCase() ?? "");
  
  // Prioridade absoluta para o nome customizado salvo:
  let nomeCustom = item.nome_bm?.trim() || "";
  
  if (!nomeCustom && item.tipo_ativo) {
    // Se tipo_ativo guardou "Nome [2K]" ou "Nome (2K)", extrair o nome limpo
    const limpo = item.tipo_ativo
      .replace(/\s*\[(250|2K|10K|100K|Ilimitada)\]/i, "")
      .replace(/\s*\((250|2K|10K|100K|Ilimitada)\)/i, "")
      .trim();
    if (limpo && !/^BM(\s*(250|2K|10K|100K|Ilimitada))?$/i.test(limpo)) {
      nomeCustom = limpo;
    }
  }

  const nomeExibicao = nomeCustom || (limiteExtraido ? `BM ${limiteExtraido}` : (item.tipo_ativo || "BM"));
  return { nome: nomeExibicao, limite: limiteExtraido, temNomeCustom: Boolean(nomeCustom) };
}

function DashboardEstoque() {
  const { empresa } = useSessao();
  const { data: estoque } = useQuery({
    queryKey: ["estoque", "bm_stock", empresa?.id],
    enabled: !!empresa?.id,
    queryFn: async () => {
      try {
        const locais = await listarEstoqueLocal({ data: { empresa_id: empresa!.id } });
        return (locais || []) as any[];
      } catch (errLocal) {
        console.warn("Erro ao buscar estoque local, tentando fallback remoto:", errLocal);
        const { data, error } = await supabase
          .from("estoque")
          .select("*")
          .eq("empresa_id", empresa!.id);
        if (error) return [];
        return (data || []) as any[];
      }
    },
    staleTime: 1000 * 60 * 2,
  });

  const getQtd = (tipo: string) => {
    return (estoque || [])
      .filter((e) => {
        const st = (e.status_envio || e.status || "").toLowerCase();
        const estaDisponivel = st === "disponivel" || st === "em_estoque" || st === "pronta_envio";
        if (!estaDisponivel && Number(e.quantidade_disponivel || 0) <= 0) return false;

        const lim = (e.limite_bm || (e.tipo_ativo?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] ?? "")).toUpperCase();
        if (tipo === "BM 250") return lim === "250" || e.tipo_ativo?.includes("250");
        if (tipo === "BM 2K") return lim === "2K" || e.tipo_ativo?.includes("2K") || e.tipo_ativo === "BM 2K";
        if (tipo === "BM 10K") return lim === "10K" || e.tipo_ativo?.includes("10K");
        if (tipo === "BM 100K") return lim === "100K" || e.tipo_ativo?.includes("100K");
        if (tipo === "BM Ilimitada") return lim === "ILIMITADA" || e.tipo_ativo?.toLowerCase().includes("ilimitada");
        return e.tipo_ativo === tipo;
      })
      .reduce((acc, curr) => acc + Number(curr.quantidade_disponivel || 0), 0);
  };

  const tipos = ["BM 250", "BM 2K", "BM 10K", "BM 100K", "BM Ilimitada", "Perfil Farmado"];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
      {tipos.map((tipo) => (
        <CartaoMetrica
          key={tipo}
          rotulo={tipo}
          valor={String(getQtd(tipo))}
          icone={Package}
          corValor="text-blue-500"
          detalhe="Em estoque"
        />
      ))}
    </div>
  );
}

function PaginaEstoque() {
  const { empresa, temPermissao, fuso } = useSessao();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemEstoque | null>(null);

  // Campos do Formulário
  const [tipoAtivo, setTipoAtivo] = useState("BM");
  const [nomeBm, setNomeBm] = useState("");
  const [limiteBm, setLimiteBm] = useState<string>("2K");
  const [temTemplate, setTemTemplate] = useState(false);
  const [dataCriacao, setDataCriacao] = useState(() => new Date().toISOString().slice(0, 10));
  const [responsavel, setResponsavel] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [statusEnvio, setStatusEnvio] = useState<string>("disponivel");
  const [qtdDisponivel, setQtdDisponivel] = useState("1");
  const [qtdReservada, setQtdReservada] = useState("0");
  const [custoMedio, setCustoMedio] = useState("0");
  const [statusGenerico, setStatusGenerico] = useState("em_estoque");

  // Confirmação de Exclusão
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemEstoque | null>(null);

  // Consulta de Membros da Equipe para preenchimento rápido
  const consultaEquipe = useQuery({
    queryKey: ["equipe-estoque", empresa?.id],
    enabled: Boolean(empresa?.id) && modalAberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome")
        .order("nome");
      if (error) return [];
      return data || [];
    },
  });

  // Consulta de Clientes para preenchimento rápido
  const consultaClientes = useQuery({
    queryKey: ["clientes-estoque", empresa?.id],
    enabled: Boolean(empresa?.id) && modalAberto,
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

  // Consulta principal do Estoque (Supabase Primário + Fallback Local)
  const { data: itensEstoque, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["estoque-lista", "bm_stock", empresa?.id],
    enabled: !!empresa?.id,
    staleTime: 0,
    queryFn: async () => {
      // 1. Supabase (Repositório Central em Nuvem)
      try {
        const { data, error } = await supabase
          .from("estoque")
          .select("*")
          .eq("empresa_id", empresa!.id)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data as ItemEstoque[];
        }
      } catch (errSupabase) {
        console.warn("Aviso ao buscar estoque no Supabase:", errSupabase);
      }

      // 2. Fallback no banco local
      try {
        const locais = await listarEstoqueLocal({ data: { empresa_id: empresa!.id } });
        return (locais || []) as ItemEstoque[];
      } catch (errLocal) {
        return [];
      }
    },
  });

  const [abaAtiva, setAbaAtiva] = useState<string>("estoque");

  // Consulta de Contas Enviadas (Persistência Local Integrada)
  const { data: contasEnviadas, isLoading: carregandoEnvios, refetch: refetchEnvios } = useQuery({
    queryKey: ["contas_enviadas", "historico_envios", empresa?.id],
    enabled: !!empresa?.id,
    queryFn: async () => {
      try {
        const locais = await listarContasEnviadasLocal({ data: { empresa_id: empresa!.id } });
        return (locais || []) as any[];
      } catch (errLocal) {
        console.warn("Erro ao buscar histórico local, tentando fallback:", errLocal);
        const res = await supabase
          .from("contas_enviadas")
          .select("*")
          .eq("empresa_id", empresa!.id)
          .order("data_envio", { ascending: false });
        return (res.data || []) as any[];
      }
    },
    staleTime: 1000 * 60 * 1,
  });

  // Identifica se o Tipo de Ativo atual é uma BM
  const isBM = useMemo(() => {
    return tipoAtivo.trim().toUpperCase().startsWith("BM");
  }, [tipoAtivo]);

  function abrirModal(item?: ItemEstoque) {
    if (item) {
      const { nome, limite, temNomeCustom } = extrairInfoBM(item);
      setItemEditando(item);
      setTipoAtivo(item.tipo_ativo && !item.tipo_ativo.toUpperCase().startsWith("BM") ? item.tipo_ativo : "BM");
      setNomeBm(temNomeCustom ? nome : (item.nome_bm || ""));
      setLimiteBm(limite || "2K");
      setTemTemplate(Boolean(item.tem_template));
      setDataCriacao(item.data_criacao ? item.data_criacao.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setResponsavel(item.responsavel || "");
      setDestinatario(item.destinatario || "");
      setStatusEnvio(item.status_envio || (item.status === "em_estoque" ? "disponivel" : item.status === "baixo_estoque" ? "reservada" : "enviada"));
      setQtdDisponivel(String(item.quantidade_disponivel ?? 1));
      setQtdReservada(String(item.quantidade_reservada ?? 0));
      setCustoMedio(String(item.custo_medio_unitario ?? 0));
      setStatusGenerico(item.status || "em_estoque");
    } else {
      setItemEditando(null);
      setTipoAtivo("BM");
      setNomeBm("");
      setLimiteBm("2K");
      setTemTemplate(false);
      setDataCriacao(new Date().toISOString().slice(0, 10));
      setResponsavel("");
      setDestinatario("");
      setStatusEnvio("disponivel");
      setQtdDisponivel("1");
      setQtdReservada("0");
      setCustoMedio("0");
      setStatusGenerico("em_estoque");
    }
    setModalAberto(true);
  }

  // Mutation de Salvar (Persistência Local Integrada)
  const salvarMutation = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");

      const nomeDigitado = nomeBm.trim();
      const rawLimite = limiteBm || "2k";
      const limiteEscolhido = rawLimite.toLowerCase().includes("100k")
        ? "100k"
        : rawLimite.toLowerCase().includes("10k")
        ? "10k"
        : rawLimite.toLowerCase().includes("2k")
        ? "2k"
        : "250";

      let tipoAtivoFinal = tipoAtivo;
      if (isBM) {
        if (nomeDigitado) {
          tipoAtivoFinal = nomeDigitado.toLowerCase().includes(limiteEscolhido.toLowerCase())
            ? nomeDigitado
            : `${nomeDigitado} [${limiteEscolhido}]`;
        } else {
          tipoAtivoFinal = `BM ${limiteEscolhido}`;
        }
      }

      const estaDisponivel = statusEnvio === "disponivel" || statusEnvio === "pronta_envio";
      const statusFinal = isBM 
        ? (estaDisponivel ? "disponivel" : statusEnvio === "reservada" ? "baixo_estoque" : "vendida")
        : statusGenerico;

      const payloadLocal = {
        id: itemEditando?.id || crypto.randomUUID(),
        empresa_id: empresa.id,
        tipo_ativo: tipoAtivoFinal,
        nome: isBM ? (nomeDigitado || null) : null,
        nome_bm: isBM ? (nomeDigitado || null) : null,
        limite: isBM ? limiteEscolhido : null,
        limite_bm: isBM ? limiteEscolhido : null,
        tem_template: isBM ? temTemplate : false,
        data_criacao: isBM ? (dataCriacao || new Date().toISOString().slice(0, 10)) : null,
        responsavel: isBM ? (responsavel.trim() || null) : null,
        criador_responsavel: isBM ? (responsavel.trim() || null) : null,
        destinatario: isBM ? (destinatario.trim() || null) : null,
        status_envio: isBM ? statusEnvio : null,
        quantidade_disponivel: Number(qtdDisponivel) || 0,
        quantidade_reservada: Number(qtdReservada) || 0,
        custo_medio_unitario: Number(custoMedio.replace(",", ".")) || 0,
        status: statusFinal,
      };

      // 1. Obter usuário autenticado para envio seguro
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ...payloadLocal,
        user_id: user?.id || null,
      };

      // 2. Persistir no Supabase com tratamento e log detalhado de erro
      try {
        if (itemEditando) {
          const { error: errUpdate } = await supabase
            .from("estoque")
            .update(payload as any)
            .eq("id", itemEditando.id);
          if (errUpdate) {
            console.warn("Aviso ao atualizar com payload completo, tentando modo compatível:", errUpdate);
            const { user_id, nome, limite, criador_responsavel, ...payloadCompativel } = payload;
            const resFallback = await supabase
              .from("estoque")
              .update(payloadCompativel as any)
              .eq("id", itemEditando.id);
            if (resFallback.error) {
              console.error("Erro detalhado ao atualizar no Supabase:", resFallback.error);
              throw new Error(resFallback.error.message || "Erro ao atualizar no estoque");
            }
          }
        } else {
          const { error: errInsert } = await supabase
            .from("estoque")
            .insert(payload as any);
          if (errInsert) {
            console.warn("Aviso ao inserir com payload completo, tentando modo compatível:", errInsert);
            const { user_id, nome, limite, criador_responsavel, ...payloadCompativel } = payload;
            const resFallback = await supabase
              .from("estoque")
              .insert(payloadCompativel as any);
            if (resFallback.error) {
              console.error("Erro detalhado ao inserir no Supabase:", resFallback.error);
              throw new Error(resFallback.error.message || "Erro ao salvar no estoque");
            }
          }
        }
      } catch (errSupabase: any) {
        console.error("Erro detalhado:", errSupabase);
        throw errSupabase;
      }

      // 3. Sincronização secundária local no SQLite (protegida contra bloqueios de EPERM do SO)
      try {
        const resLocal = await salvarItemEstoqueLocal({ data: payload });
        const estoqueSalvoId = resLocal?.id || payload.id;

        const ehEnviada = statusEnvio === "enviada" || (isBM && Boolean(destinatario.trim()) && statusEnvio !== "disponivel");
        if (ehEnviada) {
          try {
            await registrarContaEnviadaLocal({
              data: {
                empresa_id: empresa.id,
                bm_id: estoqueSalvoId,
                nome_bm: nomeDigitado || tipoAtivoFinal,
                limite_bm: limiteEscolhido,
                destinatario_cliente: destinatario.trim() || "Cliente não informado",
                responsavel_envio: responsavel.trim() || null,
                data_envio: dataCriacao || new Date().toISOString().slice(0, 10),
                custo_unitario: Number(custoMedio.replace(",", ".")) || 0,
                valor_venda: 0,
                status_envio: "enviada",
              },
            });
          } catch (eH) {
            console.warn("Aviso ao salvar histórico de conta enviada local:", eH);
          }
        }
      } catch (errLocal: any) {
        console.warn("Aviso SQLite local (não impeditivo se EPERM):", errLocal);
      }
    },
    onSuccess: () => {
      toast.success(itemEditando ? "✓ Ativo atualizado com sucesso!" : "✓ Salvo no estoque com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["contas_enviadas"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard_metrics"] });
      setModalAberto(false);
    },
    onError: (err: Error) => {
      console.error("Erro detalhado:", err);
      toast.error("Erro ao salvar no estoque", { description: err.message });
    },
  });

  const handleSaveStock = () => {
    salvarMutation.mutate();
  };

  // Mutation rápida para alternar status (Mover para Contingência / Liberar para Estoque / Bloquear)
  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus, novaOrigem }: { id: string; novoStatus: string; novaOrigem?: string }) => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      
      // 1. Atualiza localmente
      await alterarStatusEstoqueLocal({
        data: {
          id,
          empresa_id: empresa.id,
          novoStatus,
          novaOrigem,
        },
      });

      // 2. Tenta refletir no Supabase em segundo plano
      try {
        const payload: any = {
          status_envio: novoStatus,
          status: (novoStatus === "disponivel" || novoStatus === "pronta_envio") ? "em_estoque" : novoStatus === "reservada" ? "baixo_estoque" : "esgotado",
          quantidade_disponivel: (novoStatus === "disponivel" || novoStatus === "pronta_envio") ? 1 : 0,
          updated_at: new Date().toISOString(),
        };
        if (novaOrigem) payload.origem = novaOrigem;
        await supabase.from("estoque").update(payload).eq("id", id);
      } catch (e) {
        // Ignora erro remoto
      }
    },
    onSuccess: (_, variables) => {
      const msg = variables.novoStatus === "disponivel"
        ? "✓ Ativo liberado para Estoque Disponível!"
        : variables.novoStatus === "reservada"
        ? "🛡️ Ativo alocado para Contingência!"
        : "⚠️ Ativo marcado como Esgotado / Bloqueado.";
      toast.success(msg);
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard_metrics"] });
    },
    onError: (err: Error) => {
      toast.error("Erro ao alterar status do ativo", { description: err.message });
    },
  });

  // Mutation de Excluir (Persistência Local Integrada)
  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      
      // 1. Supabase (nuvem)
      const { error: erroSupabase } = await supabase.from("estoque").delete().eq("id", id);
      if (erroSupabase) {
        console.warn("Aviso ao excluir no Supabase:", erroSupabase);
      }

      // 2. Local
      try {
        await excluirItemEstoqueLocal({ data: { id, empresa_id: empresa.id } });
      } catch (errLocal) {
        console.warn("Aviso ao excluir local:", errLocal);
      }
    },
    onSuccess: () => {
      toast.success("Item removido do estoque.");
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-disponivel-venda"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard_metrics"] });
      setItemParaExcluir(null);
    },
    onError: (err: Error) => {
      toast.error("Não foi possível excluir", { description: err.message });
    },
  });

  // Filtragem dos itens na tabela
  const itensFiltrados = useMemo(() => {
    return (itensEstoque || []).filter((item) => {
      // Filtro de busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const bateNome = item.nome_bm?.toLowerCase().includes(termo);
        const bateTipo = item.tipo_ativo?.toLowerCase().includes(termo);
        const bateResp = item.responsavel?.toLowerCase().includes(termo);
        const bateDest = item.destinatario?.toLowerCase().includes(termo);
        const bateLimite = item.limite_bm?.toLowerCase().includes(termo);
        if (!bateNome && !bateTipo && !bateResp && !bateDest && !bateLimite) return false;
      }

      // Filtro por Tipo / Origem
      if (filtroTipo !== "todos") {
        if (filtroTipo === "bm" && !item.tipo_ativo.toUpperCase().startsWith("BM")) return false;
        if (filtroTipo === "perfil" && !item.tipo_ativo.toLowerCase().includes("perfil")) return false;
        if (filtroTipo === "producao" && item.origem !== "producao") return false;
        if (filtroTipo === "contingencia" && item.origem !== "contingencia") return false;
      }

      // Filtro por Status
      if (filtroStatus !== "todos") {
        const st = (item.status_envio || item.status || "").toLowerCase();
        if (filtroStatus === "disponivel" && !st.includes("disponivel") && !st.includes("em_estoque")) return false;
        if (filtroStatus === "reservada" && !st.includes("reservada") && !st.includes("baixo_estoque")) return false;
        if (filtroStatus === "enviada" && !st.includes("enviada") && !st.includes("esgotado")) return false;
      }

      return true;
    });
  }, [itensEstoque, busca, filtroTipo, filtroStatus]);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Estoque"
        descricao="Controle de saldo, ativos detalhados e disponibilidade operacional de BMs."
        modulo="estoque"
        acoes={
          temPermissao("estoque", "criar") && (
            <BotaoAdicionar
              modulo="Estoque"
              rotulo="Adicionar em Estoque"
              aoClicar={() => abrirModal()}
            />
          )
        }
      />

      {/* Cards de Métricas */}
      <DashboardEstoque />

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da BM, tipo, criador ou destino..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Tipo / Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Ativos</SelectItem>
              <SelectItem value="bm">Apenas BMs</SelectItem>
              <SelectItem value="perfil">Apenas Perfis</SelectItem>
              <SelectItem value="producao">⚙️ Da Produção</SelectItem>
              <SelectItem value="contingencia">🛡️ Contingência</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservada">Reservada</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Abas de Navegação: Estoque Ativo vs Histórico de Envios */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full space-y-4">
        <TabsList className="bg-muted/40 p-1 border border-border/40">
          <TabsTrigger value="estoque" className="gap-2 text-xs">
            <Package className="size-3.5" />
            Itens em Estoque ({itensFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="envios" className="gap-2 text-xs">
            <History className="size-3.5 text-blue-400" />
            Histórico de Envios ({(contasEnviadas || []).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4 mt-0">
          {/* Tabela de Itens em Estoque */}
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <CarregandoTabela colunas={7} />
              </div>
            ) : isError ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="size-8 text-destructive mx-auto" />
                <p className="text-sm text-destructive font-medium">Erro ao carregar estoque: {(error as Error).message}</p>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className="p-8">
                <EstadoVazio
                  titulo="Nenhum item em estoque encontrado"
                  descricao={busca ? "Tente ajustar os filtros ou termo de busca." : "Adicione novas BMs ou ativos para gerenciar a esteira de estoque."}
                  acao={
                    temPermissao("estoque", "criar") ? (
                      <Button size="sm" onClick={() => abrirModal()}>
                        <Plus className="mr-1.5 size-4" />
                        Adicionar primeiro item
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[260px]">Ativo / Nome da BM</TableHead>
                      <TableHead className="w-[90px] text-center">Limite</TableHead>
                      <TableHead className="w-[120px] text-center">Template</TableHead>
                      <TableHead className="hidden lg:table-cell">Criador / Resp.</TableHead>
                      <TableHead className="hidden md:table-cell">Destinatário / Cliente</TableHead>
                      <TableHead className="text-center w-[90px]">Disponível</TableHead>
                      <TableHead className="w-[130px] text-center">Status / Envio</TableHead>
                      <TableHead className="w-[90px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensFiltrados.map((item) => {
                      const ehBm = item.tipo_ativo?.toUpperCase().startsWith("BM") || Boolean(item.nome_bm) || Boolean(item.limite_bm);
                      const { nome, limite } = extrairInfoBM(item);
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                          {/* Nome do Ativo */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                                {ehBm ? (
                                  <>
                                    <Sparkles className="size-3.5 text-blue-400 shrink-0" />
                                    <span className="font-bold text-white tracking-tight">{nome}</span>
                                    {limite && (
                                      <Badge 
                                        variant="outline"
                                        className={`
                                          font-bold text-[10px] px-1.5 py-0 h-4.5
                                          ${limite === "250" ? "border-sky-500/40 text-sky-400 bg-sky-500/10" : ""}
                                          ${limite === "2K" ? "border-amber-500/40 text-amber-400 bg-amber-500/10" : ""}
                                          ${limite === "10K" ? "border-purple-500/40 text-purple-400 bg-purple-500/10" : ""}
                                          ${limite === "100K" ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : ""}
                                        `}
                                      >
                                        {limite}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span>{item.tipo_ativo}</span>
                                )}

                                {/* Badge de Origem Integrada: Produção ou Contingência */}
                                {item.origem === "producao" && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button 
                                        type="button"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 transition-colors"
                                        title="Clique para detalhes da produção"
                                      >
                                        <Factory className="size-2.5" />
                                        <span>Produção</span>
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-popover border-border/60 shadow-lg space-y-2">
                                      <div className="flex items-center gap-1.5 font-bold text-cyan-400 border-b border-border/40 pb-1.5">
                                        <Factory className="size-3.5" />
                                        <span>Ativo Criado na Produção</span>
                                      </div>
                                      <div className="space-y-1 text-muted-foreground">
                                        <div className="flex justify-between">
                                          <span>Responsável:</span>
                                          <span className="text-foreground font-medium">{item.responsavel || "Equipe"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Data de Entrada:</span>
                                          <span className="text-foreground font-medium">{item.data_criacao ? formatarData(item.data_criacao, fuso) : "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Status no Estoque:</span>
                                          <span className="text-foreground font-medium">{item.status_envio || "Disponível"}</span>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}

                                {item.origem === "contingencia" && (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/30"
                                    title="Alocado da contingência"
                                  >
                                    <Shield className="size-2.5" />
                                    <span>Contingência</span>
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                {item.data_criacao && (
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="size-3 text-muted-foreground/60" />
                                    {formatarData(item.data_criacao, fuso)}
                                  </span>
                                )}
                              </span>
                            </div>
                          </TableCell>

                          {/* Tag de Limite */}
                          <TableCell className="text-center">
                            {limite ? (
                              <Badge 
                                variant="outline"
                                className={`
                                  font-bold text-[11px] px-2 py-0.5
                                  ${limite === "250" ? "border-sky-500/40 text-sky-400 bg-sky-500/10" : ""}
                                  ${limite === "2K" ? "border-amber-500/40 text-amber-400 bg-amber-500/10" : ""}
                                  ${limite === "10K" ? "border-purple-500/40 text-purple-400 bg-purple-500/10" : ""}
                                  ${limite === "100K" ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : ""}
                                `}
                              >
                                {limite}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Template */}
                          <TableCell className="text-center">
                            {ehBm ? (
                              item.tem_template ? (
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] gap-1 px-1.5">
                                  <Layers className="size-3 text-emerald-400" />
                                  Com Template
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/60 text-[11px]">Sem Template</span>
                              )
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Responsável */}
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {item.responsavel ? (
                              <span className="inline-flex items-center gap-1 text-foreground/90 font-medium">
                                <User className="size-3 text-muted-foreground" />
                                {item.responsavel}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          {/* Destinatário */}
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {item.destinatario ? (
                              <span className="inline-flex items-center gap-1 text-foreground/90 font-medium">
                                <Send className="size-3 text-blue-400" />
                                {item.destinatario}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          {/* Quantidade Disponível */}
                          <TableCell className="text-center font-bold text-sm">
                            {item.quantidade_disponivel}
                          </TableCell>

                          {/* Status / Envio */}
                          <TableCell className="text-center">
                            {(() => {
                              const st = (item.status_envio || item.status || "disponivel").toLowerCase();
                              if (st.includes("enviada") || st.includes("esgotado") || Number(item.quantidade_disponivel) === 0) {
                                return (
                                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs">
                                    {Number(item.quantidade_disponivel) === 0 ? "Esgotado" : "Enviada"}
                                  </Badge>
                                );
                              }
                              if (st.includes("reservada") || st.includes("baixo_estoque")) {
                                return (
                                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs">
                                    Reservada
                                  </Badge>
                                );
                              }
                              return (
                                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs">
                                  Disponível
                                </Badge>
                              );
                            })()}
                          </TableCell>

                          {/* Ações */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Ação rápida de Contingência / Liberação */}
                              {item.origem === "contingencia" || (item.status_envio === "reservada") ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => alterarStatusMutation.mutate({ id: item.id, novoStatus: "disponivel", novaOrigem: "producao" })}
                                  title="Liberar para Estoque Disponível"
                                >
                                  <Package className="size-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-purple-400/80 hover:text-purple-400 hover:bg-purple-500/10"
                                  onClick={() => alterarStatusMutation.mutate({ id: item.id, novoStatus: "reservada", novaOrigem: "contingencia" })}
                                  title="Mover para Contingência (Reserva)"
                                >
                                  <Shield className="size-3.5" />
                                </Button>
                              )}

                              {temPermissao("estoque", "editar") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-white hover:bg-white/10"
                                  onClick={() => abrirModal(item)}
                                  title="Editar ativo"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                              )}
                              {temPermissao("estoque", "excluir") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setItemParaExcluir(item)}
                                  title="Excluir item"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="envios" className="space-y-4 mt-0">
          {/* Tabela de Histórico de Envios */}
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            {carregandoEnvios ? (
              <div className="p-6">
                <CarregandoTabela colunas={6} />
              </div>
            ) : (!contasEnviadas || contasEnviadas.length === 0) ? (
              <div className="p-8">
                <EstadoVazio
                  titulo="Nenhum registro de conta enviada"
                  descricao="Quando uma BM for despachada para um cliente ou enviada via vendas, o histórico permanente ficará registrado aqui."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[240px]">BM Despachada</TableHead>
                      <TableHead className="w-[90px] text-center">Limite</TableHead>
                      <TableHead className="min-w-[180px]">Cliente / Destinatário</TableHead>
                      <TableHead className="w-[140px] text-center">Venda / Pedido</TableHead>
                      <TableHead className="hidden md:table-cell">Responsável pelo Envio</TableHead>
                      <TableHead className="w-[120px] text-center">Data do Envio</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasEnviadas.map((envio) => {
                      const numVenda = envio.vendas?.numero;
                      return (
                        <TableRow key={envio.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Sparkles className="size-3.5 text-blue-400 shrink-0" />
                              <span className="font-semibold text-white text-sm">{envio.nome_bm}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {envio.limite_bm ? (
                              <Badge variant="outline" className="font-bold text-[11px] border-blue-500/30 text-blue-400 bg-blue-500/10">
                                {envio.limite_bm}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                              <Send className="size-3.5 text-emerald-400 shrink-0" />
                              {envio.destinatario_cliente}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {numVenda ? (
                              <Link
                                to="/vendas"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline font-mono bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded"
                                title="Ver pedido de venda"
                              >
                                #{numVenda}
                                <ExternalLink className="size-2.5 opacity-70" />
                              </Link>
                            ) : envio.venda_id ? (
                              <Link
                                to="/vendas"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline font-mono bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded"
                              >
                                Venda
                                <ExternalLink className="size-2.5 opacity-70" />
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">Despacho Direto</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {envio.responsavel_envio ? (
                              <span className="inline-flex items-center gap-1 text-foreground/80">
                                <User className="size-3" />
                                {envio.responsavel_envio}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatarData(envio.data_envio, fuso)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                              <CheckCircle2 className="size-3 mr-1" />
                              Enviada
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal / Dialog de Cadastro e Edição de Ativo no Estoque */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {itemEditando ? "Editar Ativo de Estoque" : "Adicionar em Estoque"}
            </DialogTitle>
            <DialogDescription>
              {isBM 
                ? "Preencha os dados e parâmetros operacionais para controle da BM."
                : "Defina o tipo e a quantidade do item para registro no estoque."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo de Ativo */}
            <div className="space-y-1.5">
              <Label>Tipo de Ativo</Label>
              <Select value={tipoAtivo} onValueChange={setTipoAtivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ATIVO.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>
                      {t.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CAMPOS CONDICIONAIS ESPECÍFICOS PARA BM */}
            {isBM ? (
              <BmOperationalForm
                data={{
                  nomeBm,
                  limiteBm,
                  temTemplate,
                  dataCriacao,
                  responsavel,
                  destinatario,
                  statusEnvio,
                  quantidade: qtdDisponivel,
                  custoMedio,
                }}
                onChange={(campo, val) => {
                  if (campo === "nomeBm") setNomeBm(val as string);
                  else if (campo === "limiteBm") setLimiteBm(val as string);
                  else if (campo === "temTemplate") setTemTemplate(val as boolean);
                  else if (campo === "dataCriacao") setDataCriacao(val as string);
                  else if (campo === "responsavel") setResponsavel(val as string);
                  else if (campo === "destinatario") setDestinatario(val as string);
                  else if (campo === "statusEnvio") setStatusEnvio(val as string);
                  else if (campo === "quantidade") setQtdDisponivel(String(val));
                  else if (campo === "custoMedio") setCustoMedio(val as string);
                }}
                equipeOptions={consultaEquipe.data || []}
                clientesOptions={consultaClientes.data || []}
                mostrarQuantidade={true}
                mostrarCusto={true}
                datalistSuffix="estoque"
              />
            ) : (
              /* CAMPOS CONVENCIONAIS PARA OUTROS ATIVOS (Perfis, Contas genéricas) */
              <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="qtd-disp">Qtd. Disponível</Label>
                  <Input
                    id="qtd-disp"
                    type="number"
                    min="0"
                    value={qtdDisponivel}
                    onChange={(e) => setQtdDisponivel(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qtd-res">Qtd. Reservada</Label>
                  <Input
                    id="qtd-res"
                    type="number"
                    min="0"
                    value={qtdReservada}
                    onChange={(e) => setQtdReservada(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="custo-unit">Custo Médio Unitário (R$)</Label>
                  <Input
                    id="custo-unit"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={custoMedio}
                    onChange={(e) => setCustoMedio(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status-gen">Status</Label>
                  <Select value={statusGenerico} onValueChange={setStatusGenerico}>
                    <SelectTrigger id="status-gen">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_estoque">Em Estoque</SelectItem>
                      <SelectItem value="baixo_estoque">Baixo Estoque</SelectItem>
                      <SelectItem value="esgotado">Esgotado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAberto(false)}
              disabled={salvarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveStock}
              disabled={salvarMutation.isPending}
            >
              {salvarMutation.isPending ? "Salvando..." : "Salvar no Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={Boolean(itemParaExcluir)} onOpenChange={(v) => !v && setItemParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item do estoque?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {itemParaExcluir?.nome_bm || itemParaExcluir?.tipo_ativo}?
              Esta operação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemParaExcluir && excluirMutation.mutate(itemParaExcluir.id)}
              disabled={excluirMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluirMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
