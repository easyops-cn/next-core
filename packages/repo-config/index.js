const fs = require("fs");
const path = require("path");

exports.getEasyopsConfig = () => {
  const easyopsConfig = {
    useLocalSdk: false,
    usePublicScope: false,
    contractYamlDir: "easyops",
    contractUrl: "git@git.easyops.local:anyclouds/contract-center.git",
  };
  const configPath = path.resolve(".easyops-yo.json");
  if (fs.existsSync(configPath)) {
    const incomeConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    Object.assign(easyopsConfig, incomeConfig);
  }
  return easyopsConfig;
};
