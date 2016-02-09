#!/bin/bash

mkdir -p /data/nommelumepark/code
cd /data/nommelumepark/code

git clone https://github.com/argoroots/nommelumepark.git ./
git checkout master
git pull
