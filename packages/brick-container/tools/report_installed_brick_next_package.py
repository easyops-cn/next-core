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
logging.basicConfig(level=logging.DEBUG, filename="./report_installed_brick_next_package.log")


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


def collect(install_path):
  if not os.path.exists(install_path):
    raise Exception("could not find install path {}".format(install_path))
  if not os.path.isdir(install_path):
    raise Exception("install_path must be a dir {}".format(install_path))
  package_name = os.path.basename(install_path)
  logger.info("install_path %s packageName %s", install_path, package_name)
  bricks_path = os.path.join(install_path, "dist", "bricks.json")
  if not os.path.exists(bricks_path):
    raise Exception("could not find bricks.json path {}".format(bricks_path))
  stories_path = os.path.join(install_path, "dist", "stories.json")
  with open(bricks_path) as bricks_file:
    bricks_content = simplejson.load(bricks_file)
  stories_content = []
  if os.path.exists(stories_path):
    with open(stories_path) as stories_file:
      stories_content = simplejson.load(stories_file)
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


def report_bricks_atom(org, nb_targz_path, package_name, package_version, bricks_content, stories_content, snippets_content):
  session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.micro_app_service")
  if session_id <= 0:
    raise NameServiceError("get nameservice logic.micro_app_service error, session_id={}".format(session_id))
  address = "{}:{}".format(ip, port)
  headers = {"org": str(org), "user": "defaultUser"}
  # report atom
  atom_url = "http://{}/api/v1/brick/atom/import".format(address)
  data_dict = {"stories": stories_content, "bricks": bricks_content}
  data_str = simplejson.dumps(data_dict)
  data = {"packageName": package_name, "packageVersion": package_version, "data": data_str}
  rsp = requests.post(atom_url, data=data, headers=headers, files={"file": open(nb_targz_path, "rb")})
  rsp.raise_for_status()
  # report snippet
  snippet_url = "http://{}/api/v1/brick/snippet/import".format(address)
  snippet_param = {"packageName": package_name, "snippets": snippets_content}
  rsp = requests.post(snippet_url, json=snippet_param, headers=headers)
  rsp.raise_for_status()


def report_provider_into_contract(org, package_name, contract_content):
  session_id, ip, port = ens_api.get_service_by_name("web.brick_next", "logic.micro_app_service")
  if session_id <= 0:
    raise NameServiceError("get nameservice logic.micro_app_service error, session_id={}".format(session_id))
  address = "{}:{}".format(ip, port)
  headers = {"org": str(org), "user": "defaultUser"}
  # report contract
  url = "http://{}/api/v1/brick/provider/import_into_contract".format(address)
  param = {"packageName": package_name, "data": {"contractInfo": contract_content}}
  rsp = requests.post(url, json=param, headers=headers)
  rsp.raise_for_status()

def mk_nb_tar_gz(output_filename, source_dir):
  try:
    with tarfile.open(output_filename, "w:gz") as tar:
      tar.add(source_dir, arcname=os.path.basename(source_dir))
    return True
  except Exception as e:
    logger.info(e)
    return False


def remove_tar_gz_file(nb_targz_path):
  os.remove(nb_targz_path)


if __name__ == "__main__":
  # 兼容老nb包install_postscript.sh调用report_installed_brick_next_package仅传入包路径
  if len(sys.argv) == 2:
    sys.exit(0)

  if len(sys.argv) != 4:
    print("Usage: ./report_installed_brick_next_package.py $org $install_path $version")
    sys.exit(1)

  org = sys.argv[1]
  install_path = sys.argv[2]
  package_version = sys.argv[3]

  if install_path.endswith(os.sep):
    install_path = install_path[:-1]

  if not install_path.endswith("-NB"):
    sys.exit(0)

  package_name, bricks_content, stories_content, snippets_content, contract_content = collect(install_path)
  if package_name and bricks_content and snippets_content:
    targz_name = package_name + ".tar.gz"
    nb_targz_path = os.path.join(os.path.dirname(install_path), targz_name)
    if not mk_nb_tar_gz(nb_targz_path, install_path):
      logger.error("mkdir tar.gz of nb err")
      sys.exit(1)
    report_bricks_atom(org, nb_targz_path, package_name, package_version, bricks_content, stories_content,
                       snippets_content)
    remove_tar_gz_file(nb_targz_path)
  if contract_content:
    report_provider_into_contract(org, package_name, contract_content)
