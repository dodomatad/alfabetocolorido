import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ShieldCheck,
  UserCog,
  Users,
  Search,
  Plus,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  History,
  CheckCircle2,
  Lock,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useSessao, ROTULO_PAPEL, type Papel } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/formatadores";

export const Route = createFileRoute("/_authenticated/configuracoes/acessos")({
  head: () => ({
    meta: [{ title: "Gerenciamento de Acessos & Equipe | Gestão BMs" }],
  }),
  component: PaginaAcessos,
});

type Membro = {
  id: string;
  nome: string;
  email: string | null;
  cargo: string | null;
  ativo: boolean;
  papeis: Papel[];
  ultima_atividade?: string;
};

const MODULOS = [
  { id: "dashboard", rotulo: "Dashboard" },
  { id: "vendas", rotulo: "Vendas" },
  { id: "producao", rotulo: "Produção" },
  { id: "financeiro", rotulo: "Financeiro" },
  { id: "estoque", rotulo: "Estoque" },
  { id: "entregas", rotulo: "Entregas" },
  { id: "clientes", rotulo: "Clientes" },
  { id: "fornecedores", rotulo: "Fornecedores" },
  { id: "equipe", rotulo: "Equipe / Acessos" },
  { id: "configuracoes", rotulo: "Configurações" },
];


function PaginaAcessos() {
  const { empresa, temPapel } = useSessao();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Membro | null>(null);

  const consulta = useQuery({
    queryKey: ["equipe-acessos", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      const [perfis, vinculos] = await Promise.all([
        supabase.from("perfis").select("id, nome, email, cargo, ativo").order("nome"),
        supabase.from("usuarios_papeis").select("usuario_id, papel"),
      ]);

      if (perfis.error) throw perfis.error;
      if (vinculos.error) throw vinculos.error;

      const porUsuario = new Map<string, Papel[]>();
      for (const v of vinculos.data ?? []) {
        const lista = porUsuario.get(v.usuario_id) ?? [];
        lista.push(v.papel as Papel);
        porUsuario.set(v.usuario_id, lista);
      }

      return (perfis.data ?? []).map((p) => ({
        ...p,
        papeis: porUsuario.get(p.id) ?? [],
        ultima_atividade: new Date().toISOString(), // Mock para UI
      }));
    },
  });

  const membros = (consulta.data ?? []).filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.email?.toLowerCase().includes(busca.toLowerCase()),
  );

  const totalMembros = consulta.data?.length ?? 0;
  const totalAdmins = (consulta.data ?? []).filter((m) => m.papeis.includes("administrador")).length;
  const totalOperadores = (consulta.data ?? []).filter((m) => m.papeis.includes("funcionario")).length;

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Gestão de Equipe & Acessos"
        descricao="Cadastre colaboradores, defina cargos e gerencie o nível de acesso de cada membro da equipe."
        acoes={
          <Button onClick={() => { setEditando(null); setAberto(true); }}>
            <Plus className="mr-2 size-4" />
            Novo Integrante
          </Button>
        }
      />


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CartaoMetrica rotulo="Total da Equipe" valor={String(totalMembros)} />
        <CartaoMetrica rotulo="Administradores" valor={String(totalAdmins)} />
        <CartaoMetrica rotulo="Operadores (Contingência / Tráfego)" valor={String(totalOperadores)} />
        <CartaoMetrica rotulo="Acessos Pendentes / Convites" valor={String(Math.floor(totalMembros * 0.1))} />

      </div>

      <div className="rounded-xl border bg-card shadow-panel">
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select defaultValue="todos">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Cargos</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="ativos">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <History className="mr-2 size-4" />
              Logs de Acesso
            </Button>
          </div>
        </div>


        {consulta.isLoading ? (
          <div className="p-8">
            <CarregandoTabela colunas={5} />
          </div>
        ) : consulta.isError ? (
          <div className="p-8">
            <EstadoErro
              descricao={(consulta.error as Error).message}
              aoTentarNovamente={() => void consulta.refetch()}
            />
          </div>
        ) : membros.length === 0 ? (
          <div className="p-8">
            <EstadoVazio
              titulo="Nenhum membro encontrado"
              descricao="Não encontramos membros da equipe com os critérios de busca informados."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Papel Principal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead>Dados Financeiros</TableHead>
                <TableHead className="text-right">Ações</TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {membros.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {m.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{m.nome}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.papeis.length > 0 ? (
                        m.papeis.map((p) => (
                          <Badge key={p} variant="secondary" className="bg-primary/5 text-primary border-primary/20">
                            {ROTULO_PAPEL[p]}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">Sem Papel</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={`size-2 rounded-full ${m.ativo ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      <span className="text-xs">{m.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.ultima_atividade ? formatarData(m.ultima_atividade, "America/Sao_Paulo") : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="flex items-center gap-1.5 font-normal">
                        {/* 
                          Mocking the visibility icon based on logic we'll add to members data 
                          In a real app, this comes from the 'permissoes_acesso' table check 
                        */}
                        <Eye className="size-3 text-emerald-500" />
                        <span className="text-[10px] uppercase">Visível</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditando(m); setAberto(true); }}
                    >
                      Ajustar Permissões
                      <ArrowRight className="ml-2 size-3" />
                    </Button>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ModalMembro
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        membro={editando}
      />
    </div>
  );
}

function ModalMembro({
  aberto,
  aoFechar,
  membro,
}: {
  aberto: boolean;
  aoFechar: () => void;
  membro: Membro | null;
}) {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState("perfil");
  const [carregando, setCarregando] = useState(false);

  // Estados do formulário
  const [nome, setNome] = useState(membro?.nome || "");
  const [cargo, setCargo] = useState(membro?.cargo || "");
  const [papel, setPapel] = useState<Papel>(membro?.papeis[0] || "funcionario");

  const [permissoes, setPermissoes] = useState<Record<string, any>>(
    MODULOS.reduce(
      (acc, mod) => ({
        ...acc,
        [mod.id]: { visualiza: true, edita: mod.id !== "equipe", exclui: false, ocultar: false },
      }),
      {},
    ),
  );

  const { data: dadosAcesso } = useQuery({
    queryKey: ["permissao-membro", membro?.id],
    enabled: !!membro,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissoes_acesso")
        .select("*")
        .eq("usuario_id", membro!.id);
      if (error) throw error;
      return data;
    },
  });

  // Sincronizar dados quando carregar do banco
  useState(() => {
    if (dadosAcesso && dadosAcesso.length > 0) {
      const novas = { ...permissoes };
      dadosAcesso.forEach((p) => {
        if (novas[p.modulo]) {
          novas[p.modulo] = {
            visualiza: p.pode_visualizar,
            edita: p.pode_editar,
            exclui: p.pode_excluir,
            ocultar: p.ocultar_valores,
          };
        }
      });
      setPermissoes(novas);
    }
  });

  const salvar = async () => {
    if (!membro) return;
    setCarregando(true);
    try {
      // 1. Atualizar Perfil
      const { error: errPerfil } = await supabase
        .from("perfis")
        .update({ nome, cargo })
        .eq("id", membro.id);
      if (errPerfil) throw errPerfil;

      // 2. Atualizar Papel
      await supabase.from("usuarios_papeis").delete().eq("usuario_id", membro.id);
      const { error: errPapel } = await supabase
        .from("usuarios_papeis")
        .insert({ usuario_id: membro.id, papel, empresa_id: (membro as any).empresa_id });

      if (errPapel) throw errPapel;

      // 3. Atualizar Permissões Granulares
      await supabase.from("permissoes_acesso").delete().eq("usuario_id", membro.id);
      const rows = Object.entries(permissoes).map(([modulo, p]: [string, any]) => ({
        usuario_id: membro.id,
        empresa_id: (membro as any).empresa_id,
        modulo: modulo as any,
        pode_visualizar: p.visualiza,
        pode_criar: p.edita,
        pode_editar: p.edita,
        pode_excluir: p.exclui,
        ocultar_valores: p.ocultar,
      }));
      const { error: errPerms } = await supabase.from("permissoes_acesso").insert(rows as any);

      if (errPerms) throw errPerms;

      toast.success("Permissões e perfil atualizados!");
      queryClient.invalidateQueries({ queryKey: ["equipe-acessos"] });
      aoFechar();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const toggle = (mod: string, campo: string) => {
    setPermissoes((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [campo]: !prev[mod][campo] },
    }));
  };


  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{membro ? "Editar Integrante" : "Novo Integrante"}</DialogTitle>
          <DialogDescription>
            Defina os dados pessoais, cargos e permissões granulares do membro da equipe.
          </DialogDescription>

        </DialogHeader>

        <Tabs value={aba} onValueChange={setAba} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">Dados Pessoais & Função</TabsTrigger>
            <TabsTrigger value="permissoes">Controle de Acessos & Permissões</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>

          </TabsList>

          <TabsContent value="perfil" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail de Acesso</Label>
                <Input id="email" type="email" defaultValue={membro?.email || ""} placeholder="email@empresa.com" disabled={!!membro} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo / Função</Label>
                <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Gestor de Tráfego" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="papel">Papel Principal</Label>
                <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROTULO_PAPEL).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-4 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Acesso de Administrador</p>
                  <p className="text-xs text-muted-foreground">
                    Usuários com papel de Administrador possuem acesso total a todas as áreas, incluindo financeiro e configurações de conta.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissoes" className="space-y-6 pt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px]">Módulo</TableHead>
                    <TableHead className="text-center">Visualizar</TableHead>
                    <TableHead className="text-center">Criar/Editar</TableHead>
                    <TableHead className="text-center">Excluir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULOS.map((mod) => (
                    <TableRow key={mod.id}>
                      <TableCell className="font-medium text-sm">{mod.rotulo}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={permissoes[mod.id].visualiza}
                          onCheckedChange={() => toggle(mod.id, "visualiza")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={permissoes[mod.id].edita}
                          onCheckedChange={() => toggle(mod.id, "edita")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={permissoes[mod.id].exclui}
                          onCheckedChange={() => toggle(mod.id, "exclui")}
                        />
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Lock className="size-4" />
                Proteção de Dados Sensíveis
              </h4>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Ocultar Valores Financeiros</Label>
                  <p className="text-xs text-muted-foreground">
                    Oculta faturamento, ROI e custos no dashboard e relatórios.
                  </p>
                </div>
                <Switch
                  checked={permissoes["dashboard"]?.ocultar || permissoes["financeiro"]?.ocultar}
                  onCheckedChange={() => {
                    const val = !permissoes["dashboard"]?.ocultar;
                    setPermissoes((prev) => ({
                      ...prev,
                      dashboard: { ...prev["dashboard"], ocultar: val },
                      financeiro: { ...prev["financeiro"], ocultar: val },
                    }));
                  }}

                />

              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Visão Global de Produção</Label>
                  <p className="text-xs text-muted-foreground">
                    Se desativado, o membro verá apenas a sua própria produção diária.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seguranca" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Desativar Acesso</Label>
                  <p className="text-xs text-muted-foreground">
                    Impede imediatamente o login deste usuário no sistema.
                  </p>
                </div>
                <Button variant="destructive" size="sm">Suspender Conta</Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Histórico de Sessões</h4>
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                      <div className="flex items-center gap-3">
                        <Activity className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Chrome em Windows (177.23.44.{i})</p>
                          <p className="text-muted-foreground">São Paulo, Brasil • {i === 1 ? 'Agora' : 'Há 2 horas'}</p>
                        </div>
                      </div>
                      {i === 1 && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20">Atual</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar Alterações"}
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
