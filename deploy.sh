#!/usr/bin/env bash

KEY="/home/yann/.ssh/school"
WEB_01_IP="18.170.217.131"
WEB_02_IP="18.132.98.220"

for IP in "$WEB_01_IP" "$WEB_02_IP"; do
    echo "---Deploying to the $IP---"

    scp -i "$KEY" -o StrictHostKeyChecking=no \
    web/index.html web/style.css web/app.js "ubuntu@$IP:~/"

    ssh -i "$KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
    "sudo cp ~/index.html ~/style.css ~/app.js /var/www/html && curl -sI localhost | head -n 1"
done

echo "Done. Test with: curl -I http://18.169.184.99"
