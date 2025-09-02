#!/bin/bash

# easyops 安装根目录
install_base="/usr/local/easyops"

plugin_name='brick_next_v3'

install_path="${install_base}/${plugin_name}"

deploy_init_path="/usr/local/easyops/deploy_init"
config_tool="${deploy_init_path}/tools/config_tool"

export LD_LIBRARY_PATH=/usr/local/easyops/ens_client/sdk:${LD_LIBRARY_PATH}


value=$(${config_tool} get --appID "deploy_init" --namespaceName "common" --key "check_auth_token.enable")
if [[ ${value} == "true" ]]; then
    # 初始化默认命名空间，并生成 clientId 和 secret
    ${config_tool} init -f "${install_path}/conf/config.yaml"
    if [[ $? -ne 0 ]];then
       echo "init brick_next_v3 config namespace error, exit"
       exit 1
    fi
fi


