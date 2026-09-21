module.exports = [
  {
    path: "packages/brick-container/dist/dll-of-ace.*.js",
    limit: "125 KB",
  },
  {
    path: "packages/brick-container/dist/dll-of-d3.*.js",
    limit: "45 KB",
  },
  {
    path: "packages/brick-container/dist/dll-of-echarts.*.js",
    limit: "295 KB",
  },
  {
    path: "packages/brick-container/dist/dll-of-editor-bricks-helper.*.js",
    limit: "20 KB",
  },
  {
    path: "packages/brick-container/dist/dll-of-react-dnd.*.js",
    limit: "25 KB",
  },
  {
    path: "packages/brick-container/dist/dll.*.js",
    // +8 KB: 错误码词典数据（237 条中英文文案，015 方案错误国际化）
    limit: "1448 KB",
  },
  {
    path: "packages/brick-container/dist/main.*.js",
    limit: "7 KB",
  },
  {
    path: "packages/brick-container/dist/icons--*.js",
    limit: "900 KB",
  },
  {
    path: "packages/brick-container/dist/polyfill.*.js",
    limit: "45 KB",
  },
  {
    path: "packages/brick-http/dist/index.esm.js",
    limit: "5 KB",
  },
  {
    path: "packages/brick-icons/dist/index.esm.js",
    limit: "15 KB",
  },
  {
    path: "packages/brick-kit/dist/index.esm.js",
    // +7 KB: 错误码词典数据（237 条中英文文案，015 方案错误国际化）
    limit: "145 KB",
  },
  {
    path: "packages/brick-types/dist/index.esm.js",
    limit: "1.1 KB",
  },
  {
    path: "packages/brick-types/.schema/storyboard.json",
    limit: "26 KB",
  },
  {
    path: "packages/brick-utils/dist/index.esm.js",
    limit: "145 KB",
  },
  {
    path: "packages/editor-bricks-helper/dist/index.esm.js",
    limit: "25 KB",
  },
  {
    path: "packages/fontawesome-library/dist/index.esm.js",
    limit: "426 KB",
  },
];
