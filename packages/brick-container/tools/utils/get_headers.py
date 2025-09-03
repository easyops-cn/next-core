# -*- coding: utf-8 -*-

import sys
import os

TOOLS_DIR = "/usr/local/easyops/deploy_init/tools"
sys.path.append(TOOLS_DIR)
get_token = None
token_util_path = os.path.join(TOOLS_DIR, "get_token_util.py")
if os.path.exists(token_util_path):
    from get_token_util import get_token

APP_ID = "brick_next_v3"
DEFAULT_USER = "defaultUser"


def get_headers(org, user=DEFAULT_USER):
    headers = {"org": str(org), "user": user}
    if get_token is None:
        return headers

    token = get_token(user=user, org=int(org), app_id=APP_ID)
    if not token:
        return headers

    headers["Authorization"] = "Bearer {}".format(token)
    return headers
