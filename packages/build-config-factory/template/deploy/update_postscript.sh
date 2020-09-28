#!/bin/bash

# 为保证一致，直接用 install_postscript.sh
bash ./deploy/install_postscript.sh
[[ $? -ne 0 ]] && echo "install postscript error, exit" && exit 1

exit 0
