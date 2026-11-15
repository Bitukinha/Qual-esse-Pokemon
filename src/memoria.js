const POS = {
  LOCK: 0,
  VEZ: 1,
  PONTOS: 2,
  ESTADO: 4,
  PRIMEIRA: 5,
  PARES: 6,
  CARTAS: 7,
  ACHADA: 23,
};
const TAMANHO = POS.ACHADA + 16;

const ESTADO = { AGUARDANDO: 0, JOGANDO: 1, FIM: 2 };

function criarMemoria() {
  const buffer = new SharedArrayBuffer(TAMANHO * 4);
  const mem = new Int32Array(buffer);
  mem[POS.ESTADO] = ESTADO.AGUARDANDO;
  mem[POS.PRIMEIRA] = -1;
  return buffer;
}

function travar(mem) {
  while (Atomics.compareExchange(mem, POS.LOCK, 0, 1) !== 0) {
    Atomics.wait(mem, POS.LOCK, 1);
  }
}

function destravar(mem) {
  Atomics.store(mem, POS.LOCK, 0);
  Atomics.notify(mem, POS.LOCK, 1);
}

module.exports = { POS, ESTADO, criarMemoria, travar, destravar };
