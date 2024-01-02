#!/bin/bash

# easyops 安装根目录
install_base="/usr/local/easyops"

plugin_name='brick_next_v3'

install_path="${install_base}/${plugin_name}"

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
  associated_service=("logic.micro_app_service" "logic.user_service" "logic.artifact")
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
  if [[ -f ${install_base}/brick_next_v3/packages/brick-container/tools/report_installed_brick_next_package.py ]];then
      ${install_base}/python/bin/python ${install_base}/brick_next_v3/packages/brick-container/tools/report_installed_brick_next_package.py ${org} ${install_path}
      if [[ $? -ne 0 ]]; then
          echo "report brick next error"
          exit 1
      fi
  fi
}

# 优先取环境变量里面的org
if [[ ${org}X == X ]]; then
    org=$(/usr/local/easyops/deploy_init/tools/get_env.py common org)
    [[ $? -ne 0 ]] && echo "get org error, exit" && exit 1
fi

# 上报当前安装小产品
check_service
report_package ${install_base} ${org} ${install_path}

exit 0

