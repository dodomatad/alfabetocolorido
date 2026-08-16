import {
  Boxes,
  Building2,
  ClipboardList,
  Factory,
  FileBarChart,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Truck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ItemMenu = {
  titulo: string;
  url: string;
  icone: LucideIcon;
};

export type GrupoMenu = {
  rotulo: string;
  itens: ItemMenu[];
};

export const GRUPOS_MENU: GrupoMenu[] = [
  {
    rotulo: "Operação",
    itens: [
      { titulo: "Visão geral", url: "/", icone: LayoutDashboard },
      { titulo: "Vendas", url: "/vendas", icone: ShoppingCart },
      { titulo: "Produção", url: "/producao", icone: Factory },
      { titulo: "Estoque", url: "/estoque", icone: Boxes },
      { titulo: "Entregas", url: "/entregas", icone: Truck },
    ],
  },
  {
    rotulo: "Financeiro",
    itens: [
      { titulo: "Financeiro", url: "/financeiro", icone: Wallet },
      { titulo: "Contas a receber", url: "/contas-receber", icone: TrendingUp },
      { titulo: "Contas a pagar", url: "/contas-pagar", icone: TrendingDown },
    ],
  },
  {
    rotulo: "Cadastros",
    itens: [
      { titulo: "Clientes", url: "/clientes", icone: Users },
      { titulo: "Fornecedores", url: "/fornecedores", icone: Building2 },
      { titulo: "Equipe", url: "/equipe", icone: ClipboardList },
    ],
  },
  {
    rotulo: "Gestão",
    itens: [
      { titulo: "Relatórios", url: "/relatorios", icone: FileBarChart },
      { titulo: "Configurações", url: "/configuracoes", icone: Settings },
    ],
  },
];
