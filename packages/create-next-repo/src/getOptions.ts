import fs from "fs";
import os from "os";
import path from "path";
import meow from "meow";

export interface RepoOptions {
  internal: boolean;
  repoDir: string;
  templateRepoZipUrl: string;
  zipFilePath: string;
  verbose: boolean;
}

export function getOptions(): RepoOptions {
  const cli = meow(
    `
    Usage
      $ create-next-repo my-repo

    Options
      --internal  Creates a EasyOps internal repository
      --verbose   Show verbose logs
      --help      Show help message
      --version   Show create-next-repo version
    `,
    {
      flags: {
        internal: {
          type: "boolean",
        },
        verbose: {
          type: "boolean",
        },
        // Todo(steve): remove `help` and `version` after meow fixed it.
        help: {
          type: "boolean",
        },
        version: {
          type: "boolean",
        },
      },
      allowUnknownFlags: false,
    }
  );

  const { input, flags } = cli;

  if (input.length !== 1) {
    // `process.exit(2)` will be called in `cli.showHelp()`.
    cli.showHelp();
  }

  const repoDir = path.resolve(input[0]);

  if (fs.existsSync(repoDir)) {
    throw new Error(`The directory is already existed: ${input[0]}`);
  }

  const repoName = path.basename(repoDir);

  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(repoName)) {
    throw new Error("Please use a lower-kebab-case for your repo name");
  }

  const templateRepoName = "next-template-repo";
  const templateRepoZipUrl = `https://codeload.github.com/easyops-cn/${templateRepoName}/zip/master`;
  const zipFilename = `${templateRepoName}-${Date.now()}.zip`;
  const zipFilePath = path.join(os.tmpdir(), zipFilename);

  return {
    ...flags,
    repoDir,
    templateRepoZipUrl,
    zipFilePath,
  };
}
