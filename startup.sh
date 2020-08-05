#!/bin/bash
export LOTUS_TOKEN="$(cat ~/.lotus/token)"
echo $LOTUS_TOKEN
export LOTUS_API="http://127.0.0.1:3999/rpc/v0"
echo $LOTUS_API
mkdir ~/import
mkdir ~/retrieve
export BOT_MODE="store"
eval "node index.js --dev --size 100 &> ~/qab-store.log &"
export BOT_MODE="retrieve"
eval "node index.js --dev &> ~/qab-retrieve.log &"
eval "disown -r"
eval "tail -f ~/qab.log"

