import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Tags } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio, SemPermissao } from "@/components/comum/estados";
import { SeloAtivo } from "@/components/comum/selo-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarDocumento, formatarMoeda } from "@/lib/formatadores";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Gestão BMs" },
      {
        name: "description",
        content: "Dados da empresa e modalidades de BM com preço padrão e unidade de medida.",
      },
      { property: "og:title", content: "Configurações | Gestão BMs" },
      {
        property: "og:description",
        content: "Dados da empresa e modalidades de BM utilizadas nas vendas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaConfiguracoes,
});

type Modalidade = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  preco_venda_padrao: number | string;
  custo_producao_padrao: number | string;
  valor_pagamento_unidade: number | string;
  ativo: boolean;
};

const vazio = {
  codigo: "",
  nome: "",
  descricao: "",
  preco_venda_padrao: "",
  custo_producao_padrao: "",
  valor_pagamento_unidade: "",
  ativo: true,
};

/** Converte "1.234,56" (pt-BR) em número. Vazio vira 0. */
function paraNumero(valor: string): number {
  if (!valor.trim()) return 0;
  return Number(valor.replace(/\./g, "").replace(",", "."));
}

function PaginaConfiguracoes() {
  const { empresa, podeGerenciar } = useSessao();
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Modalidade | null>(null);
  const [form, setForm] = useState({ ...vazio });

  const consulta = useQuery({
    queryKey: ["modalidades_bm", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalidades_bm")
        .select(
          "id, codigo, nome, descricao, preco_venda_padrao, custo_producao_padrao, valor_pagamento_unidade, ativo",
        )
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Modalidade[];
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não configurada");
      const preco = paraNumero(form.preco_venda_padrao);
      const custo = paraNumero(form.custo_producao_padrao);
      const pagamento = paraNumero(form.valor_pagamento_unidade);
      if ([preco, custo, pagamento].some((n) => Number.isNaN(n) || n < 0))
        throw new Error("Os valores devem ser números positivos em reais.");

      const payload = {
        codigo: form.codigo.trim().toUpperCase(),
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco_venda_padrao: preco,
        custo_producao_padrao: custo,
        valor_pagamento_unidade: pagamento,
        ativo: form.ativo,
      };

      if (editando) {
        const { error } = await supabase.from("modalidades_bm").update(payload).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("modalidades_bm")
          .insert({ ...payload, empresa_id: empresa.id });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(editando ? "Modalidade atualizada" : "Modalidade cadastrada");
      setAberto(false);
      await queryClient.invalidateQueries({ queryKey: ["modalidades_bm"] });
    },
    onError: (error: Error) =>
      toast.error("Não foi possível salvar", { description: error.message }),
  });

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Dados da empresa e catálogo de modalidades usadas nas vendas."
      />

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>Informações do cadastro principal desta instalação.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Razão social</p>
            <p className="font-medium">{empresa?.razao_social ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nome fantasia</p>
            <p className="font-medium">{empresa?.nome_fantasia || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CNPJ</p>
            <p className="num font-medium">{formatarDocumento(empresa?.cnpj)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fuso horário</p>
            <p className="font-medium">{empresa?.fuso_horario ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Modalidades de BM</h2>
            <p className="text-sm text-muted-foreground">
              Definem o que é vendido, o preço de venda, o custo e o valor pago por unidade produzida.
            </p>
          </div>
          {podeGerenciar ? (
            <Button
              onClick={() => {
                setEditando(null);
                setForm({ ...vazio });
                setAberto(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova modalidade
            </Button>
          ) : null}
        </div>

        <div className="rounded-lg border bg-card">
          {consulta.isLoading ? (
            <div className="p-4">
              <CarregandoTabela colunas={4} />
            </div>
          ) : consulta.isError ? (
            <div className="p-4">
              <EstadoErro
                descricao={(consulta.error as Error).message}
                aoTentarNovamente={() => void consulta.refetch()}
              />
            </div>
          ) : (consulta.data?.length ?? 0) === 0 ? (
            <div className="p-4">
              <EstadoVazio
                icone={<Tags className="size-5" aria-hidden="true" />}
                titulo="Nenhuma modalidade cadastrada"
                descricao="Cadastre as modalidades de BM para poder lançar itens nas vendas."
                className="border-0"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Preço de venda</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Custo</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Pagto/unidade</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-16 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consulta.data?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="font-medium">{m.nome}</p>
                        {m.descricao ? (
                          <p className="text-xs text-muted-foreground">{m.descricao}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="num">{m.codigo}</TableCell>
                      <TableCell className="num text-right">
                        {formatarMoeda(m.preco_venda_padrao)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell num text-right text-muted-foreground">
                        {formatarMoeda(m.custo_producao_padrao)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell num text-right text-muted-foreground">
                        {formatarMoeda(m.valor_pagamento_unidade)}
                      </TableCell>
                      <TableCell>
                        <SeloAtivo ativo={m.ativo} />
                      </TableCell>
                      <TableCell className="text-right">
                        {podeGerenciar ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${m.nome}`}
                            onClick={() => {
                              setEditando(m);
                              setForm({
                                codigo: m.codigo,
                                nome: m.nome,
                                descricao: m.descricao ?? "",
                                preco_venda_padrao: String(m.preco_venda_padrao).replace(".", ","),
                                custo_producao_padrao: String(m.custo_producao_padrao).replace(".", ","),
                                valor_pagamento_unidade: String(m.valor_pagamento_unidade).replace(".", ","),
                                ativo: m.ativo,
                              });
                              setAberto(true);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!podeGerenciar ? <SemPermissao recurso="a edição de configurações" /> : null}
      </section>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar modalidade" : "Nova modalidade"}</DialogTitle>
            <DialogDescription>
              Informe o preço em reais usando vírgula como separador decimal.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.nome.trim().length < 2) {
                toast.error("Informe o nome da modalidade");
                return;
              }
              if (!form.codigo.trim()) {
                toast.error("Informe o código da modalidade");
                return;
              }
              salvar.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="mod-codigo">Código</Label>
                <Input
                  id="mod-codigo"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="BM-01"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="mod-nome">Nome</Label>
                <Input
                  id="mod-nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mod-desc">Descrição</Label>
              <Textarea
                id="mod-desc"
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="mod-preco">Preço de venda (R$)</Label>
                <Input
                  id="mod-preco"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.preco_venda_padrao}
                  onChange={(e) => setForm({ ...form, preco_venda_padrao: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mod-custo">Custo de produção (R$)</Label>
                <Input
                  id="mod-custo"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.custo_producao_padrao}
                  onChange={(e) => setForm({ ...form, custo_producao_padrao: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mod-pagto">Pagamento/unidade (R$)</Label>
                <Input
                  id="mod-pagto"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.valor_pagamento_unidade}
                  onChange={(e) => setForm({ ...form, valor_pagamento_unidade: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mod-situacao">Situação</Label>
              <Select
                value={form.ativo ? "ativo" : "inativo"}
                onValueChange={(v) => setForm({ ...form, ativo: v === "ativo" })}
              >
                <SelectTrigger id="mod-situacao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativa</SelectItem>
                  <SelectItem value="inativo">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
