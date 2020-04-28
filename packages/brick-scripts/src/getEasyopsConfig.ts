import fs from "fs-extra"
import path from "path"

export const isEasyopsConfigExists = fs.existsSync(path.join(process.cwd(), ".easyops-yo.json"))
export const easyopsConfig = fs.readJsonSync(path.join(process.cwd(), ".easyops-yo.json"))
