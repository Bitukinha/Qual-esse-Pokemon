const { parentPort, workerData } = require('worker_threads');
const { travar, destravar } = require('./memoria');
const jogo = require('./jogo');

const jogador = workerData.jogador;
const mem = new Int32Array(workerData.memoria);

parentPort.on('message', (texto) => {
  let resposta;
  travar(mem);
  try {
    resposta = jogo.processar(mem, jogador, texto);
  } finally {
    destravar(mem);
  }
  parentPort.postMessage(resposta);
});
