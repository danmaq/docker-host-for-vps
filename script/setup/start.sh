#!/bin/sh

cd $(cd $(dirname $0); pwd)

ansible-playbook -i ./hosts ./site.yml