import {
  getDataOfDataTransfer,
  getTypeOfDataTransfer,
  setDataOfDataTransfer,
} from "./DataTransferHelper";
import { BuilderDataTransferType } from "./interfaces";

const mockConsolError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("setDataOfDataTransfer", () => {
  it("should serialize data", () => {
    const mockSetData = jest.fn();
    const dataTransfer = {
      setData: mockSetData,
    } as any;
    setDataOfDataTransfer(dataTransfer, BuilderDataTransferType.NODE_TO_ADD, {
      brick: "any-brick",
    });
    expect(mockSetData).toBeCalledWith(
      BuilderDataTransferType.NODE_TO_ADD,
      '{"brick":"any-brick"}'
    );
  });
});

describe("getTypeOfDataTransfer", () => {
  it("should return matched type", () => {
    const dataTransfer = {
      types: [BuilderDataTransferType.NODE_TO_ADD],
    } as any;
    const type = getTypeOfDataTransfer(dataTransfer);
    expect(type).toBe(BuilderDataTransferType.NODE_TO_ADD);
  });

  it("should return undefined if no types matched", () => {
    const dataTransfer = {
      types: ["text/plain"],
    } as any;
    const type = getTypeOfDataTransfer(dataTransfer);
    expect(type).toBe(undefined);
  });
});

describe("getDataOfDataTransfer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return data if data found", () => {
    const mockGetData = jest.fn(() => '{"brick":"any-brick"}');
    const dataTransfer = {
      getData: mockGetData,
    } as any;
    const data = getDataOfDataTransfer(
      dataTransfer,
      BuilderDataTransferType.NODE_TO_ADD
    );
    expect(data).toEqual({
      brick: "any-brick",
    });
  });

  it("should return undefined if data not found", () => {
    const mockGetData = jest.fn(() => void 0);
    const dataTransfer = {
      getData: mockGetData,
    } as any;
    const data = getDataOfDataTransfer(
      dataTransfer,
      BuilderDataTransferType.NODE_TO_ADD
    );
    expect(data).toBe(undefined);
  });

  it("should return undefined if data parse failed", () => {
    const mockGetData = jest.fn(() => "cannot be parsed");
    const dataTransfer = {
      getData: mockGetData,
    } as any;
    const data = getDataOfDataTransfer(
      dataTransfer,
      BuilderDataTransferType.NODE_TO_ADD
    );
    expect(data).toBe(undefined);
    expect(mockConsolError).toBeCalled();
  });
});
