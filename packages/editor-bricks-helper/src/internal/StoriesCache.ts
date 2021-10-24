import { Story } from "@next-core/brick-types";
import { BuildApi_getStoriesJson } from "@next-sdk/next-builder-sdk";
import _ from "lodash";

interface installInfo {
  list?: string[];
  fields?: string[];
}

export class StoriesCache {
  static instance: StoriesCache;

  static getInstance() {
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
      this.cache.storyList.set(item.storyId, item);
    });
  }

  async install(info: installInfo = {}, isCache?: boolean) {
    let needInstallList = info.list || [];
    if (Array.isArray(needInstallList) && needInstallList.length > 0) {
      needInstallList = needInstallList.filter(
        (item) => !this.cache.installed[item]
      );
      if (needInstallList.length === 0) return;
    }
    if (info.fields && !info.list && this.getStoryList().length > 0) {
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
  }
}
