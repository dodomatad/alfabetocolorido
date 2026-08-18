import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export const CORES_GRAFICO = ["#0066ff", "#39d353", "#ffd700", "#ff4444", "#7aa2ff", "#aaaaaa"];

export type FatiaRosca = { nome: string; valor: number; cor: string };

export function GraficoRosca({
  dados,
  total,
  rotuloCentro = "Total",
}: {
  dados: FatiaRosca[];
  total: number;
  rotuloCentro?: string;
}) {
  const soma = dados.reduce((s, d) => s + d.valor, 0) || 1;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="nome"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {dados.map((d) => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">{rotuloCentro}</span>
          <span className="num text-2xl font-semibold">{total}</span>
        </div>
      </div>

      <ul className="flex-1 space-y-3">
        {dados.map((d) => (
          <li key={d.nome} className="flex items-center gap-3 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.cor }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-muted-foreground">{d.nome}</span>
            <span className="num font-medium">{((d.valor / soma) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type EtapaFunil = { etapa: string; quantidade: number; percentual: number };

export function GraficoFunil({ dados }: { dados: EtapaFunil[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 24, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="gradFunil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066ff" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#0066ff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="etapa"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#aaaaaa", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="percentual"
            stroke="#0066ff"
            strokeWidth={2}
            fill="url(#gradFunil)"
            dot={{ r: 4, fill: "#0066ff", stroke: "#0a0a0a", strokeWidth: 2 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="percentual"
              position="top"
              formatter={(v: number) => `${v.toFixed(1)}%`}
              style={{ fill: "#ffffff", fontSize: 11 }}
            />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type BarraAgrupada = {
  dia: string;
  positivo: number;
  negativo: number;
  infoPositivo?: string;
  infoNegativo?: string;
};

export function GraficoBarrasAgrupadas({
  dados,
  cores = ["#0066ff", "#ff4444"],
  legendas = ["Positivo", "Negativo"],
}: {
  dados: BarraAgrupada[];
  cores?: [string, string];
  legendas?: [string, string];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 24, right: 8, left: 8, bottom: 8 }}>
          <XAxis
            dataKey="dia"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#aaaaaa", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#141417",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            itemStyle={{ fontSize: "12px", padding: "2px 0" }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            formatter={(value: number, name: string, props: any) => {
              const isPos = name === legendas[0];
              const info = isPos ? props.payload.infoPositivo : props.payload.infoNegativo;
              return [`${value.toFixed(1)}%${info ? ` | ${info}` : ""}`, name];
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: "20px", fontSize: "11px", color: "#aaaaaa" }}
          />
          <Bar
            name={legendas[0]}
            dataKey="positivo"
            fill={cores[0]}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            barSize={20}
          />
          <Bar
            name={legendas[1]}
            dataKey="negativo"
            fill={cores[1]}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoBarras({ dados }: { dados: Array<{ dia: string; percentual: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="dia"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#aaaaaa", fontSize: 12 }}
          />
          <Bar dataKey="percentual" fill="#0066ff" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="percentual"
              position="top"
              formatter={(v: number) => `${v.toFixed(1)}%`}
              style={{ fill: "#ffffff", fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
