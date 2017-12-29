#!/bin/sh

cd $(cd $(dirname $0); pwd)
ls -l
cat kujirax.json
ansible-playbook