import { Box, Button, Flex, Heading, Text, SimpleGrid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

/* ───────── paleta ───────── */
const cores = {
  bege: "#F6EBD9",
  begeEscuro: "#EAD8BC",
  marrom: "#4A3426",
  rosa: "#F6C3C8",
  amarelo: "#FBE29A",
  azul: "#BFE3E8",
  verde: "#C9E6B5",
  laranja: "#F9CFA5",
  lilas: "#DCCBF0",
};
const fitas = [
  cores.rosa,
  cores.amarelo,
  cores.azul,
  cores.verde,
  cores.laranja,
  cores.lilas,
];

/* ───────── dados ───────── */
const exemploCodigo = `colé

por_vida cidade = "Salvador"
deixe visitantes = 3

armengue saudar(nome) {
  resultado "Colé, " + nome
}

paletada i de 1 daqui_pra visitantes {
  possa_ser (i mermo 2) {
    trocar_ideias(saudar("meu rei"))
  } lá_ele {
    trocar_ideias("oi")
  }
}

tá_ligado`;

const palavrasChave = [
  "colé",
  "tá_ligado",
  "por_vida",
  "deixe",
  "armengue",
  "resultado",
  "paletada",
  "de",
  "daqui_pra",
  "possa_ser",
  "lá_ele",
  "mermo",
  "trocar_ideias",
  "corropio",
  "catiguria",
  "dar_testa",
  "oxente",
];

const comandos = [
  { oxe: "por_vida", js: "const", cor: cores.rosa },
  { oxe: "deixe", js: "let", cor: cores.amarelo },
  { oxe: "armengue", js: "function", cor: cores.azul },
  { oxe: "catiguria", js: "class", cor: cores.verde },
  { oxe: "resultado", js: "return", cor: cores.laranja },
  { oxe: "possa_ser / lá_ele", js: "if / else", cor: cores.lilas },
  { oxe: "corropio", js: "while", cor: cores.rosa },
  { oxe: "paletada", js: "for...of / for", cor: cores.amarelo },
  { oxe: "borimbora / siga_certo", js: "break / continue", cor: cores.azul },
  { oxe: "dar_testa / oxente", js: "try / catch", cor: cores.verde },
  { oxe: "trocar_ideias", js: "console.log", cor: cores.laranja },
  { oxe: "massa / aonde / vazio", js: "true / false / null", cor: cores.lilas },
  { oxe: "mermo", js: "===", cor: cores.rosa },
  { oxe: "num_é", js: "!==", cor: cores.amarelo },
  { oxe: "mais / ou / num", js: "&& / || / !", cor: cores.azul },
  { oxe: "criatura / na_casa", js: "new / this", cor: cores.verde },
];

const etapas = [
  {
    n: "1",
    titulo: "Léxico",
    texto:
      "Quebra o .oxe em tokens, reconhecendo as palavras do dicionário baianês.",
    cor: cores.rosa,
  },
  {
    n: "2",
    titulo: "Parser",
    texto:
      "Descida recursiva: monta a árvore e para no primeiro erro, com linha e coluna.",
    cor: cores.amarelo,
  },
  {
    n: "3",
    titulo: "Gerador",
    texto: "Percorre a árvore e escreve o JavaScript equivalente.",
    cor: cores.azul,
  },
  {
    n: "4",
    titulo: "Execução",
    texto:
      "O Node compila e roda o resultado, e ainda serve de rede de segurança.",
    cor: cores.verde,
  },
];

const regras = [
  {
    titulo: "Sem ponto e vírgula",
    texto: "O comando termina na quebra de linha. Um ; solto gera erro.",
    cor: cores.laranja,
  },
  {
    titulo: "Envelope obrigatório",
    texto: "Todo programa abre com colé e fecha com tá_ligado.",
    cor: cores.lilas,
  },
  {
    titulo: "Parênteses opcionais",
    texto:
      "Em possa_ser, corropio, parâmetros e oxente você escolhe usar ou não.",
    cor: cores.rosa,
  },
  {
    titulo: "Subdialeto JSON",
    texto:
      "Um .oxe que começa com { ou [ vira JSON com chaves sem aspas e comentários.",
    cor: cores.amarelo,
  },
];

/* ───────── pedaços ───────── */

function FitasBonfim() {
  return (
    <Flex h="14px" w="100%">
      {Array.from({ length: 24 }).map((_, i) => (
        <Box key={i} flex="1" bg={fitas[i % fitas.length]} />
      ))}
    </Flex>
  );
}

function Bandeirinhas() {
  return (
    <Flex w="100%" justify="space-between" overflow="hidden" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <Box
          key={i}
          w="38px"
          h="46px"
          flexShrink={0}
          bg={fitas[i % fitas.length]}
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
      ))}
    </Flex>
  );
}

function Secao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="section"
      maxW="1100px"
      mx="auto"
      px={{ base: 5, md: 8 }}
      py={{ base: 10, md: 16 }}
    >
      <Heading
        as="h2"
        fontSize={{ base: "2xl", md: "4xl" }}
        color={cores.marrom}
        mb={2}
      >
        {titulo}
      </Heading>
      {subtitulo && (
        <Text
          color={cores.marrom}
          opacity={0.75}
          fontSize="lg"
          mb={8}
          maxW="640px"
        >
          {subtitulo}
        </Text>
      )}
      {children}
    </Box>
  );
}

function CodigoOxe({ codigo }: { codigo: string }) {
  const palavras = palavrasChave.slice().sort((a, b) => b.length - a.length);

  const regex = new RegExp(
    `((?<![\\p{L}\\p{N}_])(?:${palavras.join("|")})(?![\\p{L}\\p{N}_])|"[^"]*"|(?<![\\p{L}\\p{N}_])\\d+(?![\\p{L}\\p{N}_]))`,
    "gu",
  );
  const partes = codigo.split(regex);

  return (
    <Box
      as="pre"
      bg="#FFFBF2"
      border="3px solid"
      borderColor={cores.marrom}
      borderRadius="20px"
      boxShadow={`8px 8px 0 ${cores.rosa}`}
      p={{ base: 4, md: 6 }}
      fontFamily="'JetBrains Mono', 'Fira Code', monospace"
      fontSize={{ base: "xs", md: "sm" }}
      lineHeight="1.7"
      color={cores.marrom}
      overflowX="auto"
      userSelect="text"
    >
      <code>
        {partes.map((p, i) => {
          if (palavrasChave.includes(p))
            return (
              <span
                key={i}
                style={{
                  background: cores.amarelo,
                  borderRadius: 4,
                  padding: "0 3px",
                  fontWeight: 700,
                }}
              >
                {p}
              </span>
            );
          if (p.startsWith('"'))
            return (
              <span key={i} style={{ color: "#B5533C" }}>
                {p}
              </span>
            );
          if (/^\d+$/.test(p))
            return (
              <span key={i} style={{ color: "#3C7A89" }}>
                {p}
              </span>
            );
          return <span key={i}>{p}</span>;
        })}
      </code>
    </Box>
  );
}

/* ───────── página ───────── */

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box bg={cores.bege} color={cores.marrom} minH="100vh" userSelect="none">
      <FitasBonfim />

      {/* HERO */}
      <Box
        as="header"
        maxW="1100px"
        mx="auto"
        px={{ base: 5, md: 8 }}
        pt={{ base: 10, md: 20 }}
        pb={{ base: 10, md: 16 }}
      >
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 10, lg: 14 }}
          align="center"
        >
          <Box flex="1">
            <Box
              display="inline-block"
              bg={cores.verde}
              border="2px solid"
              borderColor={cores.marrom}
              borderRadius="full"
              px={4}
              py={1}
              fontWeight="700"
              fontSize="sm"
              mb={5}
            >
              arquivos .oxe → JavaScript
            </Box>

            <Heading
              as="h1"
              fontSize={{ base: "5xl", md: "7xl" }}
              lineHeight="1"
              letterSpacing="-0.02em"
            >
              baianol
              <Box
                as="span"
                bg={cores.rosa}
                px={2}
                ml={1}
                borderRadius="12px"
                display="inline-block"
                transform="rotate(-3deg)"
              >
                #
              </Box>
            </Heading>

            <Text
              fontSize={{ base: "lg", md: "xl" }}
              mt={6}
              maxW="520px"
              lineHeight="1.6"
            >
              Uma linguagem de programação que fala baianês. Escreva{" "}
              <b>armengue</b>, <b>paletada</b> e <b>possa_ser</b>, e o
              transpilador entrega JavaScript pronto para rodar no Node. Colé?
            </Text>

            <Flex gap={3} mt={8} wrap="wrap">
              <Button
                size="lg"
                bg={cores.amarelo}
                color={cores.marrom}
                border="3px solid"
                borderColor={cores.marrom}
                borderRadius="14px"
                boxShadow={`4px 4px 0 ${cores.marrom}`}
                _hover={{
                  transform: "translate(2px, 2px)",
                  boxShadow: `2px 2px 0 ${cores.marrom}`,
                }}
                onClick={() => navigate("/playground")}
              >
                Abrir o playground
              </Button>
              <Button
                size="lg"
                bg={cores.azul}
                color={cores.marrom}
                border="3px solid"
                borderColor={cores.marrom}
                borderRadius="14px"
                boxShadow={`4px 4px 0 ${cores.marrom}`}
                _hover={{
                  transform: "translate(2px, 2px)",
                  boxShadow: `2px 2px 0 ${cores.marrom}`,
                }}
                onClick={() => navigate("/exemplos")}
              >
                Ver exemplos
              </Button>
            </Flex>
          </Box>

          <Box flex="1" w="100%" minW={0}>
            <CodigoOxe codigo={exemploCodigo} />
          </Box>
        </Flex>
      </Box>

      <Bandeirinhas />

      {/* COMO FUNCIONA */}
      <Secao
        titulo="Como funciona"
        subtitulo="Do .oxe ao console, em quatro etapas. Se algo estiver errado, o erro aponta arquivo, linha, coluna e o trecho."
      >
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5}>
          {etapas.map((e, i) => (
            <Box
              key={e.n}
              bg={e.cor}
              border="3px solid"
              borderColor={cores.marrom}
              borderRadius="20px"
              p={5}
              transform={`rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)`}
            >
              <Flex
                w="40px"
                h="40px"
                align="center"
                justify="center"
                bg={cores.bege}
                border="2px solid"
                borderColor={cores.marrom}
                borderRadius="full"
                fontWeight="800"
                mb={3}
              >
                {e.n}
              </Flex>
              <Heading as="h3" fontSize="xl" mb={2}>
                {e.titulo}
              </Heading>
              <Text fontSize="sm" lineHeight="1.6">
                {e.texto}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Secao>

      {/* COMANDOS */}
      <Box bg={cores.begeEscuro} borderY="3px solid" borderColor={cores.marrom}>
        <Secao
          titulo="Os comandos"
          subtitulo="Cada palavra vem do Dicionário Baianês, com significado parecido com o do comando. Quando o dicionário não tem nada parecido, é só a tradução."
        >
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
            {comandos.map((c) => (
              <Box
                key={c.oxe}
                bg={c.cor}
                border="2px solid"
                borderColor={cores.marrom}
                borderRadius="16px"
                p={4}
                transition="transform .15s"
                _hover={{ transform: "translateY(-4px) rotate(-1deg)" }}
              >
                <Text
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="800"
                  fontSize="md"
                  wordBreak="break-word"
                >
                  {c.oxe}
                </Text>
                <Text fontSize="sm" mt={1} opacity={0.8}>
                  ={" "}
                  <Box as="span" fontFamily="'JetBrains Mono', monospace">
                    {c.js}
                  </Box>
                </Text>
              </Box>
            ))}
          </SimpleGrid>
          <Text mt={6} fontSize="sm" opacity={0.7}>
            A tabela completa, com a origem de cada palavra, fica na
            documentação do CLI.
          </Text>
        </Secao>
      </Box>

      {/* REGRAS */}
      <Secao
        titulo="Regras da casa"
        subtitulo="Parece JavaScript, mas com algumas manias baianas."
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
          {regras.map((r) => (
            <Flex
              key={r.titulo}
              gap={4}
              bg="#FFFBF2"
              border="3px solid"
              borderColor={cores.marrom}
              borderRadius="20px"
              p={5}
              boxShadow={`6px 6px 0 ${r.cor}`}
            >
              <Box
                w="12px"
                flexShrink={0}
                bg={r.cor}
                borderRadius="full"
                border="2px solid"
                borderColor={cores.marrom}
              />
              <Box>
                <Heading as="h3" fontSize="lg" mb={1}>
                  {r.titulo}
                </Heading>
                <Text fontSize="sm" lineHeight="1.6">
                  {r.texto}
                </Text>
              </Box>
            </Flex>
          ))}
        </SimpleGrid>
      </Secao>

      {/* CTA FINAL */}
      <Box maxW="1100px" mx="auto" px={{ base: 5, md: 8 }} pb={16}>
        <Flex
          direction="column"
          align="center"
          textAlign="center"
          bg={cores.lilas}
          border="3px solid"
          borderColor={cores.marrom}
          borderRadius="28px"
          p={{ base: 8, md: 12 }}
          gap={4}
        >
          <Heading as="h2" fontSize={{ base: "2xl", md: "4xl" }}>
            Bora programar, meu rei?
          </Heading>
          <Text maxW="480px">
            Escreva seu primeiro .oxe e veja o JavaScript sair na hora.
          </Text>
          <Button
            size="lg"
            bg={cores.amarelo}
            color={cores.marrom}
            border="3px solid"
            borderColor={cores.marrom}
            borderRadius="14px"
            boxShadow={`4px 4px 0 ${cores.marrom}`}
            _hover={{
              transform: "translate(2px, 2px)",
              boxShadow: `2px 2px 0 ${cores.marrom}`,
            }}
            onClick={() => navigate("/playground")}
          >
            Ir pro playground
          </Button>
        </Flex>
      </Box>

      <Bandeirinhas />
      <Box py={6} textAlign="center" fontSize="sm" bg={cores.begeEscuro}>
        baianol# · feito com dendê e JavaScript
      </Box>
      <FitasBonfim />
    </Box>
  );
}
