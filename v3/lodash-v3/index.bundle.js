let _lodash;

function lodash() {
  return _lodash.apply(_lodash, arguments);
}

module.exports = lodash;

lodash.__inject = function (m) {
  _lodash = m;
  for (const k of Object.keys(m)) {
    lodash[k] = m[k];
  }

  delete lodash.__inject;
};
