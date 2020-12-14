# -*- coding: utf-8 -*-
import sys
import os
import simplejson
import requests

import ens_api

INSTALL_INFO_PATH = "/usr/local/easyops/deploy_init/conf/install_info.json"


class NameServiceError(Exception):
  pass


def get_version(install_path):
  # 开发环境没有version.ini文件，直接返回0.0.0
  if not os.path.exists(os.path.join(install_path, "version.ini")):
    return "0.0.0"
  with open(os.path.join(install_path, "version.ini")) as f:
    lines = f.readlines()
    return lines[-1].strip()


def _find_container_id(app_id, install_info_path):
  install_info = {}
  if os.path.exists(install_info_path):
    with open(install_info_path) as f:
      install_info = simplejson.load(f)
  for micro_app in install_info.get("micro_app", []):
    if micro_app["app_id"] == app_id:
      return micro_app["container_id"]
  return ""


def collect(install_path):
  if not os.path.exists(install_path):
    raise Exception("could not find install path {}".format(install_path))
  story_board_path = os.path.join(install_path, "storyboard.json")
  if not os.path.exists(story_board_path):
    raise Exception("could not find storyboard path {}".format(story_board_path))
  with open(story_board_path) as f:
    story_board_content = f.read()
    story_board = simplejson.loads(story_board_content)
    # 跳过没有app字段的storyboard
    if not story_board.get("app"):
      return None
    app_id = story_board["app"]["id"]
    app = {
      "name": story_board["app"]["name"],
      "appId": app_id,
      "icons": story_board["app"].get("icons", {}),
      "storyboardJson": story_board_content,
      "installStatus": "ok",
      "currentVersion": get_version(install_path),
      "homepage": story_board["app"]["homepage"],
      "internal": "true" if story_board["app"].get("internal") else "false",
      "private": "true" if story_board["app"].get("private") else "false",
      "status": "enabled",  # 新安装状态默认是enabled的
      "menuIcon": story_board["app"].get("menuIcon", {}),
      "containerId": _find_container_id(app_id, INSTALL_INFO_PATH),
    }
    apis_path = os.path.join(install_path, "apis/api.json")
    if os.path.exists(apis_path):
      with open(apis_path) as apisF:
        apis_content = apisF.read()
        apiList = simplejson.loads(apis_content)
        app["apiList"] = apiList
    return app


def create_or_update_micro_app(app, org):
  session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.ucpro_desktop_service")
  if session_id <= 0:
    raise NameServiceError("get nameservice logic.ucpro_desktop_service error, session_id={}".format(session_id))
  headers = {"org": str(org), "user": "defaultUser"}
  url = "http://{}:{}/api/micro_app/v1/installed_micro_app/report_result".format(ip, port)
  param = {"installedApps": [{"microApp": app, "containerId": app["containerId"]}]}
  if app.has_key("apiList"):
    apiList = app["apiList"]
    del app["apiList"]
    param = {"installedApps": [{"microApp": app, "containerId": app["containerId"], "apiList": apiList}]}
  rsp = requests.post(url, json=param, headers=headers)
  rsp.raise_for_status()


# 老的上报方法， 兼容ucpro还没升级的情况
def create_or_update_micro_app_to_api_gw(app, org):
  print "ucpro desktop service api not ready, use old way to report"
  session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.api.gateway")
  if session_id <= 0:
    raise NameServiceError("get nameservice logic.api.gateway error, session_id={}".format(session_id))

  headers = {"org": str(org), "user": "defaultUser"}
  url = "http://{}:{}/api/micro_app/v1/installed_micro_app".format(ip, port)
  rsp = requests.post(url, json=app, headers=headers)
  rsp_json = rsp.json()
  # 100005 means object not found
  if rsp_json["code"] == 100005:
    print 'object not init, exit'
    return
  # 100007 means already exists
  elif rsp_json["code"] == 100007:
    # 先获取当前小产品的安装状态，需要继承安装状态，
    # 如果是running状态，说明是应用商店正在安装，此时继承running的安装状态。
    # 如果是ok状态，说明应用商店没有安装，这个是正常的包升级扫描。
    # 否则会出现应用商店部署任务和launchpad安装状态不一致的bug
    url = "http://{}:{}/api/micro_app/v1/installed_micro_app/{}".format(ip, port, app["appId"])
    rsp = requests.get(url, headers=headers)
    print 'get app: {}'.format(app["appId"])
    rsp.raise_for_status()

    print 'update app: {}'.format(app["appId"])
    app["installStatus"] = rsp.json()["data"]["installStatus"]
    # 小产品状态如果非空需要继承， 因为这个是用户设置的
    # 如果状态是空，则默认是enabled的
    if rsp.json()["data"]["status"]:
      app["status"] = rsp.json()["data"]["status"]
    rsp = requests.put(url, json=app, headers=headers)
    rsp.raise_for_status()
  else:
    rsp.raise_for_status()
    print 'create app: {}'.format(app["appId"])


def upload_micro_app_images(install_path, org):
  session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.object_store_service")
  if session_id <= 0:
    raise NameServiceError("get nameservice logic.object_store_service error, session_id={}".format(session_id))
  headers = {"org": str(org), "user": "defaultUser"}
  url = "http://{}:{}/api/v1/objectStore/bucket/wwbtest/object".format(ip, port)
  for root, dirs, files in os.walk(install_path + "/images"):
    for f in files:
      fileName = os.path.basename(f)
      if fileName[0] == ".":
        continue
      param = {"objectName": fileName}
      fileData = {'file': open(f, 'rb')}
      rsp = requests.put(url, data=param, files=fileData, headers=headers)
      rsp.raise_for_status()


def report(org, app):
  try:
    create_or_update_micro_app(app, org)
  except NameServiceError, e:
    create_or_update_micro_app_to_api_gw(app, org)
  except requests.HTTPError, e:
    # ucpro_desktop_service还没有这个接口, 走回api_gw的方式上报
    if e.response.status_code == 404:
      create_or_update_micro_app_to_api_gw(app, org)
    else:
      raise e


if __name__ == "__main__":
  if len(sys.argv) < 3:
    print "Usage: ./report_installed_micro_apps.py $org $install_path"
    sys.exit(1)

  org = sys.argv[1]
  install_path = sys.argv[2]
  app = collect(install_path)
  if app:
    report(org, app)
    upload_micro_app_images(install_path, org)
