import {getEasyopsConfig} from "./getEasyopsConfig"
import fs from "fs-extra"
jest.mock("fs-extra")

const easyopsConfigRes = {
  contractYamlDir: "easyops",
  contractUrl: "git@git.easyops.local:anyclouds/contract-center.git",
  useLocalSdk: false
}
describe("getEasyopsConfig should work", ()=> {
  it("read config should work", ()=> {
    jest.spyOn(fs, "existsSync").mockReturnValue(true)
    jest.spyOn(fs, "readJsonSync").mockReturnValue({})
    expect(getEasyopsConfig()).toEqual(easyopsConfigRes)
  })
  it("without config should work", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false)
    expect(getEasyopsConfig()).toEqual(easyopsConfigRes)
  })
})
