# Contribution Guide

项目为基于 [Lerna] + [Yarn Workspace] 的 Monorepo.

更多文档请查看 《[EasyOps 开发者中心](http://docs.developers.easyops.cn/)》

## 文件结构

项目包含两个多包工作区：

```bash
.
├── dll/*                 # <DLL> Scope: `@dll/*`
├── packages              # <平台库> Scope: `@easyops/*`
    ├── brick-container   # 新 Console
    ├── brick-dll         # Vendors dll
    ├── brick-http        # Http 基础库
    ├── brick-kit         # 插件运行时
    ├── brick-scripts     # 用于构件开发的脚本工具
    └── sdk-scripts       # 用于 SDK 的脚本工具
```

## 开发调试

如果你希望调试本地版本的、属于 `@easyops/brick-dll` 的包，例如 `@easyops/brick-kit`，那么你需要依次打开三个终端，并分别运行：

1. `lerna run start --scope @easyops/brick-kit`；
2. `lerna run start --scope @easyops/brick-dll`；
3. `yarn start`。

这是由依赖关系决定的 `@easyops/brick-container` ==> `@easyops/brick-dll` ==> `@easyops/brick-kit`。开发其它包如 `@easyops/brick-utils` 同理。

由于目前不支持为 `yarn start` 传递类似 `yarn serve` 传递的 `--subdir` 等参数，需要使用对应的环境变量来设置相关参数。

- `SUBDIR=true` 等于 `--subdir`；
- `LOCAL_BRICKS=abc,xyz` 等于 `--local-bricks=abc,xyz`；
- `LOCAL_APPS=abc,xyz` 等于 `--local-apps=abc,xyz`；
- `NO_MERGE_SETTINGS=true` 等于 `--no-merge-settings`；
- 以此类推（将 `yarn serve` 支持的参数改为 `大写_常量` 格式作为名称）。

例如：

```shell
LOCAL_BRICKS=abc yarn start
# is similar to
yarn serve --local-bricks=abc
```

[lerna]: https://github.com/lerna/lerna
[yarn workspace]: https://yarnpkg.com/lang/en/docs/workspaces/
