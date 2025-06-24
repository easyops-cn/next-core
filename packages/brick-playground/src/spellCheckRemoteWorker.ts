// istanbul ignore file
import { wrap } from "comlink";
import type {
  SpellCheckRequest,
  SpellCheckResponse,
} from "@next-shared/spell-check";

export interface RemoteSpellCheckWorker {
  spellCheck(req: SpellCheckRequest): Promise<SpellCheckResponse>;
}

let remoteWorkerPromise: Promise<RemoteSpellCheckWorker> | undefined;

let worker: Worker | undefined;

export function getRemoteSpellCheckWorker() {
  if (!remoteWorkerPromise) {
    remoteWorkerPromise = (async () => {
      const Remote = wrap<{ new (): RemoteSpellCheckWorker }>(getWorker());
      return await new Remote();
    })();
  }
  return remoteWorkerPromise;
}

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./spellCheck.worker.ts", import.meta.url));
  }
  return worker;
}
