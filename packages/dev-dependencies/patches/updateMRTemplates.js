const path = require("path");
const fs = require("fs-extra");

function updateMRTemplates() {
  const defaultMdPath = ".gitlab/merge_request_templates/default.md";
  fs.outputFileSync(
    path.resolve(defaultMdPath),
    fs.readFileSync(path.join(__dirname, "../template", defaultMdPath), "utf8")
  );
}

exports.updateMRTemplates = updateMRTemplates;
