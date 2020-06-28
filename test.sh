ip="192.168.100.162 192.168.100.210"

array=(${ip//\n/});  for i in "${!array[@]}"; do sshpass -p 'dev@easyops' ssh -o StrictHostKeyChecking=no root@${ip} "nohup bash /home/easyops/update-storyboard.sh > /home/easyops/result.log &"; done;

    - sshpass -p 'dev@easyops' ssh -o StrictHostKeyChecking=no root@${ip} "nohup bash
      /home/easyops/update-storyboard.sh > /home/easyops/result.log &"
