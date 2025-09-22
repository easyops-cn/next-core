#!/usr/bin/env python
# -*- coding: utf-8 -*-

TOOLS_DIR = "/usr/local/easyops/deploy_init/tools"
APP_ID = "brick_next"

import sys
sys.path.append(TOOLS_DIR)


def get_token(user, org):
    """
    通过 app_id 从配置中获取 client_id 和 secret, 然后调用 get_token_util.get_token

    参数: (user: 用户名, org: 组织名)
    返回: token 或空字符串(当认证功能关闭时)
    异常: 当认证功能启用但相关工具或配置缺失时抛出异常
    """

    # 尝试导入 deploy_init config_reader
    try:
        from config_reader import get_config_value
    except ImportError:
        return ""

    try:
        enable = get_config_value("deploy_init", "common", "check_auth_token.enable")
        if str(enable).lower() != "true":
            return ""
    except KeyError:
        return ""
    except Exception as e:
        raise Exception("get_token: failed to read check_auth_token.enable: %s" % str(e))

    # 尝试导入 deploy_init get_token_util
    try:
        import get_token_util
    except ImportError:
        # 开关打开的情况下，如果没有找到 get_token_util 模块，则抛出异常
        raise Exception("get_token: check_auth_token is enabled, but deploy_init get_token_util module not found!")

    try:
        client_id = get_config_value(APP_ID, "application", "client_id")
        secret = get_config_value(APP_ID, "application", "secret")
    except KeyError as ke:
        raise Exception("get_token: required key missing in appId [%s]: %s" % (APP_ID, str(ke)))
    except Exception as e:
        raise Exception("get_token: failed to read clientId or secret for appId [%s]: %s" % (APP_ID, str(e)))

    return get_token_util.get_token(user, org, client_id, secret)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: python custom_get_token_util.py <user> <org>\n")
        sys.exit(1)

    user = sys.argv[1]
    org = sys.argv[2]

    token = get_token(user, org)
    print(token)


