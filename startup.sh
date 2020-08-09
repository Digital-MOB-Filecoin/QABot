#!/bin/bash
export LOTUS_TOKEN="$(cat ~/.lotus/token)"
echo $LOTUS_TOKEN
export LOTUS_API="http://127.0.0.1:3999/rpc/v0"
echo $LOTUS_API
mkdir ~/import
mkdir ~/retrieve

export BOT_MODE="store"
node index.js --size 100 &> ~/qab-store.log &
disown -r

export BOT_MODE="retrieve"
node index.js &> ~/qab-retrieve.log &
disown -r

tail -f ~/qab-store.log
tail -f ~/qab-retrieve.log

