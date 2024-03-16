# -*- coding: utf-8 -*-
import json
import os
import traceback

import yaml
import sys
import errno
import shutil

reload(sys)
sys.setdefaultencoding('utf-8')

# 公共文件夹名
_APPLICATIONS_SA_FOLDER = "applications_sa"
_BRICKS_FOLDER = "bricks"
_TEMPLATES_FOLDER = "templates"
_CORE_FOLDER = "core"
_BRICK_NEXT_FOLDER = "brick_next"
_MICRO_APPS_FOLDER = "micro-apps"

# 公共路径
_INSTALL_BASE_PATH = "/usr/local/easyops"
_DEPENDENCIES_LOCK_BASE_PATH = os.path.join(
    _INSTALL_BASE_PATH, _APPLICATIONS_SA_FOLDER, "dependencies_lock")


def init_dependencies_lock_dir():
    # 初始化 /usr/local/easyops/applications_sa/dependencies_lock
    if not os.path.exists(_DEPENDENCIES_LOCK_BASE_PATH):
        try:
            os.makedirs(_DEPENDENCIES_LOCK_BASE_PATH)
        except OSError, e:
            if e.errno != errno.EEXIST:
                raise
            print u"dependencies lock dir: {} already exist".format(_DEPENDENCIES_LOCK_BASE_PATH)

    # 初始化子目录 bricks、templates、core、micro_apps
    bricks_path = os.path.join(_DEPENDENCIES_LOCK_BASE_PATH, _BRICKS_FOLDER)
    templates_path = os.path.join(
        _DEPENDENCIES_LOCK_BASE_PATH, _TEMPLATES_FOLDER)

    core_path = os.path.join(_DEPENDENCIES_LOCK_BASE_PATH, _CORE_FOLDER)
    micro_apps_path = os.path.join(
        _DEPENDENCIES_LOCK_BASE_PATH, _MICRO_APPS_FOLDER)

    paths = [bricks_path, templates_path, core_path, micro_apps_path]
    for path in paths:
        if os.path.exists(path):
            continue
        try:
            os.mkdir(path)
        except OSError, e:
            if e.errno != errno.EEXIST:
                raise
            print u"dependencies lock dir: {} already exist".format(path)
            continue
        print u"mkdir dependencies lock dir: {}".format(path)


def parse_plugin_name(plugin_name):
    dependencies_lock_root_folder = ""
    un_suffix_name = ""
    if plugin_name.endswith("-NB"):
        dependencies_lock_root_folder = _BRICKS_FOLDER
        un_suffix_name = plugin_name.rstrip("-NB")
    elif plugin_name.endswith("-NT"):
        dependencies_lock_root_folder = _TEMPLATES_FOLDER
        un_suffix_name = plugin_name.rstrip("-NT")

    elif plugin_name == _BRICK_NEXT_FOLDER:  # # brick_next -> core
        dependencies_lock_root_folder = _CORE_FOLDER
        # un_suffix_name = bricks_next_folder
    # TODO: 其他

    if un_suffix_name == "":
        un_suffix_name = plugin_name
    return un_suffix_name, dependencies_lock_root_folder


def build_dependencies_path_tree(dependencies):
    dep_map = {}
    for dependency in dependencies:  # type: dict
        name = dependency.get("name", "")
        actual_version = dependency.get("actual_version", "")
        if name == "" or actual_version == "":
            continue
        if name in dep_map:
            continue

        # 原路径 公共路径

        un_suffix_name, dependency_type = parse_plugin_name(name)
        if dependency_type == "":
            dependency_type = name

        # /usr/local/easyops/applications_sa/dependencies_lock  templates   general-list    1.30.0
        link_path_base = os.path.join(
            _DEPENDENCIES_LOCK_BASE_PATH, dependency_type, un_suffix_name, actual_version)
        if un_suffix_name == _BRICK_NEXT_FOLDER:
            link_path_base = os.path.join(
                _DEPENDENCIES_LOCK_BASE_PATH, dependency_type, actual_version)

        dependency = {}
        # 直接在这里记录路径
        # templates
        dependency["dependency_type"] = dependency_type
        # /usr/local/easyops/applications_sa/dependencies_lock/templates/general-list/1.30.0
        dependency["link_path_base"] = link_path_base
        # general-list
        dependency["un_suffix_name"] = un_suffix_name
        dep_map[name] = dependency

    print "\n\n"

    return dep_map


def read_dependencies_yaml(install_app_path):
    dependencies_yaml_path = os.path.join(
        install_app_path, "dependencies", "micro_app_dependencies.yaml")
    print u"dependencies_yaml_path: {}".format(dependencies_yaml_path)
    dependencies_fp = open(dependencies_yaml_path, "r")
    data = yaml.load(dependencies_fp)
    if not isinstance(data, dict):
        raise u"micro_app_dependencies.yaml fmt error: {}".format(data)
    return data.get("dependencies_lock", [])


def get_static_file_map(path):
    file_map = {}
    for root, _, files in os.walk(path, topdown=False):
        if root not in file_map:
            file_map[root] = []
        if len(files) == 0:
            continue
        for filename in files:
            file_path = os.path.join(root, filename)
            if os.path.islink(file_path):
                continue
            file_map[root].append(filename)

    return file_map


def read_union_apps_file(install_app_path):
    union_app_file = os.path.join(install_app_path, "union-apps", "union-apps.json")
    if not os.path.exists(union_app_file):
        return []
    with open(union_app_file, "r") as f:
        return json.load(f)


def link_install_app_static_file(install_app_path):
    # 读取union-apps.json文件
    union_apps = read_union_apps_file(install_app_path)
    for app in union_apps:
        app_id = app["app_id"]
        version = app["version"]
        if app["use_brick_next_v3"]:
            subdir_snippet = "v3"
        else:
            subdir_snippet = "v2"
        current_app_path = os.path.join(install_app_path, _MICRO_APPS_FOLDER, subdir_snippet, app_id, version)
        if not os.path.exists(current_app_path):
            print u"current app path: {} not exist".format(current_app_path)
            continue
        current_app_path_public = os.path.join(_DEPENDENCIES_LOCK_BASE_PATH, _MICRO_APPS_FOLDER,
                                               subdir_snippet, app_id, version)
        
        # 联合打包中， micro-app会重复被打进包里(先删除文件, 保证目录文件是最新的数据)
        if os.path.exists(current_app_path_public):
            shutil.rmtree(current_app_path_public)
            print u"delete old micr-app dir: {}".format(current_app_path_public)
        os.makedirs(current_app_path_public)

        print u"current app path: {}, current_app_path_public: {}".format(current_app_path, current_app_path_public)

        static_file_map = get_static_file_map(current_app_path)
        print u"---------------------------------------------"
        for file_path_base, files in static_file_map.items():
            _link_static_file(files, file_path_base,current_app_path, current_app_path_public)

    print u"---------------------------------------------"
    print u"\n\n"


# 硬链
def link_dependency_static_file(install_app_path):
    dependency_apps = read_dependencies_yaml(install_app_path)
    # 依赖的路径树
    dependencies_path_tree = build_dependencies_path_tree(
        dependency_apps)  # type: dict
    # 区分版本
    for dependency_name, dependency_info in dependencies_path_tree.items():
        dependency_type = dependency_info["dependency_type"]
        un_suffix_name = dependency_info["un_suffix_name"]

        # /usr/local/easyops/applications_sa/dependencies_lock/templates/general-list/1.30.0
        dependency_dir_public = dependency_info["link_path_base"]
        # /usr/local/easyops/applications_sa/easy-agile-standalone-NA/templates/general-list
        dependency_dir_inside_base = os.path.join(install_app_path, dependency_type, un_suffix_name)

        try:
            static_file_map = get_static_file_map(dependency_dir_inside_base)
            for file_path_base, files in static_file_map.items():
                _link_static_file(files, file_path_base, dependency_dir_inside_base, dependency_dir_public)
        except Exception as e:
            raise RuntimeError("link file err: {}...".format(e))


def _link_static_file(files, file_path_base, dependency_dir_inside_base, dependency_dir_public):
    for filename in files:
        file_path = os.path.join(file_path_base, filename)
        file_path_backup = file_path + ".back"

        link_file_path = file_path.replace(
            dependency_dir_inside_base, dependency_dir_public)
        link_file_path_base = link_file_path.replace(filename, "")

        try:
            if not os.path.exists(link_file_path_base):
                os.makedirs(link_file_path_base)
            # 先备份文件
            os.rename(file_path, file_path_backup)

            # 如果文件不存在则移动文件
            if not os.path.exists(link_file_path):
                os.rename(file_path_backup, link_file_path)

            # 创建硬链接
            os.link(link_file_path, file_path)

        except Exception as e:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_exception(exc_type, exc_value, exc_traceback)
            if os.path.exists(file_path_backup):
                if os.path.exists(file_path):
                    os.remove(file_path)
                os.rename(file_path_backup, file_path)
        finally:
            # 确保被删除
            if os.path.exists(file_path_backup):
                os.remove(file_path_backup)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print u"Usage: ./link_union_app_static_file.py $install_path"
        sys.exit(1)
    install_path = sys.argv[1]

    # must init
    init_dependencies_lock_dir()

    # 硬链当前APP
    link_install_app_static_file(install_path)

    # 硬链依赖APP
    link_dependency_static_file(install_path)
