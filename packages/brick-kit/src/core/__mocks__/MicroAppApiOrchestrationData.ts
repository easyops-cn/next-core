export const mockMicroAppApiOrchestrationMap = new Map();
mockMicroAppApiOrchestrationMap.set("easyops.custom_api@myAwesomeApi", {
  _object_id: "MICRO_APP_API_ORCHESTRATION",
  contract: {
    endpoint: {
      method: "POST",
      uri: "/object/:objectId/instance/_search",
    },
    name: "myAwesomeApi",
    response: {
      fields: [
        {
          description: "instance list",
          name: "list",
          type: "map[]",
        },
      ],
      type: "object",
    },
  },
  name: "myAwesomeApi",
  namespace: "easyops.custom_api",
  type: "emal",
});

mockMicroAppApiOrchestrationMap.set(
  "easyops.custom_api@apiWithoutMethodAndUri",
  {
    _object_id: "MICRO_APP_API_ORCHESTRATION",
    contract: {
      name: "apiWithoutMethodAndUri",
    },
    name: "apiWithoutMethodAndUri",
    namespace: "easyops.custom_api",
    type: "emal",
  }
);

mockMicroAppApiOrchestrationMap.set("easyops.custom_api@apiListMethod", {
  _object_id: "MICRO_APP_API_ORCHESTRATION",
  contract: {
    endpoint: {
      method: "list",
      uri: "/list",
    },
    name: "apiListMethod",
  },
  name: "apiListMethod",
  namespace: "easyops.custom_api",
  type: "emal",
});

// mock contract with string type
mockMicroAppApiOrchestrationMap.set("easyops.custom_api@test", {
  _object_id: "MICRO_APP_API_ORCHESTRATION",
  contract: `
  endpoint:
    method: get
    uri: '/api/test'
  name: test`,
  name: "test",
  namespace: "easyops.custom_api",
  type: "emal",
});
