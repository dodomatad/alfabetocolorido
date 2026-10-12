import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, ChevronsUpDown, Clock, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import {
  listarEstoqueLocal,
  baixarBmsVendaLocal,
  registrarContaEnviadaLocal,
} from "@/lib/estoque.functions";
import { formatarMoeda } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

type Item = { 
  modalidade_id: string; 
  quantidade: string; 
  preco_unitario: string;
  conta_id?: string;
  contas_ids?: string[];
};

const ITEM_VAZIO: Item = { modalidade_id: "", quantidade: "1", preco_unitario: "0", conta_id: "" };

const STATUS_INICIAIS = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "efetuada", rotulo: "Efetuada" },
  { valor: "falta_pagamento", rotulo: "Falta pagamento" },
  { valor: "confirmada", rotulo: "Confirmada" },
  { valor: "reembolsada", rotulo: "Reembolsada" },
] as const;

export function FormularioVenda({
  aberto,
  aoFechar,
  vendaId,
}: {
  aberto: boolean;
  aoFechar: () => void;
  vendaId?: string | undefined;
}) {
  const { empresa, session } = useSessao();
  const queryClient = useQueryClient();

  const { data: ciroCriado, refetch: refetchCiro } = useQuery({
    queryKey: ["garantir-ciro", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: perfis } = await supabase
        .from("perfis")
        .select("id, nome")
        .eq("empresa_id", empresa?.id ?? "")
        .ilike("nome", "%ciro%");
      
      if (!perfis || perfis.length === 0) {
        // Criar o Ciro
        const { data: novoCiro, error } = await supabase.from("perfis").insert({
          nome: "Fornecedor CIRO",
          cargo: "Fornecedor BM",
          ativo: true,
          empresa_id: empresa?.id ?? ""
        } as any).select().single();
        
        if (!error && novoCiro) {
          queryClient.invalidateQueries({ queryKey: ["equipe-selecao"] });
          return novoCiro;
        }
      }
      return perfis?.[0] || null;
    }
  });


  const [clienteId, setClienteId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [percentualComissao, setPercentualComissao] = useState("0");
  const [status, setStatus] = useState<string>("rascunho");
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataEntrega, setDataEntrega] = useState("");
  const [desconto, setDesconto] = useState("0");
  const [acrescimo, setAcrescimo] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<"nao_enviado" | "entregue">("nao_enviado");
  const [itens, setItens] = useState<Item[]>([{ ...ITEM_VAZIO }]);
  const jaInicializadoRef = useRef(false);

  const consultaVenda = useQuery({
    queryKey: ["venda-edicao", vendaId],
    enabled: Boolean(vendaId) && aberto,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("*, venda_itens(*)")
        .eq("id", vendaId!)
        .single();
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!aberto) {
      jaInicializadoRef.current = false;
      return;
    }

    if (vendaId && consultaVenda.data) {
      const v = consultaVenda.data;
      setClienteId(v.cliente_id || "");
      
      let responsavelId = v.responsavel_producao_id || "";
      let obs = v.observacoes || "";
      if (obs.includes("[FORNECEDOR_CIRO]")) {
         responsavelId = "ciro-fornecedor";
         obs = obs.replace("[FORNECEDOR_CIRO]", "").trim();
      }
      
      setFuncionarioId(responsavelId);
      setPercentualComissao(v.comissao_percentual?.toString() || "0");
      setStatus(v.status || "rascunho");
      setDataVenda(v.data_venda ? v.data_venda.substring(0, 10) : new Date().toISOString().slice(0, 10));
      setDataEntrega(v.data_entrega_prevista ? v.data_entrega_prevista.substring(0, 10) : "");
      setDesconto(v.desconto?.toString() || "0");
      setAcrescimo(v.acrescimo?.toString() || "0");
      setObservacoes(obs);
      const stEntrega = String((v as any).delivery_status || (v as any).status_entrega || "");
      setDeliveryStatus(stEntrega.toLowerCase() === "entregue" ? "entregue" : "nao_enviado");

      if (v.venda_itens && v.venda_itens.length > 0) {
        setItens(v.venda_itens.map((i: any) => ({
          modalidade_id: i.modalidade_id || "",
          quantidade: i.quantidade?.toString() || "1",
          preco_unitario: i.preco_unitario?.toString() || "0",
          conta_id: i.conta_id || "",
        })));
      } else {
        setItens([{ ...ITEM_VAZIO }]);
      }
    } else if (!vendaId && !jaInicializadoRef.current) {
      jaInicializadoRef.current = true;
      setClienteId("");
      setFuncionarioId("");
      setPercentualComissao("0");
      setStatus("rascunho");
      setDataVenda(new Date().toISOString().slice(0, 10));
      setDataEntrega("");
      setDeliveryStatus("nao_enviado");
      setDesconto("0");
      setAcrescimo("0");
      setObservacoes("");
      setItens([{ ...ITEM_VAZIO }]);
    }
  }, [aberto, vendaId, consultaVenda.data]);

  const clientes = useQuery({
    queryKey: ["clientes-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const funcionarios = useQuery({
    queryKey: ["equipe-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const [perfis, membrosExtras] = await Promise.all([
        supabase.from("perfis").select("id, nome, cargo").eq("empresa_id", empresa?.id ?? "").eq("ativo", true).order("nome"),
        supabase.from("equipe_membros").select("id, nome, cargo").eq("empresa_id", empresa?.id ?? "").eq("status", "ativo").order("nome"),
      ]);
      
      const listaUnificada = [...(perfis.data ?? [])];
      (membrosExtras.data ?? []).forEach((m: any) => {
        if (!listaUnificada.find(p => p.id === m.id)) {
          listaUnificada.push(m);
        }
      });
      
      return listaUnificada;
    },
  });

  const modalidades = useQuery({
    queryKey: ["modalidades-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalidades_bm")
        .select("id, nome, codigo, preco_venda_padrao")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Consulta de Contas e BMs disponíveis no Estoque para seleção individual (Local com Fallback)
  const contasEstoqueQuery = useQuery({
    queryKey: ["estoque-disponivel-venda", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 1,
    queryFn: async () => {
      try {
        const locais = await listarEstoqueLocal({ data: { empresa_id: empresa!.id } });
        const disponiveis = (locais || []).filter((item) => {
          const st = (item.status_envio || item.status || "").toLowerCase();
          const disp = st === "disponivel" || st === "em_estoque" || st === "pronta_envio";
          return disp && Number(item.quantidade_disponivel || 0) > 0;
        });
        if (disponiveis.length > 0) return disponiveis as any[];
      } catch (errLocal) {
        console.warn("Aviso ao buscar estoque local:", errLocal);
      }

      const { data, error } = await supabase
        .from("estoque")
        .select("id, tipo_ativo, nome_bm, limite_bm, quantidade_disponivel, custo_medio_unitario, status, status_envio")
        .eq("empresa_id", empresa!.id)
        .gt("quantidade_disponivel", 0)
        .order("tipo_ativo");
      if (error) {
        console.warn("Aviso ao buscar estoque disponível:", error);
        return [];
      }
      return data || [];
    },
  });

  const numero = (v: string) => {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const { subtotal, total } = useMemo(() => {
    const sub = itens.reduce(
      (acc, i) => acc + numero(i.quantidade) * numero(i.preco_unitario),
      0,
    );
    const tot = sub - numero(desconto) + numero(acrescimo);
    return { subtotal: sub, total: tot };
  }, [itens, desconto, acrescimo]);

  const limpar = () => {
    setClienteId("");
    setFuncionarioId("");
    setPercentualComissao("0");
    setStatus("rascunho");
    setDataVenda(new Date().toISOString().slice(0, 10));
    setDataEntrega("");
    setDeliveryStatus("nao_enviado");
    setDesconto("0");
    setAcrescimo("0");
    setObservacoes("");
    setItens([{ ...ITEM_VAZIO }]);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      const validos = itens.filter((i) => i.modalidade_id && numero(i.quantidade) > 0);
      if (validos.length === 0) throw new Error("Adicione ao menos um item com modalidade e quantidade.");

      // Validação estrita de estoque antes de qualquer persistência
      for (const itemVenda of validos) {
        const mod = (modalidades.data ?? []).find((m) => m.id === itemVenda.modalidade_id);
        const qtdPedida = numero(itemVenda.quantidade);
        const nomeMod = mod?.nome || "BM";
        const limiteAlvo = (nomeMod.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || "").toLowerCase();

        const idsSelecionados: string[] = itemVenda.contas_ids && itemVenda.contas_ids.length > 0
          ? itemVenda.contas_ids
          : itemVenda.conta_id ? [itemVenda.conta_id] : [];

        // Total de contas disponíveis no estoque para esta modalidade
        const contasDisponiveis = (contasEstoqueQuery.data || []).filter((c) => {
          const st = (c.status || "").toLowerCase();
          const stEnvio = (c.status_envio || "").toLowerCase();
          const estaDisponivel = (st === "disponivel" || st === "em_estoque" || stEnvio === "disponivel" || stEnvio === "pronta_envio") && Number(c.quantidade_disponivel || 0) > 0;
          if (!estaDisponivel) return false;
          if (!limiteAlvo) return true;
          const limC = (c.limite_bm || c.tipo_ativo || "").toLowerCase();
          return limC.includes(limiteAlvo);
        });

        const totalDisponivelSaldo = contasDisponiveis.reduce((acc, curr) => acc + Number(curr.quantidade_disponivel || 1), 0);

        if (totalDisponivelSaldo < qtdPedida) {
          throw new Error(`Estoque insuficiente para ${nomeMod}: você solicitou ${qtdPedida}, mas restam apenas ${totalDisponivelSaldo} disponível(is).`);
        }

        // Se o usuário selecionou BMs específicas, validar quantidade selecionada vs pedida
        if (idsSelecionados.length > 0 && idsSelecionados.length !== qtdPedida) {
          throw new Error(`Quantidade divergente para ${nomeMod}: você selecionou ${idsSelecionados.length} BM(s) específica(s), mas o item pede ${qtdPedida}. Ajuste a seleção.`);
        }
      }

      let vendaSalvaId: string = vendaId || "";
      const nomeCliente = (clientes.data ?? []).find((c) => c.id === clienteId)?.nome || null;
      const statusFinalEntrega = deliveryStatus === "entregue" ? "entregue" : "pendente";
      const dataRealizadaFinal = deliveryStatus === "entregue" ? (dataVenda || new Date().toISOString().slice(0, 10)) : null;
      
      const payloadVenda: any = {
          empresa_id: empresa.id,
          cliente_id: clienteId || null,
          cliente: nomeCliente,
          responsavel_producao_id: funcionarioId === 'ciro-fornecedor' ? null : (funcionarioId || null),
          comissao_percentual: numero(percentualComissao),
          data_venda: dataVenda,
          data_entrega_prevista: dataEntrega || null,
          status: status as any,
          status_entrega: statusFinalEntrega,
          delivery_status: deliveryStatus,
          subtotal,
          desconto: numero(desconto),
          acrescimo: numero(acrescimo),
          valor_total: total,
          observacoes: (funcionarioId === 'ciro-fornecedor' ? '[FORNECEDOR_CIRO] ' : '') + (observacoes.trim() || ''),
          atualizado_por: session?.user.id ?? null,
      };

      if (vendaId) {
        // UPDATE
        let { error: erroVenda } = await supabase
          .from("vendas")
          .update(payloadVenda)
          .eq("id", vendaId);
        
        // Se a coluna delivery_status não existir no banco remoto ainda, faz update sem ela
        if (erroVenda && (erroVenda.message?.includes("delivery_status") || (erroVenda as any).code === "PGRST204")) {
          const { delivery_status: _, ...payloadSemDeliveryStatus } = payloadVenda;
          const res = await supabase.from("vendas").update(payloadSemDeliveryStatus).eq("id", vendaId);
          erroVenda = res.error;
        }
        if (erroVenda) throw erroVenda;
        
        // Remove itens antigos
        await supabase.from("venda_itens").delete().eq("venda_id", vendaId);
      } else {
        // INSERT
        const { data: proximo, error: erroNumero } = await (supabase as any).rpc("proximo_numero_venda", {
          _empresa: empresa.id,
        });
        if (erroNumero) throw erroNumero;
        
        let novaVendaResult = await supabase
          .from("vendas")
          .insert({
            ...payloadVenda,
            numero: Number(proximo) || 1,
            criado_por: session?.user.id ?? null,
          })
          .select("id")
          .single();

        // Se a coluna delivery_status não existir no banco remoto ainda, insere sem ela
        if (novaVendaResult.error && (novaVendaResult.error.message?.includes("delivery_status") || (novaVendaResult.error as any).code === "PGRST204")) {
          const { delivery_status: _, ...payloadSemDeliveryStatus } = payloadVenda;
          novaVendaResult = await supabase
            .from("vendas")
            .insert({
              ...payloadSemDeliveryStatus,
              numero: Number(proximo) || 1,
              criado_por: session?.user.id ?? null,
            })
            .select("id")
            .single();
        }

        if (novaVendaResult.error) throw novaVendaResult.error;
        vendaSalvaId = novaVendaResult.data.id;
      }

      // Sincroniza / cadastra entrega vinculada à venda com cliente e destinatário corretos
      if (!vendaId) {
        // Nova venda: cria a entrega correspondente
        const { error: erroEntrega } = await supabase.from("entregas").insert({
          empresa_id: empresa.id,
          venda_id: vendaSalvaId,
          cliente_id: clienteId || null,
          destinatario: nomeCliente,
          data_prevista: dataEntrega || dataVenda || new Date().toISOString().slice(0, 10),
          status: statusFinalEntrega,
          data_realizada: dataRealizadaFinal,
          criado_por: session?.user.id ?? null,
        } as any);
        if (erroEntrega) {
          console.warn("Aviso ao vincular entrega na venda:", erroEntrega);
        }
      } else {
        // Edição de venda: atualiza a entrega vinculada se existir ou cria se não existir
        const { data: entregaExistente } = await supabase
          .from("entregas")
          .select("id")
          .eq("venda_id", vendaId)
          .maybeSingle();

        if (entregaExistente) {
          await supabase.from("entregas").update({
            cliente_id: clienteId || null,
            destinatario: nomeCliente,
            data_prevista: dataEntrega || dataVenda,
            status: statusFinalEntrega,
            data_realizada: dataRealizadaFinal,
            atualizado_por: session?.user.id ?? null,
          } as any).eq("id", entregaExistente.id);
        } else {
          await supabase.from("entregas").insert({
            empresa_id: empresa.id,
            venda_id: vendaId,
            cliente_id: clienteId || null,
            destinatario: nomeCliente,
            data_prevista: dataEntrega || dataVenda,
            status: statusFinalEntrega,
            data_realizada: dataRealizadaFinal,
            criado_por: session?.user.id ?? null,
          } as any);
        }
      }

      // Insere os novos itens (incluindo conta_id se selecionada)
      const { error: erroItens } = await supabase.from("venda_itens").insert(
        validos.map((i) => ({
          venda_id: vendaSalvaId,
          modalidade_id: i.modalidade_id,
          quantidade: numero(i.quantidade),
          preco_unitario: numero(i.preco_unitario),
          desconto: 0,
          valor_total: numero(i.quantidade) * numero(i.preco_unitario),
          ...(i.conta_id ? { conta_id: i.conta_id } : {}),
        })),
      );
      if (erroItens) {
        // Fallback caso a coluna conta_id não exista ainda no schema remoto de venda_itens
        const { error: erroItensSemContaId } = await supabase.from("venda_itens").insert(
          validos.map((i) => ({
            venda_id: vendaSalvaId,
            modalidade_id: i.modalidade_id,
            quantidade: numero(i.quantidade),
            preco_unitario: numero(i.preco_unitario),
            desconto: 0,
            valor_total: numero(i.quantidade) * numero(i.preco_unitario),
          })),
        );
        if (erroItensSemContaId) throw erroItensSemContaId;
      }

      // Baixa automática no estoque para os itens vendidos e registro de histórico
      for (const itemVenda of validos) {
        const mod = (modalidades.data ?? []).find((m) => m.id === itemVenda.modalidade_id);
        const qtdVendida = numero(itemVenda.quantidade);
        const nomeMod = mod?.nome || "BM";
        const codigoMod = mod?.codigo || "";
        const dataDespacho = dataRealizadaFinal || dataVenda || new Date().toISOString().slice(0, 10);
        const nomeRespEnvio = (funcionarios.data ?? []).find((f) => f.id === funcionarioId)?.nome || null;

        // Tentar identificar o limite ou nome correspondente no estoque (normalizado para 250, 2k, 10k, 100k)
        const limiteAlvo = (nomeMod.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || codigoMod.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || "").toLowerCase();

        let idsParaBaixar: string[] = itemVenda.contas_ids && itemVenda.contas_ids.length > 0
          ? itemVenda.contas_ids
          : itemVenda.conta_id ? [itemVenda.conta_id] : [];

        // Se não selecionou BMs específicas manualmente, busca automaticamente as primeiras N BMs disponíveis deste limite
        if (idsParaBaixar.length === 0) {
          const { data: bmsAuto } = await supabase
            .from("estoque")
            .select("id, limite_bm, tipo_ativo")
            .eq("empresa_id", empresa.id)
            .eq("status", "disponivel")
            .gt("quantidade_disponivel", 0)
            .order("created_at", { ascending: true })
            .limit(qtdVendida * 2);

          const compativeis = (bmsAuto || []).filter((b) => {
            if (!limiteAlvo) return true;
            const limB = (b.limite_bm || b.tipo_ativo || "").toLowerCase();
            return limB.includes(limiteAlvo);
          });

          idsParaBaixar = compativeis.slice(0, qtdVendida).map((b) => b.id);
        }

        if (idsParaBaixar.length > 0) {
          const statusEnvioFinal = deliveryStatus === "entregue" ? "entregue" : "reservada";

          // 1. Baixa atômica prioritária no banco local SQLite
          try {
            await baixarBmsVendaLocal({
              data: {
                empresa_id: empresa.id,
                venda_id: vendaSalvaId,
                cliente_id: clienteId || null,
                destinatario: nomeCliente,
                bms_ids: idsParaBaixar,
                status_envio: statusEnvioFinal,
              },
            });
          } catch (errLocalBaixa) {
            console.warn("Aviso na baixa local (ou ativo já baixado):", errLocalBaixa);
            throw errLocalBaixa;
          }

          // 2. Registro no histórico local de contas enviadas
          for (const bmId of idsParaBaixar) {
            const contaRef = (contasEstoqueQuery.data || []).find((c) => c.id === bmId);
            const nomeBMFinal = contaRef?.nome_bm || contaRef?.tipo_ativo || nomeMod;
            const limiteBMFinal = contaRef?.limite_bm || limiteAlvo || null;

            try {
              await registrarContaEnviadaLocal({
                data: {
                  empresa_id: empresa.id,
                  bm_id: bmId,
                  venda_id: vendaSalvaId,
                  nome_bm: nomeBMFinal,
                  limite_bm: limiteBMFinal,
                  destinatario_cliente: nomeCliente || "Cliente da Venda",
                  responsavel_envio: nomeRespEnvio,
                  data_envio: dataDespacho,
                  custo_unitario: contaRef?.custo_medio_unitario || 0,
                  valor_venda: numero(itemVenda.preco_unitario),
                  status_envio: "enviada",
                },
              });
            } catch (eHLocal) {
              console.warn("Aviso ao salvar histórico de conta local:", eHLocal);
            }
          }

          // 3. Espelhamento não-bloqueante no Supabase (se disponível)
          try {
            await (supabase as any).rpc("baixar_bms_venda", {
              p_empresa_id: empresa.id,
              p_venda_id: vendaSalvaId,
              p_cliente_id: clienteId || null,
              p_destinatario: nomeCliente,
              p_bms_ids: idsParaBaixar,
              p_status_envio: statusEnvioFinal,
            });
          } catch (eRpc) {
            // Ignora falha remota do Supabase
          }
        }
      }

      // Só gerar lançamento financeiro se for uma NOVA venda (para evitar duplicidade na edição)
      const valorComissao = (subtotal * numero(percentualComissao)) / 100;
      if (!vendaId && funcionarioId && valorComissao > 0) {
        // Obter número temporário para descrição, já que proximo não está no escopo
        const numVenda = 0; // Só um placeholder, pois o real já foi inserido
        const { error: erroFinanceiro } = await supabase.from("lancamentos_financeiros").insert({
          empresa_id: empresa.id,
          tipo: "pagar",
          categoria: "Comissão / Repasse",
          descricao: `Comissão Venda - ${funcionarios.data?.find(f => f.id === funcionarioId)?.nome || 'Funcionária'}`,
          valor: valorComissao,
          data_vencimento: dataVenda,
          situacao: "aberto",
          observacoes: `Comissão de ${percentualComissao}% sobre subtotal de ${formatarMoeda(subtotal)}.`,
          criado_por: session?.user.id ?? null,
        });
        if (erroFinanceiro) {
          console.error("Erro ao gerar lançamento de comissão:", erroFinanceiro);
          toast.error("Venda salva, mas erro ao gerar comissão no financeiro.");
        }
      }
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["entregas"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["contas_enviadas"] });
      void queryClient.invalidateQueries({ queryKey: ["historico_envios"] });
      void queryClient.invalidateQueries({ queryKey: ["historico_envios_estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["producao"] });
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["painel"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["financeiro-unificado"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas-comissoes"] });
      limpar();
      aoFechar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar venda</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder={clientes.isLoading ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent>

                {(clientes.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status inicial</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_INICIAIS.map((s) => (
                  <SelectItem key={s.valor} value={s.valor}>
                    {s.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data-venda">Data da venda</Label>
            <Input
              id="data-venda"
              type="date"
              value={dataVenda}
              onChange={(e) => setDataVenda(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data-entrega">Previsão de entrega</Label>
            <Input
              id="data-entrega"
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>
        </div>

        {/* Status de Envio */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Status de envio
          </Label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setDeliveryStatus("nao_enviado")}
              className={`
                flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all border
                ${deliveryStatus === "nao_enviado"
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }
              `}
            >
              <Clock className="size-3.5 shrink-0 text-amber-500" />
              <span>Não enviado</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryStatus("entregue")}
              className={`
                flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all border
                ${deliveryStatus === "entregue"
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }
              `}
            >
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
              <span>Entregue</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Itens do pedido</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItens((a) => [...a, { ...ITEM_VAZIO }])}
            >
              <Plus className="size-4" aria-hidden="true" />
              Item
            </Button>
          </div>

          {itens.map((item, indice) => (
            <div 
              key={indice} 
              className="relative grid gap-3 rounded-2xl border border-[#27272A] bg-[#141417] p-4 shadow-sm md:grid-cols-3"
            >
              <div className="space-y-1.5 md:col-span-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Modalidade / Tipo de Conta
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remover item"
                    onClick={() => setItens((a) => (a.length === 1 ? a : a.filter((_, x) => x !== indice)))}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <Select
                  value={item.modalidade_id}
                  onValueChange={(v) =>
                    setItens((a) =>
                      a.map((i, x) => {
                        if (x !== indice) return i;
                        const m = (modalidades.data ?? []).find((mm) => mm.id === v);
                        return {
                          ...i,
                          modalidade_id: v,
                          preco_unitario: m ? String(m.preco_venda_padrao) : i.preco_unitario,
                        };
                      }),
                    )
                  }
                >
                  <SelectTrigger className="h-10 bg-black/20">
                    <SelectValue
                      placeholder={modalidades.isLoading ? "Carregando..." : "Selecione a modalidade"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(modalidades.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SELEÇÃO VISUAL E PESQUISÁVEL DE "NOME DA BM" (COMBOBOX COM SUPORTE A TAGS / MULTI-SELEÇÃO) */}
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-blue-400" />
                    <span>Nome da BM *</span>
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground/80 lowercase">
                    {(() => {
                      const mod = (modalidades.data ?? []).find((m) => m.id === item.modalidade_id);
                      const lim = mod?.nome?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || "";
                      return lim ? `filtrado por ${lim}` : "ativas e prontas em estoque";
                    })()}
                  </span>
                </Label>

                {(() => {
                  const mod = (modalidades.data ?? []).find((m) => m.id === item.modalidade_id);
                  const nomeMod = mod?.nome || "";
                  const limAlvo = (nomeMod.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || "").toUpperCase();

                  // Filtra apenas ativos disponíveis ou prontos para envio correspondentes à modalidade
                  const contasFiltradas = (contasEstoqueQuery.data || []).filter((c) => {
                    const st = (c.status_envio || c.status || "").toLowerCase();
                    // Deve estar disponível ou pronta para envio
                    const statusValido = st === "disponivel" || st === "pronta_envio" || st === "em_estoque";
                    if (!statusValido && Number(c.quantidade_disponivel || 0) <= 0) return false;

                    if (!limAlvo) return true;
                    const limC = (c.limite_bm || (c.tipo_ativo?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] ?? "")).toUpperCase();
                    return limC === limAlvo || c.tipo_ativo?.toLowerCase().includes(nomeMod.toLowerCase());
                  });

                  // Array de IDs selecionados no item (suporte a seleção múltipla)
                  const selecionados: string[] = item.contas_ids && item.contas_ids.length > 0
                    ? item.contas_ids
                    : item.conta_id ? [item.conta_id] : [];

                  const alternarSelecaoConta = (contaId: string) => {
                    let novosIds: string[];
                    if (selecionados.includes(contaId)) {
                      novosIds = selecionados.filter((id) => id !== contaId);
                    } else {
                      novosIds = [...selecionados, contaId];
                    }

                    const novaQtd = novosIds.length > 0 ? String(novosIds.length) : (item.quantidade || "1");

                    setItens((prev) =>
                      prev.map((it, x) =>
                        x === indice
                          ? {
                              ...it,
                              contas_ids: novosIds,
                              conta_id: novosIds[0] || "",
                              quantidade: novosIds.length > 0 ? novaQtd : it.quantidade,
                            }
                          : it,
                      ),
                    );
                  };

                  const limparSelecao = () => {
                    setItens((prev) =>
                      prev.map((it, x) =>
                        x === indice
                          ? { ...it, contas_ids: [], conta_id: "" }
                          : it,
                      ),
                    );
                  };

                  return (
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-auto min-h-10 bg-black/20 border-border/60 hover:bg-black/30 font-normal text-xs px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-1.5 flex-1 text-left">
                              {selecionados.length === 0 ? (
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <span>Selecione ou busque a BM disponível...</span>
                                </span>
                              ) : (
                                selecionados.map((id) => {
                                  const c = (contasEstoqueQuery.data || []).find((x) => x.id === id);
                                  const n = c?.nome_bm || c?.tipo_ativo || "BM Selecionada";
                                  const lim = c?.limite_bm || "250";
                                  return (
                                    <Badge
                                      key={id}
                                      variant="secondary"
                                      className="gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] py-0.5 px-2"
                                    >
                                      <span>{n} • {lim}</span>
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alternarSelecaoConta(id);
                                        }}
                                        className="hover:text-white cursor-pointer ml-0.5"
                                      >
                                        <X className="size-3" />
                                      </span>
                                    </Badge>
                                  );
                                })
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] max-w-[95vw] p-0 bg-popover border-border/60 shadow-xl" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar por nome da BM ou limite..." className="text-xs" />
                            <CommandList className="max-h-60 overflow-y-auto">
                              <CommandEmpty className="p-3 text-xs text-center text-muted-foreground">
                                {contasFiltradas.length === 0
                                  ? "Nenhuma BM disponível encontrada para esta modalidade."
                                  : "Nenhuma BM encontrada com este termo."}
                              </CommandEmpty>
                              <CommandGroup heading="Ativos Disponíveis (Produção / Estoque)">
                                {contasFiltradas.map((conta) => {
                                  const nomePrincipal = conta.nome_bm || conta.tipo_ativo;
                                  const limiteBadge = conta.limite_bm || (conta.tipo_ativo?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] ?? "250");
                                  const estaMarcada = selecionados.includes(conta.id);
                                  const statusTexto = conta.status_envio === "pronta_envio" ? "Pronta para Envio" : "Disponível";

                                  return (
                                    <CommandItem
                                      key={conta.id}
                                      value={`${nomePrincipal} ${limiteBadge} ${conta.id}`}
                                      onSelect={() => alternarSelecaoConta(conta.id)}
                                      className="flex items-center justify-between text-xs py-2 px-2.5 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                        <div className={cn(
                                          "flex size-4 items-center justify-center rounded border transition-colors",
                                          estaMarcada ? "bg-blue-600 border-blue-500 text-white" : "border-muted-foreground/40 bg-background/50"
                                        )}>
                                          {estaMarcada && <Check className="size-3" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-semibold text-foreground truncate">
                                            {nomePrincipal}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            Limite: <strong className="text-blue-400">{limiteBadge}</strong> • Saldo: {conta.quantidade_disponivel}
                                          </span>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] shrink-0 font-medium">
                                        {statusTexto}
                                      </Badge>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {selecionados.length > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                          <span className="text-blue-400 font-medium">
                            ✓ {selecionados.length} BM{selecionados.length > 1 ? "s" : ""} selecionada{selecionados.length > 1 ? "s" : ""} (quantidade sincronizada)
                          </span>
                          <button
                            type="button"
                            onClick={limparSelecao}
                            className="text-xs text-muted-foreground hover:text-destructive underline"
                          >
                            Limpar seleção
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qtd. de Contas
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 1"
                  className="h-10 bg-black/20"
                  value={item.quantidade}
                  onChange={(e) =>
                    setItens((a) =>
                      a.map((i, x) => (x === indice ? { ...i, quantidade: e.target.value } : i)),
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor Unitário
                </Label>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  className="h-10 bg-black/20"
                  value={item.preco_unitario}
                  onChange={(e) =>
                    setItens((a) =>
                      a.map((i, x) => (x === indice ? { ...i, preco_unitario: e.target.value } : i)),
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subtotal
                </Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-black/40 px-3 text-sm font-medium text-blue-400">
                  {formatarMoeda(numero(item.quantidade) * numero(item.preco_unitario))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl my-3">
          <div className="space-y-1.5">
<Label className="text-xs font-semibold text-zinc-300 mb-1.5">
              Funcionária (Produção das Contas)
            </Label>
            <Select value={funcionarioId} onValueChange={setFuncionarioId}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder={funcionarios.isLoading ? "Carregando..." : "Selecione a funcionária"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ciro-fornecedor" className="font-semibold text-purple-400">
                  FORNECEDOR CIRO
                </SelectItem>
                {(funcionarios.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome} {f.cargo ? `(${f.cargo})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300 mb-1.5">
              % Comissão / Repasse (%)
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Ex: 10"
                value={percentualComissao}
                onChange={(e) => setPercentualComissao(e.target.value)}
                className="bg-zinc-950 border-zinc-800 pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-zinc-500 font-bold">%</span>
            </div>
            {subtotal > 0 && numero(percentualComissao) > 0 && (
              <span className="text-[11px] text-blue-400 mt-1 block">
                Comissão devida: {formatarMoeda((subtotal * numero(percentualComissao)) / 100)}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="desconto">Desconto (R$)</Label>
            <Input
              id="desconto"
              inputMode="decimal"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acrescimo">Acréscimo (R$)</Label>
            <Input
              id="acrescimo"
              inputMode="decimal"
              value={acrescimo}
              onChange={(e) => setAcrescimo(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal dos itens</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-blue-500/20 pt-2 text-lg font-bold text-white">
            <span>Valor Total do Pedido</span>
            <span className="text-blue-400">{formatarMoeda(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar} disabled={salvar.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
