import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Search, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";


import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


import { CarregandoCartoes, EstadoErro } from "@/components/comum/estados";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";
import {
  CORES_GRAFICO,
  GraficoBarras,
  GraficoFunil,
  GraficoRosca,
} from "@/components/dashboard/graficos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarMoeda, formatarNumero } from "@/lib/formatadores";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Gestão BMs" },
      {
        name: "description",
        content:
          "Painel financeiro e operacional com faturamento, custos, lucro, ROI e conversão de vendas.",
      },
      { property: "og:title", content: "Dashboard | Gestão BMs" },
      {
        property: "og:description",
        content: "Faturamento, custos, lucro, ROI e conversão de vendas em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaDashboard,
});

const PERIODOS = [
  { valor: "7", rotulo: "Últimos 7 dias" },
  { valor: "30", rotulo: "Últimos 30 dias" },
  { valor: "90", rotulo: "Últimos 90 dias" },
  { valor: "365", rotulo: "Últimos 12 meses" },
] as const;

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  confirmada: "Confirmada",
  em_producao: "Em produção",
  pronta: "Pronta",
  parcialmente_entregue: "Parcialmente entregue",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ETAPAS_FUNIL: Array<{ chave: string; rotulo: string }> = [
  { chave: "total", rotulo: "Pedidos" },
  { chave: "confirmada", rotulo: "Confirmados" },
  { chave: "producao", rotulo: "Em produção" },
  { chave: "pronta", rotulo: "Prontos" },
  { chave: "entregue", rotulo: "Entregues" },
];

type LinhaVenda = {
  id: string;
  status: string;
  valor_total: number | string;
  desconto: number | string;
  data_venda: string;
};

type LinhaItem = {
  quantidade: number | string;
  modalidades_bm: { custo_producao_padrao: number | string } | null;
};

function PaginaDashboard() {
  const { empresa, fuso, permissoes } = useSessao();
  const [dias, setDias] = useState<string>("30");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const { inicioIso, hojeIso } = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(dias));
    return {
      inicioIso: d.toISOString().slice(0, 10),
      hojeIso: new Date().toISOString().slice(0, 10),
    };
  }, [dias]);


  const consulta = useQuery({
    queryKey: ["dashboard", empresa?.id, dias, statusFiltro],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      let vendasQuery = supabase
        .from("vendas")
        .select("id, status, valor_total, desconto, data_venda")
        .gte("data_venda", inicioIso);
      if (statusFiltro !== "todos") vendasQuery = vendasQuery.eq("status", statusFiltro as never);

      const [vendas, itens] = await Promise.all([
        vendasQuery,
        supabase
          .from("venda_itens")
          .select("quantidade, vendas!inner(data_venda), modalidades_bm(custo_producao_padrao)")
          .gte("vendas.data_venda", inicioIso),
      ]);

      const erro = vendas.error ?? itens.error;
      if (erro) throw erro;

      return {
        vendas: (vendas.data ?? []) as unknown as LinhaVenda[],
        itens: (itens.data ?? []) as unknown as LinhaItem[],
      };
    },
  });

  const vendas = consulta.data?.vendas ?? [];
  const itens = consulta.data?.itens ?? [];

  const ocultarValores = useMemo(() => {
    return permissoes.find(p => p.modulo === 'dashboard')?.ocultar_valores === true;
  }, [permissoes]);

  const validas = vendas.filter((v) => v.status !== "cancelada");
  const liquido = validas.reduce((s, v) => s + Number(v.valor_total ?? 0), 0) || 0;
  const descontos = validas.reduce((s, v) => s + Number(v.desconto ?? 0), 0) || 0;
  const bruto = liquido + descontos;
  const custos = itens.reduce(
    (s, i) => s + Number(i.quantidade ?? 0) * Number(i.modalidades_bm?.custo_producao_padrao ?? 0),
    0,
  ) || 0;
  const lucro = liquido - custos;
  const roi = custos > 0 ? lucro / custos : 0;
  const convertidas = vendas.filter(
    (v) => v.status !== "rascunho" && v.status !== "cancelada",
  ).length;
  const taxaConversao = vendas.length > 0 ? (convertidas / vendas.length) * 100 : 0;

  const fmtValor = (v: number) => (ocultarValores ? "R$ ***" : formatarMoeda(v));
  const fmtNumero = (v: number) => (ocultarValores ? "***" : formatarNumero(v));


  const porStatus = Object.entries(
    vendas.reduce<Record<string, number>>((acc, v) => {
      acc[v.status] = (acc[v.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([status, valor], i) => ({
    nome: ROTULO_STATUS[status] ?? status,
    valor,
    cor: CORES_GRAFICO[i % CORES_GRAFICO.length] as string,
  }));

  const contarStatus = (...lista: string[]) =>
    vendas.filter((v) => lista.includes(v.status)).length;
  const totalPedidos = vendas.length;
  const quantidades: Record<string, number> = {
    total: totalPedidos,
    confirmada: contarStatus(
      "confirmada",
      "em_producao",
      "pronta",
      "parcialmente_entregue",
      "entregue",
    ),
    producao: contarStatus("em_producao", "pronta", "parcialmente_entregue", "entregue"),
    pronta: contarStatus("pronta", "parcialmente_entregue", "entregue"),
    entregue: contarStatus("entregue"),
  };
  const funil = ETAPAS_FUNIL.map((e) => ({
    etapa: e.rotulo,
    quantidade: quantidades[e.chave] ?? 0,
    percentual: totalPedidos > 0 ? ((quantidades[e.chave] ?? 0) / totalPedidos) * 100 : 0,
  }));

  const contagemDias = DIAS.map((dia, indice) => ({
    dia,
    quantidade: validas.filter((v) => new Date(`${v.data_venda}T12:00:00Z`).getUTCDay() === indice)
      .length,
  }));
  const totalVolumeDias = contagemDias.reduce((s, d) => s + d.quantidade, 0) || 1;
  const barrasVolume = [...contagemDias.slice(1), contagemDias[0]!].map((d) => ({
    dia: d.dia,
    percentual: (d.quantidade / totalVolumeDias) * 100,
  }));

  const acertosPorDia = DIAS.map((dia, indice) => {
    const vendasDia = vendas.filter(
      (v) => new Date(`${v.data_venda}T12:00:00Z`).getUTCDay() === indice
    );
    const convertidasDia = vendasDia.filter(
      (v) => v.status !== "rascunho" && v.status !== "cancelada"
    ).length;
    const taxa = vendasDia.length > 0 ? (convertidasDia / vendasDia.length) * 100 : 0;
    return {
      dia,
      percentual: taxa,
    };
  });
  const barrasAcertos = [...acertosPorDia.slice(1), acertosPorDia[0]!];

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground/50 hover:text-primary transition-colors">
              <Menu className="size-4" />
            </Button>
          </SidebarTrigger>
          <h1 className="text-lg font-semibold tracking-tight text-foreground/90 sm:text-xl ml-1">Dashboard</h1>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-primary hover:bg-primary/10 transition-colors" aria-label="Buscar e filtrar dados">
              <Search className="size-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Filtros</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatarData(inicioIso, fuso)} 00:00 — {formatarData(hojeIso, fuso)} 23:59
              </p>
            </div>

            <label className="block space-y-1.5 text-xs text-muted-foreground">
              Período de visualização
              <Select value={dias} onValueChange={setDias}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => (
                    <SelectItem key={p.valor} value={p.valor}>
                      {p.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="block space-y-1.5 text-xs text-muted-foreground">
              Status do pedido
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>
                      {rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              Empresa
              <div className="flex h-9 items-center rounded-md border bg-secondary px-3 text-sm text-foreground">
                <span className="truncate">
                  {empresa?.nome_fantasia || empresa?.razao_social || "—"}
                </span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>


      {consulta.isLoading ? (
        <CarregandoCartoes />
      ) : consulta.isError ? (
        <EstadoErro
          descricao={(consulta.error as Error).message}
          aoTentarNovamente={() => void consulta.refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <CartaoMetrica
              rotulo="Faturamento bruto"
              valor={fmtValor(bruto)}
              destaque
              className="lg:col-span-1"
            />
            <CartaoMetrica
              rotulo="Custo com Perfil"
              valor={fmtValor(custos)}
            />
            <CartaoMetrica
              rotulo="Faturamento líquido"
              valor={fmtValor(liquido)}
            />
            <CartaoMetrica
              rotulo="ROI"
              valor={fmtNumero(roi)}
              corValor={
                roi < 1.0 ? "text-red-500" :
                roi < 2.0 ? "text-amber-500" :
                roi < 4.0 ? "text-emerald-500" :
                "text-blue-500"
              }
              explicacao={ocultarValores ? "" : "< 1.0: Crítico | 1.0 a 1.99: Alerta | 2.0 a 3.99: Bom | 4.0+: Excelente"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
            <CartaoMetrica
              rotulo="Lucro"
              valor={fmtValor(lucro)}
              positivo={lucro >= 0}
            />
            <CartaoMetrica
              rotulo="Taxa de Acertos"
              valor={ocultarValores ? "***%" : `${formatarNumero(taxaConversao)}%`}
              positivo={taxaConversao >= 0}
            />
          </div>


          <section className="rounded-xl border bg-card p-6 shadow-panel">
            <h2 className="text-sm font-semibold">Vendas por dia da semana</h2>
            <p className="mb-2 mt-1 text-xs text-muted-foreground">
              Participação de cada dia no total de vendas do período.
            </p>
            {vendas.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada no período.
              </p>
            ) : (
              <GraficoBarras dados={barrasVolume} />
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-panel">
            <h2 className="text-sm font-semibold">Taxa de Acertos por dia da semana</h2>
            <p className="mb-2 mt-1 text-xs text-muted-foreground">
              Desempenho de conversão segmentado por dia.
            </p>
            {vendas.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada no período.
              </p>
            ) : (
              <GraficoBarras dados={barrasAcertos} />
            )}
          </section>

        </>
      )}
    </div>
  );
}
