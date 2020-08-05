#!/bin/bash
export LOTUS_TOKEN="$(cat ~/.lotus/token)"
echo $LOTUS_TOKEN
export LOTUS_API="http://127.0.0.1:3999/rpc/v0"
echo $LOTUS_API
mkdir ~/import
mkdir ~/retrieve
eval "node index.js --dev --size 1000000 --standalone false --cmdMode &> ~/qab.log &"
eval "disown -r"
eval "tail -f ~/qab.log"

