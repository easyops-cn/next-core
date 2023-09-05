
# -*- coding: utf-8 -*-
import logging
import os
import sys

import ens_api
import requests
import simplejson
import tarfile

from copy import deepcopy

logger = logging.getLogger("report_installed_brick_next_package")
logging.basicConfig(level=logging.DEBUG,
                    filename="./report_installed_brick_next_package.log")


# 1. 获取到当前的需要处理的包处理到包名
# 2. 拿到包下面的三个文件 bricks.json stories.json contracts.json
# 3. 读取三个文件的内容
# 4. 调用接口，发送文件内容
class NameServiceError(Exception):
    pass


def get_snippets_from_stories(stories_content):
    ret_snippets = []
    for story in stories_content:
        story_category = story.get("category", "other")
        story_conf = story.get("conf")  # 获取示例数据
        if isinstance(story_conf, list) and len(story_conf) > 0:
            for conf in story_conf:
                if conf.get("snippetId"):  # 有snippetId的示例，需要上报到snippet
                    snippet_tmp = deepcopy(conf)
                    snippet_tmp["id"] = snippet_tmp["snippetId"]
                    del snippet_tmp["snippetId"]
                    snippet_tmp["category"] = story_category
                    if "title" in snippet_tmp:
                        snippet_tmp["text"] = snippet_tmp["title"]
                        del snippet_tmp["title"]
                    if "description" in snippet_tmp:
                        snippet_tmp["description"] = snippet_tmp["message"]
                        del snippet_tmp["message"]
                    ret_snippets.append(snippet_tmp)
    return ret_snippets


def get_v3_story(br):
    story_id = br.get("name", "")
    if not story_id:
        return
    story = { "storyId": story_id, "v3Brick": True, "type": "brick" }
    desc = br.get("description")
    if type(desc) != dict:
        desc = {"en": desc, "zh": desc}
    story["description"] = desc

    text = br.get("text")
    if not text:
        text = desc
    story["text"] = text

    story["category"] = br.get("category", "other")
    story["alias"] = br.get("alias", [])
    story["icon"] = br.get("icon")

    doc = br.get("doc", {})
    properties = br.get("properties")
    events = br.get("events")
    slots = br.get("slots")
    methods = br.get("methods")
    parts = br.get("parts")
    if "id" not in doc:
        doc["id"] = story_id
    if "name" not in doc:
        doc["name"] = story_id
    if "docKink" not in doc:
        doc["docKink"] = "brick"
    if "description" not in doc:
        doc["description"] = desc
    if "properties" not in doc:
        doc["properties"] = properties
    if "events" not in doc:
        doc["events"] = events
    if "methods" not in doc:
        doc["methods"] = methods
    if "parts" not in doc:
        doc["parts"] = parts
    if "slots" not in doc:
        doc["slots"] = slots
    # TODO: interface in doc
    story["doc"] = doc

    # TODO: conf

    return story


def collect_stories(install_path):
    stories_path = os.path.join(install_path, "dist", "stories.json")
    manifest_path = os.path.join(install_path, "dist", "manifest.json")
    # v2 brick
    if os.path.exists(stories_path):
        with open(stories_path) as stories_file:
            stories_content = simplejson.load(stories_file)
            return stories_content
    # v3 brick
    elif os.path.exists(manifest_path):
        with open(manifest_path) as manifest_file:
            manifest_content = simplejson.load(manifest_file)
            stories_content = []
            for br in manifest_content.get("bricks", []):
                story = get_v3_story(br)
                if story:
                    stories_content.append(story)
            return stories_content
    return []


def collect(install_path):
    if not os.path.exists(install_path):
        raise Exception("could not find install path {}".format(install_path))
    if not os.path.isdir(install_path):
        raise Exception("install_path must be a dir {}".format(install_path))
    package_name = os.path.basename(install_path)
    logger.info("install_path %s packageName %s", install_path, package_name)
    bricks_path = os.path.join(install_path, "dist", "bricks.json")
    if not os.path.exists(bricks_path):
        raise Exception(
            "could not find bricks.json path {}".format(bricks_path))
    stories_path = os.path.join(install_path, "dist", "stories.json")
    with open(bricks_path) as bricks_file:
        bricks_content = simplejson.load(bricks_file)
    stories_content = collect_stories(install_path)
    snippets_from_stories = get_snippets_from_stories(stories_content)
    snippets_path = os.path.join(install_path, "dist", "snippets.json")
    snippets_content = {"snippets": []}
    if os.path.exists(snippets_path):
        with open(snippets_path) as snippets_file:
            snippets_content = simplejson.load(snippets_file)
    snippets_content["snippets"].extend(snippets_from_stories)
    contract_path = os.path.join(install_path, "dist", "contracts.json")
    contract_content = {}
    if os.path.exists(contract_path):
        with open(contract_path) as contract_file:
            contract_content = simplejson.load(contract_file)
    return package_name, bricks_content, stories_content, snippets_content, contract_content


def report_bricks_atom(org, nb_targz_path, package_name, package_version, bricks_content, stories_content,
                       snippets_content):
    session_id, ip, port = ens_api.get_service_by_name(
        "web.brick_next", "logic.micro_app_service")
    if session_id <= 0:
        raise NameServiceError(
            "get nameservice logic.micro_app_service error, session_id={}".format(session_id))
    address = "{}:{}".format(ip, port)
    headers = {"org": str(org), "user": "defaultUser"}
    # report atom
    atom_url = "http://{}/api/v1/brick/atom/import".format(address)
    data_dict = {"stories": stories_content, "bricks": bricks_content}
    data_str = simplejson.dumps(data_dict)
    data = {"packageName": package_name,
            "packageVersion": package_version, "data": data_str}
    rsp = requests.post(atom_url, data=data, headers=headers, files={
                        "file": open(nb_targz_path, "rb")})
    rsp.raise_for_status()
    # report snippet
    snippet_url = "http://{}/api/v1/brick/snippet/import".format(address)
    snippet_param = {"packageName": package_name, "snippets": snippets_content}
    rsp = requests.post(snippet_url, json=snippet_param, headers=headers)
    rsp.raise_for_status()


def report_brick_next_package(org, brick_targz_path, package_name, package_version):
    # report brick_next or NT
    session_id, ip, port = ens_api.get_service_by_name(
        "web.brick_next", "logic.micro_app_service")
    if session_id <= 0:
        raise NameServiceError(
            "get nameservice logic.micro_app_service error, session_id={}".format(session_id))
    address = "{}:{}".format(ip, port)
    headers = {"org": str(org), "user": "defaultUser"}
    # report atom
    atom_url = "http://{}/api/v1/brick_next/report".format(address)
    data = {"packageName": package_name, "packageVersion": package_version}
    rsp = requests.post(atom_url, data=data, headers=headers, files={
                        "file": open(brick_targz_path, "rb")})
    rsp.raise_for_status()


def report_provider_into_contract(org, package_name, contract_content):
    session_id, ip, port = ens_api.get_service_by_name(
        "web.brick_next", "logic.micro_app_service")
    if session_id <= 0:
        raise NameServiceError(
            "get nameservice logic.micro_app_service error, session_id={}".format(session_id))
    address = "{}:{}".format(ip, port)
    headers = {"org": str(org), "user": "defaultUser"}
    # report contract
    url = "http://{}/api/v1/brick/provider/import_into_contract".format(
        address)
    param = {"packageName": package_name, "data": {
        "contractInfo": contract_content}}
    rsp = requests.post(url, json=param, headers=headers)
    rsp.raise_for_status()


def mk_nb_tar_gz(output_filename, source_dir):
    try:
        tar = tarfile.open(output_filename, "w:gz")
        for root, dirs, files in os.walk(source_dir):
            root_ = os.path.relpath(root, start=source_dir)
            for file in files:
                if not file.endswith(".log"):
                    file_path = os.path.join(root, file)
                    tar.add(file_path, arcname=os.path.join(root_, file))
        tar.close()
        return True
    except Exception as e:
        logger.error(e)
        return False


def remove_tar_gz_file(nb_targz_path):
    os.remove(nb_targz_path)


def report_brick_next(org, install_path):
    # 读取版本信息
    version_file = os.path.join(install_path, "version.ini")
    with open(version_file, "r") as f:
        lines = f.readlines()
        package_version = str.strip(lines[1])
    targz_name = "brick_next.tar.gz"
    brick_targz_path = os.path.join(install_path, targz_name)
    if not mk_nb_tar_gz(brick_targz_path, install_path):
        logger.error("mkdir brick_next.tar.gz err")
        sys.exit(1)
    package_name = "brick_next"
    report_brick_next_package(org, brick_targz_path, package_name, package_version)
    remove_tar_gz_file(brick_targz_path)


def report_nb(org, install_path):
    # 读取版本信息
    version_file = os.path.join(install_path, "version.ini")
    with open(version_file, "r") as f:
        lines = f.readlines()
        package_version = str.strip(lines[1])

    package_name, bricks_content, stories_content, snippets_content, contract_content = collect(
        install_path)
    if package_name and bricks_content and snippets_content:
        targz_name = package_name + ".tar.gz"
        nb_targz_path = os.path.join(install_path, targz_name)
        if not mk_nb_tar_gz(nb_targz_path, install_path):
            logger.error("mkdir tar.gz of nb err")
            sys.exit(1)
        report_bricks_atom(org, nb_targz_path, package_name, package_version, bricks_content, stories_content,
                           snippets_content)
        remove_tar_gz_file(nb_targz_path)
    if contract_content:
        report_provider_into_contract(org, package_name, contract_content)

def report_nt(org, install_path):
    # 读取版本信息
    version_file = os.path.join(install_path, "version.ini")
    with open(version_file, "r") as f:
        lines = f.readlines()
        package_version = str.strip(lines[1])

    package_name = os.path.basename(install_path)
    if package_name:
        targz_name = package_name + ".tar.gz"
        nt_targz_path = os.path.join(install_path, targz_name)
        if not mk_nb_tar_gz(nt_targz_path, install_path):
            logger.error("mkdir tar.gz of nt err")
            sys.exit(1)
        report_brick_next_package(org, nt_targz_path, package_name, package_version)
        remove_tar_gz_file(nt_targz_path)



if __name__ == "__main__":
    # 兼容老nb包install_postscript.sh调用report_installed_brick_next_package仅传入包路径
    if len(sys.argv) == 2:
        sys.exit(0)

    if len(sys.argv) != 3:
        print("Usage: ./report_installed_brick_next_package.py $org $install_path")
        sys.exit(1)

    org = sys.argv[1]
    install_path = sys.argv[2]

    if install_path.endswith(os.sep):
        install_path = install_path[:-1]

    if install_path.endswith("brick_next"):
        report_brick_next(org, install_path)
    elif install_path.endswith("-NB"):
        report_nb(org, install_path)
    elif install_path.endswith("-NT"):
        report_nt(org, install_path)
    else:
        sys.exit(0)

