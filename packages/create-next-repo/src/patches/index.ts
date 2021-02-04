import chalk from "chalk";
import { patchInternalTemplate } from "./patchInternalTemplate";
import { replaceCommentSectionsInReadme } from "./replaceCommentSectionsInReadme";
import { replaceCommentSectionsInWorkflows } from "./replaceCommentSectionsInWorkflows";
import { replaceInternalBadges } from "./replaceInternalBadges";
import { replaceInternalScopes } from "./replaceInternalScopes";
import { replaceInternalUrls } from "./replaceInternalUrls";
import { replaceYourRepository } from "./replaceYourRepository";
import { customConsole, LogLevel } from "../customConsole";

export interface PatchOptions {
  internal: boolean;
}

export function patch(dest: string, { internal }: PatchOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(LogLevel.DEFAULT, "Patching files ...");
    const tasks: Promise<unknown>[] = [];
    if (internal) {
      tasks.push(patchInternal(dest));
    } else {
      tasks.push(patchPublic(dest));
    }
    Promise.all(tasks)
      .then(() => {
        customConsole.log(
          LogLevel.DEFAULT,
          chalk.cyan("Patched successfully!")
        );
        resolve();
      })
      .catch(reject);
  });
}

async function patchInternal(dest: string): Promise<void> {
  await replaceCommentSectionsInReadme(dest);
  await replaceInternalBadges(dest);
  await replaceInternalUrls(dest);
  await replaceInternalScopes(dest);
  await replaceYourRepository(dest);
  await patchInternalTemplate(dest);
}

async function patchPublic(dest: string): Promise<void> {
  await replaceCommentSectionsInReadme(dest);
  await replaceCommentSectionsInWorkflows(dest);
  await replaceYourRepository(dest);
}
