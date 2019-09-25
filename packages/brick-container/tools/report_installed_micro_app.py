# -*- coding: utf-8 -*-
import sys
import os
import simplejson
import requests

import ens_api


def get_version(install_path):
    # 开发环境没有version.ini文件，直接返回0.0.0
    if not os.path.exists(os.path.join(install_path, "version.ini")):
        return "0.0.0"
    with open(os.path.join(install_path, "version.ini")) as f:
        lines = f.readlines()
        return lines[-1].strip()


def collect(install_path):
    # 不存在应用商店时，不上报, 否则上报会出错
    session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.ucpro_desktop_service")
    if session_id <= 0:
        print "logic.ucpro_desktop_service not exists, session_id={0}, skip report".format(session_id)
        return None

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
        return {
            "name": story_board["app"]["name"],
            "appId": story_board["app"]["id"],
            "icons": story_board["app"].get("icons", {}),
            "storyboardJson": story_board_content,
            "installStatus": "ok",
            "currentVersion": get_version(install_path),
            "homepage": story_board["app"]["homepage"],
            "internal": "true" if story_board["app"].get("internal") else "false",
            "private": "true" if story_board["app"].get("private") else "false",
            "status": "enabled",  # 新安装状态默认是enabled的
            "menuIcon": story_board["app"].get("menuIcon", {}),
        }


def create_or_update_micro_app(app, ip, port, org):
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
        if rsp.json()["data"].get("menuIcon"):
            app["menuIcon"] = rsp.json()["data"]["menuIcon"]
        rsp = requests.put(url, json=app, headers=headers)
        rsp.raise_for_status()
    else:
        rsp.raise_for_status()
        print 'create app: {}'.format(app["appId"])


def report(org, app):
    session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.api.gateway")
    if session_id <= 0:
        raise Exception("get nameservice logic.api.gateway error, session_id={}".format(session_id))
    create_or_update_micro_app(app, ip, port, org)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print "Usage: ./report_installed_micro_apps.py $org $install_path"
        sys.exit(1)

    org = sys.argv[1]
    install_path = sys.argv[2]
    app = collect(install_path)
    if app:
        report(org, app)

