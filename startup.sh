#!/bin/bash
export LOTUS_TOKEN="$(cat ~/.lotus/token)"
echo $LOTUS_TOKEN
eval "node index.js &> ~/qab.log &"
eval "disown -r"
eval "tail -f ~/qab.log"

