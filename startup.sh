export LOTUS_TOKEN="$(cat ~/.lotus/token)"
echo $LOTUS_TOKEN

node index.js &> ~/qab.log &
disown -r
tail -f ~/qab.log

