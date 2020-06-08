'use strict';

const request = require('request');
const config = require('./config');
var spawn = require("spawn-promise");

function LotusCmd(body) {
    const axios = require('axios');
    return axios.post(config.lotus.api, body);
}

function StateListMiners() {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateListMiners", "params": [null], "id": 3 }));
}

function StateMinerPower(miner) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateMinerPower", "params": [miner, null], "id": 3 }));
}

function StateMinerInfo(miner) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateMinerInfo", "params": [miner, null], "id": 0 }));
}

function ClientQueryAsk(peerID, miner) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientQueryAsk", "params": [peerID, miner], "id": 0 }));
}

function ClientFindData(dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientFindData", "params": [dataCid], "id": 0 }));
}

function ClientGetDealInfo(dealCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientGetDealInfo", "params": [{"/":dealCid}], "id": 0 }));
}

function ClientListDeals() {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientListDeals", "params": [], "id": 0 }));
}

function ClientStartDeal(dataCid, miner, price, duration) {
    return spawn('lotus', ["client", "deal", dataCid, miner, price, duration], null);
}

/*function ClientStartDeal2() {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientStartDeal", "params": [{"Data":{"TransferType":"string value","Root":{"/":"bafkreih7ojhsmt6lzljynwrvyo5gggi2wwxa75fdo3fztpiixbtcagbxmi"},"PieceCid":null,"PieceSize":1024},"Wallet":"t01024","Miner":"t01024","EpochPrice":"0","MinBlocksDuration":42,"DealStartEpoch":10101}], "id": 0 }));
}*/

function ClientImport(file) {
    return spawn('lotus', ["client", "import", file], null);
}

function ClientRetrieve(dataCid, outFile) {
    return spawn('lotus', ["client", "retrieve", dataCid, outFile], null);
}

var args = process.argv.slice(2);

if (args[0] === 'test') {
    StateMinerPower("t089665").then(data => {
        console.log(data)
    }).catch(error => {
        console.log(error);
    });

    ClientGetDealInfo("bafyreiflw5y3arrrsvil5abyarcnnxc7a7ort6higwf2mqzevmtrtvnsle").then(data => {
        console.log(data)
    }).catch(error => {
        console.log(error);
    });

    /*ClientStartDeal2().then(data => {
        console.log(data)
    }).catch(error => {
        console.log(error);
    });*/

    ClientListDeals().then(data => {
        console.log(data)
    }).catch(error => {
        console.log(error);
    });
}

module.exports = {
    StateListMiners,
    StateMinerPower,
    StateMinerInfo,
    ClientQueryAsk,
    ClientFindData,
    ClientGetDealInfo,
    ClientStartDeal,
    ClientImport,
    ClientRetrieve,
};