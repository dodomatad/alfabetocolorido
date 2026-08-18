import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { SeloAtivo } from "@/components/comum/selo-status";
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
import {
  apenasDigitos,
  documentoValido,
  emailValido,
  formatarData,
  formatarDocumento,
} from "@/lib/formatadores";
import { cn } from "@/lib/utils";

type Registro = {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
};

type Tabela = "clientes" | "fornecedores";

const POR_PAGINA = 10;

const formularioVazio = {
  nome: "",
  documento: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
  ativo: true,
};

export function CadastroPessoas({
  tabela,
  titulo,
  singular,
  descricao,
}: {
  tabela: Tabela;
  titulo: string;
  singular: string;
  descricao: string;
}) {
  const { empresa, podeGerenciar, fuso } = useSessao();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [pagina, setPagina] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [form, setForm] = useState({ ...formularioVazio });
  const [semDocumento, setSemDocumento] = useState(false);
  const [semTelefone, setSemTelefone] = useState(false);
  const [semEmail, setSemEmail] = useState(false);
  const [semEndereco, setSemEndereco] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const chave = useMemo(
    () => [tabela, empresa?.id, busca, situacao, pagina] as const,
    [tabela, empresa?.id, busca, situacao, pagina],
  );

  const consulta = useQuery({
    queryKey: chave,
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      let q = supabase
        .from(tabela)
        .select("id, nome, documento, telefone, email, endereco, observacoes, ativo, created_at", {
          count: "exact",
        })
        .order("nome", { ascending: true })
        .range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);

      if (situacao !== "todos") q = q.eq("ativo", situacao === "ativos");
      if (busca.trim()) {
        const termo = `%${busca.trim()}%`;
        q = q.or(`nome.ilike.${termo},documento.ilike.${termo},email.ilike.${termo}`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { itens: (data ?? []) as Registro[], total: count ?? 0 };
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não configurada");
      const payload = {
        nome: form.nome.trim(),
        documento: !semDocumento && form.documento.trim() ? apenasDigitos(form.documento) : null,
        telefone: !semTelefone && form.telefone.trim() ? form.telefone.trim() : null,
        email: !semEmail && form.email.trim() ? form.email.trim() : null,
        endereco: !semEndereco && form.endereco.trim() ? form.endereco.trim() : null,
        observacoes: form.observacoes.trim() || null,
        ativo: form.ativo,
      };

      if (editando) {
        const { error } = await supabase.from(tabela).update(payload).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tabela).insert({ ...payload, empresa_id: empresa.id });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(editando ? `${singular} atualizado` : `${singular} cadastrado`);
      setAberto(false);
      await queryClient.invalidateQueries({ queryKey: [tabela] });
    },
    onError: (error: { message: string; code?: string }) => {
      const duplicado = error.code === "23505";
      toast.error("Não foi possível salvar", {
        description: duplicado
          ? "Já existe um registro com este documento nesta empresa."
          : error.message,
      });
    },
  });

  function abrirNovo() {
    setEditando(null);
    setForm({ ...formularioVazio });
    setSemDocumento(false);
    setSemTelefone(false);
    setSemEmail(false);
    setSemEndereco(false);
    setErros({});
    setAberto(true);
  }

  function abrirEdicao(registro: Registro) {
    setEditando(registro);
    setForm({
      nome: registro.nome,
      documento: registro.documento ?? "",
      telefone: registro.telefone ?? "",
      email: registro.email ?? "",
      endereco: registro.endereco ?? "",
      observacoes: registro.observacoes ?? "",
      ativo: registro.ativo,
    });
    setSemDocumento(!registro.documento);
    setSemTelefone(!registro.telefone);
    setSemEmail(!registro.email);
    setSemEndereco(!registro.endereco);
    setErros({});
    setAberto(true);
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const novos: Record<string, string> = {};
    if (form.nome.trim().length < 2) novos["nome"] = "O nome é obrigatório.";
    if (!semDocumento && form.documento.trim() && !documentoValido(form.documento))
      novos["documento"] = "Informe um CPF ou CNPJ válido.";
    if (!semEmail && form.email.trim() && !emailValido(form.email)) novos["email"] = "E-mail inválido.";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    salvar.mutate();
  }

  const total = consulta.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo={titulo}
        descricao={descricao}
        acoes={
          podeGerenciar ? (
            <Button onClick={abrirNovo}>
              <Plus className="size-4" aria-hidden="true" />
              Adicionar {singular.toLowerCase()}
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Pesquisar por nome, documento ou e-mail"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0);
            }}
            aria-label="Pesquisar"
          />
        </div>
        <Select
          value={situacao}
          onValueChange={(v) => {
            setSituacao(v as typeof situacao);
            setPagina(0);
          }}
        >
          <SelectTrigger className="sm:w-52" aria-label="Filtrar por situação">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Somente ativos</SelectItem>
            <SelectItem value="inativos">Somente inativos</SelectItem>
            <SelectItem value="todos">Todas as situações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {consulta.isLoading ? (
          <div className="p-4">
            <CarregandoTabela colunas={5} />
          </div>
        ) : consulta.isError ? (
          <div className="p-4">
            <EstadoErro
              descricao={(consulta.error as Error).message}
              aoTentarNovamente={() => void consulta.refetch()}
            />
          </div>
        ) : (consulta.data?.itens.length ?? 0) === 0 ? (
          <div className="p-4">
            <EstadoVazio
              icone={<Users className="size-5" aria-hidden="true" />}
              titulo={busca ? "Nenhum resultado para esta pesquisa" : `Nenhum ${singular.toLowerCase()} cadastrado`}
              descricao={
                busca
                  ? "Revise o termo pesquisado ou altere o filtro de situação."
                  : `Cadastre o primeiro ${singular.toLowerCase()} para começar a registrar operações.`
              }
              acao={
                podeGerenciar && !busca ? (
                  <Button onClick={abrirNovo}>
                    <Plus className="size-4" aria-hidden="true" />
                    Cadastrar {singular.toLowerCase()}
                  </Button>
                ) : null
              }
              className="border-0"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Contato</TableHead>
                  <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-16 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.itens.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="font-medium">{registro.nome}</TableCell>
                    <TableCell className="num">{formatarDocumento(registro.documento)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {registro.telefone || registro.email || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell num text-muted-foreground">
                      {formatarData(registro.created_at, fuso)}
                    </TableCell>
                    <TableCell>
                      <SeloAtivo ativo={registro.ativo} />
                    </TableCell>
                    <TableCell className="text-right">
                      {podeGerenciar ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEdicao(registro)}
                          aria-label={`Editar ${registro.nome}`}
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

      {total > POR_PAGINA ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {pagina + 1} de {totalPaginas} · {total} registros
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina === 0}
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina + 1 >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? `Editar ${singular.toLowerCase()}` : `Novo ${singular.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Registros com histórico não são excluídos: use a situação inativa para retirá-los da operação.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={enviar} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="campo-nome">Nome</Label>
              <Input
                id="campo-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                aria-invalid={Boolean(erros["nome"])}
              />
              {erros["nome"] ? <p className="text-xs text-destructive">{erros["nome"]}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campo-documento">CPF ou CNPJ</Label>
                <Input
                  id="campo-documento"
                  value={semDocumento ? "Isento / Não informado" : form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                  inputMode="numeric"
                  disabled={semDocumento}
                  aria-invalid={Boolean(erros["documento"])}
                />
                <button
                  type="button"
                  onClick={() => {
                    const novoEstado = !semDocumento;
                    setSemDocumento(novoEstado);
                    if (novoEstado) setErros((prev) => ({ ...prev, documento: "" }));
                  }}
                  className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer w-fit transition-colors"
                >
                  <div className={cn("size-3 rounded-sm border border-blue-400/50 flex items-center justify-center transition-colors", semDocumento && "bg-blue-400 border-blue-400")}>
                    {semDocumento && <div className="size-1.5 bg-black rounded-full" />}
                  </div>
                  Não Possui CNPJ/CPF
                </button>
                {!semDocumento && erros["documento"] ? (
                  <p className="text-xs text-destructive">{erros["documento"]}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campo-telefone">Telefone</Label>
                <Input
                  id="campo-telefone"
                  value={semTelefone ? "Isento / Não informado" : form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  inputMode="tel"
                  disabled={semTelefone}
                />
                <button
                  type="button"
                  onClick={() => {
                    const novoEstado = !semTelefone;
                    setSemTelefone(novoEstado);
                  }}
                  className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer w-fit transition-colors"
                >
                  <div className={cn("size-3 rounded-sm border border-blue-400/50 flex items-center justify-center transition-colors", semTelefone && "bg-blue-400 border-blue-400")}>
                    {semTelefone && <div className="size-1.5 bg-black rounded-full" />}
                  </div>
                  Não Possui Telefone
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campo-email">E-mail</Label>
              <Input
                id="campo-email"
                type="email"
                value={semEmail ? "Isento / Não informado" : form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={semEmail}
                aria-invalid={Boolean(erros["email"])}
              />
              <button
                type="button"
                onClick={() => {
                  const novoEstado = !semEmail;
                  setSemEmail(novoEstado);
                  if (novoEstado) setErros((prev) => ({ ...prev, email: "" }));
                }}
                className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer w-fit transition-colors"
              >
                <div className={cn("size-3 rounded-sm border border-blue-400/50 flex items-center justify-center transition-colors", semEmail && "bg-blue-400 border-blue-400")}>
                  {semEmail && <div className="size-1.5 bg-black rounded-full" />}
                </div>
                Não Possui E-mail
              </button>
              {!semEmail && erros["email"] ? <p className="text-xs text-destructive">{erros["email"]}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campo-endereco">Endereço</Label>
              <Input
                id="campo-endereco"
                value={semEndereco ? "Não informado" : form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                disabled={semEndereco}
              />
              <button
                type="button"
                onClick={() => {
                  setSemEndereco(!semEndereco);
                }}
                className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer w-fit transition-colors"
              >
                <div className={cn("size-3 rounded-sm border border-blue-400/50 flex items-center justify-center transition-colors", semEndereco && "bg-blue-400 border-blue-400")}>
                  {semEndereco && <div className="size-1.5 bg-black rounded-full" />}
                </div>
                Não Possui Endereço
              </button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campo-obs">Observações</Label>
              <Textarea
                id="campo-obs"
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campo-situacao">Situação</Label>
              <Select
                value={form.ativo ? "ativo" : "inativo"}
                onValueChange={(v) => setForm({ ...form, ativo: v === "ativo" })}
              >
                <SelectTrigger id="campo-situacao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
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
