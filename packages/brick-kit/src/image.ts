import { MetaImage } from "@easyops/brick-types";
import { isEmpty } from "lodash";

export function getUrlByImageFactory(images: MetaImage[]) {
  return function getUrlByImage(name: string) {
    if (isEmpty(images)) {
      // eslint-disable-next-line no-console
      console.warn("no images uploaded, please upload image first");
      return;
    }

    const find = images?.find((item) => item.name === name);

    if (!find?.url) {
      // eslint-disable-next-line no-console
      console.warn("the name of the image was not found:", name);
      return;
    }

    return find.url;
  };
}
