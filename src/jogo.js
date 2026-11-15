const { POS, ESTADO } = require('./memoria');

const CARTAS = 16;
const PARES = 8;
const POKEMONS = 151;

const dois = (n) => String(n).padStart(2, '0');
const tres = (n) => String(n).padStart(3, '0');
const recusar = (codigo) => ({ eu: ['!' + codigo], todos: [] });

function novaPartida(mem) {
  const sorteados = [];
  while (sorteados.length < PARES) {
    const n = 1 + Math.floor(Math.random() * POKEMONS);
    if (!sorteados.includes(n)) sorteados.push(n);
  }

  const cartas = [...sorteados, ...sorteados];
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }

  for (let i = 0; i < CARTAS; i++) {
    mem[POS.CARTAS + i] = cartas[i];
    mem[POS.ACHADA + i] = 0;
  }
  mem[POS.VEZ] = 1;
  mem[POS.PONTOS] = 0;
  mem[POS.PONTOS + 1] = 0;
  mem[POS.PRIMEIRA] = -1;
  mem[POS.PARES] = 0;
  mem[POS.ESTADO] = ESTADO.JOGANDO;

  return 'I' + mem[POS.VEZ];
}

function encerrar(mem) {
  mem[POS.ESTADO] = ESTADO.AGUARDANDO;
  mem[POS.PRIMEIRA] = -1;
}

function processar(mem, jogador, texto) {
  if (texto[0] !== String(jogador)) return recusar(4);

  if (texto.slice(1) === 'R') {
    if (mem[POS.ESTADO] !== ESTADO.FIM) return recusar(3);
    return { eu: [], todos: [novaPartida(mem)] };
  }

  if (/^.A\d\d$/.test(texto)) return abrirCarta(mem, jogador, Number(texto.slice(2)));

  return recusar(4);
}

function abrirCarta(mem, jogador, pos) {
  if (mem[POS.ESTADO] !== ESTADO.JOGANDO) return recusar(3);
  if (mem[POS.VEZ] !== jogador) return recusar(1);
  if (pos >= CARTAS || mem[POS.ACHADA + pos] === 1 || mem[POS.PRIMEIRA] === pos) return recusar(2);

  const primeira = mem[POS.PRIMEIRA];
  const pokemon = mem[POS.CARTAS + pos];

  if (primeira === -1) {
    mem[POS.PRIMEIRA] = pos;
    return { eu: [], todos: [`${jogador}A${dois(pos)}${tres(pokemon)}`] };
  }

  const pokemon1 = mem[POS.CARTAS + primeira];
  mem[POS.PRIMEIRA] = -1;

  if (pokemon1 !== pokemon) {
    mem[POS.VEZ] = jogador === 1 ? 2 : 1;
    return {
      eu: [],
      todos: [`${jogador}N${dois(primeira)}${dois(pos)}${tres(pokemon1)}${tres(pokemon)}`, 'T' + mem[POS.VEZ]],
    };
  }

  mem[POS.ACHADA + primeira] = 1;
  mem[POS.ACHADA + pos] = 1;
  mem[POS.PONTOS + jogador - 1]++;
  mem[POS.PARES]++;

  const todos = [`${jogador}Y${dois(primeira)}${dois(pos)}${tres(pokemon)}`];
  if (mem[POS.PARES] === PARES) {
    mem[POS.ESTADO] = ESTADO.FIM;
    const p1 = mem[POS.PONTOS], p2 = mem[POS.PONTOS + 1];
    todos.push('E' + (p1 > p2 ? 1 : p2 > p1 ? 2 : 0));
  }
  return { eu: [], todos };
}

module.exports = { novaPartida, encerrar, processar };
