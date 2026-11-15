const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { travar, destravar } = require('./src/memoria');

const THREADS = 4;
const VEZES = 200000;

if (isMainThread) {
  const rodar = (usarMutex) =>
    new Promise((resolve) => {
      const buffer = new SharedArrayBuffer(8);
      const mem = new Int32Array(buffer);
      let terminadas = 0;
      for (let i = 0; i < THREADS; i++) {
        const w = new Worker(__filename, { workerData: { buffer, usarMutex } });
        w.on('message', () => {
          if (++terminadas === THREADS) resolve(mem[1]);
        });
      }
    });

  (async () => {
    const esperado = THREADS * VEZES;
    const sem = await rodar(false);
    const com = await rodar(true);
    console.log(`Esperado:        ${esperado}`);
    console.log(`Sem mutex:       ${sem}  ${sem === esperado ? '(deu sorte)' : `(perdeu ${esperado - sem} somas)`}`);
    console.log(`Com mutex:       ${com}  ${com === esperado ? '(correto)' : '(ERRO)'}`);
  })();
} else {
  const mem = new Int32Array(workerData.buffer);
  for (let i = 0; i < VEZES; i++) {
    if (workerData.usarMutex) travar(mem);
    const valor = mem[1];
    mem[1] = valor + 1;
    if (workerData.usarMutex) destravar(mem);
  }
  parentPort.postMessage('ok');
}
