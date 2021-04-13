import { BootstrapApi } from "@sdk/api-gateway-sdk";

type BootstrapFn = typeof BootstrapApi.bootstrap;

export default function wrappedBootstrap(): BootstrapFn {
  return BootstrapApi.bootstrap;
}
