import { Story } from "@next-core/brick-types";
import { BuildApi_getStoriesJson } from "@next-sdk/next-builder-sdk";
import _ from "lodash";

interface installInfo {
  list?: string[];
  fields?: string[];
}

export class StoriesCache {
  static instance: StoriesCache;

  static getInstance(): StoriesCache {
    if (!StoriesCache.instance) {
      StoriesCache.instance = new StoriesCache();
    }
    return StoriesCache.instance;
  }

  private cache = {
    storyList: new Map<string, Story>(),
    installed: {} as Record<string, boolean>,
  };

  getStoryList(): Story[];
  getStoryList(id?: string): Story;
  getStoryList(id?: string) {
    if (typeof id === "string") {
      return this.cache.storyList.get(id);
    }
    return [...this.cache.storyList.values()];
  }

  setCache(id: string): void {
    this.cache.installed[id] = true;
  }

  hasInstalled(storyId: string): boolean {
    return !!this.cache.installed[storyId];
  }

  init(list: Story[]) {
    list.forEach((item) => {
      this.cache.storyList.set(item.id, item);
    });
  }

  async install(
    info?: installInfo,
    isCache?: boolean
  ): Promise<Story[] | void> {
    let needInstallList: string[] = [];
    if (Array.isArray(info?.list)) {
      needInstallList = info.list.filter((item) => !this.cache.installed[item]);
      if (needInstallList.length === 0) return;
    }
    if (info && info.fields && !info.list && this.getStoryList().length > 0) {
      // it's mean the base info had install
      // and we don't need to requset again
      return;
    }
    const response = (await BuildApi_getStoriesJson(
      info
        ? {
            storyIds: needInstallList,
            fields: info.fields,
          }
        : undefined
    )) as {
      data: {
        list: Story[];
      };
    };
    response.data.list.forEach((item) => {
      isCache && this.setCache(item.id);
      let storyItem = this.cache.storyList.get(item.id);
      storyItem = _.mergeWith({}, storyItem, item, (o, s) =>
        _.isNull(s) ? o : s
      );
      this.cache.storyList.set(item.id, storyItem);
    });
    return response.data.list;
  }
}
