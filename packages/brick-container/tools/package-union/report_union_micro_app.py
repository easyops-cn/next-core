# -*- coding: utf-8 -*-
import json as simplejson
import sys
import os
import ens_api
import requests
import simplejson
import shutil

reload(sys)
sys.setdefaultencoding("utf-8")

# 公共路径
_INSTALL_BASE_PATH = "/usr/local/easyops"
_APPLICATIONS_SA_FOLDER = "applications_sa"

class NameServiceError(Exception):
    pass


def join_host_port(host, port):
    template = "%s:%s"
    host_requires_bracketing = ':' in host or '%' in host
    if host_requires_bracketing:
        template = "[%s]:%s"
    return template % (host, port)


session_id, ip, port = ens_api.get_service_by_name("", "logic.micro_app_service")
if session_id <= 0:
    raise Exception("get name service logic.micro_app_service failed, no session_id")
MICRO_APP_ADDR = join_host_port(ip, port)

session_id, ip, port = ens_api.get_service_by_name("", "logic.micro_app_standalone_service")
if session_id <= 0:
    raise NameServiceError("get nameservice logic.micro_app_standalone error, session_id={}".format(session_id))
MICRO_APP_SA_ADDR = join_host_port(ip, port)


def get_version(install_path):
    # 开发环境没有version.ini文件，直接返回0.0.0
    if not os.path.exists(os.path.join(install_path, "version.ini")):
        return "0.0.0"
    with open(os.path.join(install_path, "version.ini")) as f:
        lines = f.readlines()
        return lines[-1].strip()


def collect_app_info(app_path, report_app_id, version):
    if not os.path.exists(app_path):
        print u"could not find app path {}".format(app_path)
        return 
    bootstrap_file_name = ""
    for f in os.listdir(app_path):
        if f.startswith("bootstrap-mini.") and f.endswith(".json"):
            bootstrap_file_name = f
    if bootstrap_file_name is "":
        print u"bootstrap-mini.*.json not found in dir {}".format(app_path)
        return
    bootstrap_file = os.path.join(app_path, bootstrap_file_name)
    print u"report app: {}, bootstrap_file: {}".format(report_app_id, bootstrap_file)
    with open(bootstrap_file) as f:
        bootstrap_content = f.read()
        bootstrap_content_json = simplejson.loads(bootstrap_content)
        # 跳过没有app字段的storyboard
        if not bootstrap_content_json.get("storyboards"):
            return None
        storyboards = bootstrap_content_json.get("storyboards")
        for story_board in storyboards:
            if story_board["app"]["id"] == report_app_id:
                app = {
                    "appId": story_board["app"]["id"],
                    "name": story_board["app"]["name"],
                    "internal": "true" if story_board["app"].get("internal") else "false",
                    "version": version,
                    "homepage": story_board["app"]["homepage"],
                    "status": "enabled",  # 新安装状态默认是enabled的
                    "setActiveVersion": True,
                    "meta": simplejson.dumps(story_board["meta"], ensure_ascii=False),
                    "defaultConfig": story_board["app"].get("defaultConfig"),
                    "defaultContainer": story_board["app"].get("defaultContainer"),
                    "icons": story_board["app"].get("icons", {}),
                    "menuIcon": story_board["app"].get("menuIcon", {}),
                    "locales": story_board["app"].get("locales", {}),
                    "description": story_board["app"].get("description"),
                    "author": story_board["app"].get("author"),
                    "isFromUnionApp": True,
                }
                return app


def report(org, app):
    try:
        skip_update = create_or_update_micro_app_sa(org, app)
    except NameServiceError, e:
        raise e
    except requests.HTTPError, e:
        raise e
    return skip_update


def create_or_update_micro_app_sa(org, app):
    headers = {"org": str(org), "user": "defaultUser"}
    url = "http://{}/api/v1/micro_app_standalone/report".format(MICRO_APP_SA_ADDR)
    rsp = requests.post(url, json=app, headers=headers)
    rsp.raise_for_status()
    rsp_data = rsp.json().get("data", {})
    print "report app: {} end".format(app["appId"])
    return rsp_data.get("skipUpdate", False)


def import_micro_app_permissions(org, permission_path):
    if not os.path.exists(permission_path):
        return
    headers = {"org": str(org), "user": "defaultUser"}
    url = "http://{}/api/micro_app/v1/permission/import".format(MICRO_APP_ADDR)

    print "permission path is {}, will start import permissions".format(permission_path)
    with open(permission_path) as f:
        p_f_content = f.read()
        permission_list = simplejson.loads(p_f_content)
        body = {"permissionList": permission_list}
        rsp = requests.post(url, json=body, headers=headers)
        rsp.raise_for_status()

def read_union_apps_file(install_app_path):
    union_app_file = os.path.join(install_app_path, "union-apps", "union-apps.json")
    if not os.path.exists(union_app_file):
        return []
    with open(union_app_file, "r") as f:
        return simplejson.load(f)


def report_union_apps(org, install_app_path):
    union_apps = read_union_apps_file(install_path)
    updated_apps = []
    skip_updated_apps = []
    for app in union_apps:
        app_id = app["app_id"]
        version = app["version"]
        if app["use_brick_next_v3"]:
            subdir_snippet = "v3"
        else:
            subdir_snippet = "v2"
        union_app_path = os.path.join(install_app_path, "micro-apps", subdir_snippet, app_id, version)
        print u"report app: {},  current app path: {}".format(app_id, union_app_path)
        app = collect_app_info(union_app_path, app_id, version)
        if app:
            skip_update = report(org, app)
            permission_file_path = os.path.join(union_app_path, "permissions", "permissions.json")
            import_micro_app_permissions(org, permission_file_path)
            if skip_update is False:
                updated_apps.append(app["appId"])
            else:
                skip_updated_apps.append(app["appId"])
    print "report union_apps: updated sa_na: {}, skip updated sa_na: {}".format(",".join(updated_apps), ",".join(skip_updated_apps))
    return updated_apps

def delete_directory(directory_path):
    try:
        shutil.rmtree(directory_path)
        print u"delete directory: {}".format(directory_path)
    except Exception as e:
        print u"error deleting directory: {}, err: {}".format(directory_path, e)

def is_develop_version(standalone_na_path):
    version_file_path = os.path.join(standalone_na_path, "version.ini")
    if not os.path.exists(version_file_path):
        return True
    with open(version_file_path) as f:
        version_content = f.readlines()
        if "0.0.0" in version_content[1]:
            return True
    return False

def uninstall_old_sa_na(standalone_na_list):
    for sa_na_name in standalone_na_list:
        sa_na_path = os.path.join(_INSTALL_BASE_PATH, _APPLICATIONS_SA_FOLDER, sa_na_name+"-standalone-NA")
        if not os.path.exists(sa_na_path):
            print u"old standalone_na dir: {} done not exist".format(sa_na_path)
            continue
        if is_develop_version(sa_na_path):
            print u"standalone_na is developing: skip delete dir: {}".format(sa_na_path)
            continue

        # 删除old standalone na
        delete_directory(sa_na_path)
        # 删除pkg目录： /usr/local/easyops/pkg/conf/xx-standalone-na
        old_sa_na_pkg_path = os.path.join(_INSTALL_BASE_PATH, "pkg", "conf", sa_na_name+"-standalone-NA")
        if os.path.exists(old_sa_na_pkg_path):
            delete_directory(old_sa_na_pkg_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print "Usage: ./report_union_micro_app.py $org $install_path"
        sys.exit(1)
    org = sys.argv[1]
    install_path = sys.argv[2]
    updated_apps = report_union_apps(org, install_path)
    # 卸载老的sa-na
    uninstall_old_sa_na(updated_apps)

