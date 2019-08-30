#!/bin/bash

# easyops 安装根目录
install_base="/usr/local/easyops"

install_path_dir='$install-path-dir$'
scope_name='$scope-name$'
plugin_name='$package-name$'
suffix='$suffix-name$'

install_path="${install_base}/${install_path_dir}/${plugin_name}-${suffix}"

# 构件目录
plugins_dir="${install_base}/brick_next/${scope_name}"

# 删除上一个版本
rm -rf "${plugins_dir:?}/${plugin_name}"

# 确保存在插件目录
mkdir -p "${plugins_dir}"
# 这边转换插件的名字，不用 -NB 后缀
ln -snf "${install_path}" "${plugins_dir}/${plugin_name}"

# 上报当前安装小产品
if [[ ${suffix} == "NA" ]]; then
    org=$(/usr/local/easyops/deploy_init/tools/get_env.py common org)
    if [[ $? -ne 0 ]]; then
        echo "get org error"
        exit 1
    fi

    ${install_base}/python/bin/python ${install_base}/brick_next/packages/brick-container/tools/report_installed_micro_app.py ${org} ${install_path}
    if [[ $? -ne 0 ]]; then
        echo "report installed micro app error"
        exit 1
    fi
fi

exit 0

