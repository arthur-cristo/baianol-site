import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { Box, Flex } from "@chakra-ui/react";
import { LEXEMAS } from "baianol";
import {
  classificar,
  corTexto,
  estiloDe,
  fundoCategoria,
  mono,
} from "./realce";
import { cores } from "./tema";

/* ───────── medidas (fixas, para o texto e o realce alinharem) ───────── */
const FONTE = 14;
const LINHA = 24;
const PAD = 16;
const GUT = 48;
const ESQ = GUT + 14;
const TAB = "  ";

const PARES = new Map([
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
]);
const FECHAM = new Set([")", "]", "}"]);
const ASPAS = new Set(['"', "'", "`"]);

/* ───────── sugestões ───────── */
interface Item {
  rotulo: string;
  detalhe: string;
  inserir: string; // $0 marca onde fica o cursor
  tipo: "palavra" | "snippet" | "nome";
  categoria?: string;
}

const SNIPPETS: Record<string, { detalhe: string; inserir: string }[]> = {
  possa_ser: [{ detalhe: "if (…) { }", inserir: "possa_ser ($0) {\n  \n}" }],
  lá_ele: [{ detalhe: "else { }", inserir: "lá_ele {\n  $0\n}" }],
  corropio: [{ detalhe: "while (…) { }", inserir: "corropio ($0) {\n  \n}" }],
  paletada: [
    { detalhe: "for…of lista", inserir: "paletada item de $0 {\n  \n}" },
    {
      detalhe: "for de 1 até n",
      inserir: "paletada i de 1 daqui_pra $0 {\n  \n}",
    },
  ],
  armengue: [
    { detalhe: "function nome() { }", inserir: "armengue $0() {\n  \n}" },
  ],
  catiguria: [
    {
      detalhe: "class { construtor }",
      inserir: "catiguria $0 {\n  construtor() {\n    \n  }\n}",
    },
  ],
  construtor: [
    { detalhe: "constructor() { }", inserir: "construtor($0) {\n  \n}" },
  ],
  dar_testa: [
    {
      detalhe: "try / catch",
      inserir: "dar_testa {\n  $0\n} oxente (erro) {\n  \n}",
    },
  ],
  oxente: [
    { detalhe: "catch (erro) { }", inserir: "oxente (erro) {\n  $0\n}" },
  ],
  morreu_aí: [{ detalhe: "finally { }", inserir: "morreu_aí {\n  $0\n}" }],
  trocar_ideias: [{ detalhe: "console.log()", inserir: "trocar_ideias($0)" }],
  enrolar: [{ detalhe: "JSON.stringify()", inserir: "enrolar($0)" }],
  desapartar: [{ detalhe: "JSON.parse()", inserir: "desapartar($0)" }],
};

const BASE: Item[] = [
  {
    rotulo: "colé",
    detalhe: "programa completo",
    inserir: "colé\n\n$0\n\ntá_ligado",
    tipo: "snippet",
    categoria: "Envelope",
  },
  {
    rotulo: "tá_ligado",
    detalhe: "fecha o programa",
    inserir: "tá_ligado",
    tipo: "palavra",
    categoria: "Envelope",
  },
  ...Object.entries(LEXEMAS).flatMap(([k, d]): Item[] => {
    const snips = SNIPPETS[k];
    if (snips) {
      return snips.map((s) => ({
        rotulo: k,
        detalhe: s.detalhe,
        inserir: s.inserir,
        tipo: "snippet",
        categoria: d.categoria,
      }));
    }
    return [
      {
        rotulo: k,
        detalhe: d.js,
        inserir: k,
        tipo: "palavra",
        categoria: d.categoria,
      },
    ];
  }),
];

/* ───────── funções puras ───────── */
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const inicioDaLinha = (v: string, pos: number) =>
  pos === 0 ? 0 : v.lastIndexOf("\n", pos - 1) + 1;

/** O cursor está dentro de "texto", 'texto', `texto` ou de um comentário //? (só olha a linha atual) */
function dentroDeTexto(linhaAntes: string): boolean {
  let aspa: string | null = null;
  for (let i = 0; i < linhaAntes.length; i++) {
    const c = linhaAntes[i];
    if (aspa) {
      if (c === "\\") i++;
      else if (c === aspa) aspa = null;
    } else if (c === '"' || c === "'" || c === "`") aspa = c;
    else if (c === "/" && linhaAntes[i + 1] === "/") return true;
  }
  return aspa !== null;
}

let larguraCache = 0;
function larguraChar(): number {
  if (!larguraCache) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.font = `${FONTE}px ${mono}`;
      larguraCache = ctx.measureText("M").width;
    }
  }
  return larguraCache || 8.4;
}

function calcularSugestoes(v: string, caret: number, forcar: boolean) {
  const antes = v.slice(0, caret);
  const prefixo = /[\p{L}\p{N}_$]*$/u.exec(antes)![0];
  const ini = caret - prefixo.length;
  if (!forcar && prefixo.length === 0) return null;
  if (/^\d/.test(prefixo)) return null;
  if (v[ini - 1] === ".") return null;
  if (dentroDeTexto(antes.slice(antes.lastIndexOf("\n") + 1))) return null;

  const nomes = new Set<string>();
  for (const p of classificar(v)) {
    if (
      (p.classe === "identificador" || p.classe === "funcao") &&
      p.valor !== prefixo
    )
      nomes.add(p.valor);
  }

  const np = norm(prefixo);
  const itens = [
    ...BASE,
    ...[...nomes].map(
      (n): Item => ({ rotulo: n, detalhe: "nome", inserir: n, tipo: "nome" }),
    ),
  ]
    .filter((i) => i.inserir !== prefixo && norm(i.rotulo).startsWith(np))
    .sort(
      (a, b) =>
        Number(a.tipo === "nome") - Number(b.tipo === "nome") ||
        a.rotulo.length - b.rotulo.length,
    )
    .slice(0, 8);

  return itens.length ? { itens, prefixo, ini } : null;
}

/** Aplica a indentação da linha atual às linhas seguintes do snippet e acha o cursor ($0). */
function expandir(modelo: string, indent: string) {
  const texto = modelo
    .split("\n")
    .map((l, i) => (i === 0 ? l : indent + l))
    .join("\n");
  const marca = texto.indexOf("$0");
  return marca === -1
    ? { texto, caret: texto.length }
    : { texto: texto.replace("$0", ""), caret: marca };
}

/** Edita via execCommand para manter o Ctrl+Z nativo. */
function inserir(
  ta: HTMLTextAreaElement,
  ini: number,
  fim: number,
  texto: string,
) {
  ta.focus();
  ta.setSelectionRange(ini, fim);
  if (!document.execCommand("insertText", false, texto)) {
    ta.setRangeText(texto, ini, fim, "end");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function apagar(ta: HTMLTextAreaElement, ini: number, fim: number) {
  ta.focus();
  ta.setSelectionRange(ini, fim);
  if (!document.execCommand("delete")) {
    ta.setRangeText("", ini, fim, "end");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/** Tab / Shift+Tab em várias linhas. */
function indentarBloco(ta: HTMLTextAreaElement, recuar: boolean) {
  const v = ta.value;
  const ini = ta.selectionStart;
  const fim = ta.selectionEnd;
  const bIni = inicioDaLinha(v, ini);
  const limite = fim > ini && v[fim - 1] === "\n" ? fim - 1 : fim;
  const quebra = v.indexOf("\n", limite);
  const bFim = quebra === -1 ? v.length : quebra;

  let primeira = 0;
  let total = 0;
  const novas = v
    .slice(bIni, bFim)
    .split("\n")
    .map((l, i) => {
      let nova = l;
      let delta = 0;
      if (recuar) {
        const rem = /^ {1,2}/.exec(l)?.[0].length ?? 0;
        nova = l.slice(rem);
        delta = -rem;
      } else if (l.length) {
        nova = TAB + l;
        delta = TAB.length;
      }
      if (i === 0) primeira = delta;
      total += delta;
      return nova;
    });

  inserir(ta, bIni, bFim, novas.join("\n"));
  ta.setSelectionRange(Math.max(bIni, ini + primeira), fim + total);
}

/* ───────── estilos compartilhados entre o textarea e o realce ───────── */
const baseTexto: CSSProperties = {
  fontFamily: mono,
  fontSize: FONTE,
  lineHeight: `${LINHA}px`,
  letterSpacing: "normal",
  fontVariantLigatures: "none",
  tabSize: 2,
  whiteSpace: "pre",
  overflowWrap: "normal",
  wordBreak: "normal",
  margin: 0,
  border: 0,
  boxSizing: "border-box",
  paddingTop: PAD,
  paddingBottom: PAD,
  paddingRight: PAD,
  paddingLeft: ESQ,
};

interface Sug {
  itens: Item[];
  prefixo: string;
  ini: number;
  sel: number;
  x: number;
  y: number;
}

interface Props {
  valor: string;
  onChange: (v: string) => void;
  onExecutar: () => void;
  altura?: string;
  linhaErro?: number | null;
}

export default function Editor({
  valor,
  onChange,
  onExecutar,
  altura = "480px",
  linhaErro = null,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const camadaRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const suprimir = useRef(false);
  const [sug, setSug] = useState<Sug | null>(null);

  const partes = useMemo(() => classificar(valor), [valor]);
  const totalLinhas = valor.split("\n").length;

  function abrir(v: string, caret: number, forcar: boolean) {
    const r = calcularSugestoes(v, caret, forcar);
    const ta = taRef.current;
    if (!r || !ta) {
      setSug(null);
      return;
    }
    const linha = v.slice(0, r.ini).split("\n").length - 1;
    const col = r.ini - inicioDaLinha(v, r.ini);
    const alt = r.itens.length * 28 + 8;
    let y = PAD + (linha + 1) * LINHA - ta.scrollTop;
    if (y + alt > ta.clientHeight && y - LINHA - alt > 0) y = y - LINHA - alt;
    const x = Math.min(
      Math.max(0, ESQ + col * larguraChar() - ta.scrollLeft),
      Math.max(0, ta.clientWidth - 280),
    );
    setSug({ ...r, sel: 0, x, y });
  }

  function aceitar(item: Item) {
    const ta = taRef.current;
    if (!ta || !sug) return;
    const v = ta.value;
    const caret = ta.selectionStart;
    const indent = /^[ \t]*/.exec(v.slice(inicioDaLinha(v, caret), caret))![0];
    const { texto, caret: off } = expandir(item.inserir, indent);
    suprimir.current = true;
    inserir(ta, sug.ini, caret, texto);
    suprimir.current = false;
    ta.setSelectionRange(sug.ini + off, sug.ini + off);
    setSug(null);
  }

  function aoMudar(e: ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    onChange(v);
    if (suprimir.current) {
      setSug(null);
      return;
    }
    abrir(v, e.target.selectionStart, false);
  }

  function aoRolar(e: UIEvent<HTMLTextAreaElement>) {
    const { scrollLeft, scrollTop } = e.currentTarget;
    if (camadaRef.current)
      camadaRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    if (gutterRef.current)
      gutterRef.current.style.transform = `translateY(${-scrollTop}px)`;
    if (sug) setSug(null);
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    const ta = e.currentTarget;
    const v = ta.value;
    const ini = ta.selectionStart;
    const fim = ta.selectionEnd;
    const k = e.key;

    if ((e.ctrlKey || e.metaKey) && k === "Enter") {
      e.preventDefault();
      onExecutar();
      return;
    }
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      abrir(v, ini, true);
      return;
    }

    // popup aberto: navegação
    if (sug) {
      if (k === "ArrowDown" || k === "ArrowUp") {
        e.preventDefault();
        const n = sug.itens.length;
        setSug({
          ...sug,
          sel: (sug.sel + (k === "ArrowDown" ? 1 : n - 1)) % n,
        });
        return;
      }
      if (k === "Enter" || k === "Tab") {
        e.preventDefault();
        aceitar(sug.itens[sug.sel]);
        return;
      }
      if (k === "Escape") {
        e.preventDefault();
        setSug(null);
        return;
      }
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "PageUp",
          "PageDown",
        ].includes(k)
      )
        setSug(null);
    }

    const semModificador = !e.ctrlKey && !e.metaKey && !e.altKey;

    // Tab / Shift+Tab
    if (k === "Tab" && semModificador) {
      e.preventDefault();
      if (e.shiftKey || v.slice(ini, fim).includes("\n")) {
        indentarBloco(ta, e.shiftKey);
      } else {
        const col = ini - inicioDaLinha(v, ini);
        inserir(ta, ini, fim, " ".repeat(TAB.length - (col % TAB.length)));
      }
      return;
    }

    // Enter: mantém a indentação, entra um nível depois de { ( [
    if (k === "Enter" && semModificador && !e.shiftKey) {
      e.preventDefault();
      const antes = v.slice(0, ini);
      const linhaAntes = antes.slice(antes.lastIndexOf("\n") + 1);
      const indent = /^[ \t]*/.exec(linhaAntes)![0];
      const ult = linhaAntes.trimEnd().slice(-1);
      const abre = ult !== "" && PARES.has(ult);
      if (abre && PARES.get(ult) === (v[fim] ?? "")) {
        const meio = indent + TAB;
        inserir(ta, ini, fim, "\n" + meio + "\n" + indent);
        ta.setSelectionRange(ini + 1 + meio.length, ini + 1 + meio.length);
      } else {
        inserir(ta, ini, fim, "\n" + indent + (abre ? TAB : ""));
      }
      return;
    }

    // Backspace entre um par vazio: apaga os dois
    if (k === "Backspace" && ini === fim && ini > 0) {
      const a = v[ini - 1];
      const p = v[ini];
      if (PARES.get(a) === p || (ASPAS.has(a) && a === p)) {
        e.preventDefault();
        apagar(ta, ini - 1, ini + 1);
        return;
      }
    }

    if (!semModificador || k.length !== 1) return;

    const prox = v[fim] ?? "";
    const antes = v.slice(0, ini);
    const linhaAntes = antes.slice(antes.lastIndexOf("\n") + 1);
    const emTexto = dentroDeTexto(linhaAntes);

    // seleção + ( [ { " ' ` : envolve
    if (ini !== fim && (PARES.has(k) || ASPAS.has(k))) {
      e.preventDefault();
      inserir(ta, ini, fim, k + v.slice(ini, fim) + (PARES.get(k) ?? k));
      ta.setSelectionRange(ini + 1, fim + 1);
      return;
    }

    // digitar o fechamento que já está logo à frente: só pula
    if (ini === fim && (FECHAM.has(k) || ASPAS.has(k)) && prox === k) {
      e.preventDefault();
      ta.setSelectionRange(ini + 1, ini + 1);
      return;
    }

    // } numa linha só com espaços: recua um nível
    if (
      k === "}" &&
      ini === fim &&
      linhaAntes.length >= TAB.length &&
      /^[ \t]+$/.test(linhaAntes)
    ) {
      e.preventDefault();
      inserir(ta, ini - TAB.length, fim, "}");
      return;
    }

    // abre um par
    if (ini === fim && !emTexto && /^(|\s|[)\]}])$/.test(prox)) {
      if (PARES.has(k)) {
        e.preventDefault();
        inserir(ta, ini, fim, k + PARES.get(k));
        ta.setSelectionRange(ini + 1, ini + 1);
      } else if (ASPAS.has(k) && !/[\p{L}\p{N}_]/u.test(v[ini - 1] ?? "")) {
        e.preventDefault();
        inserir(ta, ini, fim, k + k);
        ta.setSelectionRange(ini + 1, ini + 1);
      }
    }
  }

  return (
    <Box
      position="relative"
      h={altura}
      css={{ "& textarea::selection": { background: "rgba(191,227,232,0.7)" } }}
    >
      <Box position="absolute" inset={0} overflow="hidden" bg="#FFFBF2">
        {/* fundo da calha */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: GUT,
            background: cores.begeEscuro,
            borderRight: `2px solid ${cores.marrom}`,
          }}
        />

        {/* realce (rola junto com o textarea via transform) */}
        <div
          ref={camadaRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            willChange: "transform",
          }}
        >
          {linhaErro != null && (
            <div
              style={{
                position: "absolute",
                left: -50000,
                width: 100000,
                top: PAD + (linhaErro - 1) * LINHA,
                height: LINHA,
                background: "rgba(246,195,200,0.6)",
              }}
            />
          )}
          <pre
            style={{
              ...baseTexto,
              position: "relative",
              color: cores.marrom,
              background: "transparent",
            }}
          >
            <code>
              {partes.map((p, i) => (
                <span key={i} style={estiloDe(p, true)}>
                  {p.valor}
                </span>
              ))}
            </code>
            <br />
          </pre>
        </div>

        {/* números de linha */}
        <div
          ref={gutterRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: GUT,
            boxSizing: "border-box",
            padding: `${PAD}px 10px ${PAD}px 0`,
            textAlign: "right",
            pointerEvents: "none",
            willChange: "transform",
            fontFamily: mono,
            fontSize: FONTE,
            lineHeight: `${LINHA}px`,
            color: "#9B8A78",
          }}
        >
          {Array.from({ length: totalLinhas }, (_, i) => (
            <div
              key={i}
              style={
                i + 1 === linhaErro
                  ? { color: "#C03A52", fontWeight: 700 }
                  : undefined
              }
            >
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          ref={taRef}
          value={valor}
          onChange={aoMudar}
          onKeyDown={aoTeclar}
          onScroll={aoRolar}
          onClick={() => setSug(null)}
          onBlur={() => setSug(null)}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Editor de código baianol#"
          style={{
            ...baseTexto,
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            resize: "none",
            outline: "none",
            overflow: "auto",
            background: "transparent",
            color: "transparent",
            caretColor: cores.marrom,
          }}
        />
      </Box>

      {sug && (
        <Box
          position="absolute"
          zIndex={5}
          left={`${sug.x}px`}
          top={`${sug.y}px`}
          minW="260px"
          bg="#FFFBF2"
          border="2px solid"
          borderColor={cores.marrom}
          borderRadius="12px"
          boxShadow={`4px 4px 0 ${cores.rosa}`}
          fontFamily={mono}
          fontSize="13px"
          overflow="hidden"
        >
          {sug.itens.map((item, i) => (
            <Flex
              key={i}
              h="28px"
              px={2}
              gap={2}
              align="center"
              cursor="pointer"
              bg={i === sug.sel ? cores.amarelo : "transparent"}
              onMouseDown={(e) => {
                e.preventDefault();
                aceitar(item);
              }}
              onMouseEnter={() => setSug({ ...sug, sel: i })}
            >
              <Box
                w="10px"
                h="10px"
                flexShrink={0}
                borderRadius="3px"
                border="1px solid"
                borderColor={cores.marrom}
                bg={
                  item.tipo === "nome"
                    ? corTexto.identificador
                    : (fundoCategoria[item.categoria ?? ""] ?? cores.amarelo)
                }
              />
              <Box flex="1" whiteSpace="nowrap">
                <b>{item.rotulo.slice(0, sug.prefixo.length)}</b>
                {item.rotulo.slice(sug.prefixo.length)}
              </Box>
              <Box opacity={0.6} fontSize="11px" whiteSpace="nowrap">
                {item.detalhe}
              </Box>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
}
