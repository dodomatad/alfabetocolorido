import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
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
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarMoeda } from "@/lib/formatadores";
import { Combobox } from "@/components/ui/combobox";
import { SeloStatusVenda } from "./selo-status";
import { resilientInsert } from "@/lib/supabase-resilient";
import { listarEstoqueLocal } from "@/lib/estoque.functions";

export type Registro = Record<string, unknown>;

export type CampoModulo = {
  nome: string;
  rotulo: string;
  tipo: "texto" | "numero" | "moeda" | "data" | "selecao" | "texto_longo" | "relacao";
  subtipo?: "combobox";
  obrigatorio?: boolean;
  visivel?: (valores: Record<string, any>) => boolean;

  padrao?: string;
  opcoes?: { valor: string; rotulo: string }[];
  /** Para tipo "relacao": tabela de origem e coluna exibida. */
  relacao?: { tabela: "clientes" | "fornecedores" | "modalidades_bm" | "vendas" | "estoque"; rotulo: string };
};

export type ColunaModulo = {
  nome: string;
  rotulo: string;
  formato?: "texto" | "moeda" | "data" | "numero";
  alinharDireita?: boolean;
  relacao?: { tabela: string; rotulo: string };
  render?: (valor: unknown, registro: any) => React.ReactNode;
};

type Props = {
  titulo: string;
  descricao: string;
  tabela: "ordens_producao" | "itens_estoque" | "entregas" | "lancamentos_financeiros" | "estoque";
  chaveConsulta: string;
  campos: CampoModulo[];
  colunas: ColunaModulo[];
  filtroFixo?: Record<string, string>;
  ordenarPor?: { coluna: string; ascendente?: boolean };
  selectCustom?: string;
  rotuloBotao?: string;
  vazioTitulo: string;
  vazioDescricao: string;
  topComponent?: React.ReactNode;
  antesDeSalvar?: (registro: Record<string, any>, valores: Record<string, string>) => Promise<Record<string, any>> | Record<string, any>;
};

// A tabela é escolhida por uma união fechada acima; o cast evita a explosão de
// tipos genéricos do client gerado sem abrir mão da validação em tempo de escrita.
const consultarTabela = (tabela: string) =>
  (supabase as any).from(tabela);


export function ModuloRegistros({
  titulo,
  descricao,
  tabela,
  chaveConsulta,
  campos,
  colunas,
  filtroFixo,
  ordenarPor,
  rotuloBotao,
  vazioTitulo,
  vazioDescricao,
  selectCustom,
  topComponent,
  antesDeSalvar,
}: Props) {
  const { empresa, session, fuso, temPermissao } = useSessao();
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);

  const estadoInicial = () =>
    Object.fromEntries(campos.map((c) => [c.nome, c.padrao ?? ""])) as Record<string, string>;
  const [valores, setValores] = useState<Record<string, string>>(estadoInicial);

  const consulta = useQuery({
    queryKey: [chaveConsulta, empresa?.id, filtroFixo],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      if (!temPermissao(tabela.replace('ordens_', '').replace('itens_', '').replace('lancamentos_', ''), 'visualizar')) {
        return [];
      }
      let lista: any[] = [];
      try {
        const { data, error } = await consultarTabela(tabela)
          .select(selectCustom || "*")
          .order(ordenarPor?.coluna ?? "created_at", { ascending: ordenarPor?.ascendente ?? false });
        if (error) {
          console.warn("Aviso na consulta remota:", error);
        } else if (data) {
          lista = data;
        }
      } catch (err) {
        console.warn("Erro ao consultar dados:", err);
      }

      if (tabela === "estoque" && lista.length === 0 && empresa?.id) {
        try {
          const locais = await listarEstoqueLocal({ data: { empresa_id: empresa.id } });
          if (locais && locais.length > 0) {
            lista = locais;
          }
        } catch {
          // ignora
        }
      }

      if (!filtroFixo) return lista;
      return lista.filter((r: Registro) => Object.entries(filtroFixo).every(([k, v]) => r[k] === v));
    },
  });

  const relacoes = useQuery({
    queryKey: ["relacoes-modulo", tabela, empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    queryFn: async () => {
      const mapa: Record<string, { id: string; rotulo: string }[]> = {};
      for (const campo of campos.filter((c) => c.tipo === "relacao" && c.relacao)) {
        const rel = campo.relacao!;
        if (rel.tabela === "vendas") {
          const { data, error } = await supabase
            .from("vendas")
            .select("id, numero, cliente, clientes(nome)")
            .order("numero", { ascending: false })
            .limit(200);
          if (error) throw error;
          mapa[campo.nome] = (data ?? []).map((linha: any) => {
            const nomeCli = linha.cliente || linha.clientes?.nome || "";
            const rotuloVenda = nomeCli ? `Venda #${linha.numero} — ${nomeCli}` : `Venda #${linha.numero}`;
            return { id: String(linha.id), rotulo: rotuloVenda };
          });
        } else {
          const { data, error } = await supabase
            .from(rel.tabela)
            .select(`id, ${rel.rotulo}`)
            .limit(200);
          if (error) throw error;
          mapa[campo.nome] = (data ?? []).map((linha) => {
            const item = linha as unknown as Record<string, unknown>;
            return { id: String(item['id']), rotulo: String(item[rel.rotulo] ?? "—") };
          });
        }
      }
      return mapa;
    },
  });

  const criarRelacaoRapida = useMutation({
    mutationFn: async ({ campo, nome }: { campo: CampoModulo; nome: string }) => {
      if (!empresa?.id || !campo.relacao) throw new Error("Operação inválida.");
      
      const payload: any = {
        empresa_id: empresa.id,
        criado_por: session?.user.id ?? null,
        atualizado_por: session?.user.id ?? null,
      };

      // Define a coluna de rótulo (geralmente 'nome')
      payload[campo.relacao.rotulo] = nome;
      
      const { data, error } = await supabase
        .from(campo.relacao.tabela)
        .insert(payload)
        .select(`id, ${campo.relacao.rotulo}`)
        .single();

      if (error) throw error;
      return data as any;
    },
    onSuccess: (data, variables) => {
      const { campo } = variables;
      toast.success(`${campo.rotulo} criado com sucesso.`);
      
      // Atualiza o cache das relações para incluir o novo item imediatamente
      void queryClient.invalidateQueries({ queryKey: ["relacoes-modulo"] });
      
      // Seleciona o novo item no formulário
      setValores((a) => ({ ...a, [campo.nome]: String(data.id) }));
    },
    onError: (erro: Error) => toast.error(`Erro ao criar registro: ${erro.message}`),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      for (const campo of campos) {
        if (campo.obrigatorio && !valores[campo.nome]?.trim()) {
          throw new Error(`Preencha o campo ${campo.rotulo}.`);
        }
      }
      const registro: Registro = {
        empresa_id: empresa.id,
        criado_por: session?.user.id ?? null,
        atualizado_por: session?.user.id ?? null,
        ...(filtroFixo ?? {}),
      };
      for (const campo of campos) {
        const bruto = valores[campo.nome] ?? "";
        if (bruto === "") {
          if (campo.tipo === "numero" || campo.tipo === "moeda") registro[campo.nome] = 0;
          else if (!campo.obrigatorio) registro[campo.nome] = null;
          continue;
        }
        registro[campo.nome] =
          campo.tipo === "numero" || campo.tipo === "moeda"
            ? Number(bruto.replace(",", ".")) || 0
            : bruto;
      }

      let registroFinal = registro;
      if (antesDeSalvar) {
        registroFinal = await antesDeSalvar(registro, valores);
      }

      const { error } = await resilientInsert(tabela, [registroFinal]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro criado com sucesso.");
      void queryClient.invalidateQueries({ queryKey: [chaveConsulta] });
      setValores(estadoInicial());
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const formatar = (valor: unknown, formato: ColunaModulo["formato"], c: ColunaModulo, registro?: any) => {
    if (c.render) {
      return c.render(valor, registro);
    }
    if (valor === null || valor === undefined || valor === "") return "—";
    if (c.relacao && registro) {
      const relName = c.nome.replace('_id', '');
      const relObj = registro[relName] || registro[c.relacao.tabela] || (c.relacao.tabela === 'clientes' ? registro.clientes : null);
      if (relObj && typeof relObj === 'object') {
        const rotulo = (relObj as any)[c.relacao.rotulo];
        if (rotulo) return String(rotulo);
      }
    }
    if (formato === "moeda") return formatarMoeda(valor as number);
    if (formato === "data") return formatarData(String(valor), fuso);
    if (c.nome === "status") return <SeloStatusVenda status={String(valor)} />;
    // Evita exibir UUID bruto na interface
    if (typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) {
      return "—";
    }
    return String(valor).replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo={titulo}
        descricao={descricao}
        acoes={
          <BotaoAdicionar
            modulo={titulo}
            rotulo={rotuloBotao ?? "Adicionar"}
            aoClicar={() => setAberto(true)}
          />
        }
      />
      {topComponent}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{rotuloBotao ?? `Adicionar em ${titulo}`}</DialogTitle>
            <DialogDescription>Preencha as informações do novo registro.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {campos.map((campo) => {
              if (campo.visivel && !campo.visivel(valores)) return null;
              
              return (
                <div
                  key={campo.nome}
                  className={`space-y-1.5 ${campo.tipo === "texto_longo" ? "sm:col-span-2" : ""}`}
                >
                  <Label htmlFor={campo.nome}>{campo.rotulo}</Label>
                  {campo.tipo === "selecao" || campo.tipo === "relacao" ? (
                  campo.subtipo === "combobox" ? (
                    <Combobox
                      options={
                        campo.tipo === "selecao"
                          ? (campo.opcoes ?? []).map((o) => ({ id: o.valor, rotulo: o.rotulo }))
                          : relacoes.data?.[campo.nome] ?? []
                      }
                      value={valores[campo.nome] ?? ""}
                      onValueChange={(v) => setValores((a) => ({ ...a, [campo.nome]: v }))}
                      placeholder={`Selecionar ${campo.rotulo.toLowerCase()}...`}
                      onCreate={campo.tipo === "relacao" && campo.relacao?.tabela === "clientes" 
                        ? (nome) => criarRelacaoRapida.mutate({ campo, nome })
                        : undefined
                      }
                      createLabel={`Criar ${campo.rotulo.toLowerCase()}`}
                    />
                  ) : (
                    <Select
                      value={valores[campo.nome] ?? ""}
                      onValueChange={(v) => setValores((a) => ({ ...a, [campo.nome]: v }))}
                    >
                      <SelectTrigger id={campo.nome}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {campo.tipo === "selecao"
                          ? (campo.opcoes ?? []).map((o) => (
                              <SelectItem key={o.valor} value={o.valor}>
                                {o.rotulo}
                              </SelectItem>
                            ))
                          : (relacoes.data?.[campo.nome] ?? []).map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.rotulo}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  )
                ) : campo.tipo === "texto_longo" ? (
                  <Textarea
                    id={campo.nome}
                    rows={2}
                    value={valores[campo.nome] ?? ""}
                    onChange={(e) => setValores((a) => ({ ...a, [campo.nome]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={campo.nome}
                    type={campo.tipo === "data" ? "date" : "text"}
                    inputMode={campo.tipo === "numero" || campo.tipo === "moeda" ? "decimal" : undefined}
                    value={valores[campo.nome] ?? ""}
                    onChange={(e) => setValores((a) => ({ ...a, [campo.nome]: e.target.value }))}
                  />
                )}
              </div>
            );})}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={salvar.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border bg-card">
        {consulta.isLoading ? (
          <div className="p-4">
            <CarregandoTabela colunas={colunas.length} />
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
              icone={<Inbox className="size-5" aria-hidden="true" />}
              titulo={vazioTitulo}
              descricao={vazioDescricao}
              className="border-0"
              acao={<Button onClick={() => setAberto(true)}>{rotuloBotao ?? "Adicionar"}</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {colunas.map((c) => (
                    <TableHead key={c.nome} className={c.alinharDireita ? "text-right" : undefined}>
                      {c.rotulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(consulta.data ?? []).map((registro: Registro, indice: number) => (
                  <TableRow key={String(registro['id'] ?? indice)}>
                    {colunas.map((c) => (
                      <TableCell
                        key={c.nome}
                        className={c.alinharDireita ? "num text-right" : undefined}
                      >
                        {formatar(registro[c.nome], c.formato, c, registro)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
