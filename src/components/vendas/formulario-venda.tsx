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
  salvarVendaLocal,
} from "@/lib/estoque.functions";
import { formatarMoeda, normalizeLimit } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

type Item = { 
  modalidade_id: string; 
  quantidade: string; 
  preco_unitario: string;
  conta_id?: string;
  contas_ids?: string[];
  nome_bm?: string;
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

  // Consulta de Contas e BMs disponíveis no Estoque para seleção individual (Unificada Local + Remoto)
  const contasEstoqueQuery = useQuery({
    queryKey: ["estoque-disponivel-venda", empresa?.id],
    enabled: aberto,
    staleTime: 0,
    queryFn: async () => {
      let remotos: any[] = [];
      try {
        let query = supabase
          .from("estoque")
          .select("*")
          .is("venda_id", null)
          .or("status.eq.Disponível,status.eq.disponivel,status.eq.Pronta para Envio,status_envio.eq.disponivel");

        if (empresa?.id) {
          query = query.eq("empresa_id", empresa.id);
        }

        const { data, error } = await query;
        if (!error && data) {
          remotos = data;
        } else {
          // Fallback mais abrangente sem filtros restritivos caso o schema difira
          const { data: fallbackData } = await supabase
            .from("estoque")
            .select("*")
            .is("venda_id", null);
          if (fallbackData) remotos = fallbackData;
        }
      } catch (errRemoto) {
        console.warn("Aviso ao buscar estoque remoto:", errRemoto);
      }

      let locais: any[] = [];
      if (empresa?.id) {
        try {
          const res = await listarEstoqueLocal({ data: { empresa_id: empresa.id } });
          if (res) locais = res;
        } catch (errLocal) {
          console.warn("Aviso ao buscar estoque local:", errLocal);
        }
      }

      const mapa = new Map<string, any>();
      remotos.forEach((r) => mapa.set(r.id, r));
      locais.forEach((l) => {
        if (!mapa.has(l.id)) {
          mapa.set(l.id, l);
        } else {
          mapa.set(l.id, { ...mapa.get(l.id), ...l });
        }
      });

      const todos = Array.from(mapa.values());
      return todos.filter((item) => {
        const st = (item.status || item.status_envio || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        const isSoldOrDelivered = st.includes("vendida") || st.includes("entregue") || Boolean(item.venda_id);
        if (isSoldOrDelivered) return false;

        const disp = st.includes("disponivel") || st.includes("em_estoque") || st.includes("pronta") || (!item.venda_id && !item.cliente_id);
        const qtd = item.quantidade_disponivel !== undefined && item.quantidade_disponivel !== null
          ? Number(item.quantidade_disponivel)
          : 1;
        return disp && qtd > 0;
      });
    },
  });

  const parseCurrency = (val: any): number => {
    if (typeof val === "number") return Number.isFinite(val) ? val : 0;
    if (!val) return 0;
    const limpo = String(val)
      .replace(/R\$\s?/gi, "")
      .replace(/[^0-9,.-]/g, "")
      .trim();
    if (!limpo) return 0;
    if (limpo.includes(",")) {
      const semPontoMilhar = limpo.replace(/\./g, "").replace(",", ".");
      const num = Number(semPontoMilhar);
      return Number.isFinite(num) ? num : 0;
    }
    const num = Number(limpo);
    return Number.isFinite(num) ? num : 0;
  };

  const numero = parseCurrency;

  const { subtotal, total } = useMemo(() => {
    const sub = itens.reduce(
      (acc, i) => acc + parseCurrency(i.quantidade) * parseCurrency(i.preco_unitario),
      0,
    );
    const tot = sub - parseCurrency(desconto) + parseCurrency(acrescimo);
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
    mutationFn: async (itensProcessar?: Item[]) => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");

      const listaItens = itensProcessar && itensProcessar.length > 0 ? itensProcessar : itens;
      const validos = listaItens.filter((i) => i.modalidade_id && parseCurrency(i.quantidade) > 0);
      if (validos.length === 0) {
        throw new Error("Adicione ao menos um item com modalidade e quantidade.");
      }

      if (!clienteId) {
        throw new Error("Por favor, selecione um cliente para a venda.");
      }

      const nomeCliente = (clientes.data ?? []).find((c) => c.id === clienteId)?.nome || "Cliente";
      const statusFinalEnvio = deliveryStatus === "entregue" ? "entregue" : "nao_enviado";
      const statusFinalEntrega = deliveryStatus === "entregue" ? "entregue" : "pendente";
      const dataVendaFinal = dataVenda || new Date().toISOString().slice(0, 10);
      const dataEntregaFinal = dataEntrega || null;
      const dataRealizadaFinal = deliveryStatus === "entregue" ? dataVendaFinal : null;

      // Sanitização monetária completa
      const subtotalCalculado = validos.reduce(
        (acc, i) => acc + parseCurrency(i.quantidade) * parseCurrency(i.preco_unitario),
        0
      );
      const descCalculado = parseCurrency(desconto);
      const acrescCalculado = parseCurrency(acrescimo);
      const totalCalculado = Math.max(0, subtotalCalculado - descCalculado + acrescCalculado);

      // PASSO 1: Inserir ou atualizar na tabela 'vendas' no Supabase
      let saleData: any = null;

      if (vendaId) {
        const payloadUpdate: any = {
          cliente_id: clienteId,
          cliente: nomeCliente,
          cliente_nome: nomeCliente,
          responsavel_producao_id: funcionarioId === "ciro-fornecedor" ? null : (funcionarioId || null),
          comissao_percentual: parseCurrency(percentualComissao),
          data_venda: dataVendaFinal,
          data_entrega_prevista: dataEntregaFinal,
          status: status as any,
          status_entrega: statusFinalEntrega,
          delivery_status: statusFinalEnvio,
          subtotal: subtotalCalculado,
          desconto: descCalculado,
          acrescimo: acrescCalculado,
          valor_total: totalCalculado,
          observacoes: (funcionarioId === "ciro-fornecedor" ? "[FORNECEDOR_CIRO] " : "") + (observacoes.trim() || ""),
          atualizado_por: session?.user?.id ?? null,
        };

        const { data: updatedSale, error: updError } = await supabase
          .from("vendas")
          .update(payloadUpdate)
          .eq("id", vendaId)
          .select()
          .maybeSingle();

        if (updError) {
          // Se delivery_status ou cliente_nome não existirem na tabela remota
          const { delivery_status: _, cliente_nome: __, ...safePayload } = payloadUpdate;
          const { data: retrySale, error: retryError } = await supabase
            .from("vendas")
            .update(safePayload)
            .eq("id", vendaId)
            .select()
            .single();

          if (retryError) throw retryError;
          saleData = retrySale;
        } else {
          saleData = updatedSale;
        }

        await supabase.from("venda_itens").delete().eq("venda_id", vendaId);
      } else {
        // Obter com segurança o próximo número sequencial da empresa
        let proximoNumero = 1;
        try {
          const { data: maxVenda } = await supabase
            .from("vendas")
            .select("numero, numero_venda")
            .eq("empresa_id", empresa.id)
            .order("numero", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (maxVenda) {
            const n1 = Number(maxVenda.numero) || 0;
            const n2 = Number(maxVenda.numero_venda) || 0;
            proximoNumero = Math.max(n1, n2, 0) + 1;
          }
        } catch (errNum) {
          console.warn("Aviso ao buscar próximo número sequencial:", errNum);
        }

        const payloadInsert: any = {
          empresa_id: empresa.id,
          cliente_id: clienteId,
          cliente: nomeCliente,
          cliente_nome: nomeCliente,
          numero: proximoNumero,
          responsavel_producao_id: funcionarioId === "ciro-fornecedor" ? null : (funcionarioId || null),
          comissao_percentual: parseCurrency(percentualComissao),
          data_venda: dataVendaFinal,
          data_entrega_prevista: dataEntregaFinal,
          status: (status || "confirmada") as any,
          status_entrega: statusFinalEntrega,
          delivery_status: statusFinalEnvio,
          subtotal: subtotalCalculado,
          desconto: descCalculado,
          acrescimo: acrescCalculado,
          valor_total: totalCalculado,
          observacoes: (funcionarioId === "ciro-fornecedor" ? "[FORNECEDOR_CIRO] " : "") + (observacoes.trim() || ""),
          criado_por: session?.user?.id ?? null,
        };

        const { data: newSale, error: insError } = await supabase
          .from("vendas")
          .insert([payloadInsert])
          .select()
          .single();

        if (insError) {
          // Retry sem campos opcionais se o cache do schema remoto divergir
          const { delivery_status: _, cliente_nome: __, ...safePayload } = payloadInsert;
          const { data: retrySale, error: retryError } = await supabase
            .from("vendas")
            .insert([safePayload])
            .select()
            .single();

          if (retryError) throw retryError;
          saleData = retrySale;
        } else {
          saleData = newSale;
        }
      }

      if (!saleData?.id) {
        throw new Error("Não foi possível confirmar o salvamento da venda.");
      }

      const vendaSalvaId: string = saleData.id;

      // PASSO 2: Inserir itens vinculados na tabela 'venda_itens'
      const itensInsert = validos.map((i) => ({
        venda_id: vendaSalvaId,
        modalidade_id: i.modalidade_id || null,
        conta_id: i.conta_id || (i.contas_ids?.[0]) || null,
        quantidade: parseCurrency(i.quantidade),
        preco_unitario: parseCurrency(i.preco_unitario),
        desconto: 0,
        valor_total: parseCurrency(i.quantidade) * parseCurrency(i.preco_unitario),
      }));

      const { error: erroItens } = await supabase.from("venda_itens").insert(itensInsert);
      if (erroItens) {
        if (erroItens.message?.includes("conta_id")) {
          const semConta = itensInsert.map(({ conta_id, ...resto }) => resto);
          const { error: retryItensError } = await supabase.from("venda_itens").insert(semConta);
          if (retryItensError) throw retryItensError;
        } else {
          throw erroItens;
        }
      }

      // Sincroniza registro de entrega vinculado à venda
      try {
        const { data: entregaExistente } = await supabase
          .from("entregas")
          .select("id")
          .eq("venda_id", vendaSalvaId)
          .maybeSingle();

        if (entregaExistente) {
          await supabase.from("entregas").update({
            cliente_id: clienteId,
            destinatario: nomeCliente,
            data_prevista: dataEntregaFinal || dataVendaFinal,
            status: statusFinalEntrega,
            data_realizada: dataRealizadaFinal,
            atualizado_por: session?.user?.id ?? null,
          } as any).eq("id", entregaExistente.id);
        } else {
          await supabase.from("entregas").insert({
            empresa_id: empresa.id,
            venda_id: vendaSalvaId,
            cliente_id: clienteId,
            destinatario: nomeCliente,
            data_prevista: dataEntregaFinal || dataVendaFinal,
            status: statusFinalEntrega,
            data_realizada: dataRealizadaFinal,
            criado_por: session?.user?.id ?? null,
          } as any);
        }
      } catch (errEntr) {
        console.warn("Aviso ao sincronizar entrega:", errEntr);
      }

      // PASSO 3: Baixa dos Ativos na tabela 'estoque' e Histórico de Envio
      const nomeRespEnvio = (funcionarios.data ?? []).find((f) => f.id === funcionarioId)?.nome || null;

      for (const itemVenda of validos) {
        const mod = (modalidades.data ?? []).find((m) => m.id === itemVenda.modalidade_id);
        const qtdVendida = parseCurrency(itemVenda.quantidade);
        const nomeMod = mod?.nome || "BM";
        const codigoMod = mod?.codigo || "";
        const dataDespacho = dataRealizadaFinal || dataVendaFinal;
        const selectedLimitNorm = normalizeLimit(nomeMod || codigoMod);

        let idsParaBaixar: string[] = itemVenda.contas_ids && itemVenda.contas_ids.length > 0
          ? itemVenda.contas_ids
          : itemVenda.conta_id ? [itemVenda.conta_id] : [];

        // Se não selecionou BMs específicas manualmente, deduz automaticamente as primeiras N disponíveis
        if (idsParaBaixar.length === 0) {
          const compativeis = (contasEstoqueQuery.data || []).filter((b) => {
            const bmLimitNorm = normalizeLimit(b.limite_bm || b.limite || b.tipo_ativo || b.tipo || "");
            const isSameLimit = !selectedLimitNorm || bmLimitNorm === selectedLimitNorm || bmLimitNorm.includes(selectedLimitNorm) || selectedLimitNorm.includes(bmLimitNorm);
            const st = (b.status_envio || b.status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const isSold = st.includes("vendida") || st.includes("entregue") || Boolean(b.venda_id);
            return isSameLimit && !isSold;
          });

          idsParaBaixar = compativeis.slice(0, qtdVendida).map((b) => b.id);
        }

        if (idsParaBaixar.length > 0) {
          const statusEstoque = statusFinalEnvio === "entregue" ? "Entregue" : "Vendida";
          const statusEnvioEstoque = statusFinalEnvio === "entregue" ? "entregue" : "reservada";

          // 1. Atualizar estoque no Supabase
          try {
            const payloadEstoque: any = {
              status: statusEstoque,
              status_envio: statusEnvioEstoque,
              quantidade_disponivel: 0,
              venda_id: vendaSalvaId,
              cliente_id: clienteId,
              cliente_nome: nomeCliente,
              destinatario: nomeCliente,
              data_venda: dataVendaFinal,
              updated_at: new Date().toISOString(),
            };

            const { error: errEst } = await (supabase.from("estoque") as any)
              .update(payloadEstoque)
              .in("id", idsParaBaixar)
              .eq("empresa_id", empresa.id);

            if (errEst) {
              const { data_venda: _, cliente_nome: __, ...safeEstoque } = payloadEstoque;
              await (supabase.from("estoque") as any)
                .update(safeEstoque)
                .in("id", idsParaBaixar)
                .eq("empresa_id", empresa.id);
            }
          } catch (eEst) {
            console.warn("Aviso ao atualizar status das BMs no estoque do Supabase:", eEst);
          }

          // 2. Histórico individual em contas_enviadas
          for (const bmId of idsParaBaixar) {
            const contaRef = (contasEstoqueQuery.data || []).find((c) => c.id === bmId);
            const nomeBMFinal = contaRef?.nome_bm || contaRef?.tipo_ativo || nomeMod;
            const limiteBMFinal = contaRef?.limite_bm || contaRef?.limite || selectedLimitNorm || null;

            try {
              await supabase.from("contas_enviadas").insert({
                empresa_id: empresa.id,
                bm_id: bmId,
                venda_id: vendaSalvaId,
                nome_bm: nomeBMFinal,
                limite_bm: limiteBMFinal,
                destinatario_cliente: nomeCliente,
                responsavel_envio: nomeRespEnvio,
                data_envio: dataDespacho,
                custo_unitario: contaRef?.custo_medio_unitario || 0,
                valor_venda: parseCurrency(itemVenda.preco_unitario),
                status_envio: statusFinalEnvio === "entregue" ? "enviada" : "reservada",
              } as any);
            } catch (eContas) {
              console.warn("Aviso ao salvar histórico de conta enviada:", eContas);
            }
          }

          // 3. Atualização no banco local SQLite
          try {
            await baixarBmsVendaLocal({
              data: {
                empresa_id: empresa.id,
                venda_id: vendaSalvaId,
                cliente_id: clienteId,
                destinatario: nomeCliente,
                bms_ids: idsParaBaixar,
                status_envio: statusEnvioEstoque,
              },
            });
          } catch (errLocalBaixa) {
            console.warn("Baixa local ignorada:", errLocalBaixa);
          }

          for (const bmId of idsParaBaixar) {
            const contaRef = (contasEstoqueQuery.data || []).find((c) => c.id === bmId);
            const nomeBMFinal = contaRef?.nome_bm || contaRef?.tipo_ativo || nomeMod;
            const limiteBMFinal = contaRef?.limite_bm || contaRef?.limite || selectedLimitNorm || null;

            try {
              await registrarContaEnviadaLocal({
                data: {
                  empresa_id: empresa.id,
                  bm_id: bmId,
                  venda_id: vendaSalvaId,
                  nome_bm: nomeBMFinal,
                  limite_bm: limiteBMFinal,
                  destinatario_cliente: nomeCliente,
                  responsavel_envio: nomeRespEnvio,
                  data_envio: dataDespacho,
                  custo_unitario: contaRef?.custo_medio_unitario || 0,
                  valor_venda: parseCurrency(itemVenda.preco_unitario),
                  status_envio: "enviada",
                },
              });
            } catch {
              // fallback local ignorado
            }
          }
        }
      }

      // PASSO 4: Persistência no Banco Local SQLite (TanStack Start)
      try {
        await salvarVendaLocal({
          data: {
            id: vendaSalvaId,
            empresa_id: empresa.id,
            cliente_id: clienteId,
            cliente_nome: nomeCliente,
            responsavel_producao_id: funcionarioId === "ciro-fornecedor" ? null : (funcionarioId || null),
            status: status || "confirmada",
            status_entrega: statusFinalEntrega,
            delivery_status: statusFinalEnvio,
            data_venda: dataVendaFinal,
            data_entrega_prevista: dataEntregaFinal,
            desconto: descCalculado,
            acrescimo: acrescCalculado,
            valor_total: totalCalculado,
            observacoes: ((funcionarioId === "ciro-fornecedor" ? "[FORNECEDOR_CIRO] " : "") + (observacoes.trim() || "")) || null,
            criado_por: session?.user?.id ?? null,
            itens: validos.map((i) => ({
              modalidade_id: i.modalidade_id,
              conta_id: i.conta_id || (i.contas_ids?.[0]) || null,
              quantidade: parseCurrency(i.quantidade),
              preco_unitario: parseCurrency(i.preco_unitario),
              desconto: 0,
              valor_total: parseCurrency(i.quantidade) * parseCurrency(i.preco_unitario),
            })),
          },
        });
      } catch (errLocalVenda) {
        console.warn("Aviso ao salvar venda localmente:", errLocalVenda);
      }

      // Lançamento financeiro de comissão (se houver)
      const valorComissao = (subtotalCalculado * parseCurrency(percentualComissao)) / 100;
      if (!vendaId && funcionarioId && funcionarioId !== "ciro-fornecedor" && valorComissao > 0) {
        try {
          await supabase.from("lancamentos_financeiros").insert({
            empresa_id: empresa.id,
            tipo: "pagar",
            categoria: "Comissão / Repasse",
            descricao: `Comissão Venda #${saleData.numero || "S/N"} - ${funcionarios.data?.find((f) => f.id === funcionarioId)?.nome || "Funcionária"}`,
            valor: valorComissao,
            data_vencimento: dataVendaFinal,
            situacao: "aberto",
            observacoes: `Comissão de ${percentualComissao}% sobre subtotal de ${formatarMoeda(subtotalCalculado)}.`,
            criado_por: session?.user?.id ?? null,
          });
        } catch (erroFinanceiro) {
          console.warn("Aviso ao gerar lançamento de comissão:", erroFinanceiro);
        }
      }

      return saleData;
    },
    onSuccess: () => {
      toast.success("✓ Venda cadastrada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard_metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["painel"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-producao-bms"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-disponivel-venda"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["entregas"] });
      void queryClient.invalidateQueries({ queryKey: ["contas_enviadas"] });
      void queryClient.invalidateQueries({ queryKey: ["historico_envios"] });
      void queryClient.invalidateQueries({ queryKey: ["historico_envios_estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["producao"] });
      void queryClient.invalidateQueries({ queryKey: ["producao_diaria"] });
      void queryClient.invalidateQueries({ queryKey: ["financeiro-unificado"] });
      limpar();
      aoFechar();
    },
    onError: (erro: any) => {
      console.error("Erro detalhado ao salvar venda:", erro);
      toast.error(erro?.message || "Erro ao registrar venda. Verifique os dados e tente novamente.");
    },
  });

  const handleSalvarVenda = () => {
    try {
      if (!empresa?.id) {
        toast.error("Empresa não identificada. Recarregue a página.");
        return;
      }

      if (!clienteId) {
        toast.error("Por favor, selecione um cliente para a venda.");
        return;
      }

      if (!itens || itens.length === 0) {
        toast.error("Adicione ao menos um item ao pedido.");
        return;
      }

      // Auto-associar modalidade caso uma BM tenha sido selecionada diretamente
      const itensAjustados = itens.map((item) => {
        let modId = item.modalidade_id;
        if (!modId) {
          const primeiraBmId = item.contas_ids?.[0] || item.conta_id;
          if (primeiraBmId) {
            const bmObj = (contasEstoqueQuery.data || []).find((b) => b.id === primeiraBmId);
            if (bmObj) {
              const limNorm = normalizeLimit(bmObj.limite_bm || bmObj.limite || bmObj.tipo_ativo || "");
              const mod = (modalidades.data || []).find((m) => normalizeLimit(m.nome || m.codigo) === limNorm);
              if (mod) modId = mod.id;
            }
          }
          const primeiraModalidade = modalidades.data?.[0];
          if (!modId && primeiraModalidade) {
            modId = primeiraModalidade.id;
          }
        }
        return { ...item, modalidade_id: modId };
      });

      const temItemInvalido = itensAjustados.some(
        (i) => !i.modalidade_id || parseCurrency(i.quantidade) <= 0
      );
      if (temItemInvalido) {
        toast.error("Preencha a modalidade e quantidade (> 0) para todos os itens.");
        return;
      }

      salvar.mutate(itensAjustados);
    } catch (err: any) {
      console.error("Erro no manipulador de submissão da venda:", err);
      toast.error(err?.message || "Erro ao processar dados da venda");
    }
  };

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
                        const novoModNorm = normalizeLimit(m?.nome || m?.codigo);
                        // Filtra apenas contas já selecionadas que ainda combinem com a nova modalidade selecionada
                        const contasAindaValidas = (i.contas_ids || []).filter((id) => {
                          const c = (contasEstoqueQuery.data || []).find((ct) => ct.id === id);
                          if (!c) return false;
                          const cNorm = normalizeLimit(c.limite_bm || c.limite || c.tipo_ativo || "");
                          return !novoModNorm || cNorm === novoModNorm || cNorm.includes(novoModNorm) || novoModNorm.includes(cNorm);
                        });
                        return {
                          ...i,
                          modalidade_id: v,
                          preco_unitario: m ? String(m.preco_venda_padrao) : i.preco_unitario,
                          contas_ids: contasAindaValidas,
                          conta_id: contasAindaValidas[0] || "",
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
                      const modNome = mod?.nome || mod?.codigo || "";
                      const limNorm = normalizeLimit(modNome);
                      return limNorm ? `filtrado por ${modNome}` : "todas disponíveis em estoque";
                    })()}
                  </span>
                </Label>

                {(() => {
                  const mod = (modalidades.data ?? []).find((m) => m.id === item.modalidade_id);
                  const nomeMod = mod?.nome || mod?.codigo || "";
                  const selectedLimitNorm = normalizeLimit(nomeMod); // ex: "2k"

                  const allStockBms = contasEstoqueQuery.data || [];

                  // Normalização do Filtro de Modalidade / Limite
                  const bmsFiltradasLimite = selectedLimitNorm
                    ? allStockBms.filter((bm) => {
                        const bmLimitNorm = normalizeLimit(bm.limite_bm || bm.limite || bm.tipo_ativo || bm.tipo || "");
                        return bmLimitNorm === selectedLimitNorm || bmLimitNorm.includes(selectedLimitNorm) || selectedLimitNorm.includes(bmLimitNorm);
                      })
                    : allStockBms;

                  // Se houver BMs com o limite específico, utiliza elas; caso contrário, exibe todas as BMs disponíveis para seleção imediata
                  const availableBms = bmsFiltradasLimite.length > 0 ? bmsFiltradasLimite : allStockBms;

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

                    // Se a modalidade ainda não foi escolhida, associa automaticamente a modalidade correspondente à BM selecionada
                    let novaModalidadeId = item.modalidade_id;
                    const bmSelecionada = allStockBms.find((b) => b.id === contaId);
                    if (!novaModalidadeId && bmSelecionada) {
                      const limNorm = normalizeLimit(bmSelecionada.limite_bm || bmSelecionada.limite || bmSelecionada.tipo_ativo || "");
                      const modCompativel = (modalidades.data ?? []).find((m) => normalizeLimit(m.nome || m.codigo) === limNorm);
                      if (modCompativel) {
                        novaModalidadeId = modCompativel.id;
                      }
                    }

                    setItens((prev) =>
                      prev.map((it, x) =>
                        x === indice
                          ? {
                              ...it,
                              modalidade_id: novaModalidadeId,
                              contas_ids: novosIds,
                              conta_id: novosIds[0] || "",
                              nome_bm: bmSelecionada?.nome_bm || bmSelecionada?.tipo_ativo || it.nome_bm || "",
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
                          ? { ...it, contas_ids: [], conta_id: "", nome_bm: "" }
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
                                  const c = allStockBms.find((x) => x.id === id);
                                  const n = c?.nome_bm || c?.tipo_ativo || "BM Selecionada";
                                  const lim = c?.limite_bm || c?.limite || "250";
                                  const port = c?.nome_portfolio;
                                  const conta = c?.nome_conta;
                                  return (
                                    <Badge
                                      key={id}
                                      variant="secondary"
                                      className="gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] py-0.5 px-2"
                                    >
                                      <span>{n}</span>
                                      {port && <span className="opacity-80 text-[10px]">• Port: {port}</span>}
                                      {conta && <span className="opacity-80 text-[10px]">• CA: {conta}</span>}
                                      <span className="font-bold opacity-90">• {lim}</span>
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
                        <PopoverContent className="w-[520px] max-w-[95vw] p-0 bg-popover border-border/60 shadow-xl" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar por nome da BM, portfólio, conta, operador ou limite..." className="text-xs" />
                            <CommandList className="max-h-64 overflow-y-auto">
                              <CommandEmpty className="p-3 text-xs text-center text-muted-foreground">
                                {allStockBms.length === 0
                                  ? "Nenhuma BM disponível encontrada no estoque."
                                  : "Nenhuma BM encontrada com este termo de busca."}
                              </CommandEmpty>
                              <CommandGroup heading={`Ativos Disponíveis (${availableBms.length} em estoque)`}>
                                {availableBms.map((bm) => {
                                  const nomePrincipal = bm.nome || bm.nome_bm || bm.tipo_ativo || "BM sem nome";
                                  const limiteBadge = bm.limite || bm.limite_bm || (bm.tipo_ativo?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] ?? "250");
                                  const portNome = bm.nome_portfolio || "";
                                  const contaNome = bm.nome_conta || "";
                                  const estaMarcada = selecionados.includes(bm.id);
                                  const stEnvio = (bm.status_envio || "").toLowerCase();
                                  const statusTexto = bm.status || ((stEnvio === "pronta_envio" || stEnvio.includes("pronta")) ? "Pronta para Envio" : "Disponível");
                                  const operador = bm.criador_responsavel || bm.responsavel || "";

                                  return (
                                    <CommandItem
                                      key={bm.id}
                                      value={`${nomePrincipal} ${portNome} ${contaNome} ${limiteBadge} ${operador} ${statusTexto} ${bm.id}`.toLowerCase()}
                                      onSelect={() => alternarSelecaoConta(bm.id)}
                                      className="flex items-center justify-between text-xs py-2 px-2.5 cursor-pointer hover:bg-accent/40"
                                    >
                                      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                                        <div className={cn(
                                          "flex size-4 items-center justify-center rounded border transition-colors shrink-0",
                                          estaMarcada ? "bg-blue-600 border-blue-500 text-white" : "border-muted-foreground/40 bg-background/50"
                                        )}>
                                          {estaMarcada && <Check className="size-3" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-foreground truncate">
                                              {nomePrincipal}
                                            </span>
                                            {portNome && (
                                              <>
                                                <span className="text-muted-foreground/40">•</span>
                                                <span className="text-[11px] text-blue-300 font-medium truncate max-w-[170px]" title={portNome}>
                                                  Portfólio: {portNome}
                                                </span>
                                              </>
                                            )}
                                            {contaNome && (
                                              <>
                                                <span className="text-muted-foreground/40">•</span>
                                                <span className="text-[11px] text-amber-300 font-medium truncate max-w-[170px]" title={contaNome}>
                                                  Conta: {contaNome}
                                                </span>
                                              </>
                                            )}
                                            <span className="text-muted-foreground/40">•</span>
                                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0 h-4 font-bold shrink-0">
                                              {limiteBadge.toUpperCase().startsWith("BM") ? limiteBadge.toUpperCase() : `BM ${limiteBadge.toUpperCase()}`}
                                            </Badge>
                                            <span className="text-muted-foreground/40">•</span>
                                            <span className="text-[11px] text-emerald-400 font-medium shrink-0">
                                              {statusTexto}
                                            </span>
                                          </div>
                                          {operador && (
                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                              Operador: <strong className="text-slate-300 font-normal">{operador}</strong>
                                            </span>
                                          )}
                                        </div>
                                      </div>
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
          <Button onClick={handleSalvarVenda} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
