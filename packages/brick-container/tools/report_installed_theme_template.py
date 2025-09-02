# -*- coding: utf-8 -*-
import sys
import os
import simplejson
import requests
import ens_api

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils.get_headers import get_headers


def collect(install_path):
  if not os.path.exists(install_path):
    raise Exception("could not find install path {}".format(install_path))
  theme_template_path = os.path.join(install_path, "theme.json")
  if not os.path.exists(theme_template_path):
    raise Exception("could not find theme path {}".format(theme_template_path))
  with open(theme_template_path) as f:
    theme_content = f.read()
    theme_json = simplejson.loads(theme_content)
  return theme_json


def create_or_update_theme_template_data(data, org):
  session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.next_builder_service")
  if session_id <= 0:
    raise Exception("get nameservice logic.micro_app_service error, session_id={}".format(session_id))
  address = "{}:{}".format(ip, port)
  headers = get_headers(org)  
  url = "http://{}/api/v1/next-builder/theme-data-import".format(address)
  param = {"themeData": data}
  rsp = requests.post(url, json=param, headers=headers)
  rsp.raise_for_status()


def report(org, theme_template_data):
  create_or_update_theme_template_data(theme_template_data, org)


if __name__ == "__main__":
  if len(sys.argv) < 3:
    print "Usage: ./report_installed_theme_template.py $org $install_path"
    sys.exit(1)

  org = sys.argv[1]
  install_path = sys.argv[2]
  theme_template_json = collect(install_path)
  if theme_template_json:
    report(org, theme_template_json)
