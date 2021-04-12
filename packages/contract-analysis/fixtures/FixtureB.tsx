/* eslint-disable */
import { createProviderClass } from "@next-core/brick-utils";
import { InstanceApi } from "@next-sdk/cmdb-sdk";
import utils from "./utils";

export async function FixtureB(): Promise<unknown> {
  return InstanceApi.postSearchV3("HOST", {
    fields: ["*"],
  });
}

customElements.define(
  "contract-analysis.provider-fixture-b",
  createProviderClass(FixtureB)
);
