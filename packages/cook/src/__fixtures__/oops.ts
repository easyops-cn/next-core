export default `
{
  list: oops.appListTableData
    .filter((item) =>
      _.uniq(
        _.difference(
          oops.appConfigData.keys,
          oops.appConfigData.values[0]?.data
            .filter(
              (i) =>
                i.state === "del" ||
                _.find(oops.appListTableData, ['key', i.key])?.locked
                // oops.appListTableData.find(
                //   (k) => k.key === i.key && k.locked
                // )
            )
            .map((j) => j.key)
        )
      ).includes(item.key)
    )
    .map((item) => ({
      name: item.key,
      type: item?.type,
      value: item?.value,
      secret: item?.secret,
    })),
}
`;
