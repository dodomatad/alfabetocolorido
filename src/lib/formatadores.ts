const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatarMoeda(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (n === null || n === undefined || Number.isNaN(n)) return moeda.format(0);
  return moeda.format(n);
}

export function formatarNumero(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return numero.format(n);
}

/** Formata uma data (ISO ou Date) como dd/MM/yyyy no fuso informado. */
export function formatarData(
  valor: string | Date | null | undefined,
  fuso = "America/Sao_Paulo",
): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? parseDataFlexivel(valor) : valor;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: fuso,
  }).format(d);
}

export function formatarDataHora(
  valor: string | Date | null | undefined,
  fuso = "America/Sao_Paulo",
): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? parseDataFlexivel(valor) : valor;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: fuso,
  }).format(d);
}

/** Datas puras (yyyy-MM-dd) são interpretadas como meio-dia UTC para evitar troca de dia. */
function parseDataFlexivel(valor: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(`${valor}T12:00:00Z`);
  return new Date(valor);
}

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D+/g, "");
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) com dígitos verificadores. */
export function documentoValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length === 11) return cpfValido(d);
  if (d.length === 14) return cnpjValido(d);
  return false;
}

export function formatarDocumento(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = apenasDigitos(valor);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return valor;
}

function cpfValido(d: string): boolean {
  if (/^(\d)\1{10}$/.test(d)) return false;
  const etapas: Array<[number, number]> = [
    [9, 10],
    [10, 11],
  ];
  for (const etapa of etapas) {
    const inicio = etapa[0];
    const pos = etapa[1];
    let soma = 0;
    for (let i = 0; i < inicio; i++) soma += Number(d[i]) * (pos - i);
    const resto = ((soma * 10) % 11) % 10;
    if (resto !== Number(d[inicio])) return false;
  }

  return true;
}

function cnpjValido(d: string): boolean {
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (tamanho: number) => {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(d[i]) * peso;
      peso = peso - 1 < 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

export function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}
