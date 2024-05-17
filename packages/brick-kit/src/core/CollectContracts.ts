import { Contract } from "@next-core/brick-types";

const contractsMap: Map<string, Contract> = new Map();
const widgetContractMap: Map<string, Contract> = new Map();
const debugContractMap: Map<string, Contract> = new Map();

const addContract = (
  contracts: Contract[],
  map: Map<string, Contract>
): void => {
  contracts?.forEach((contract) => {
    map.set(`${contract.namespaceId}.${contract.name}`, contract);
  });
};

export function collectContract(contracts: Contract[]): void {
  addContract(contracts, contractsMap);
}

export function collectWidgetContract(contracts: Contract[]): void {
  addContract(contracts, widgetContractMap);
}

export function clearCollectWidgetContract(): void {
  widgetContractMap.clear();
}

export function collectDebugContract(contracts: Contract[] | undefined): void {
  addContract(contracts, debugContractMap);
}

export function clearDebugContract(): void {
  debugContractMap.clear();
}

export function getContract(name: string): Contract {
  return (
    contractsMap.get(name) ||
    widgetContractMap.get(name) ||
    debugContractMap.get(name)
  );
}
