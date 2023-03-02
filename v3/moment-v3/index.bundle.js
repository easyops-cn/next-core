let _moment;

function moment() {
  return _moment.apply(_moment, arguments);
}

module.exports = moment;

moment.__inject = function (m) {
  _moment = m;
  for (const k of Object.keys(m)) {
    moment[k] = m[k];
  }

  delete moment.__inject;
};
