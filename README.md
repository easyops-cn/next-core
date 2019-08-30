# Brick Demo

[![pipeline status](https://git.easyops.local/anyclouds/next-core/badges/master/pipeline.svg)](https://git.easyops.local/anyclouds/next-core/commits/master)
[![coverage report](https://git.easyops.local/anyclouds/next-core/badges/master/coverage.svg)](https://git.easyops.local/anyclouds/next-core/commits/master)

http://brick-next.162.d.easyops.local/

## Contributing

[Contribution Guide](CONTRIBUTING.md)

### Prepare

`yarn`

### Development

`yarn start`

> For now, please run `yarn build` first before `yarn start`, to build all dependent sub-packages.  
> Usually you run `yarn build` only once if [@easyops/brick-dll] has no breaking changes.

`yarn start` equals `lerna run start --scope=@easyops/brick-container`. It means that you should run another start for your bricks-package if needed.

You can use `yarn start --scope=@bricks/general-auth` to run @easyops/brick-container and @bricks/general-auth concurrently.
It equals `lerna run start --scope=@easyops/brick-container --scope=@bricks/general-auth`

### Offline development

For some reason, you maybe are offline, or server is down, don't worry:  
Prefix `OFFLINE=true` before `yarn start`.

### Build

`yarn build`

### Test

`yarn test`

### Create New Brick-Packages or New Bricks in Existed Packages

`yarn yo`

[@easyops/brick-dll]: packages/brick-dll
