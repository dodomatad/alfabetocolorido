import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, 
  ShieldCheck, 
  UserCog, 
  Activity,
  Plus,
  MoreVertical,
  Mail,
  Key,
  UserX,
  Edit2,
  Lock
} from "lucide-react";
import { useState } from "react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ROTULO_PAPEL, type Papel } from "@/hooks/use-sessao";

export const Route = createFileRoute("/_authenticated/configuracoes/acessos")({
  head: () => ({
    title: "Gerenciamento de Acessos & Equipe | Gestão BMs",
  }),
  component: PaginaAcessos,
});

const COR_PAPEL: Record<Papel, string> = {
  administrador: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  gestor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  financeiro: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  supervisor_producao: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  funcionario: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  visualizacao: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

function PaginaAcessos() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Gerenciamento de Acessos & Equipe"
        descricao="Controle quais abas, dados e ações cada membro da equipe pode visualizar ou editar."
        acoes={
          <Button onClick={() => setModalAberto(true)} className="gap-2">
            <Plus className="size-4" />
            Convidar Novo Membro
          </Button>
        }
      />

      {/* Grid de Indicadores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          titulo="Total de Membros"
          valor="12"
          icone={Users}
        />
        <CartaoIndicador
          titulo="Administradores"
          valor="3"
          icone={ShieldCheck}
        />
        <CartaoIndicador
          titulo="Operadores / Produção"
          valor="7"
          icone={UserCog}
        />
        <CartaoIndicador
          titulo="Membros Ativos Hoje"
          valor="9"
          icone={Activity}
        />
      </div>

      <Card className="shadow-panel bg-[#141417] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Membros e Funções</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-zinc-800">
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400">Membro</TableHead>
                <TableHead className="text-zinc-400">Cargo / Perfil</TableHead>
                <TableHead className="text-zinc-400">Abas Liberadas</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Último Acesso</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">LT</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-200">Ligya Teixeira</span>
                      <span className="text-xs text-muted-foreground">teixeiraligya@gmail.com</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={COR_PAPEL.administrador}>
                    Administrador
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0 h-5 border-none">Dash</Badge>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0 h-5 border-none">Prod</Badge>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0 h-5 border-none">Fin</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-none">Ativo</Badge>
                </TableCell>
                <TableCell className="text-sm text-zinc-500 italic">Hoje, 10:45</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-slate-200 hover:bg-zinc-800">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#141417] border-zinc-800 text-slate-200">
                      <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-zinc-800">
                        <Edit2 className="size-4" /> Editar Permissões
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-amber-500 cursor-pointer hover:bg-zinc-800">
                        <Key className="size-4" /> Redefinir Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive cursor-pointer hover:bg-zinc-800">
                        <UserX className="size-4" /> Revogar Acesso
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Convidar/Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141417] text-slate-100 border-zinc-800 shadow-panel p-0">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-xl">Convidar / Editar Membro</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Defina o nome, e-mail e nível de acesso granular para este membro.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-6 p-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-slate-300">Nome Completo</Label>
                <Input id="nome" placeholder="Ex: João Silva" className="bg-zinc-900 border-zinc-800 text-slate-200 placeholder:text-zinc-600 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">E-mail de Acesso</Label>
                <Input id="email" type="email" placeholder="joao@empresa.com" className="bg-zinc-900 border-zinc-800 text-slate-200 placeholder:text-zinc-600 focus:ring-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Perfil Base</Label>
              <Select defaultValue="operador">
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-slate-200">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent className="bg-[#141417] border-zinc-800 text-slate-200">
                  <SelectItem value="administrador" className="hover:bg-zinc-800">Administrador</SelectItem>
                  <SelectItem value="gestor" className="hover:bg-zinc-800">Gestor</SelectItem>
                  <SelectItem value="operador" className="hover:bg-zinc-800">Operador de Contingência</SelectItem>
                  <SelectItem value="financeiro" className="hover:bg-zinc-800">Gestor Financeiro</SelectItem>
                  <SelectItem value="personalizado" className="hover:bg-zinc-800">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2 text-primary">
                <ShieldCheck className="size-4" />
                Matriz de Permissões Granulares
              </h4>

              <div className="space-y-6">
                {/* Módulo Dashboard */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dashboard Geral</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-slate-200 cursor-pointer">Faturamento e Lucro</Label>
                        <p className="text-[10px] text-zinc-500">Exibe valores financeiros no dashboard</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-slate-200 cursor-pointer">ROI e Custos</Label>
                        <p className="text-[10px] text-zinc-500">Exibe ROI e custos de produção</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                {/* Módulo Produção */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Aba Produção (Contingência)</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-slate-200 cursor-pointer">Visualizar produção global</Label>
                        <p className="text-[10px] text-zinc-500">Desligado: vê apenas os próprios dados</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-slate-200 cursor-pointer">Registrar novas produções</Label>
                        <p className="text-[10px] text-zinc-500">Permite lançar produções diárias</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Módulo Financeiro */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Financeiro & Sensível</p>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox id="sensivel" className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" />
                        <div className="space-y-0.5">
                          <Label htmlFor="sensivel" className="text-sm text-amber-500 font-medium cursor-pointer flex items-center gap-1.5">
                            <Lock className="size-3" />
                            Ocultar dados sensíveis
                          </Label>
                          <p className="text-[10px] text-amber-500/60 italic">Oculta campos de valores e lucros em todo o app</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-slate-200 cursor-pointer">Acesso Total ao Financeiro</Label>
                        <p className="text-[10px] text-zinc-500">Visualizar e editar Fluxo de Caixa / Entradas / Saídas</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 p-6 bg-zinc-900/20">
            <Button variant="ghost" className="text-zinc-400 hover:text-slate-200" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 px-8">
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
