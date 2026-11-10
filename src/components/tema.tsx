import { Box, Flex } from "@chakra-ui/react";

export const cores = {
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

export const fitas = [cores.rosa, cores.amarelo, cores.azul, cores.verde, cores.laranja, cores.lilas];

export function FitasBonfim() {
  return (
    <Flex h="14px" w="100%">
      {Array.from({ length: 24 }).map((_, i) => (
        <Box key={i} flex="1" bg={fitas[i % fitas.length]} />
      ))}
    </Flex>
  );
}