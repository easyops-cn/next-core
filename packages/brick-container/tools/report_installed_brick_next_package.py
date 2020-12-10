# -*- coding: utf-8 -*-
import sys
import os
import commands
import simplejson
import requests

import ens_api

INSTALL_BASE_PATH = "{}/{}/dist/{}"
OBJECT_ID = "INSTALLED_BRICKS_NEXT_PACKAGE"

class NameServiceError(Exception):
    pass

def format_app_name(install_path):
    package_name = os.path.basename(install_path)
    type_name = ""
    if package_name.endswith("-NT"):
      type_name = "templates"
    elif package_name.endswith("-NB"):
      type_name = "bricks"
    else:
      raise Exception("could not dealwith package type {}".format(package_name))
    new_package_name = package_name[:-3]
    package_type = package_name[-2:]
    return package_name, type_name, new_package_name, package_type

def get_js_name(install_path):
    # dist path
    dist_path = os.path.join(install_path, "dist")
    if not os.path.exists(dist_path):
        raise Exception("could not find dist path {}".format(dist_path))
    list_file = os.listdir(dist_path)
    for f in list_file:
      if f.endswith(".js"):
        return os.path.basename(f)

def get_stories_json(install_path):
    # dist path
    stories_json_path = os.path.join(install_path, "dist/stories.json")
    if not os.path.exists(stories_json_path):
        return ""
    with open(stories_json_path) as f:
        return f.read()

def collect(install_path):
    if not os.path.exists(install_path):
        raise Exception("could not find install path {}".format(install_path))
    package_name, type_name, new_package_name, package_type = format_app_name(install_path)
    json_path = os.path.join(install_path, "dist/{}.json".format(type_name))
    if not os.path.exists(json_path):
        raise Exception("could not find json path {}".format(json_path))
    with open(json_path) as f:
        json_content = f.read()
        bricks = simplejson.loads(json_content)
        bricks["filePath"] = INSTALL_BASE_PATH.format(type_name, new_package_name, get_js_name(install_path))
        stories_json = get_stories_json(install_path)
        installed_package = {"name": package_name, "packageJson": bricks, "packageType": package_type, "storiesJson": stories_json}
        return installed_package


def create_or_update_package(org, installed_package, install_path):
    session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.micro_app_service")
    if session_id <= 0:
        raise NameServiceError("get nameservice logic.micro_app_service error, session_id={}".format(session_id))
    headers = {"org": str(org), "user": "defaultUser"}
    package_name = os.path.basename(install_path)

    req = {"installedPackages": [installed_package]}

    # report
    url = "http://{}:{}/api/micro_app/v1/installed_bricks_next_package/report_result".format(ip, port)
    rsp = requests.post(url, json=req, headers=headers)
    rsp.raise_for_status()

def check_org():
    session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.cmdb")
    if session_id <= 0:
        raise NameServiceError("get nameservice logic.cmdb error, session_id={}".format(session_id))

    url = 'http://%s:%s/org/list' % (ip, port)
    resp = requests.get(url=url, headers={'Host': "cmdb.easyops-only.com"})
    resp.raise_for_status()
    payload = resp.json()
    data = payload['data']
    if len(data) == 0:
      return False
    else:
      return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print "Usage: ./report_installed_brick_next_package.py $install_path"
        sys.exit(1)

    # 检查org是否存在
    if not check_org():
      sys.exit(0)

    (status, org) = commands.getstatusoutput('/usr/local/easyops/deploy_init/tools/get_env.py common org')
    if status != 0:
      print "get common org error"
      sys.exit(1)
    install_path = sys.argv[1]
    installed_package = collect(install_path)
    if installed_package:
        create_or_update_package(org, installed_package, install_path)

