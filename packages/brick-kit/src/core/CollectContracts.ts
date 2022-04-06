import { Contract } from "@next-core/brick-types";

const contractsMap: Map<string, Contract> = new Map();

export function collectContract(contracts: Contract[]): void {
  contracts?.forEach((contract) => {
    contractsMap.set(`${contract.namespaceId}.${contract.name}`, contract);
  });
}

export function getContract(name: string): Contract {
  return contractsMap.get(name);
}
