# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.7](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.6...@next-core/runtime@1.0.7) (2023-03-31)


### Bug Fixes

* expose legacy doTransform ([5df317f](https://github.com/easyops-cn/next-core/commit/5df317fd4878b3b8d3d98b2d00152b513554e063))





## [1.0.6](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.5...@next-core/runtime@1.0.6) (2023-03-28)


### Bug Fixes

* only load providers not defined yet ([0147667](https://github.com/easyops-cn/next-core/commit/0147667ec3e886645b3651afcb9061e27b0c97f8))





## [1.0.5](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.4...@next-core/runtime@1.0.5) (2023-03-28)


### Bug Fixes

* update sdk ([e8a4875](https://github.com/easyops-cn/next-core/commit/e8a48754815ba2a9880c703d093482c14f4dcb0d))





## [1.0.4](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.3...@next-core/runtime@1.0.4) (2023-03-24)

**Note:** Version bump only for package @next-core/runtime





## [1.0.3](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.2...@next-core/runtime@1.0.3) (2023-03-23)

**Note:** Version bump only for package @next-core/runtime





## [1.0.2](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.1...@next-core/runtime@1.0.2) (2023-03-22)

**Note:** Version bump only for package @next-core/runtime

## [1.0.1](https://github.com/easyops-cn/next-core/compare/@next-core/runtime@1.0.0...@next-core/runtime@1.0.1) (2023-03-22)

**Note:** Version bump only for package @next-core/runtime

# 1.0.0 (2023-03-22)

### Bug Fixes

- allow certain native props as brick props ([2944e14](https://github.com/easyops-cn/next-core/commit/2944e14c51ce58b58b1084b9eb41cb8910f0b7db))
- allow set theme for brick playground ([f9c31ab](https://github.com/easyops-cn/next-core/commit/f9c31abdbf0bcab52ea253ea2f84cb7c50b53bc2))
- check permissions before checking brick.if ([15e61ee](https://github.com/easyops-cn/next-core/commit/15e61ee8848989571a4109989b45adb32b743100))
- disallow setting proto or constructor on bricks ([e940460](https://github.com/easyops-cn/next-core/commit/e9404603178dd58fd49de54648011a73fbe01fab))
- expose checkIfOfComputed ([89dca47](https://github.com/easyops-cn/next-core/commit/89dca47ddb325e5a42e582eaab0e08673e2b3c5d))
- fix check installed apps ([a1a48b1](https://github.com/easyops-cn/next-core/commit/a1a48b1a853dcff2ddd44f309aedd9fa06045184))
- fix checkIfByTransform ([f6246ab](https://github.com/easyops-cn/next-core/commit/f6246ab1dbaed6c027bfdfd48a08be0a244c57c0))
- fix control node dataSource computing ([ac8da73](https://github.com/easyops-cn/next-core/commit/ac8da73db78cb9e8aecf1c4287a55ca623da85a6))
- fix control node slot ([d4e5a41](https://github.com/easyops-cn/next-core/commit/d4e5a41e38b69f470b78dcfabb6dc3739aeb3460))
- fix deps ([0b604e2](https://github.com/easyops-cn/next-core/commit/0b604e2fb7b27c81946fdcc74525aaa838155d0e))
- fix event conditions ([631ef73](https://github.com/easyops-cn/next-core/commit/631ef7375b71afd079e202246e62533e11c58cf8))
- fix illustrations ([595cec4](https://github.com/easyops-cn/next-core/commit/595cec43f5c871c61d6480e537ea845a079941bc))
- fix isHttpAbortError usage ([0b0346e](https://github.com/easyops-cn/next-core/commit/0b0346e5f921ce8d3e88249f1359429a19cfe79d))
- fix loading bar when loading brick chunks ([9e6a7a2](https://github.com/easyops-cn/next-core/commit/9e6a7a2f816ab7a123988dd450f5693536181db4))
- fix menu overrideApp ([2d8ef89](https://github.com/easyops-cn/next-core/commit/2d8ef8968820d97db683d0bd47230f2593c4d549))
- fix preview with useBrick ([3fba9c1](https://github.com/easyops-cn/next-core/commit/3fba9c19e273dbad23053f06653a55064d4d86cd))
- fix re-render of control nodes ([c7c1612](https://github.com/easyops-cn/next-core/commit/c7c1612be448cd62065bc696efc8ee966aa0e06e))
- fix setup useBrick for deeper useBrick ([14d98c6](https://github.com/easyops-cn/next-core/commit/14d98c6a32ee0e34ae12b25f85caa496e42a0f5e))
- fix shared i18next ([d5a794e](https://github.com/easyops-cn/next-core/commit/d5a794eec2e22b05da63deb6b73a371da5ff53da))
- fix tpl defined props with methods ([a6fc207](https://github.com/easyops-cn/next-core/commit/a6fc20719b645d8c39bd91ab786fc73e5af83105))
- fix types that a string is also Iterable<string> ([8abe59a](https://github.com/easyops-cn/next-core/commit/8abe59ab7c2c62835b2ddb0a4a34572b9d4aac0c))
- fix useBrick lifeCycle ([48d5dd6](https://github.com/easyops-cn/next-core/commit/48d5dd671031f4033b1755744b4f7a2b9cf034a2))
- fix useBrick with custom templates ([978ba56](https://github.com/easyops-cn/next-core/commit/978ba5652877f68ff04af8ad816a424a34216868))
- fix useBrick with non-object props ([2f85db1](https://github.com/easyops-cn/next-core/commit/2f85db15640da07514215469acd14f071723e7ad))
- load shared modules from bricks/basic if possible ([b271dce](https://github.com/easyops-cn/next-core/commit/b271dcec2a6d60862b4824590cc55ca3be0fcde4))
- make @next-core/cook be an ES module ([d3c3fc0](https://github.com/easyops-cn/next-core/commit/d3c3fc0b91d3fe04d7abd7463c08d7b413cbd195))
- make listeners be sync ([9261b73](https://github.com/easyops-cn/next-core/commit/9261b7389465d6224fdd51b59eb17cccbc8a5956))
- prefer proxy properties over exposed states when define properties on tpl ([30c0672](https://github.com/easyops-cn/next-core/commit/30c067238cdab30a87e9afe4a6efc27f8afe1b1b))
- refine auth ([3dd4174](https://github.com/easyops-cn/next-core/commit/3dd4174bdaa75a2059df40193ad9116789485671))
- refine brick playground ([c57d5a0](https://github.com/easyops-cn/next-core/commit/c57d5a049bd9aa2bc2058cdbed6ee3d880787652))
- refine evaluate ([f75f1c6](https://github.com/easyops-cn/next-core/commit/f75f1c622cd5efaa17b1d7d141de93ce4000a007))
- refine events ([22e0c76](https://github.com/easyops-cn/next-core/commit/22e0c766ee23a03d998b1644b3d81526f254e454))
- refine i18n ([d38cbbc](https://github.com/easyops-cn/next-core/commit/d38cbbcca4adfee788141dab4901dc1b5da39c94))
- refine i18n ([60966a7](https://github.com/easyops-cn/next-core/commit/60966a747d2e04e72ad6ec7a82251d1b94a50a07))
- refine i18n usage in bricks ([ad9d2c2](https://github.com/easyops-cn/next-core/commit/ad9d2c2b1a9361150147895dce9dff0fdea45328))
- refine legacy runtime ([32bf540](https://github.com/easyops-cn/next-core/commit/32bf540919fef1d1fa1b1e89fde71bb93eefbf9c))
- refine serve ([809ce36](https://github.com/easyops-cn/next-core/commit/809ce368bdc76891c1e8359315e0cc3220ed7dc1))
- refine tpl ([9730159](https://github.com/easyops-cn/next-core/commit/9730159571777776c4cfde65a43eeee2b3c381f2))
- refine useBrick ([ae585b0](https://github.com/easyops-cn/next-core/commit/ae585b030b0e02d803790aaa838bab88dd1a3365))
- refine useBrick ([8f3c557](https://github.com/easyops-cn/next-core/commit/8f3c5579f0d9be78c9d287a2af84665c139fd439))
- refine useBrick lifeCycle ([92f9426](https://github.com/easyops-cn/next-core/commit/92f942633868389063ff727682ab57110f505ea6))
- remove unnecessary conditions ([1e25937](https://github.com/easyops-cn/next-core/commit/1e25937477824f900e57f96c3542814ebd54df32))
- setup useBrick as immutable ([c57bfc1](https://github.com/easyops-cn/next-core/commit/c57bfc1b74e1c8e15688632e9b96ae61a6e38575))
- support breadcrumb ([4058a4b](https://github.com/easyops-cn/next-core/commit/4058a4b75337c4753472e9bfe59fd17d775da6bb))
- support menu for standalone apps ([b41a390](https://github.com/easyops-cn/next-core/commit/b41a390a70af567ec40ae01d259fcef5c7f4ecdc))
- support serving with remote standalone apps ([25fc30b](https://github.com/easyops-cn/next-core/commit/25fc30b9c95248480c222a7e79cb682b1466b9aa))
- transform legacy TPL usage as STATE ([734da19](https://github.com/easyops-cn/next-core/commit/734da1915b246f5a64ba7865c3169f0cb39fb8ac))
- use module resolution bundler ([dccb86f](https://github.com/easyops-cn/next-core/commit/dccb86f30109b799a9dc9455c6f4433907934ba6))
- use real API for validating permissions ([02f4321](https://github.com/easyops-cn/next-core/commit/02f432110697e5b8e84d26dc1af50f42f195568c))
- use sdk of check login ([afe9e7d](https://github.com/easyops-cn/next-core/commit/afe9e7dc225462f40e49e9892aa2cc35a81c418f))
- v2-adapter: initial ([7b3caa9](https://github.com/easyops-cn/next-core/commit/7b3caa9d98471f592c76f86cc9b5ee669a800359))
- v2-adapter: stage 2 ([b314a22](https://github.com/easyops-cn/next-core/commit/b314a2296d18d0fa2e4cdf2338b2de9c78183139))
- wait for all blockings before rendering ([e8d0ab1](https://github.com/easyops-cn/next-core/commit/e8d0ab14f8d4ae407ba627f23c3e935691cef744))
- warn when proxy properties conflict with exposed states ([dd46b24](https://github.com/easyops-cn/next-core/commit/dd46b24d1c143e760cf07866a8074e0d497aea37))

### Features

- abort controller ([656ab80](https://github.com/easyops-cn/next-core/commit/656ab80129a3d9b16b5286577d50b863075a1b20))
- allow onMount and onUnmount for normal bricks ([a00df5a](https://github.com/easyops-cn/next-core/commit/a00df5a02206cd2ac2c61c4357698d9dff57f196))
- allow set bootstrap data in playground ([8e631d3](https://github.com/easyops-cn/next-core/commit/8e631d31206e37722fe4ec3ad51249b54425d39e))
- async evaluate ([b6c38dd](https://github.com/easyops-cn/next-core/commit/b6c38dd764fbbcf5f131b69180b8e0d87193d921))
- expose tpl state as property exclusively ([f443980](https://github.com/easyops-cn/next-core/commit/f443980b90b38dfd49cf0dbafc483ba6772491b1))
- match routes ([5a017c9](https://github.com/easyops-cn/next-core/commit/5a017c9145c4e39bbec8e19f6e89b208c5afdcbb))
- merge with remote runtime settings ([a933c12](https://github.com/easyops-cn/next-core/commit/a933c12d5243538be09ea87595c1f542f41f5903))
- preview ([7af0ac2](https://github.com/easyops-cn/next-core/commit/7af0ac282fc47781540110214378c133c8bd21ad))
- react wrapper for brick ([5c47288](https://github.com/easyops-cn/next-core/commit/5c4728848206d8a873ea15fd113f25731cdad7b9))
- refactor stableLoadBricks ([df800cf](https://github.com/easyops-cn/next-core/commit/df800cfbe83cd892f0542c75aeb02f7123f4b80e))
- refine implementation of decorators ([577c022](https://github.com/easyops-cn/next-core/commit/577c022181f941d8e9ecd22ef486a5a6eb3f8359))
- support APP.getMenu for non-standalone apps ([010a6ef](https://github.com/easyops-cn/next-core/commit/010a6ef650a082fe0248ace6fd7c873298fc3c1b))
- support basic usage of custom templates ([f647c24](https://github.com/easyops-cn/next-core/commit/f647c24a1213e4d87adf1e4dc77392b444ea0592))
- support basic v2-adapter ([f5c1ac4](https://github.com/easyops-cn/next-core/commit/f5c1ac407087f8d96bf9909bdb41b5bc78517523))
- support brick children ([4ecac77](https://github.com/easyops-cn/next-core/commit/4ecac77b765674b3b15171fcb822d9d05aee89dd))
- support context actions ([89535ca](https://github.com/easyops-cn/next-core/commit/89535ca885602145448666131a7c94bdea5ae494))
- support control nodes: forEach/if/switch ([804318f](https://github.com/easyops-cn/next-core/commit/804318fa48d641cf985361593fc0ea8402f2f136))
- support custom template states ([4200875](https://github.com/easyops-cn/next-core/commit/420087522cf8cc77bef95103b7460055dc89d7bf))
- support development with remote ([2f93e6c](https://github.com/easyops-cn/next-core/commit/2f93e6ca46c4858139c450a02af83b146e746894))
- support displaying native message and error ([5336cf5](https://github.com/easyops-cn/next-core/commit/5336cf5010dfa06d57758e9d42169667f39b95c5))
- support dynamic template ref ([53aebed](https://github.com/easyops-cn/next-core/commit/53aebedc9e59381699638ad4e550a7f779bc4aa3))
- support fetchByProvider ([26a68c0](https://github.com/easyops-cn/next-core/commit/26a68c03a5736a468dd9c52d2875be1effa35301))
- support flow api provider ([dedb801](https://github.com/easyops-cn/next-core/commit/dedb80193841ec39d38047d494bacbb3c3401c20))
- support history ([1dae136](https://github.com/easyops-cn/next-core/commit/1dae136fe0bd5ac2423f68f019ab2564074bd454))
- support INSTALLED_APPS.has() ([90b8ff9](https://github.com/easyops-cn/next-core/commit/90b8ff9694e98b4bcfa95e415b62fc682dafa92c))
- support loading bar ([dfab076](https://github.com/easyops-cn/next-core/commit/dfab0760fbef4dd4c0e36d5961cf8c4257559b8f))
- support media api ([e2590b1](https://github.com/easyops-cn/next-core/commit/e2590b1c609e315307d917b38e3527d3da8ac398))
- support play bricks with yaml ([246cf6e](https://github.com/easyops-cn/next-core/commit/246cf6e4d7b9341e1074ec81286d8af5c17768f2))
- support storyboard functions ([2836bd7](https://github.com/easyops-cn/next-core/commit/2836bd73cce1dcce1c33cad72a1f053fcad2fa83))
- support syntax sugar of slots: children ([0c5978b](https://github.com/easyops-cn/next-core/commit/0c5978bcdc244805218bfca73374cf302ab409b2))
- support theme and mode ([3e263ea](https://github.com/easyops-cn/next-core/commit/3e263ea6f38e9b5da6ebc7447e035017288ae530))
- support trackable control nodes ([972f764](https://github.com/easyops-cn/next-core/commit/972f76459686faa7ca0fd9e5020e15ce5d66d22b))
- support useBrick ([708845e](https://github.com/easyops-cn/next-core/commit/708845eb016c1514de0cae6c5b337344e34ae35e))
- support useBrick with custom templates ([b3e2853](https://github.com/easyops-cn/next-core/commit/b3e2853c5c7fcd9c74427ee9b0a01e00a5456161))
- support widget functions ([bcbb834](https://github.com/easyops-cn/next-core/commit/bcbb834a305512e61fb20fbc6ab3992180251e23))
- support widget i18n and images ([bd837b9](https://github.com/easyops-cn/next-core/commit/bd837b9d36f51371f70607840c7100cd1484fee8))
- support widget packages ([211e6fc](https://github.com/easyops-cn/next-core/commit/211e6fca509e6885df33c6ec672b01edd71a773b))
- track context ([d812e13](https://github.com/easyops-cn/next-core/commit/d812e13b4c0defd9bf0b4bba2b8039fc83f766b4))
- transform and inject ([7c0331a](https://github.com/easyops-cn/next-core/commit/7c0331a488d625d4f5d9dc05b3861b5e35dccc53))
