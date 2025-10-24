# -*- coding: utf-8 -*-
import json as simplejson
import sys
import os
import ens_api
import requests
import simplejson

reload(sys)
sys.setdefaultencoding("utf-8")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))  # 将 tools 目录加入 path
from utils.get_headers import get_headers

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

def get_entry_html(install_path, version):
    # entry_html_path
    entry_html_path = os.path.join(install_path, "versions", version, "webroot/index.html")
    if not os.path.exists(entry_html_path):
        return ""
    with open(entry_html_path) as f:
        return f.read()

def collect(install_path, report_app_id, version, set_active_version):
    if not os.path.exists(install_path):
        raise Exception("could not find install path {}".format(install_path))
    webroot_dir = os.path.join(install_path, "versions", version, "webroot/-")
    if not os.path.exists(webroot_dir):
        raise Exception("could not find webroot path {}".format(webroot_dir))
    bootstrap_file_name = ""
    for f in os.listdir(webroot_dir):
        if f.startswith("bootstrap.") and f.endswith(".json"):
            bootstrap_file_name = f
    if bootstrap_file_name is "" :
        raise Exception("bootstrap.***.json not found in dir {}".format(webroot_dir))
    bootstrap_file = os.path.join(webroot_dir, bootstrap_file_name)
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
                    "entryHtml": get_entry_html(install_path, version),
                    "setActiveVersion": bool(set_active_version),
                    "meta": simplejson.dumps(story_board["meta"], ensure_ascii=False),
                    "defaultConfig": story_board["app"].get("defaultConfig"),
                    "defaultContainer": story_board["app"].get("defaultContainer"),
                    "icons": story_board["app"].get("icons", {}),
                    "menuIcon": story_board["app"].get("menuIcon", {}),
                    "locales": story_board["app"].get("locales", {}),
                    "usePublicDependencies": story_board["app"].get("usePublicDependencies"),
                    "description": story_board["app"].get("description"),
                    "author": story_board["app"].get("author"),
                    "unionAppInfo": get_union_app_info(story_board["app"].get("unionApps", [])),  #单na上报脚本不能记录union_app_id信息， 只记录relatedResourcePackages
                }
                print u"report app: {}, version: {}, related_resource_packages: {}".format(report_app_id, version, app["unionAppInfo"].get("relatedResourcePackages", []))
                return app

def get_union_app_info(union_app_info):
    if len(union_app_info) == 0:
        return {} 
    # 单na上报， 只要unionApps.relatedResourcePackages字段
    return {
        "relatedResourcePackages": union_app_info[0].get("relatedResourcePackages", [])
    }

def report(org, app):
    try:
        create_or_update_micro_app_sa(org, app)
    except NameServiceError, e:
        raise e
    except requests.HTTPError, e:
        raise e

def create_or_update_micro_app_sa(org, app):
    headers = get_headers(org)
    url = "http://{}/api/v1/micro_app_standalone/report".format(MICRO_APP_SA_ADDR)
    rsp = requests.post(url, json=app, headers=headers)
    rsp.raise_for_status()
    print "report app end"

def import_micro_app_permissions(install_path, version, org):
    permission_path = os.path.join(install_path, "versions", version, "webroot", "permissions", "permissions.json")
    if not os.path.exists(permission_path):
        return

    headers = get_headers(org)
    url = "http://{}/api/micro_app/v1/permission/import".format(MICRO_APP_ADDR)

    with open(permission_path) as f:
        p_f_content = f.read()
        permission_list = simplejson.loads(p_f_content)
        body = {"permissionList": permission_list}
        rsp = requests.post(url, json=body, headers=headers)
        rsp.raise_for_status()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print "Usage: ./report_installed_micro_app_sa.py $org $install_path $version $set_active_version"
        sys.exit(1)
    org = sys.argv[1]
    install_path = sys.argv[2]
    report_app_id = sys.argv[3]
    version = sys.argv[4]
    set_active_version = sys.argv[5]
    app = collect(install_path, report_app_id, version, set_active_version)
    if app:
        usePublicDependenciesFlag = app.get("usePublicDependencies")
        unionTags = app.get("unionTags")
        if not usePublicDependenciesFlag and unionTags:
            print "union package must use common dependencies, please modify the config[usePublicDependencies] or config[unionTags]"
            sys.exit(1)
        report(org, app)
        import_micro_app_permissions(install_path, version, org)
