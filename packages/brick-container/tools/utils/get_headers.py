# -*- coding: utf-8 -*-

from custom_get_token_util import get_token

DEFAULT_USER = "defaultUser"


def get_headers(org, user=DEFAULT_USER):
    headers = {"org": str(org), "user": user}
    token = get_token(user=user, org=int(org))
    if not token:
        return headers

    headers["Authorization"] = "Bearer {}".format(token)
    return headers
