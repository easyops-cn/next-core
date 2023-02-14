import path from "node:path";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const faPackageJsonPath = require.resolve(
  "@fortawesome/fontawesome-free/package.json"
);

const fontFaceRegExp = /@font-face\s*\{[\s\S]*?\}\n?\n?/gm;

/** @type {string[]} */
const fontFaces = [];

const types = ["fontawesome", "regular", "solid", "brands"];

/** @type {Promises<unknown>[]} */
const tasks = [];

// Extract `@font-face {...}` to an external file.
// Because they can only work outside of shadow DOM.
const extractFontFaces = Promise.all(
  types.map(async (type) => {
    const srcPath = path.resolve(faPackageJsonPath, `../css/${type}.css`);
    // Rename the css files as `*.shadow.css`
    const targetPath = path.resolve(
      process.cwd(),
      `./src/fa-icon/fontawesome-free/css/${type}.shadow.css`
    );
    const srcContent = await readFile(srcPath, "utf-8");
    const newContent = srcContent.replace(fontFaceRegExp, (match) => {
      fontFaces.push(match);
      return "";
    });

    return writeFile(targetPath, newContent);
  })
);

tasks.push(extractFontFaces);

tasks.push(
  extractFontFaces.then(() => {
    const fontFacesPath = path.resolve(
      process.cwd(),
      "./src/fa-icon/fontawesome-free/css/font-faces.css"
    );
    return writeFile(fontFacesPath, fontFaces.join(""));
  })
);

// Copy font files.
const fonts = [
  "fa-brands-400.ttf",
  "fa-brands-400.woff2",
  "fa-regular-400.ttf",
  "fa-regular-400.woff2",
  "fa-solid-900.ttf",
  "fa-solid-900.woff2",
];

const copyFonts = Promise.all(
  fonts.map((font) =>
    copyFile(
      path.resolve(faPackageJsonPath, `../webfonts/${font}`),
      path.resolve(
        process.cwd(),
        `./src/fa-icon/fontawesome-free/webfonts/${font}`
      )
    )
  )
);

tasks.push(copyFonts);

Promise.all(tasks).then(
  () => {
    console.log("Generate font-awesome files done!");
  },
  (error) => {
    console.error("Generate font-awesome files failed:", error);
  }
);
