import fs from "fs-extra"
import path from "path"

export const getEasyopsConfig = () => {
  let easyopsConfig = {
    contractYamlDir: "easyops",
    contractUrl: "git@git.easyops.local:anyclouds/contract-center.git",
    useLocalSdk: false
  }
  const isEasyopsConfigExists = fs.existsSync(path.join(process.cwd(), ".easyops-yo.json"))
  if (isEasyopsConfigExists) {
    const incomeConfig = fs.readJsonSync(path.join(process.cwd(), ".easyops-yo.json"))
    easyopsConfig = Object.assign(easyopsConfig, incomeConfig)
  }
  return easyopsConfig
}
