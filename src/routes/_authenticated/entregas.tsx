import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/entregas")({
  head: () => ({
    meta: [
      { title: "Entregas | Gestão BMs" },
      { name: "description", content: "Programação e acompanhamento das entregas aos clientes." },
      { property: "og:title", content: "Entregas | Gestão BMs" },
      { property: "og:description", content: "Programação e acompanhamento das entregas aos clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ModuloRegistros
      titulo="Entregas"
      descricao="Programação e acompanhamento das entregas aos clientes."
      tabela="entregas"
      chaveConsulta="entregas"
      selectCustom="*, clientes(nome), vendas(id, numero, cliente, cliente_id, clientes(nome))"
      ordenarPor={{ coluna: "created_at" }}
      campos={[
        { 
          nome: "venda_id", 
          rotulo: "Venda (opcional)", 
          tipo: "relacao", 
          subtipo: "combobox",
          relacao: { tabela: "vendas", rotulo: "numero" } 
        },
        { 
          nome: "cliente_id", 
          rotulo: "Cliente", 
          tipo: "relacao", 
          subtipo: "combobox",
          relacao: { tabela: "clientes", rotulo: "nome" } 
        },
        {
          nome: "destinatario",
          rotulo: "Destinatário / Cliente Avulso (opcional)",
          tipo: "texto",
        },
        { nome: "data_prevista", rotulo: "Data prevista", tipo: "data" },
        { nome: "data_realizada", rotulo: "Data realizada", tipo: "data" },
        
        {
          nome: "status",
          rotulo: "Status",
          tipo: "selecao",
          padrao: "pendente",
          opcoes: [
            { valor: "pendente", rotulo: "Pendente" },
            { valor: "em_rota", rotulo: "Em rota" },
            { valor: "entregue", rotulo: "Entregue" },
            { valor: "falhou", rotulo: "Falhou" },
            { valor: "cancelada", rotulo: "Cancelada" },
            { valor: "reposicao", rotulo: "Reposição" },
          ],
        },
        {
          nome: "custo_reposicao",
          rotulo: "Custo da Reposição (R$)",
          tipo: "moeda",
          visivel: (v) => v['status'] === "reposicao",
        },
        { nome: "observacoes", rotulo: "Observações", tipo: "texto_longo" },
      ]}
      colunas={[
        { 
          nome: "cliente_id", 
          rotulo: "Cliente", 
          relacao: { tabela: "clientes", rotulo: "nome" },
          render: (_valor, registro) => {
            // 1. Nome direto registrado no ato da venda (cliente novo/avulso)
            const nomeVendaDireto = registro.vendas?.cliente?.trim();
            // 2. Nome do cliente vinculado na venda
            const nomeClienteVenda = registro.vendas?.clientes?.nome?.trim();
            // 3. Nome do cliente vinculado diretamente na entrega
            const nomeClienteEntrega = registro.clientes?.nome?.trim();
            // 4. Destinatário direto da entrega
            const destinatario = registro.destinatario?.trim();

            const nomeFinal = nomeVendaDireto || nomeClienteVenda || nomeClienteEntrega || destinatario;

            if (!nomeFinal) {
              return (
                <span className="text-muted-foreground/70 italic text-xs">
                  Cliente não informado
                </span>
              );
            }

            return (
              <div className="flex flex-col">
                <span
                  className="block max-w-[200px] truncate font-medium text-white"
                  title={nomeFinal}
                >
                  {nomeFinal}
                </span>
                {registro.vendas?.numero ? (
                  <span className="text-[10px] text-muted-foreground">
                    Venda #{registro.vendas.numero}
                  </span>
                ) : null}
              </div>
            );
          }
        },
        { nome: "data_prevista", rotulo: "Data Prevista", formato: "data" },
        { nome: "status", rotulo: "Status" },
        { nome: "custo_reposicao", rotulo: "Custo Repos.", formato: "moeda" },
      ]}
      antesDeSalvar={async (registro) => {
        const reg = { ...registro };
        
        // Se vinculou uma venda, busca dados da venda para preencher cliente_id e destinatário se vazios
        const vendaId = reg["venda_id"];
        if (vendaId) {
          const { data: venda } = await supabase
            .from("vendas")
            .select("id, cliente, cliente_id, clientes(nome)")
            .eq("id", String(vendaId))
            .maybeSingle();

          if (venda) {
            if (!reg["cliente_id"] && venda.cliente_id) {
              reg["cliente_id"] = venda.cliente_id;
            }
            if (!reg["destinatario"]) {
              reg["destinatario"] = venda.cliente || (venda.clientes as any)?.nome || null;
            }
          }
        }

        // Se tem cliente_id mas não tem destinatário, busca o nome do cliente cadastrado
        const clienteId = reg["cliente_id"];
        if (clienteId && !reg["destinatario"]) {
          const { data: cli } = await supabase
            .from("clientes")
            .select("nome")
            .eq("id", String(clienteId))
            .maybeSingle();
          if (cli?.nome) {
            reg["destinatario"] = cli.nome;
          }
        }

        return reg;
      }}
      vazioTitulo="Nenhuma entrega programada"
      vazioDescricao="Programe a primeira entrega para acompanhar prazos e status."
    />
  );
}
