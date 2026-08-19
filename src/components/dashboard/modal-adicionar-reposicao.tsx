import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/use-sessao";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ModalAdicionarReposicaoProps {
  aberto: boolean;
  aoFechar: () => void;
  vendasDisponiveis?: any[];
}

export function ModalAdicionarReposicao({
  aberto,
  aoFechar,
  vendasDisponiveis = [],
}: ModalAdicionarReposicaoProps) {
  const { empresa, session } = useSessao();
  const queryClient = useQueryClient();

  const [valores, setValores] = useState({
    venda_id: "",
    cliente_nome: "",
    tipo_perfil: "",
    motivo_reposicao: "",
    custo_reposicao: "0",
    status: "concluida",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      if (!valores.cliente_nome) throw new Error("O nome do cliente é obrigatório.");
      if (!valores.tipo_perfil) throw new Error("O tipo de perfil é obrigatório.");

      const { error } = await supabase.from("reposicoes_perfis").insert({
        empresa_id: empresa.id,
        venda_id: valores.venda_id || null,
        cliente_nome: valores.cliente_nome,
        tipo_perfil: valores.tipo_perfil,
        motivo_reposicao: valores.motivo_reposicao,
        custo_reposicao: Number(valores.custo_reposicao.replace(",", ".")) || 0,
        responsavel_id: session?.user.id || null,
        status: valores.status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reposição registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      aoFechar();
      setValores({
        venda_id: "",
        cliente_nome: "",
        tipo_perfil: "",
        motivo_reposicao: "",
        custo_reposicao: "0",
        status: "concluida",
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar reposição: ${error.message}`);
    },
  });

  const handleVendaChange = (vendaId: string) => {
    const venda = vendasDisponiveis.find((v) => v.id === vendaId);
    setValores((prev) => ({
      ...prev,
      venda_id: vendaId === "nenhuma" ? "" : vendaId,
      cliente_nome: venda?.cliente || prev.cliente_nome,
    }));
  };

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="sm:max-w-[500px] bg-[#141417] border-[#27272A]/50 text-white">
        <DialogHeader>
          <DialogTitle>Registrar Nova Reposição</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informe os detalhes do perfil/BM enviado em garantia. O custo será abatido do lucro.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="venda">Venda Relacionada (Opcional)</Label>
            <Select value={valores.venda_id} onValueChange={handleVendaChange}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Selecione uma venda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                {vendasDisponiveis.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.cliente ? `${v.cliente} — ` : ""}
                    Venda #{v.numero_venda || v.id.slice(0, 8)} ({new Date(v.created_at || v.data_venda).toLocaleDateString("pt-BR")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cliente">Nome do Cliente / Identificação</Label>
            <Input
              id="cliente"
              placeholder="Ex: João Silva ou ID da Venda"
              className="bg-white/5 border-white/10"
              value={valores.cliente_nome}
              onChange={(e) => setValores({ ...valores, cliente_nome: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Perfil</Label>
              <Input
                id="tipo"
                placeholder="Ex: BM 250, Ilimitada..."
                className="bg-white/5 border-white/10"
                value={valores.tipo_perfil}
                onChange={(e) => setValores({ ...valores, tipo_perfil: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custo">Custo da Reposição (R$)</Label>
              <Input
                id="custo"
                type="text"
                placeholder="0,00"
                className="bg-white/5 border-white/10"
                value={valores.custo_reposicao}
                onChange={(e) => setValores({ ...valores, custo_reposicao: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="motivo">Motivo da Reposição</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Queda de BM no primeiro acesso, Checkpoint..."
              className="bg-white/5 border-white/10 min-h-[80px]"
              value={valores.motivo_reposicao}
              onChange={(e) => setValores({ ...valores, motivo_reposicao: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={valores.status}
              onValueChange={(v) => setValores({ ...valores, status: v })}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? "Salvando..." : "Salvar Reposição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
