import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Filter, 
  Inbox, 
  MoreHorizontal, 
  Plus, 
  Wallet 
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
type SituacaoLancamento = "aberto" | "pago" | "atrasado" | "cancelado";

interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  situacao: SituacaoLancamento;
  observacoes: string | null;
}

function PaginaFinanceiro() {
  const { empresa, session, fuso } = useSessao();
  const queryClient = useQueryClient();
  
  const [aberto, setAberto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  
  const [valores, setValores] = useState({
    tipo: "receber" as TipoLancamento,
    descricao: "",
    categoria: "",
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .select("*")
        .order("data_vencimento", { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Lancamento[];
    },
  });

  const dados = useMemo(() => {
    let lista = consulta.data || [];
    if (filtroTipo !== "todos") {
      lista = lista.filter(item => item.tipo === filtroTipo);
    }
    if (filtroStatus !== "todos") {
      lista = lista.filter(item => item.situacao === filtroStatus);
    }
    return lista;
  }, [consulta.data, filtroTipo, filtroStatus]);

  const resumo = useMemo(() => {
    const lista = consulta.data || [];
    const hoje = new Date().toISOString().slice(0, 10);
    
    const aReceber = lista.filter(i => i.tipo === "receber" && i.situacao === "aberto");
    const aPagar = lista.filter(i => i.tipo === "pagar" && i.situacao === "aberto");
    const atrasados = lista.filter(i => i.situacao === "atrasado" || (i.situacao === "aberto" && i.data_vencimento < hoje));

    const totalReceber = aReceber.reduce((acc, i) => acc + i.valor, 0);
    const totalPagar = aPagar.reduce((acc, i) => acc + i.valor, 0);
    const totalAtrasado = atrasados.reduce((acc, i) => acc + i.valor, 0);

    return {
      receber: { valor: totalReceber, qtd: aReceber.length },
      pagar: { valor: totalPagar, qtd: aPagar.length },
      liquido: totalReceber - totalPagar,
      atrasado: { valor: totalAtrasado, qtd: atrasados.length }
    };
  }, [consulta.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      if (!valores.descricao) throw new Error("A descrição é obrigatória.");
      
      const payload = {
        empresa_id: empresa.id,
        tipo: valores.tipo,
        descricao: valores.descricao,
        categoria: valores.categoria || null,
        valor: Number(valores.valor.replace(",", ".")) || 0,
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
      setAberto(false);
      setValores({
        tipo: "receber",
        descricao: "",
        categoria: "",
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
        titulo="Gestão Financeira & Lançamentos"
        descricao="Controle consolidado de entradas e saídas de caixa."
        acoes={
          <Button onClick={() => setAberto(true)}>
            <Plus className="mr-2 size-4" />
            Novo Lançamento
          </Button>
        }
      />

      {consulta.isLoading ? (
        <CarregandoCartoes />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CartaoIndicador
            rotulo="Total a Receber"
            valor={formatarMoeda(resumo.receber.valor)}
            detalhe={`${resumo.receber.qtd} títulos pendentes`}
            tom="positivo"
            icone={ArrowUpCircle}
          />
          <CartaoIndicador
            rotulo="Total a Pagar"
            valor={formatarMoeda(resumo.pagar.valor)}
            detalhe={`${resumo.pagar.qtd} contas pendentes`}
            tom="negativo"
            icone={ArrowDownCircle}
          />
          <CartaoIndicador
            rotulo="Saldo Previsto (Líquido)"
            valor={formatarMoeda(resumo.liquido)}
            detalhe="Diferença total de caixa"
            tom="neutro"
            icone={Wallet}
          />
          <CartaoIndicador
            rotulo="Contas em Atraso"
            valor={formatarMoeda(resumo.atrasado.valor)}
            detalhe={`${resumo.atrasado.qtd} títulos vencidos`}
            tom="alerta"
            icone={Clock}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filtroTipo} onValueChange={setFiltroTipo} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="receber">Entradas</TabsTrigger>
            <TabsTrigger value="pagar">Saídas</TabsTrigger>
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
                      {item.tipo === "receber" ? "+" : "-"} {formatarMoeda(item.valor)}
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
              <Select value={valores.categoria} onValueChange={v => setValores(a => ({ ...a, categoria: v }))}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas Diretas</SelectItem>
                  <SelectItem value="trafego">Tráfego Pago</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas / SaaS</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="comissoes">Comissões</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
    </div>
  );
}
