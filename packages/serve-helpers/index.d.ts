import type { Request, Response } from "express";

export function getBrickPackages(
  rootDir: string,
  publicRootWithVersion: string
): Promise<unknown[]>;
export function tryFiles(files: string | string[]): string | undefined;
export function tryServeFiles(
  files: string | string[],
  req: Request,
  res: Response
): string | undefined;