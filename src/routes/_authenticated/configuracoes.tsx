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
  nome: string;
  descricao: string | null;
  unidade_medida: string;
  preco_padrao: number | string | null;
  ativo: boolean;
};

const vazio = { nome: "", descricao: "", unidade_medida: "un", preco_padrao: "", ativo: true };

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
        .select("id, nome, descricao, unidade_medida, preco_padrao, ativo")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Modalidade[];
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não configurada");
      const preco = form.preco_padrao.trim()
        ? Number(form.preco_padrao.replace(/\./g, "").replace(",", "."))
        : null;
      if (preco !== null && Number.isNaN(preco)) throw new Error("Preço padrão inválido");

      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        unidade_medida: form.unidade_medida.trim() || "un",
        preco_padrao: preco,
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
              Definem o que é vendido, a unidade de medida e o preço padrão sugerido.
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
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Preço padrão</TableHead>
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
                      <TableCell>{m.unidade_medida}</TableCell>
                      <TableCell className="num text-right">
                        {m.preco_padrao === null ? "—" : formatarMoeda(m.preco_padrao)}
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
                                nome: m.nome,
                                descricao: m.descricao ?? "",
                                unidade_medida: m.unidade_medida,
                                preco_padrao:
                                  m.preco_padrao === null ? "" : String(m.preco_padrao).replace(".", ","),
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
              salvar.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="mod-nome">Nome</Label>
              <Input
                id="mod-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="mod-unidade">Unidade de medida</Label>
                <Input
                  id="mod-unidade"
                  value={form.unidade_medida}
                  onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mod-preco">Preço padrão (R$)</Label>
                <Input
                  id="mod-preco"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.preco_padrao}
                  onChange={(e) => setForm({ ...form, preco_padrao: e.target.value })}
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
