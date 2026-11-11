import type { CSSProperties } from "react";
import { LEXEMAS, tokenizar, type Token } from "baianol";
import { cores } from "./tema";

export const mono = "'JetBrains Mono', 'Fira Code', monospace";

export type Classe =
  | "reservada"
  | "identificador"
  | "funcao"
  | "propriedade"
  | "numero"
  | "texto"
  | "operador"
  | "pontuacao"
  | "comentario"
  | "espaco";

export interface Parte {
  valor: string;
  classe: Classe;
  categoria?: string;
}

// palavras reservadas: fundo pastel por categoria
export const fundoCategoria: Record<string, string> = {
  Declaração: cores.rosa,
  Controle: cores.amarelo,
  Erros: cores.laranja,
  Valor: cores.verde,
  Operador: cores.azul,
  "E/S": cores.lilas,
  JSON: cores.lilas,
  Envelope: cores.begeEscuro,
};

// demais tokens: tons mais fortes da paleta
export const corTexto: Partial<Record<Classe, string>> = {
  identificador: "#C03A52", // vermelho
  funcao: "#7050B0", // lilás
  propriedade: "#B85C14", // laranja
  numero: "#9A6A00", // âmbar
  texto: "#3F7A2B", // verde
  operador: "#2B78A0", // azul
  comentario: "#9B8A78", // cinza-bege
  pontuacao: cores.marrom,
};

const ehLexema = (v: string) => Object.prototype.hasOwnProperty.call(LEXEMAS, v);

function classificarTokens(tokens: Token[]): Parte[] {
  const sig = tokens.filter((t) => t.tipo !== "ESPACO" && t.tipo !== "COMENTARIO");
  const indice = new Map(sig.map((t, i) => [t, i] as const));

  return tokens.map((t): Parte => {
    switch (t.tipo) {
      case "ESPACO":
        return { valor: t.valor, classe: "espaco" };
      case "COMENTARIO":
        return { valor: t.valor, classe: "comentario" };
      case "NUMERO":
        return { valor: t.valor, classe: "numero" };
      case "TEXTO":
      case "TEMPLATE":
        return { valor: t.valor, classe: "texto" };
      case "OPERADOR":
        return { valor: t.valor, classe: "operador" };
      case "PONTUACAO":
        return { valor: t.valor, classe: "pontuacao" };
      case "PALAVRA": {
        const i = indice.get(t) ?? 0;
        const ant = sig[i - 1];
        const prox = sig[i + 1];
        if (ant && (ant.valor === "." || ant.valor === "?.")) return { valor: t.valor, classe: "propriedade" };
        if (prox?.valor === ":" && ant && (ant.valor === "{" || ant.valor === ",")) {
          return { valor: t.valor, classe: "propriedade" };
        }
        if (t.valor === "colé" || t.valor === "tá_ligado") {
          return { valor: t.valor, classe: "reservada", categoria: "Envelope" };
        }
        if (ehLexema(t.valor)) {
          return { valor: t.valor, classe: "reservada", categoria: LEXEMAS[t.valor].categoria };
        }
        if (prox?.valor === "(") return { valor: t.valor, classe: "funcao" };
        return { valor: t.valor, classe: "identificador" };
      }
    }
  });
}

/** Tolerante a erro: se o texto todo não tokeniza, tenta linha por linha. */
export function classificar(fonte: string): Parte[] {
  try {
    return classificarTokens(tokenizar(fonte));
  } catch {
    const partes: Parte[] = [];
    fonte.split("\n").forEach((linha, i) => {
      if (i > 0) partes.push({ valor: "\n", classe: "espaco" });
      if (!linha) return;
      try {
        partes.push(...classificarTokens(tokenizar(linha)));
      } catch {
        partes.push({ valor: linha, classe: "espaco" });
      }
    });
    return partes;
  }
}

/** compacto = sem padding/negrito/itálico, para não mudar a largura dos caracteres (editor). */
export function estiloDe(p: Parte, compacto = false): CSSProperties {
  if (p.classe === "reservada") {
    const fundo = fundoCategoria[p.categoria ?? ""] ?? cores.amarelo;
    return compacto
      ? { background: fundo, borderRadius: 3, boxShadow: `0 0 0 1px ${fundo}` }
      : { background: fundo, borderRadius: 4, padding: "0 3px", fontWeight: 700 };
  }
  if (p.classe === "espaco") return {};
  return {
    color: corTexto[p.classe],
    fontStyle: p.classe === "comentario" && !compacto ? "italic" : undefined,
    fontWeight: p.classe === "operador" && !compacto ? 600 : undefined,
  };
}