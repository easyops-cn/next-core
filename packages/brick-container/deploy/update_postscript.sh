#!/bin/bash

# easyops 安装根目录
install_base="/usr/local/easyops"

plugin_name='brick_next'

install_path="${install_base}/${plugin_name}"

deploy_init_path="/usr/local/easyops/deploy_init"
config_tool="${deploy_init_path}/tools/config_tool"


function check_service_availability() {
  services=$1
  for service in ${services[*]}; do
    ret=`${install_base}/python/bin/python ${install_base}/ens_client/tools/get_all_service.py ${service}`
    arr=($ret)
    if [[ ${arr[0]} -lt 0 ]]; then
        echo "service ${service} not ready"
        return 1
    fi
  done
}

function check_service() {
  associated_service=("logic.micro_app_service" "logic.micro_app_standalone_service" "logic.user_service" "logic.artifact")
  check_service_availability "${associated_service[*]}"
  if [[ `echo $?` -eq 1 ]]; then
      sleep 15
      check_service_availability "${associated_service[*]}"
      if [[ `echo $?` -eq 1 ]]; then
          echo "some service not ready, and retry fail, exit"
          exit 1
      fi
  fi
}

function report_package() {
  install_base=$1
  org=$2
  install_path=$3
  if [[ -f ${install_base}/brick_next/packages/brick-container/tools/report_installed_brick_next_package.py ]];then
      ${install_base}/python/bin/python ${install_base}/brick_next/packages/brick-container/tools/report_installed_brick_next_package.py ${org} ${install_path}
      if [[ $? -ne 0 ]]; then
          echo "report brick next error"
          exit 1
      fi
  fi
}

export LD_LIBRARY_PATH=/usr/local/easyops/ens_client/sdk:${LD_LIBRARY_PATH}

# 优先取环境变量里面的org
if [[ ${org}X == X ]]; then
    org=$(/usr/local/easyops/deploy_init/tools/get_env.py common org)
    [[ $? -ne 0 ]] && echo "get org error, exit" && exit 1
fi


value=$(${config_tool} get --appID "deploy_init" --namespaceName "common" --key "check_auth_token.enable")
if [[ ${value} == "true" ]]; then
    # 初始化默认命名空间，并生成 clientId 和 secret
    ${config_tool} init -f "${install_path}/conf/config.yaml"
    if [[ $? -ne 0 ]];then
       echo "import brick_next_v3 config namespace error, exit"
       exit 1
    fi
fi


# 上报当前安装小产品
check_service
report_package ${install_base} ${org} ${install_path}

exit 0

