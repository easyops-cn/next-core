import {
  decorateCmdbObject,
  decorateCmdbInstance,
  decorateReadSorting,
  decorateReadSearch,
  decorateReadAdvancedSearch,
  decorateReadPagination,
  decorateReadPropertiesCustomDisplay,
  decorateReadPropertyDisplay,
  decorateReadSelection,
  decorateBrickModal,
  decorateReadPresetConfigs,
  decorateReadMultiple,
  decorateReadRelatedToMe,
  decorateReadCmdbCard,
  decorateReadInstanceDisplay,
  decorateReadCustomDisplay,
  decorateBrickFeatures
} from "./brick";
import { BrickRender } from "@easyops/brick-types";

class FakeElement {
  private attrs: Record<string, string> = {};

  hasAttribute(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }

  getAttribute(name: string): string {
    return this.attrs[name] || null;
  }

  setAttribute(name: string, value: string): void {
    this.attrs[name] = value;
  }

  removeAttribute(name: string) {
    delete this.attrs[name];
  }
}

class FakeElementWithRender extends FakeElement implements BrickRender {
  _render() {}
}

describe("brick decorators", () => {
  it("should work to decorateCmdbObject", () => {
    const OriginalElement = class extends FakeElement {};
    const NewElement = decorateCmdbObject(OriginalElement as any);
    const elem = new NewElement();
    elem.objectId = 1;
    expect(elem.objectId).toBe("1");
  });

  it("should work to decorateCmdbInstance", () => {
    const OriginalElement = class extends FakeElement {};
    const NewElement = decorateCmdbInstance(OriginalElement as any);
    const elem = new NewElement();
    elem.instanceId = 1;
    expect(elem.instanceId).toBe("1");
  });

  it("should work to decorateReadMultiple", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadMultiple(OriginalElement as any);
    const elem = new NewElement();
    elem.detailUrlTemplates = { ObjectA: "/ObjectA/${instanceId}" };
    expect(elem.detailUrlTemplates).toStrictEqual({
      ObjectA: "/ObjectA/${instanceId}"
    });
  });

  it("should work to decorateReadRelatedToMe", () => {
    const OriginalElement = class extends FakeElement {};
    const NewElement = decorateReadRelatedToMe(OriginalElement as any);
    const elem = new NewElement();
    elem.relatedToMe = "1";
    expect(elem.relatedToMe).toBe(true);
    elem.relatedToMe = false;
    expect(elem.relatedToMe).toBe(false);
    elem.relatedToMeDisabled = "1";
    expect(elem.relatedToMeDisabled).toBe(true);
    elem.relatedToMeDisabled = false;
    expect(elem.relatedToMeDisabled).toBe(false);
  });

  it("should work to decorateReadPresetConfigs", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadPresetConfigs(OriginalElement as any);
    const elem = new NewElement();
    elem.presetConfigs = { query: { aaa: 123 }, fieldIds: ["aaa"] };
    expect(elem.presetConfigs).toStrictEqual({
      query: { aaa: 123 },
      fieldIds: ["aaa"]
    });
  });

  it("should work to decorateReadSorting", () => {
    const OriginalElement = class extends FakeElement {};
    const NewElement = decorateReadSorting(OriginalElement as any);
    const elem = new NewElement();
    elem.sort = 1;
    expect(elem.sort).toBe("1");
    elem.sort = null;
    expect(elem.sort).toBe(null);
    elem.asc = "1";
    expect(elem.asc).toBe(true);
    elem.asc = false;
    expect(elem.asc).toBe(false);
  });

  it("should work to decorateReadSearch", () => {
    const OriginalElement = class extends FakeElement {};
    const NewElement = decorateReadSearch(OriginalElement as any);
    const elem = new NewElement();
    elem.q = 1;
    expect(elem.q).toBe("1");
    elem.q = null;
    expect(elem.q).toBe(null);
    elem.searchDisabled = "1";
    expect(elem.searchDisabled).toBe(true);
    elem.searchDisabled = false;
    expect(elem.searchDisabled).toBe(false);
  });

  it("should work to decorateReadAdvancedSearch", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadAdvancedSearch(OriginalElement as any);
    const elem = new NewElement();
    elem.aq = { $and: { aaa: { $eq: 111 }, bbb: { $eq: 222 } } };
    expect(elem.aq).toEqual({ $and: { aaa: { $eq: 111 }, bbb: { $eq: 222 } } });
    elem.advancedSearchDisabled = "1";
    expect(elem.advancedSearchDisabled).toBe(true);
    elem.advancedSearchDisabled = false;
    expect(elem.advancedSearchDisabled).toBe(false);
  });

  it("should work to decorateReadPagination", () => {
    const OriginalElement = class extends FakeElement {};
    const NewElement = decorateReadPagination(OriginalElement as any);
    const elem = new NewElement();
    elem.page = "2";
    expect(elem.page).toBe(2);
    elem.pageSize = "10";
    expect(elem.pageSize).toBe(10);
  });

  it("should work to decorateReadSelection", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadSelection(OriginalElement as any);
    const elem = new NewElement();
    elem.selectedKeys = ["fake_id"];
    expect(elem.selectedKeys).toStrictEqual(["fake_id"]);
    elem.selectedItems = [{ id: "fake_id" }];
    expect(elem.selectedItems).toStrictEqual([{ id: "fake_id" }]);
  });

  it("should work to decorateReadPropertiesCustomDisplay", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadPropertiesCustomDisplay(
      OriginalElement as any
    );
    const elem = new NewElement();
    elem.propertyDisplayConfigs = [{ key: "key", brick: "brick-name" }];
    expect(elem.propertyDisplayConfigs).toEqual([
      { key: "key", brick: "brick-name" }
    ]);
  });

  it("should work to decorateReadCustomDisplay", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadCustomDisplay(OriginalElement as any);
    const elem = new NewElement();
    elem.value = { key: "value" };
    expect(elem.value).toEqual({ key: "value" });
    elem.options = { key2: "value2" };
    expect(elem.options).toEqual({ key2: "value2" });
  });

  it("should work to decorateReadInstanceDisplay", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadInstanceDisplay(OriginalElement as any);
    const elem = new NewElement();
    elem.object = { key: "value" };
    expect(elem.object).toEqual({ key: "value" });
  });

  it("should work to decorateReadPropertyDisplay", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadPropertyDisplay(OriginalElement as any);
    const elem = new NewElement();
    elem.key = 1;
    expect(elem.key).toBe("1");
    elem.isPrimary = "1";
    expect(elem.isPrimary).toBe(true);
    elem.isPrimary = false;
    expect(elem.isPrimary).toBe(false);
  });

  it("should work to decorateReadCmdbCard", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateReadCmdbCard(OriginalElement as any);
    const elem = new NewElement();
    elem.instance = { instanceId: "fake_id" };
    expect(elem.instance).toEqual({ instanceId: "fake_id" });
    elem.object = { objectId: "fake_id" };
    expect(elem.object).toEqual({ objectId: "fake_id" });
    elem.objectId = "aaa";
    expect(elem.objectId).toBe("aaa");
    elem.detailUrl = "bbb";
    expect(elem.detailUrl).toBe("bbb");
  });

  it("should work to decorateBrickModal", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateBrickModal(OriginalElement as any);
    const elem = new NewElement();
    const sypOnRender = jest.spyOn(elem, "_render");
    elem.closeOnOk = "1";
    expect(elem.closeOnOk).toBe(true);
    elem.closeOnOk = false;
    expect(elem.closeOnOk).toBe(false);
    elem.modalTitle = "aaa";
    expect(elem.modalTitle).toBe("aaa");
    elem.modalWidth = 1000;
    expect(elem.modalWidth).toBe(1000);
    elem.open({ detail: { instanceId: "fake_id" } });
    expect(elem.instanceId).toBe("fake_id");
    expect(elem.isVisible).toBe(true);
    expect(sypOnRender).toBeCalled();
    sypOnRender.mockClear();
    elem.close();
    expect(elem.isVisible).toBe(false);
    expect(sypOnRender).toBeCalled();
    const mockReset = jest.fn();
    elem.reset = mockReset;
    elem.destroy();
    expect(mockReset).toBeCalled();
  });

  it("should work to decorateBrickFeatures", () => {
    const OriginalElement = class extends FakeElementWithRender {};
    const NewElement = decorateBrickFeatures(OriginalElement as any);
    const elem = new NewElement();
    elem.features = { feature1: { key: "value" } };
    expect(elem.features).toEqual({ feature1: { key: "value" } });
  });
});
