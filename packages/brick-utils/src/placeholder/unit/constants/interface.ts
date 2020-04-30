export enum UnitType {
  Time = "time",
  Byte = "byte",
  Bibyte = "bibyte",
  BitRate = "bitRate",
  ByteRate = "byteRate",
}

export interface Unit {
  id: string;
  divisor: number;
  display: string;
  alias?: string[];
}
