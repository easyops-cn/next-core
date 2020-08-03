import { create } from "./main";
import meow from "meow";
import { createReleaseRecord } from "./releaseRecord";
import { AskFlags } from "./interface";
import { generateDoc } from "./generateDoc";

// 可以从命令行参数中指定生成类型。
const { flags } = meow({
  flags: {
    type: {
      type: "string",
      alias: "t",
    },
    bricks: {
      type: "string",
      alias: "b",
    },
    provider: {
      type: "string",
      alias: "p",
    },
  },
});

// 生成开发者中心构件发布记录
if (flags.type === "record") {
  // istanbul ignore next (nothing logic)
  createReleaseRecord().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else if (flags.type === "doc") {
  // 生成type docs注释
  // istanbul ignore next (nothing logic)
  generateDoc(flags.bricks).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  // istanbul ignore next (nothing logic)
  create(flags as AskFlags).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
