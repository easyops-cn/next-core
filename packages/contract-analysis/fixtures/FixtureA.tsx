/* eslint-disable */
import { createProviderClass } from "@next-core/brick-utils";
import { InstanceApi, CmdbObjectApi as RenamedApi } from "@next-sdk/cmdb-sdk";
import * as AuthSdk from "@next-sdk/auth-sdk";
import wrappedBootstrap from "./wrappedBootstrap";

// @ts-ignore for test.
import styles from "./FixtureA.module.css";

export async function FixtureA(): Promise<unknown> {
  const r = RenamedApi.getDetail;
  wrappedBootstrap();
  return InstanceApi.postSearchV3("HOST", {
    fields: [r.name],
  });
}

customElements.define(
  "contract-analysis.provider-fixture-a",
  createProviderClass(FixtureA)
);
