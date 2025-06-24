// istanbul ignore file
import { expose } from "comlink";
import {
  spellCheck,
  type SpellCheckRequest,
  type SpellCheckResponse,
} from "@next-shared/spell-check";

class SpellCheckWorker {
  spellCheck(req: SpellCheckRequest): SpellCheckResponse {
    return spellCheck(req);
  }
}

expose(SpellCheckWorker);
