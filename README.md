# Brick Demo

[![pipeline status](https://git.easyops.local/anyclouds/next-core/badges/master/pipeline.svg)](https://git.easyops.local/anyclouds/next-core/commits/master)
[![coverage report](https://git.easyops.local/anyclouds/next-core/badges/master/coverage.svg)](https://git.easyops.local/anyclouds/next-core/commits/master)

## Contributing

[Contribution Guide](CONTRIBUTING.md)

### Prepare

`yarn`

### Development

`yarn start`

> `yarn start` equals `lerna run start --scope=@easyops/brick-container`.

`lerna run start --scope=OTHER-PACKAGES`

The dev server will use this repository's sibling director of _brick-next_ by default. It means it will work if your projects are like:

```
/Users/one/easyops/next-core
/Users/one/easyops/brick-next
```

In case the _brick-next_ located in other place, you could add a `dev.config.js` in this repository, E.g.:

```js
const path = require("path");
exports.brickNextDir = path.join(__dirname, "../brick-next");
```

### Build

`yarn build`

### Test

`yarn test`

To test a specified file:

```shell
yarn test ./path/to/your.spec.ts
```

[@easyops/brick-dll]: packages/brick-dll
