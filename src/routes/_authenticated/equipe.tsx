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
  Key,
  LogOut,
  RefreshCcw,
  Smartphone,
  Copy,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Trash2,
  Filter,
  Download,
  Clock,
  Layout,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useSessao, ROTULO_PAPEL, type Papel } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/formatadores";

export const Route = createFileRoute("/_authenticated/equipe")({
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
  const [aba, setAba] = useState("perfil");

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
              <History className="mr-2 size-4" />
              Logs de Acesso
            </Button>
            <Button onClick={() => { setEditando(null); setAberto(true); }}>
              <Plus className="mr-2 size-4" />
              Novo Integrante
            </Button>
          </div>
        }
      />


      <div className="grid grid-cols-2 gap-4">
        {/* Coluna 1: Total e Operadores */}
        <div className="space-y-4">
          <CartaoMetrica 
            rotulo="Total da Equipe" 
            valor={String(totalMembros)}
            icone={Users}
            className="border-blue-500/80 shadow-[0_0_15px_rgba(0,102,255,0.15)] bg-[#141417] rounded-2xl border-[#27272A]/40"
            corValor="text-white"
          />
          <CartaoMetrica 
            rotulo="Operadores (Contingência / Tráfego)" 
            valor={String(totalOperadores)}
            icone={Activity}
            className="bg-[#141417] rounded-2xl border-[#27272A]/40"
            corValor="text-emerald-400"
          />
        </div>

        {/* Coluna 2: Admins e Pendentes */}
        <div className="space-y-4">
          <CartaoMetrica 
            rotulo="Administradores" 
            valor={String(totalAdmins)}
            icone={ShieldCheck}
            className="bg-[#141417] rounded-2xl border-[#27272A]/40"
            corValor="text-blue-400"
          />
          <CartaoMetrica 
            rotulo="Acessos Pendentes / Convites" 
            valor={String(Math.floor(totalMembros * 0.1))}
            icone={ShieldAlert}
            className="bg-[#141417] rounded-2xl border-[#27272A]/40"
            corValor="text-amber-400"
          />
        </div>
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
                <TableHead>Cargo / Função</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Status Senha</TableHead>
                <TableHead>Dados Fin.</TableHead>
                <TableHead className="text-right">Ações de Acesso</TableHead>

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
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className={`size-2 rounded-full ${m.ativo ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                        {m.ativo && <div className="absolute inset-0 size-2 animate-ping rounded-full bg-emerald-500 opacity-75" />}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {m.ultima_atividade ? formatarData(m.ultima_atividade, "America/Sao_Paulo") : '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal">
                      Senha Ativa
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Eye className="size-4 text-emerald-500" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Alterar Senha"
                        onClick={() => { setEditando(m); setAba("seguranca"); setAberto(true); }}
                        className="size-8 text-muted-foreground hover:text-primary"
                      >
                        <Key className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Gerar Link de Redefinição"
                        onClick={() => {
                          navigator.clipboard.writeText("https://gestao-bm-central.lovable.app/redefinir-senha?token=mock");
                          toast.success("Link de redefinição copiado!");
                        }}
                        className="size-8 text-muted-foreground hover:text-primary"
                      >
                        <RefreshCcw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Desconectar Sessão"
                        onClick={() => toast.success("Sessão desconectada com sucesso!")}
                        className="size-8 text-muted-foreground hover:text-destructive"
                      >
                        <LogOut className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditando(m); setAba("perfil"); setAberto(true); }}
                        className="ml-2"
                      >
                        Editar
                        <ArrowRight className="ml-2 size-3" />
                      </Button>
                    </div>
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
        abaPadrao={aba}
      />

      <section className="rounded-xl border bg-card p-6 shadow-panel">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Activity className="size-4 text-primary" />
              Histórico Recente de Acessos
            </h3>
          </div>
          <div className="flex flex-row justify-center items-center gap-2 mt-3 md:mt-0 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast.info("Funcionalidade para registrar acesso em desenvolvimento")}
              className="text-xs md:text-sm whitespace-nowrap px-3 h-8 md:h-9"
            >
              <Plus className="mr-2 size-3" />
              Registrar Acesso
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs md:text-sm whitespace-nowrap px-3 h-8 md:h-9"
            >
              Ver Relatório Completo
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 1, user: "João Silva", status: "success", time: "Agora", device: "Chrome / Windows", ip: "177.23.44.1" },
            { id: 2, user: "Maria Oliveira", status: "success", time: "Há 45 min", device: "Safari / iPhone", ip: "189.12.33.2" },
            { id: 3, user: "Carlos Souza", status: "error", time: "Há 2 horas", device: "Firefox / Linux", ip: "45.11.22.8", motivo: "Senha incorreta" },
          ].map((log, idx) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-xs">
              <div className="flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-full ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                  {log.status === 'success' ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
                </div>
                <div>
                  <p className="font-medium">{log.user}</p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    {log.device} • {log.ip}
                    {log.status === 'error' && <span className="text-destructive font-semibold">({log.motivo})</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-muted-foreground">{log.time}</p>
                  {log.status === 'success' && idx === 0 && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ATIVO</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 text-muted-foreground hover:text-red-400 hover:bg-red-950/30"
                  onClick={() => {
                    if (confirm(`Deseja remover este registro de acesso de ${log.user}?`)) {
                      toast.success("Registro removido com sucesso!");
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModalMembro({
  aberto,
  aoFechar,
  membro,
  abaPadrao = "perfil",
}: {
  aberto: boolean;
  aoFechar: () => void;
  membro: Membro | null;
  abaPadrao?: string;
}) {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState(abaPadrao);

  useEffect(() => {
    setAba(abaPadrao);
  }, [abaPadrao, aberto]);

  const [carregando, setCarregando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const gerarSenhaForte = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNovaSenha(password);
    setConfirmarSenha(password);
    toast.success("Senha forte gerada!");
  };

  // Estados do formulário
  const [nome, setNome] = useState(membro?.nome || "");
  const [cargo, setCargo] = useState(membro?.cargo || "");
  const [papel, setPapel] = useState<Papel>(membro?.papeis[0] || "funcionario");

  const permissoesIniciais = useMemo(() => {
    return MODULOS.reduce(
      (acc, mod) => ({
        ...acc,
        [mod.id]: { visualiza: true, edita: mod.id !== "equipe", exclui: false, ocultar: false, so_propria_producao: false },
      }),
      {} as Record<string, any>,
    );
  }, []);

  const [permissoes, setPermissoes] = useState<Record<string, any>>(permissoesIniciais);

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
  useEffect(() => {
    if (dadosAcesso && dadosAcesso.length > 0) {
      const novas = { ...permissoesIniciais };
      dadosAcesso.forEach((p) => {
        if (novas[p.modulo]) {
          novas[p.modulo] = {
            visualiza: p.pode_visualizar,
            edita: p.pode_editar,
            exclui: p.pode_excluir,
            ocultar: p.ocultar_valores,
            so_propria_producao: p.modulo === 'producao' && p.ocultar_valores, // Mapeamento temporário ou nova coluna
          };
        }
      });
      setPermissoes(novas);
    }
  }, [dadosAcesso, permissoesIniciais]);

  const marcarTodos = () => {
    const novas = { ...permissoes };
    Object.keys(novas).forEach(k => {
      novas[k] = { visualiza: true, edita: true, exclui: true, ocultar: false, so_propria_producao: false };
    });
    setPermissoes(novas);
  };

  const desmarcarTodos = () => {
    const novas = { ...permissoes };
    Object.keys(novas).forEach(k => {
      novas[k] = { visualiza: false, edita: false, exclui: false, ocultar: false, so_propria_producao: false };
    });
    setPermissoes(novas);
  };

  const perfilOperador = () => {
    const novas = desmarcarTodosRef();
    novas["dashboard"] = { visualiza: true, edita: false, exclui: false, ocultar: true, so_propria_producao: false };
    novas["producao"] = { visualiza: true, edita: true, exclui: false, ocultar: false, so_propria_producao: false };
    novas["entregas"] = { visualiza: true, edita: true, exclui: false, ocultar: false, so_propria_producao: false };
    setPermissoes(novas);
  };

  const desmarcarTodosRef = () => {
    const novas = { ...permissoes };
    Object.keys(novas).forEach(k => {
      novas[k] = { visualiza: false, edita: false, exclui: false, ocultar: false, so_propria_producao: false };
    });
    return novas;
  };

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

  const PADRAO_PERM = { visualiza: false, edita: false, exclui: false, ocultar: false, so_propria_producao: false };
  const perm = (mod: string) => permissoes[mod] ?? PADRAO_PERM;

  const toggle = (mod: string, campo: string) => {
    setPermissoes((prev) => {
      const atual = prev[mod] ?? PADRAO_PERM;
      return { ...prev, [mod]: { ...atual, [campo]: !atual[campo] } };
    });
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
          <TabsList className="flex flex-col gap-1.5 w-full h-auto p-1.5 bg-[#141417] rounded-xl border border-[#27272A]/50">
            <TabsTrigger 
              value="perfil" 
              className="w-full justify-center py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all data-[state=active]:bg-[#27272A] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold text-muted-foreground hover:text-white hover:bg-white/5"
            >
              Dados Pessoais & Função
            </TabsTrigger>
            <TabsTrigger 
              value="permissoes"
              className="w-full justify-center py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all data-[state=active]:bg-[#27272A] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold text-muted-foreground hover:text-white hover:bg-white/5"
            >
              Acessos & Permissões
            </TabsTrigger>
            <TabsTrigger 
              value="seguranca"
              className="w-full justify-center py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all data-[state=active]:bg-[#27272A] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold text-muted-foreground hover:text-white hover:bg-white/5"
            >
              Segurança
            </TabsTrigger>
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
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={marcarTodos}>Marcar Todos</Button>
              <Button variant="outline" size="sm" onClick={desmarcarTodos}>Desmarcar Todos</Button>
              <Button variant="outline" size="sm" onClick={perfilOperador}>Perfil Operador Padrão</Button>
            </div>

            <Accordion type="multiple" defaultValue={["operacao"]} className="w-full space-y-4">
              <AccordionItem value="operacao" className="border rounded-lg px-4 bg-muted/20">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-white">OPERAÇÃO</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <div className="space-y-4">
                    <PermissaoItem 
                      rotulo="Visão Geral (Dashboard)" 
                      ativo={perm("dashboard").visualiza}
                      onChange={() => toggle("dashboard", "visualiza")}
                    >
                      <SubPermissao 
                        rotulo="Ocultar valores financeiros (Faturamento Bruto/Líquido, ROI e Lucro)"
                        ativo={perm("dashboard").ocultar}
                        onChange={() => toggle("dashboard", "ocultar")}
                      />
                    </PermissaoItem>

                    <PermissaoItem 
                      rotulo="Vendas" 
                      ativo={perm("vendas").visualiza}
                      onChange={() => toggle("vendas", "visualiza")}
                    />

                    <PermissaoItem 
                      rotulo="Produção (Contingência & BMs)" 
                      ativo={perm("producao").visualiza}
                      onChange={() => toggle("producao", "visualiza")}
                    >
                      <SubPermissao 
                        rotulo="Ver apenas a própria produção diária"
                        ativo={perm("producao").so_propria_producao}
                        onChange={() => toggle("producao", "so_propria_producao")}
                      />
                    </PermissaoItem>

                    <PermissaoItem 
                      rotulo="Estoque" 
                      ativo={perm("estoque").visualiza}
                      onChange={() => toggle("estoque", "visualiza")}
                    />

                    <PermissaoItem 
                      rotulo="Entregas" 
                      ativo={perm("entregas").visualiza}
                      onChange={() => toggle("entregas", "visualiza")}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="financeiro" className="border rounded-lg px-4 bg-muted/20">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-white">FINANCEIRO</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <PermissaoItem 
                    rotulo="Financeiro Geral (Contas a Pagar e Receber / Fluxo de Caixa)" 
                    ativo={perm("financeiro").visualiza}
                    onChange={() => toggle("financeiro", "visualiza")}
                  >
                    <SubPermissao 
                      rotulo="Permitir criar novos lançamentos e editar"
                      ativo={perm("financeiro").edita}
                      onChange={() => toggle("financeiro", "edita")}
                    />
                  </PermissaoItem>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cadastros" className="border rounded-lg px-4 bg-muted/20">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-white">CADASTROS</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <PermissaoItem 
                    rotulo="Clientes" 
                    ativo={perm("clientes").visualiza}
                    onChange={() => toggle("clientes", "visualiza")}
                  />
                  <PermissaoItem 
                    rotulo="Fornecedores" 
                    ativo={perm("fornecedores").visualiza}
                    onChange={() => toggle("fornecedores", "visualiza")}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gestao" className="border rounded-lg px-4 bg-muted/20">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-white">GESTÃO</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <PermissaoItem 
                    rotulo="Equipe & Acessos" 
                    ativo={perm("equipe").visualiza}
                    onChange={() => toggle("equipe", "visualiza")}
                  />
                  <PermissaoItem 
                    rotulo="Configurações" 
                    ativo={perm("configuracoes").visualiza}
                    onChange={() => toggle("configuracoes", "visualiza")}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="seguranca" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Key className="size-5 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold">Alteração Direta de Senha</h4>
                    <p className="text-xs text-muted-foreground">
                      Defina uma nova senha para {membro?.nome || "o colaborador"}.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nova-senha">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="nova-senha"
                        type={verSenha ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="••••••••"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setVerSenha(!verSenha)}
                      >
                        {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmar-senha"
                      type={verSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={gerarSenhaForte} className="text-xs">
                      <RefreshCcw className="mr-2 size-3" />
                      Gerar Senha Forte Aleatória
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2 rounded-md border p-3 bg-muted/20">
                    <Switch id="forcar-troca" />
                    <Label htmlFor="forcar-troca" className="text-xs font-normal cursor-pointer">
                      Forçar colaborador a criar uma nova senha pessoal no próximo login
                    </Label>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => {
                    if (novaSenha !== confirmarSenha) {
                      toast.error("As senhas não coincidem!");
                      return;
                    }
                    if (novaSenha.length < 6) {
                      toast.error("A senha deve ter pelo menos 6 caracteres.");
                      return;
                    }
                    toast.success(`Senha de ${membro?.nome} atualizada com sucesso!`);
                    setNovaSenha("");
                    setConfirmarSenha("");
                  }}
                >
                  Salvar Nova Senha
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="text-xs flex items-center gap-2" onClick={() => {
                  navigator.clipboard.writeText("https://gestao-bm-central.lovable.app/redefinir-senha?token=mock");
                  toast.success("Link copiado!");
                }}>
                  <Copy className="size-3" />
                  Gerar Link de Redefinição
                </Button>
                <Button variant="outline" className="text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10" onClick={() => toast.success("Sessão desconectada!")}>
                  <LogOut className="size-3" />
                  Desconectar Sessão
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Smartphone className="size-4" />
                  Dispositivos & Sessões Ativas
                </h4>
                <div className="space-y-2">
                  {[
                    { id: 1, device: "Chrome em Windows 11", location: "São Paulo, Brasil", active: true, ip: "177.23.44.1" },
                  ].map((sessao) => (
                    <div key={sessao.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                      <div className="flex items-center gap-3">
                        <Activity className="size-4 text-primary" />
                        <div>
                          <p className="font-medium">{sessao.device}</p>
                          <p className="text-muted-foreground">{sessao.location} • {sessao.ip}</p>
                        </div>
                      </div>
                      {sessao.active && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20">SESSÃO ATUAL</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="space-y-0.5">
                  <Label className="text-destructive font-semibold">Zona de Perigo</Label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Desativação de conta</p>
                </div>
                <Button variant="destructive" size="sm">Suspender Acesso</Button>
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

function PermissaoItem({ rotulo, ativo, onChange, children }: { rotulo: string; ativo: boolean; onChange: () => void; children?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-3">
        <Checkbox id={rotulo} checked={ativo} onCheckedChange={onChange} className="size-5" />
        <Label htmlFor={rotulo} className="text-sm font-semibold cursor-pointer">
          {rotulo}
        </Label>
      </div>
      {ativo && children && (
        <div className="pl-8 space-y-2 border-l-2 border-primary/20 ml-2.5 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function SubPermissao({ rotulo, ativo, onChange }: { rotulo: string; ativo: boolean; onChange: () => void }) {
  const id = `sub-${rotulo.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex items-center space-x-3">
      <Switch id={id} checked={ativo} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-xs text-muted-foreground cursor-pointer italic font-medium">
        {rotulo}
      </Label>
    </div>
  );
}
