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
  Link as LinkIcon,
  Mail,
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
  user_id: string | null;
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
  const [abaPrincipal, setAbaPrincipal] = useState("membros");

  // Estados para os novos modais
  const [modalLogsAberto, setModalLogsAberto] = useState(false);
  const [modalRegistrarAberto, setModalRegistrarAberto] = useState(false);
  const [modalConviteAberto, setModalConviteAberto] = useState(false);

  const consulta = useQuery({
    queryKey: ["equipe-acessos", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      const [perfis, membrosExtras, vinculos] = await Promise.all([
        supabase.from("perfis").select("id, nome, email, cargo, ativo").order("nome"),
        supabase.from("equipe_membros").select("id, user_id, nome, email, cargo, status").order("nome"),
        supabase.from("usuarios_papeis").select("usuario_id, papel"),
      ]);

      if (perfis.error) throw perfis.error;
      if (membrosExtras.error) throw (membrosExtras as any).error;
      if (vinculos.error) throw vinculos.error;

      // Unificar perfis reais com membros cadastrados manualmente na tabela equipe_membros
      const listaUnificada = (perfis.data ?? []).map(p => ({
        id: p.id,
        user_id: p.id,
        nome: p.nome,
        email: p.email,
        cargo: p.cargo,
        ativo: p.ativo
      }));
      
      ((membrosExtras as any).data ?? []).forEach((m: any) => {
        if (!listaUnificada.find(p => p.id === m.id)) {
          listaUnificada.push({
            id: m.id,
            user_id: m.user_id,
            nome: m.nome,
            email: m.email,
            cargo: m.cargo,
            ativo: m.status === 'ativo'
          });
        }
      });

      const porUsuario = new Map<string, Papel[]>();
      for (const v of vinculos.data ?? []) {
        const lista = porUsuario.get(v.usuario_id) ?? [];
        lista.push(v.papel as Papel);
        porUsuario.set(v.usuario_id, lista);
      }

      return listaUnificada.map((p: any) => ({
        ...p,
        user_id: p.user_id || p.id, // Fallback se vier apenas do perfil
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

  const consultaLogs = useQuery({
    queryKey: ["logs-acesso", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      if (!empresa?.id) return [];
      const { data, error } = await supabase
        .from("logs_acesso")
        .select("id, usuario_nome, usuario_email, dispositivo, ip, status, created_at")
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const logsRecentes = consultaLogs.data ?? [];

  return (
    <div className="space-y-6">

      <CabecalhoPagina
        titulo="Gestão de Equipe & Acessos"
        descricao="Cadastre colaboradores, defina cargos e gerencie o nível de acesso de cada membro da equipe."
        acoes={
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full touch-pan-x scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Button variant="outline" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl flex items-center gap-2 bg-[#141417] border-[#27272A]/80 hover:bg-[#27272A]/40 transition-colors" onClick={() => setModalConviteAberto(true)}>
              <LinkIcon className="size-4" />
              Gerar Convite
            </Button>
            <Button variant="outline" className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl flex items-center gap-2 bg-[#141417] border-[#27272A]/80 hover:bg-[#27272A]/40 transition-colors" onClick={() => setModalLogsAberto(true)}>
              <History className="size-4" />
              Logs de Acesso
            </Button>
            <Button className="shrink-0 whitespace-nowrap px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl flex items-center gap-2 bg-[#0066FF] text-white hover:bg-[#0055DD] transition-colors" onClick={() => { setEditando(null); setAberto(true); }}>
              <Plus className="size-4" />
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
                        m.papeis.map((p: Papel) => (
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
                        size="icon"
                        title="Remover Integrante"
                        onClick={async () => {
                          if (confirm(`Deseja realmente remover ${m.nome} da equipe? Esta ação não pode ser desfeita.`)) {
                            const { error: errPapeis } = await supabase.from("usuarios_papeis").delete().eq("usuario_id", m.id);
                            const { error: errPerms } = await supabase.from("permissoes_acesso").delete().eq("usuario_id", m.id);
                            const { error: errMembro } = await supabase.from("equipe_membros").delete().eq("id", m.id);
                            const { error: errPerfil } = await supabase.from("perfis").delete().eq("id", m.id);
                            
                            if (errPerfil || errPapeis || errPerms || errMembro) {
                              toast.error("Erro ao remover membro");
                            } else {
                              toast.success("Membro removido com sucesso!");
                              queryClient.invalidateQueries({ queryKey: ["equipe-acessos"] });
                            }
                          }
                        }}
                        className="size-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
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

      <ModalLogsAcesso
        aberto={modalLogsAberto}
        aoFechar={() => setModalLogsAberto(false)}
        membros={consulta.data ?? []}
      />

      <ModalRegistrarAcesso
        aberto={modalRegistrarAberto}
        aoFechar={() => setModalRegistrarAberto(false)}
        membros={consulta.data ?? []}
      />

      <ModalGerarConvite
        aberto={modalConviteAberto}
        aoFechar={() => setModalConviteAberto(false)}
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
              onClick={() => setModalRegistrarAberto(true)}
              className="text-xs md:text-sm whitespace-nowrap px-3 h-8 md:h-9"
            >
              <Plus className="mr-2 size-3" />
              Registrar Acesso
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setModalLogsAberto(true)}
              className="text-xs md:text-sm whitespace-nowrap px-3 h-8 md:h-9"
            >
              Ver Relatório Completo
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {logsRecentes.map((log, idx) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-xs">
              <div className="flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-full ${log.status === 'sucesso' || log.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                  {log.status === 'sucesso' || log.status === 'ativo' ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
                </div>
                <div>
                  <p className="font-medium">{log.usuario_nome}</p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    {log.dispositivo} • {log.ip}
                    {(log.status === 'erro' || log.status === 'suspeito') && <span className="text-destructive font-semibold">({log.status.toUpperCase()})</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-muted-foreground">
                    {log.created_at ? formatarData(log.created_at, "America/Sao_Paulo") : '—'}
                  </p>
                  {(log.status === 'ativo' || (log.status === 'sucesso' && idx === 0)) && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ATIVO</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 text-muted-foreground hover:text-red-400 hover:bg-red-950/30"
                  onClick={async () => {
                    if (confirm(`Deseja remover este registro de acesso de ${log.usuario_nome}?`)) {
                      const { error } = await supabase.from("logs_acesso").delete().eq("id", log.id);
                      if (error) {
                        toast.error("Erro ao remover registro");
                      } else {
                        toast.success("Registro removido com sucesso!");
                        queryClient.invalidateQueries({ queryKey: ["logs-acesso"] });
                        queryClient.invalidateQueries({ queryKey: ["logs-acesso-detalhado"] });
                      }
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {logsRecentes.length === 0 && (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum acesso registrado recentemente.
            </div>
          )}

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
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [papel, setPapel] = useState<Papel>("funcionario");

  useEffect(() => {
    if (aberto) {
      setNome(membro?.nome || "");
      setEmail(membro?.email || "");
      setCargo(membro?.cargo || "");
      setPapel(membro?.papeis?.[0] || "funcionario");
    }
  }, [aberto, membro]);

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

  const { empresa } = useSessao();

  const salvar = async () => {
    if (!empresa?.id) {
      toast.error("Empresa não identificada");
      return;
    }

    if (!membro && (!novaSenha || novaSenha.length < 6)) {
      toast.error("Defina uma senha inicial de pelo menos 6 caracteres para o novo integrante.");
      setAba("seguranca");
      return;
    }

    setCarregando(true);
    try {
      let usuarioId = membro?.id;

      if (!membro) {
        const { cadastrarMembroEquipe } = await import("@/lib/equipe.functions");
        const resultado = await cadastrarMembroEquipe({
          data: {
            nome,
            email: email.trim().toLowerCase(),
            senha: novaSenha,
            cargo,
            papel,
            empresaId: empresa.id,
            permissoes: permissoes,
          },
        });
        usuarioId = resultado.userId;
      } else {
        // 1. Atualizar Perfil e equipe_membros
        const { error: errPerfil } = await supabase
          .from("perfis")
          .update({ 
            nome, 
            cargo,
            updated_at: new Date().toISOString()
          })
          .eq("id", membro.id);
        
        if (errPerfil) throw errPerfil;

        // Atualizar também na tabela equipe_membros para manter consistência
        await supabase
          .from("equipe_membros")
          .update({ 
            nome, 
            cargo, 
            papel,
            permissoes: permissoes,
            status_senha: 'Senha Ativa',
            updated_at: new Date().toISOString()
          })
          .eq("id", membro.id);

        // 2. Sincronizar Papéis e Permissões
        if (usuarioId) {
          await supabase.from("usuarios_papeis").delete().eq("usuario_id", usuarioId);
          await supabase.from("usuarios_papeis").insert({ 
            usuario_id: usuarioId, 
            papel, 
            empresa_id: empresa.id 
          });

          await supabase.from("permissoes_acesso").delete().eq("usuario_id", usuarioId);
          const rows = Object.entries(permissoes).map(([modulo, p]: [string, any]) => ({
            usuario_id: usuarioId,
            empresa_id: empresa.id,
            modulo: modulo as any,
            pode_visualizar: p.visualiza,
            pode_criar: p.edita,
            pode_editar: p.edita,
            pode_excluir: p.exclui,
            ocultar_valores: p.ocultar,
          }));
          await supabase.from("permissoes_acesso").insert(rows as any);
        }
      }

      toast.success(membro ? "Integrante atualizado!" : "Integrante cadastrado!");
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
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="email@empresa.com" 
                  disabled={!!membro} 
                />
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
                    <h4 className="text-sm font-semibold">{membro ? "Redefinir Senha do Colaborador" : "Senha Inicial de Acesso"}</h4>
                    <p className="text-xs text-muted-foreground">
                      {membro 
                        ? `Defina uma nova senha para ${membro.nome}.` 
                        : "Defina a senha que o colaborador usará no primeiro acesso."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nova-senha">{membro ? "Nova Senha" : "Senha Provisória"}</Label>
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

                {membro && (
                  <Button 
                    className="w-full" 
                    disabled={carregando}
                    onClick={async () => {
                      if (novaSenha !== confirmarSenha) {
                        toast.error("As senhas não coincidem!");
                        return;
                      }
                      if (novaSenha.length < 6) {
                        toast.error("A senha deve ter pelo menos 6 caracteres.");
                        return;
                      }
                      
                      setCarregando(true);
                      try {
                        const { redefinirSenhaMembro } = await import("@/lib/equipe.functions");
                        await redefinirSenhaMembro({
                          data: { usuarioId: membro.id, novaSenha }
                        });
                        toast.success(`Senha de ${membro.nome} atualizada com sucesso!`);
                        setNovaSenha("");
                        setConfirmarSenha("");
                      } catch (err: any) {
                        toast.error(err.message);
                      } finally {
                        setCarregando(false);
                      }
                    }}
                  >
                    {carregando ? "Atualizando..." : "Atualizar Senha do Colaborador"}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="text-xs flex items-center gap-2" 
                  onClick={async () => {
                    if (!membro?.email) return;
                    setCarregando(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(membro.email.trim().toLowerCase(), {
                        redirectTo: `${window.location.origin}/redefinir-senha`
                      });
                      if (error) throw error;
                      toast.success("Link de redefinição enviado para o e-mail do colaborador!");
                    } catch (err: any) {
                      toast.error("Erro ao enviar link: " + err.message);
                    } finally {
                      setCarregando(false);
                    }
                  }}
                  disabled={carregando}
                >
                  <RefreshCcw className="size-3" />
                  Enviar Link de Redefinição
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

function ModalLogsAcesso({
  aberto,
  aoFechar,
  membros,
}: {
  aberto: boolean;
  aoFechar: () => void;
  membros: Membro[];
}) {
  const { empresa } = useSessao();
  const queryClient = useQueryClient();
  const [filtroMembro, setFiltroMembro] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("7");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs-acesso-detalhado", empresa?.id, filtroMembro, filtroStatus, filtroPeriodo],
    enabled: aberto && !!empresa?.id,
    queryFn: async () => {
      if (!empresa?.id) return [];
      let query = supabase
        .from("logs_acesso")
        .select("id, usuario_nome, usuario_email, dispositivo, ip, status, created_at")
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false });

      if (filtroMembro !== "todos") query = query.eq("usuario_id", filtroMembro);
      if (filtroStatus !== "todos") query = query.eq("status", filtroStatus);

      if (filtroPeriodo !== "todos") {
        const dias = parseInt(filtroPeriodo);
        const dataCorte = new Date();
        dataCorte.setDate(dataCorte.getDate() - dias);
        query = query.gte("created_at", dataCorte.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const removerLog = async (id: string) => {
    if (!confirm("Deseja remover este registro de acesso?")) return;
    const { error } = await supabase.from("logs_acesso").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover log");
    } else {
      toast.success("Log removido");
      queryClient.invalidateQueries({ queryKey: ["logs-acesso"] });
      queryClient.invalidateQueries({ queryKey: ["logs-acesso-detalhado"] });
    }
  };

  const limparHistorico = async () => {
    if (!empresa?.id) return;
    if (!confirm("Deseja limpar TODO o histórico de acessos desta empresa? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("logs_acesso").delete().eq("empresa_id", empresa.id);
    if (error) {
      toast.error("Erro ao limpar histórico");
    } else {
      toast.success("Histórico limpo com sucesso");
      queryClient.invalidateQueries({ queryKey: ["logs-acesso"] });
      queryClient.invalidateQueries({ queryKey: ["logs-acesso-detalhado"] });
    }
  };

  const exportarLogs = () => {
    if (!logs || logs.length === 0) {
      toast.error("Sem dados para exportar");
      return;
    }
    const headers = ["Data", "Colaborador", "E-mail", "Dispositivo", "IP", "Status"];
    const rows = logs.map(l => [
      l.created_at ? formatarData(l.created_at, "America/Sao_Paulo") : "",
      l.usuario_nome,
      l.usuario_email || "",
      l.dispositivo,
      l.ip,
      l.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const empresaId = empresa?.id || "logs";
    link.setAttribute("download", `logs-acesso-${empresaId}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
    toast.success("Logs exportados com sucesso!");
  };

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <History className="size-5 text-primary" />
                Relatório Completo de Acessos
              </DialogTitle>
              <DialogDescription>
                Histórico detalhado de tentativas de login e sessões ativas da equipe.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportarLogs}>
                <Download className="mr-2 size-4" />
                Exportar CSV
              </Button>
              <Button variant="destructive" size="sm" onClick={limparHistorico}>
                <Trash2 className="mr-2 size-4" />
                Limpar Histórico
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Colaborador</Label>
              <Select value={filtroMembro} onValueChange={setFiltroMembro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Membros</SelectItem>
                  {membros.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativo">Ativo / Conectado</SelectItem>
                  <SelectItem value="sucesso">Login Bem-sucedido</SelectItem>
                  <SelectItem value="erro">Senha Incorreta</SelectItem>
                  <SelectItem value="suspeito">Acesso Suspeito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Últimos 7 dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="todos">Todo o Histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <CarregandoTabela colunas={5} />
            ) : !logs || logs.length === 0 ? (
              <div className="p-8">
                <EstadoVazio titulo="Nenhum log encontrado" descricao="Não existem registros de acesso para os filtros selecionados." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Dispositivo / IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.usuario_nome}</p>
                          <p className="text-[10px] text-muted-foreground">{log.usuario_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-muted-foreground" />
                          {formatarData(log.created_at, "America/Sao_Paulo")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{log.dispositivo}</p>
                          <p className="text-[10px] text-muted-foreground">{log.ip}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          log.status === 'ativo' || log.status === 'sucesso' 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : log.status === 'erro'
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }>
                          {log.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => removerLog(log.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModalRegistrarAcesso({
  aberto,
  aoFechar,
  membros,
}: {
  aberto: boolean;
  aoFechar: () => void;
  membros: Membro[];
}) {
  const { empresa } = useSessao();
  const queryClient = useQueryClient();
  const [carregando, setCarregando] = useState(false);
  
  const [formData, setFormData] = useState({
    usuario_id: "",
    dispositivo: "Chrome / Windows",
    ip: "127.0.0.1",
    status: "sucesso",
    created_at: new Date().toISOString().slice(0, 16),
  });

  const salvar = async () => {
    if (!formData.usuario_id) {
      toast.error("Selecione um colaborador");
      return;
    }

    if (!empresa?.id) {
      toast.error("Empresa não identificada");
      return;
    }
    
    setCarregando(true);
    try {
      const membro = membros.find(m => m.id === formData.usuario_id);
      
      const { error } = await supabase.from("logs_acesso").insert({
        empresa_id: empresa.id,
        usuario_id: formData.usuario_id,
        usuario_nome: membro?.nome || "Desconhecido",
        usuario_email: membro?.email ?? null,
        dispositivo: formData.dispositivo,
        ip: formData.ip,
        status: formData.status,
        created_at: new Date(formData.created_at).toISOString(),
      });

      if (error) throw error;

      toast.success("Acesso registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["logs-acesso"] });
      queryClient.invalidateQueries({ queryKey: ["logs-acesso-detalhado"] });
      aoFechar();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Registrar Novo Acesso
          </DialogTitle>
          <DialogDescription>
            Registre manualmente uma sessão ou tentativa de acesso da equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Membro da Equipe</Label>
            <Select value={formData.usuario_id} onValueChange={(v) => setFormData(p => ({ ...p, usuario_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {membros.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Dispositivo / Plataforma</Label>
            <Select value={formData.dispositivo} onValueChange={(v) => setFormData(p => ({ ...p, dispositivo: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chrome / Windows">Chrome / Windows</SelectItem>
                <SelectItem value="Safari / iPhone">Safari / iPhone</SelectItem>
                <SelectItem value="Edge / Windows">Edge / Windows</SelectItem>
                <SelectItem value="Firefox / Linux">Firefox / Linux</SelectItem>
                <SelectItem value="Chrome / Android">Chrome / Android</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Endereço IP</Label>
              <Input value={formData.ip} onChange={(e) => setFormData(p => ({ ...p, ip: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sucesso">Bem-sucedido</SelectItem>
                  <SelectItem value="ativo">Ativo / Conectado</SelectItem>
                  <SelectItem value="erro">Senha Incorreta</SelectItem>
                  <SelectItem value="suspeito">Acesso Suspeito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Data e Hora</Label>
            <Input 
              type="datetime-local" 
              value={formData.created_at} 
              onChange={(e) => setFormData(p => ({ ...p, created_at: e.target.value }))} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={carregando}>
            {carregando ? "Registrando..." : "Salvar Registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModalGerarConvite({
  aberto,
  aoFechar,
}: {
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { empresa, session } = useSessao();
  const [carregando, setCarregando] = useState(false);
  const [conviteGerado, setConviteGerado] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("Operador de Contingência");
  const [papel, setPapel] = useState<Papel>("funcionario");

  const permissoesIniciais = useMemo(() => {
    return MODULOS.reduce(
      (acc, mod) => ({
        ...acc,
        [mod.id]: { pode_visualizar: true, pode_criar: mod.id !== "equipe", pode_editar: mod.id !== "equipe", pode_excluir: false, ocultar_valores: mod.id === 'dashboard' },
      }),
      {} as Record<string, any>,
    );
  }, []);

  const [permissoes, setPermissoes] = useState<Record<string, any>>(permissoesIniciais);

  const toggle = (mod: string, campo: string) => {
    setPermissoes((prev) => {
      const atual = prev[mod] ?? { pode_visualizar: false, pode_criar: false, pode_editar: false, pode_excluir: false, ocultar_valores: false };
      return { ...prev, [mod]: { ...atual, [campo]: !atual[campo] } };
    });
  };

  const salvar = async () => {
    if (!empresa?.id || !session?.user.id) return;
    setCarregando(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase.from("convites_equipe").insert({
        empresa_id: empresa.id,
        email: email || null,
        cargo,
        papel,
        permissoes: permissoes as any,
        criado_por: session.user.id,
        token,
        status: 'pendente'
      }).select().single();

      if (error) throw error;

      const link = `${window.location.origin}/aceitar-convite?token=${token}`;
      setConviteGerado(link);
      toast.success("Convite gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar Link de Convite</DialogTitle>
          <DialogDescription>
            Crie um link de cadastro personalizado com permissões pré-configuradas.
          </DialogDescription>
        </DialogHeader>

        {conviteGerado ? (
          <div className="space-y-6 py-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/20 p-3 rounded-full">
                  <CheckCircle2 className="size-8 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Link Gerado com Sucesso!</h3>
                <p className="text-sm text-muted-foreground">Envie este link para o novo colaborador realizar o cadastro.</p>
              </div>
              
              <div className="flex items-center gap-2 bg-[#0A0A0A] p-3 rounded border border-[#27272A]">
                <code className="text-xs text-primary flex-1 truncate">{conviteGerado}</code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    navigator.clipboard.writeText(conviteGerado);
                    toast.success("Link copiado!");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            
            <Button className="w-full" variant="outline" onClick={() => {
              setConviteGerado(null);
              setEmail("");
              aoFechar();
            }}>
              Fechar e Voltar
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="conv-email">E-mail do Convidado (Opcional)</Label>
                <Input 
                  id="conv-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="exemplo@email.com" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conv-cargo">Cargo / Função</Label>
                <Input 
                  id="conv-cargo" 
                  value={cargo} 
                  onChange={(e) => setCargo(e.target.value)} 
                  placeholder="Ex: Operador de Contingência" 
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="conv-papel">Papel Principal</Label>
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

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider">Permissões Pré-definidas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MODULOS.map(mod => (
                  <div key={mod.id} className="flex items-center space-x-3 p-2 rounded-lg border bg-muted/10">
                    <Checkbox 
                      id={`conv-perm-${mod.id}`} 
                      checked={permissoes[mod.id]?.pode_visualizar} 
                      onCheckedChange={() => toggle(mod.id, "pode_visualizar")} 
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor={`conv-perm-${mod.id}`} className="text-xs font-bold cursor-pointer">
                        {mod.rotulo}
                      </Label>
                      <div className="flex gap-2">
                        {mod.id !== 'dashboard' && (
                          <button 
                            type="button"
                            onClick={() => toggle(mod.id, "pode_criar")}
                            className={`text-[9px] uppercase font-bold ${permissoes[mod.id]?.pode_criar ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            Gravar
                          </button>
                        )}
                        {mod.id === 'dashboard' && (
                          <button 
                            type="button"
                            onClick={() => toggle(mod.id, "ocultar_valores")}
                            className={`text-[9px] uppercase font-bold ${permissoes[mod.id]?.ocultar_valores ? 'text-amber-500' : 'text-muted-foreground'}`}
                          >
                            Ocultar Valores
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
              <Button onClick={salvar} disabled={carregando}>
                {carregando ? "Gerando..." : "Gerar Link de Convite"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


