import type { Request, Response, NextFunction } from "express";

export function getBrickPackages(
  localBrickFolders: string[],
  publicRootWithVersion?: boolean,
  localBricks?: string[]
): Promise<unknown[]>;
export function getBrickManifests(
  rootDir: string,
  localBricks?: string[]
): Promise<unknown[]>;
export function getLocalBrickPackageNames(
  localBrickFolders: string[],
  localBricks?: string[]
): Promise<string[]>;
export function tryFiles(files: string | string[]): string | undefined;
export function tryServeFiles(
  files: string | string[],
  req: Request,
  res: Response
): string | undefined;
export function serveBricks(options: {
  localBrickFolders: string[];
}): (req: Request, res: Response, next: NextFunction) => void;
