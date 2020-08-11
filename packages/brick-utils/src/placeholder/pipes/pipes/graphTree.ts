import {
  find,
  get,
  groupBy,
  uniq,
  map,
  forEach,
  isEmpty,
  orderBy,
} from "lodash";

export function graphTree(
  value: {
    edges: Record<string, any>[];
    topic_vertices: Record<string, any>[];
    vertices: Record<string, any>[];
  },
  query?: {
    sort: {
      key: string;
      order: 1 | -1;
    };
  }
): Record<string, any>[] {
  if (!value) {
    return [];
  }
  const sort = query?.sort;
  const groupByEdgeOut = groupBy(value.edges, "out");
  const findChildren = (node: Record<string, any>): Record<string, any> => {
    const relationEdges = groupByEdgeOut[node.instanceId];
    forEach(relationEdges, (edge) => {
      const key = edge.out_name;
      const foundInstance = find(value.vertices, ["instanceId", edge.in]);
      if (foundInstance) {
        const resultInstance = findChildren(foundInstance);
        if (node[key]) {
          node[key].push(resultInstance);
        } else {
          node[key] = [resultInstance];
        }
      }
    });
    if (sort) {
      const keyList = uniq(map(relationEdges, "out_name"));
      forEach(keyList, (key) => {
        if (!isEmpty(node[key])) {
          node[key] = orderBy(
            node[key],
            (item) => get(item, sort.key) ?? -Infinity,
            sort.order === -1 ? "desc" : "asc"
          );
        }
      });
    }
    return node;
  };
  const result =
    value.topic_vertices?.map((root) => {
      return findChildren(root);
    }) ?? [];
  return result;
}
