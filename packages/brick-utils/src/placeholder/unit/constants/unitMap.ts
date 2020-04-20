import { bytes, bibytes } from "./bytes";
import { bitRates, byteRates } from "./byteRates";
import { times } from "./times";
import { Unit, UnitType } from "./interface";

export const UNIT_MAP: { [k in UnitType]: Unit[] } = {
  [UnitType.Time]: times,
  [UnitType.Byte]: bytes,
  [UnitType.Bibyte]: bibytes,
  [UnitType.BitRate]: bitRates,
  [UnitType.ByteRate]: byteRates,
};
