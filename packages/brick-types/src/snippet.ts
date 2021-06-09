import { BrickConf } from "./manifest";
import { I18nString } from "./story";

/** @internal */
export interface BrickSnippet {
  snippetId: string;
  bricks: BrickConf[];
  thumbnail?: string;
  text?: I18nString;
  description?: I18nString;
  category?: string;
  subCategory?: string;
}
