import {
  PropertyDisplayConfig,
  BrickRender,
  CardConfig,
  CategoryConfig,
  BrickOfModal,
  AttributeConfig,
  CustomBrickConfig,
  BrickAction
} from "@easyops/brick-types";

export const ATTR_OBJECT_ID = "object-id";
export const ATTR_INSTANCE_ID = "instance-id";
export const ATTR_Q = "q";
export const ATTR_SEARCH_DISABLED = "search-disabled";
export const ATTR_ADVANCED_SEARCH_DISABLED = "advanced-search-disabled";
export const ATTR_PAGE = "page";
export const ATTR_PAGE_SIZE = "page-size";
export const ATTR_SORT = "sort";
export const ATTR_ASC = "asc";
export const ATTR_RELATED_TO_ME = "related-to-me";
export const ATTR_RELATED_TO_ME_DISABLED = "related-to-me-disabled";
export const ATTR_ALIVE_HOSTS = "alive-hosts";
export const ATTR_ALIVE_HOSTS_DISABLED = "alive-hosts-disabled";
export const ATTR_KEY = "key";
export const ATTR_IS_PRIMARY = "is-primary";
export const ATTR_COLUMN = "column";
export const ATTR_COLUMN_WIDTH = "column-width";
export const ATTR_SHOW_STATISTICS = "show-statistics";
export const ATTR_SELECTED_CATEGORY = "selected-category";
export const ATTR_DETAIL_URL = "detail-url";
export const ATTR_CLOSE_ON_OK = "close-on-ok";
export const ATTR_RELATION_SIDE_ID = "relation-side-id";

export function decorateCmdbObject<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    set objectId(value: string) {
      const newValue = String(value);
      if (newValue !== this.objectId) {
        this.setAttribute(ATTR_OBJECT_ID, newValue);
      }
    }

    get objectId(): string {
      return this.getAttribute(ATTR_OBJECT_ID);
    }
  };
}

export function decorateCmdbInstance<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    set instanceId(value: string) {
      const newValue = String(value);
      if (newValue !== this.instanceId) {
        this.setAttribute(ATTR_INSTANCE_ID, newValue);
      }
    }

    get instanceId(): string {
      return this.getAttribute(ATTR_INSTANCE_ID);
    }
  };
}

export function decorateReadMultiple<
  T extends { new (...args: any[]): HTMLElement & BrickRender }
>(constructor: T): any {
  return class extends constructor {
    private _detailUrlTemplates: Record<string, string>;

    set detailUrlTemplates(value: Record<string, string>) {
      if (value !== this.detailUrlTemplates) {
        this._detailUrlTemplates = value;
        this._render();
      }
    }

    get detailUrlTemplates(): Record<string, string> {
      return this._detailUrlTemplates;
    }
  };
}

export function decorateReadRelatedToMe<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set relatedToMe(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.relatedToMe) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_RELATED_TO_ME, "");
        } else {
          this.removeAttribute(ATTR_RELATED_TO_ME);
        }
      }
    }

    get relatedToMe(): boolean {
      return this.hasAttribute(ATTR_RELATED_TO_ME);
    }

    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set relatedToMeDisabled(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.relatedToMeDisabled) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_RELATED_TO_ME_DISABLED, "");
        } else {
          this.removeAttribute(ATTR_RELATED_TO_ME_DISABLED);
        }
      }
    }

    get relatedToMeDisabled(): boolean {
      return this.hasAttribute(ATTR_RELATED_TO_ME_DISABLED);
    }
  };
}

export function decorateReadAliveHosts<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    set aliveHosts(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.aliveHosts) {
        if (newValue) {
          this.setAttribute(ATTR_ALIVE_HOSTS, "");
        } else {
          this.removeAttribute(ATTR_ALIVE_HOSTS);
        }
      }
    }

    get aliveHosts(): boolean {
      return this.hasAttribute(ATTR_ALIVE_HOSTS);
    }

    set aliveHostsDisabled(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.aliveHostsDisabled) {
        if (newValue) {
          this.setAttribute(ATTR_ALIVE_HOSTS_DISABLED, "");
        } else {
          this.removeAttribute(ATTR_ALIVE_HOSTS_DISABLED);
        }
      }
    }

    get aliveHostsDisabled(): boolean {
      return this.hasAttribute(ATTR_ALIVE_HOSTS_DISABLED);
    }
  };
}

export function decorateInstanceUpdateRelation<
  T extends {
    new (...args: any[]): HTMLElement & BrickRender;
  }
>(constructor: T): any {
  return class extends constructor {
    set relationSideId(value: string) {
      const newValue = String(value);
      if (newValue !== this.relationSideId) {
        this.setAttribute(ATTR_RELATION_SIDE_ID, newValue);
      }
    }

    get relationSideId(): string {
      return this.getAttribute(ATTR_RELATION_SIDE_ID);
    }
  };
}
export function decorateReadPresetConfigs<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  C = any
>(constructor: T): any {
  return class extends constructor {
    private _presetConfigs: C;

    set presetConfigs(filter: C) {
      if (filter !== this.presetConfigs) {
        this._presetConfigs = filter;
        this._render();
      }
    }

    get presetConfigs(): C {
      return this._presetConfigs;
    }
  };
}

export function decorateReadSorting<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    set sort(value: string) {
      if (value !== null && value !== undefined) {
        const newValue = String(value);
        if (newValue !== this.sort) {
          this.setAttribute(ATTR_SORT, newValue);
        }
      } else {
        if (this.sort !== null) {
          this.removeAttribute(ATTR_SORT);
        }
      }
    }

    get sort(): string {
      return this.getAttribute(ATTR_SORT);
    }

    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set asc(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.asc) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_ASC, "");
        } else {
          this.removeAttribute(ATTR_ASC);
        }
      }
    }

    get asc(): boolean {
      return this.hasAttribute(ATTR_ASC);
    }
  };
}

export function decorateReadSearch<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    set q(value: string) {
      if (value !== null && value !== undefined) {
        const newValue = String(value);
        if (newValue !== this.q) {
          this.setAttribute(ATTR_Q, newValue);
        }
      } else {
        if (this.q !== null) {
          this.removeAttribute(ATTR_Q);
        }
      }
    }

    get q(): string {
      return this.getAttribute(ATTR_Q);
    }

    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set searchDisabled(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.searchDisabled) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_SEARCH_DISABLED, "");
        } else {
          this.removeAttribute(ATTR_SEARCH_DISABLED);
        }
      }
    }

    get searchDisabled(): boolean {
      return this.hasAttribute(ATTR_SEARCH_DISABLED);
    }
  };
}

export function decorateReadAdvancedSearch<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  Q = Record<string, any>
>(constructor: T): any {
  return class extends constructor {
    private _aq: Q;

    set aq(value: Q) {
      if (value !== this.aq) {
        this._aq = value;
        this._render();
      }
    }

    get aq(): Q {
      return this._aq;
    }

    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set advancedSearchDisabled(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.advancedSearchDisabled) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_ADVANCED_SEARCH_DISABLED, "");
        } else {
          this.removeAttribute(ATTR_ADVANCED_SEARCH_DISABLED);
        }
      }
    }

    get advancedSearchDisabled(): boolean {
      return this.hasAttribute(ATTR_ADVANCED_SEARCH_DISABLED);
    }
  };
}

export function decorateReadPagination<
  T extends { new (...args: any[]): HTMLElement }
>(constructor: T): any {
  return class extends constructor {
    set page(value: number) {
      const newValue = Number(value);
      if (newValue !== this.page) {
        this.setAttribute(ATTR_PAGE, String(newValue));
      }
    }

    get page(): number {
      return this.hasAttribute(ATTR_PAGE)
        ? Number(this.getAttribute(ATTR_PAGE))
        : null;
    }

    set pageSize(value: number) {
      const newValue = Number(value);
      if (newValue !== this.pageSize) {
        this.setAttribute(ATTR_PAGE_SIZE, String(newValue));
      }
    }

    get pageSize(): number {
      return this.hasAttribute(ATTR_PAGE_SIZE)
        ? Number(this.getAttribute(ATTR_PAGE_SIZE))
        : null;
    }
  };
}

export function decorateReadSelection<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  K = string,
  I = any
>(constructor: T): any {
  return class extends constructor {
    private _selectedKeys: K[];
    private _selectedItems: I[];

    set selectedKeys(value: K[]) {
      if (value !== this.selectedKeys) {
        this._selectedKeys = value;
        this._render();
      }
    }

    get selectedKeys(): K[] {
      return this._selectedKeys;
    }

    set selectedItems(value: I[]) {
      if (value !== this.selectedItems) {
        this._selectedItems = value;
        this._render();
      }
    }

    get selectedItems(): I[] {
      return this._selectedItems;
    }
  };
}

export function decorateReadPropertiesCustomDisplay<
  T extends { new (...args: any[]): HTMLElement & BrickRender }
>(constructor: T): any {
  return class extends constructor {
    private _propertyDisplayConfigs: PropertyDisplayConfig[];

    set propertyDisplayConfigs(configs: PropertyDisplayConfig[]) {
      if (configs !== this.propertyDisplayConfigs) {
        this._propertyDisplayConfigs = configs;
        this._render();
      }
    }

    get propertyDisplayConfigs(): PropertyDisplayConfig[] {
      return this._propertyDisplayConfigs;
    }
  };
}

export function decorateCmdbInstanceDetail<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  C = Record<string, any>
>(constructor: T): any {
  return class extends constructor {
    private _attributeKeys: string[];
    private _attributeConfigs: Record<string, AttributeConfig>;
    private _brickConfigList: CustomBrickConfig<C>[];
    private _actions: BrickAction[];

    set attributeKeys(value: string[]) {
      if (value !== this._attributeKeys) {
        this._attributeKeys = value;
        this._render();
      }
    }

    get attributeKeys(): string[] {
      return this._attributeKeys;
    }

    set attributeConfigs(value: Record<string, AttributeConfig>) {
      if (value !== this._attributeConfigs) {
        this._attributeConfigs = value;
        this._render();
      }
    }

    get attributeConfigs(): Record<string, AttributeConfig> {
      return this._attributeConfigs;
    }

    set brickConfigList(value: CustomBrickConfig<C>[]) {
      if (value !== this._brickConfigList) {
        this._brickConfigList = value;
        this._render();
      }
    }

    get brickConfigList(): CustomBrickConfig<C>[] {
      return this._brickConfigList;
    }

    set actions(value: BrickAction[]) {
      if (value !== this._actions) {
        this._actions = value;
        this._render();
      }
    }

    get actions(): BrickAction[] {
      return this._actions;
    }
  };
}

export function decorateReadCustomDisplay<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  V = any,
  O = Record<string, any>
>(constructor: T): any {
  return class extends constructor {
    private _value: V;
    private _options: O;

    set value(value: V) {
      if (value !== this.value) {
        this._value = value;
        this._render();
      }
    }

    get value(): V {
      return this._value;
    }

    set options(value: O) {
      if (value !== this.options) {
        this._options = value;
        this._render();
      }
    }

    get options(): O {
      return this._options;
    }
  };
}

export function decorateReadInstanceDisplay<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  O = Record<string, any>
>(constructor: T): any {
  return class extends constructor {
    private _object: O;

    set object(value: O) {
      if (value !== this.object) {
        this._object = value;
        this._render();
      }
    }

    get object(): O {
      return this._object;
    }
  };
}

export function decorateReadPropertyDisplay<
  T extends { new (...args: any[]): HTMLElement & BrickRender }
>(constructor: T): any {
  return class extends constructor {
    set key(value: string) {
      const newValue = String(value);
      if (newValue !== this.key) {
        this.setAttribute(ATTR_KEY, newValue);
      }
    }

    get key(): string {
      return this.getAttribute(ATTR_KEY);
    }

    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set isPrimary(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.isPrimary) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_IS_PRIMARY, "");
        } else {
          this.removeAttribute(ATTR_IS_PRIMARY);
        }
      }
    }

    get isPrimary(): boolean {
      return this.hasAttribute(ATTR_IS_PRIMARY);
    }
  };
}

export function decorateReadCardList<
  T extends { new (...args: any[]): HTMLElement & BrickRender }
>(constructor: T): any {
  return class extends constructor {
    private _card: CardConfig;
    private _category: CategoryConfig;

    set selectedCategory(value: string) {
      const newValue = String(value);
      if (newValue !== this.selectedCategory) {
        this.setAttribute(ATTR_SELECTED_CATEGORY, newValue);
      }
    }

    get selectedCategory(): string {
      return this.getAttribute(ATTR_SELECTED_CATEGORY);
    }

    set column(value: number) {
      const newValue = Number(value);
      if (newValue !== this.column) {
        this.setAttribute(ATTR_COLUMN, String(newValue));
      }
    }

    get column(): number {
      return this.hasAttribute(ATTR_COLUMN)
        ? Number(this.getAttribute(ATTR_COLUMN))
        : 3;
    }

    set columnWidth(value: number) {
      const newValue = Number(value);
      if (newValue !== this.columnWidth) {
        this.setAttribute(ATTR_COLUMN_WIDTH, String(newValue));
      }
    }

    get columnWidth(): number {
      return this.hasAttribute(ATTR_COLUMN_WIDTH)
        ? Number(this.getAttribute(ATTR_COLUMN_WIDTH))
        : null;
    }

    set card(value: CardConfig) {
      if (value !== this.card) {
        this._card = value;
        this._render();
      }
    }

    get card(): CardConfig {
      return this._card;
    }

    set category(value: CategoryConfig) {
      if (value !== this.category) {
        this._category = value;
        this._render();
      }
    }

    get category(): CategoryConfig {
      return this._category;
    }

    set showStatistics(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.showStatistics) {
        newValue
          ? this.setAttribute(ATTR_SHOW_STATISTICS, "")
          : this.removeAttribute(ATTR_SHOW_STATISTICS);
      }
    }

    get showStatistics(): boolean {
      return this.hasAttribute(ATTR_SHOW_STATISTICS);
    }
  };
}

export function decorateReadCmdbCard<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  I = Record<string, any>,
  O = Record<string, any>
>(constructor: T): any {
  return class extends constructor {
    private _instance: I;
    private _object: O;

    set instance(instance: I) {
      if (instance !== this.instance) {
        this._instance = instance;
        this._render();
      }
    }

    get instance(): I {
      return this._instance;
    }

    set object(object: O) {
      if (object !== this.object) {
        this._object = object;
        this._render();
      }
    }

    get object(): O {
      return this._object;
    }

    set objectId(value: string) {
      const newValue = String(value);
      if (newValue !== this.objectId) {
        this.setAttribute(ATTR_OBJECT_ID, newValue);
      }
    }

    get objectId(): string {
      return this.getAttribute(ATTR_OBJECT_ID);
    }

    set detailUrl(value: string) {
      const newValue = String(value);
      if (newValue !== this.detailUrl) {
        this.setAttribute(ATTR_DETAIL_URL, newValue);
      }
    }

    get detailUrl(): string {
      return this.getAttribute(ATTR_DETAIL_URL);
    }
  };
}

export function decorateBrickModal<
  T extends {
    new (...args: any[]): HTMLElement & BrickOfModal & BrickRender;
  },
  P = Record<string, any>
>(constructor: T): any {
  return class extends constructor {
    private _modalTitle: React.ReactNode;
    private _modalWidth: number;
    // ** Always accept primitive data (strings, numbers, booleans)
    //    as either attributes or properties. **
    set closeOnOk(value: boolean) {
      const newValue = Boolean(value);
      if (newValue !== this.closeOnOk) {
        if (newValue) {
          // ** Aim to keep primitive data attributes and properties in sync,
          //    reflecting from property to attribute, and vice versa. **
          this.setAttribute(ATTR_CLOSE_ON_OK, "");
        } else {
          this.removeAttribute(ATTR_CLOSE_ON_OK);
        }
      }
    }

    get closeOnOk(): boolean {
      return this.hasAttribute(ATTR_CLOSE_ON_OK);
    }

    set modalTitle(value: React.ReactNode) {
      if (value !== this.modalTitle) {
        this._modalTitle = value;
        this._render();
      }
    }

    get modalTitle(): React.ReactNode {
      return this._modalTitle;
    }

    set modalWidth(value: number) {
      if (value !== this._modalWidth) {
        this._modalWidth = value;
        this._render();
      }
    }

    get modalWidth(): number {
      return this._modalWidth;
    }

    open = (e?: CustomEvent<P>) => {
      if (e) {
        Object.assign(this, e.detail);
      }
      this.isVisible = true;
      this._render();
    };

    close = () => {
      this.isVisible = false;
      this._render();
    };

    destroy = () => {
      this.destroyOnClose = true;
      this.close();
      this.destroyOnClose = false;

      if (this.reset) {
        this.reset();
      }
    };
  };
}

export function decorateBrickFeatures<
  T extends { new (...args: any[]): HTMLElement & BrickRender },
  F = Record<string, Record<string, any> | boolean>
>(constructor: T): any {
  return class extends constructor {
    private _features: F;

    set features(value: F) {
      if (value !== this.features) {
        this._features = value;
        this._render();
      }
    }

    get features(): F {
      return this._features;
    }
  };
}
