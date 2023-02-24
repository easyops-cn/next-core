import { Contract } from "@next-core/types";

const contractsMap: Map<string, Contract> = new Map();
const widgetContractMap: Map<string, Contract> = new Map();

const addContract = (
  contracts: Contract[] | undefined,
  map: Map<string, Contract>
): void => {
  contracts?.forEach((contract) => {
    map.set(`${contract.namespaceId}.${contract.name}`, contract);
  });
};

export function collectContract(contracts: Contract[] | undefined): void {
  addContract(contracts, contractsMap);
}

export function collectWidgetContract(contracts: Contract[] | undefined): void {
  addContract(contracts, widgetContractMap);
}

export function clearCollectWidgetContract(): void {
  widgetContractMap.clear();
}

export function getContract(name: string): Contract | undefined {
  return contractsMap.get(name) || widgetContractMap.get(name);
}
