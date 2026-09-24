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
import { formatarData, formatarMoeda } from "@/lib/formatadores";
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
    categoria: "",
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
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          id, 
          numero_venda, 
          valor_total, 
          criado_por,
          data_venda,
          equipe_membros:criado_por (nome, email, cargo),
          comissao_percentual,
          observacoes,
          responsavel:perfis!vendas_responsavel_producao_id_fkey (nome)
        `)
        .eq("status", "confirmada");
      if (error) throw error;
      return data || [];
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

    const vendas = (consultaVendas.data || []) as any[];
    const lista: any[] = [];

    vendas.forEach(v => {
      if (pagas.has(v.id)) return;
      
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
        categoria: "comissoes",
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
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalComissoesDevidas = useMemo(() => {
    return comissoesPendentes.reduce((acc, f) => acc + (Number(f.comissao) || 0), 0);
  }, [comissoesPendentes]);

  const fornecedorBmTotal = useMemo(() => {
    const vendas = (consultaVendas.data || []) as any[];
    return vendas.reduce((acc, v) => {
      const nomeResponsavel = v.responsavel?.nome?.toLowerCase() || "";
      const obs = v.observacoes || "";
      if (nomeResponsavel.includes("ciro") || obs.includes("[FORNECEDOR_CIRO]")) {
        const percentual = Number(v.comissao_percentual || 0);
        const valorTotal = Number(v.valor_total || 0);
        return acc + (valorTotal * (percentual / 100));
      }
      return acc;
    }, 0);
  }, [consultaVendas.data]);

  const qtdVendasComComissao = comissoesPendentes.length;

  const dados = useMemo(() => {
    let lista = consulta.data || [];
    if (filtroTipo !== "todos") {
      if (filtroTipo === "Produção de BM / Insumos") {
        lista = lista.filter(item => item.categoria === "Produção de BM / Insumos");
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
    
    const aReceber = lista.filter(i => i.tipo === "receber" && (i.situacao === "aberto" || i.situacao === "parcial" || i.situacao === "pendente" as any || i.situacao === "a_vencer" as any));
    const aPagar = lista.filter(i => i.tipo === "pagar" && (i.situacao === "aberto" || i.situacao === "parcial" || i.situacao === "pendente" as any || i.situacao === "a_vencer" as any));
    const atrasados = lista.filter(i => i.situacao === "atrasado" || (i.situacao === "aberto" && i.data_vencimento < hoje));
    const producaoBM = lista.filter(i => {
      const categoria = (i.categoria || "").trim().toLowerCase();
      const tipo = (i.tipo || "").trim().toLowerCase();
      
      const categoriasProducaoBM = [
        'operacional', 
        'produção bm', 
        'producao bm', 
        'insumos', 
        'ferramentas', 
        'saldo bot', 
        'saldo do bot', 
        'produção de bm / insumos',
        'comissoes',
        'comissões',
        'comissão',
        'comissao',
        'repasses',
        'repasse',
        'funcionarios',
        'funcionários',
        'fornecedores',
        'fornecedor bm'
      ];
      const ehCategoriaBM = categoriasProducaoBM.includes(categoria);
      const ehSaida = tipo === 'pagar' || tipo === 'saida' || tipo === 'saída' || tipo === 'despesa';

      return ehCategoriaBM && ehSaida;
    });

    const totalReceber = aReceber.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const totalPagar = aPagar.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const totalAtrasado = atrasados.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const totalProducao = producaoBM.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    
    // Calcula o Lucro / ROI baseado nas Vendas - Custos de Producao Pagos
    const vendas = (consultaVendas.data || []) as any[];
    const faturamentoTotal = vendas.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    const producaoBMPagos = producaoBM.filter(i => (i.situacao || "").trim().toLowerCase() === "pago");
    const totalProducaoPago = producaoBMPagos.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
    const lucroReal = faturamentoTotal - totalProducaoPago;

    const totalUnidadesBM = producaoBM.reduce((acc, i) => acc + (Number(i.quantidade_unidades) || 0), 0);
    const custoMedioBM = totalUnidadesBM > 0 ? totalProducao / totalUnidadesBM : 0;

    return {
      receber: { valor: totalReceber, qtd: aReceber.length },
      pagar: { valor: totalPagar, qtd: aPagar.length },
      liquido: lucroReal, // Agora reflete o Lucro (ROI)
      atrasado: { valor: totalAtrasado, qtd: atrasados.length },
      producao: { 
        valor: totalProducao, 
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
      setAberto(false);
      setValores({
        tipo: "receber",
        descricao: "",
        categoria: "",
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
            detalhe={resumo.producao.unidades > 0 ? `Custo médio: ${formatarMoeda(resumo.producao.custoMedio)} / BM` : `${resumo.producao.qtd} insumos/lançamentos`}
            corValor="text-amber-400 font-bold text-2xl"
            icone={Layers}
            corIcone="text-amber-400"
          />

          <CartaoFinanceiro
            rotulo="LUCRO LÍQUIDO (ROI)"
            valor={ocultarValores ? "R$ ***" : formatarMoeda(resumo.liquido)}
            detalhe="Faturamento de Vendas - Custos Pagos"
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
                      <Badge variant="outline" className="font-normal capitalize">
                        {item.categoria || "Geral"}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
            <DialogDescription>Registre uma nova entrada ou saída de caixa.</DialogDescription>
          </DialogHeader>

          <Tabs 
            value={valores.tipo} 
            onValueChange={(v) => setValores(a => ({ ...a, tipo: v as TipoLancamento }))}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receber">Receita / A Receber</TabsTrigger>
              <TabsTrigger value="pagar">Despesa / A Pagar</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição / Título</Label>
              <Input 
                id="descricao" 
                placeholder="Ex: Pagamento Proxy, Venda BM..." 
                value={valores.descricao}
                onChange={e => setValores(a => ({ ...a, descricao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input 
                id="valor" 
                placeholder="0,00"
                value={valores.valor}
                onChange={e => setValores(a => ({ ...a, valor: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vencimento">Data de Vencimento</Label>
              <Input 
                id="vencimento" 
                type="date"
                value={valores.data_vencimento}
                onChange={e => setValores(a => ({ ...a, data_vencimento: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={valores.categoria} onValueChange={v => {
                const isProd = v === "Produção de BM / Insumos";
                setValores(a => ({ 
                  ...a, 
                  categoria: v, 
                  tipo: isProd ? "pagar" : a.tipo,
                  subcategoria: isProd ? a.subcategoria : ""
                }));
              }}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção de BM / Insumos">Produção de BM / Insumos</SelectItem>
                  <SelectItem value="vendas">Vendas Diretas</SelectItem>
                  <SelectItem value="trafego">Tráfego Pago</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas / SaaS</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="comissoes">Comissões</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {valores.categoria === "Produção de BM / Insumos" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subcategoria">Tipo de Insumo</Label>
                  <Select value={valores.subcategoria} onValueChange={v => setValores(a => ({ ...a, subcategoria: v }))}>
                    <SelectTrigger id="subcategoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="quantidade_unidades">Qtd. BMs Produzidas</Label>
                  <Input 
                    id="quantidade_unidades" 
                    type="number"
                    value={valores.quantidade_unidades}
                    onChange={e => setValores(a => ({ ...a, quantidade_unidades: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="forma">Forma de Pagamento</Label>
              <Select value={valores.forma_pagamento} onValueChange={v => setValores(a => ({ ...a, forma_pagamento: v }))}>
                <SelectTrigger id="forma">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situacao">Status Inicial</Label>
              <Select value={valores.situacao} onValueChange={v => setValores(a => ({ ...a, situacao: v as SituacaoLancamento }))}>
                <SelectTrigger id="situacao">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Pendente</SelectItem>
                  <SelectItem value="pago">Já Pago / Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea 
                id="obs" 
                placeholder="Detalhes adicionais..." 
                value={valores.observacoes}
                onChange={e => setValores(a => ({ ...a, observacoes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
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
