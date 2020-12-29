import {
  BuilderDataTransferType,
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
} from "./interfaces";

export function setDataOfDataTransfer(
  dataTransfer: DataTransfer,
  type: BuilderDataTransferType.NODE_TO_ADD,
  payload: BuilderDataTransferPayloadOfNodeToAdd
): void;
export function setDataOfDataTransfer(
  dataTransfer: DataTransfer,
  type: BuilderDataTransferType.NODE_TO_MOVE,
  payload: BuilderDataTransferPayloadOfNodeToMove
): void;
export function setDataOfDataTransfer(
  dataTransfer: DataTransfer,
  type: BuilderDataTransferType,
  payload: unknown
): void {
  dataTransfer.setData(type, JSON.stringify(payload));
}

export function getTypeOfDataTransfer(
  dataTransfer: DataTransfer
): BuilderDataTransferType {
  const receivedTypes = Array.from(dataTransfer.types);
  const allowedTypes = [
    BuilderDataTransferType.NODE_TO_ADD,
    BuilderDataTransferType.NODE_TO_MOVE,
  ];
  for (const type of allowedTypes) {
    if (receivedTypes.includes(type)) {
      return type;
    }
  }
}

export function getDataOfDataTransfer(
  dataTransfer: DataTransfer,
  type: BuilderDataTransferType.NODE_TO_ADD
): BuilderDataTransferPayloadOfNodeToAdd;
export function getDataOfDataTransfer(
  dataTransfer: DataTransfer,
  type: BuilderDataTransferType.NODE_TO_MOVE
): BuilderDataTransferPayloadOfNodeToMove;
export function getDataOfDataTransfer(
  dataTransfer: DataTransfer,
  type: BuilderDataTransferType
): unknown {
  const text = dataTransfer.getData(type);
  if (!text) {
    return;
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected transferred data:", text);
  }
  return data;
}
