export const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const maskCPF = (v: string) =>
  onlyDigits(v).slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

export const maskCEP = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export function isValidCPF(value: string) {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10]);
}
