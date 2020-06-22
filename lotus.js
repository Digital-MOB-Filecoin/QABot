'use strict';

const config = require('./config');
var spawn = require("spawn-promise");
let api = config.lotus.api;
let token = config.lotus.token;

function LotusCmd(body) {
    return new Promise(function (resolve, reject) {
        const axios = require('axios');
        axios.post(api, body, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(response => {
            resolve(response.data);
        }).catch(error => {
            reject(error);
        });
    })
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

function ClientImport2(file) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientImport", "params": [{"Path":"/root/qab-testfile-09af1688","IsCAR":false}], "id": 0 }));
}

function ClientRetrieve(dataCid, outFile) {
    return spawn('lotus', ["client", "retrieve", dataCid, outFile], null);
}

function ClientFindData(dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientFindData", "params": [{"/":dataCid}], "id": 0 }));
}

function ClientRetrieve2(dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientRetrieve", "params": [{"Root":{"/":dataCid},"Size":133169152, "Total":"133169152", "PaymentInterval":1048576, "PaymentIntervalIncrease":1048576, "Client": "t01989", "Miner":"t01989", "MinerPeerID":"12D3KooWGsMLm2BziXWYf31pL7oqMRfd9nSuHVy1qLi6yzsznqVA"},{"Path":"/root/ret10.data","IsCAR":false}], "id": 0 }));
}

function StateMinerSectorCount(miner) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateMinerSectorCount", "params": [miner, null], "id": 0 }));
}

function StateMinerSectors(miner) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateMinerSectors", "params": [miner, "AA==", true, null], "id": 0 }));
}

function StateSectorGetInfo(miner, sector) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateSectorGetInfo", "params": [miner, sector, null], "id": 0 }));
}

function StateSectorPreCommitInfo(miner, sector) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateSectorPreCommitInfo", "params": [miner, sector, null], "id": 0 }));
}

function NetFindPeer(PeerId) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.NetFindPeer", "params": [PeerId], "id": 0 }));
}


var args = process.argv.slice(2);

if (args[0] === 'test-ip') {
    api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.h9EjLZcyctRvFgyOeHMSw9XXbKCE8xJKh9CTvWRWViI';// qabot2

    StateMinerInfo('t02000').then(data => {
        console.log(data.result.PeerId);
        NetFindPeer(data.result.PeerId).then(data => {
            console.log(JSON.stringify(data.result.Addrs[2]));
        }).catch(error => {
            console.log(error);
        });
    }).catch(error => {
        console.log(error);
    });
}

if (args[0] === 'test-retrive') {
    api = 'http://178.128.158.180:3999/rpc/v0'; // qabot3
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.Y8l11zZ3GcGh3Wtjmt3XQ5jznpOFZKzCu6W57bvzK4o';// qabot2
    //api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    //api = 'http://64.227.17.40:3999/rpc/v0';  // qabot1

    /*[{"Root":{"/":dataCid},
    "Size":133169152, 
    "Total":"133169152", 
    "PaymentInterval":1048576, 
    "PaymentIntervalIncrease":1048576, 
    "Client": "t01989", 
    "Miner":"t01989", 
    "MinerPeerID":"12D3KooWGsMLm2BziXWYf31pL7oqMRfd9nSuHVy1qLi6yzsznqVA"},
    {"Path":"/root/ret1.data","IsCAR":false}]*/

    ClientFindData('QmYyPGBmss54opK4LLHpnx9KCvdMGdfoY9YpJNh9RdEWgT').then(data => {
        console.log(JSON.stringify(data));

        /*ClientRetrieve2('QmRsujXtDVYdKRWvZyuGUuoi7XHcAcRpDz3YA91yAo1Uye').then(data => {
            console.log(JSON.stringify(data));
        }).catch(error => {
            console.log(error);
        });*/
    }).catch(error => {
        console.log(error);
    });
}

if (args[0] === 'test-sector') {
    api = 'http://178.128.158.180:3999/rpc/v0'; // qabot3
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.Y8l11zZ3GcGh3Wtjmt3XQ5jznpOFZKzCu6W57bvzK4o';// qabot2
    //api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    //api = 'http://64.227.17.40:3999/rpc/v0';  // qabot1

    /*StateSectorGetInfo('t01812', 0).then(data => {
            console.log(JSON.stringify(data));
        }).catch(error => {
            console.log(error);
        });*/

    StateListMiners().then(data => {
        data.result.forEach(miner => {
            StateMinerSectorCount(miner).then(data => {
                let bResult = false;
                if (data.result.Pset > 0) {
                    //console.log(miner,  data.result.Pset);
                    for (var sector = 0; sector < data.result.Pset && sector < 10; sector++) {
                        (async () => {
                            await StateSectorPreCommitInfo(miner, sector).then(data => {
                                if (data.result) {
                                    console.log(miner, sector);
                                    console.log(JSON.stringify(data));
                                    let preCommitInfo = JSON.stringify(data);

                                    /*(async () => {
                                        await StateMinerSectors(miner).then(data => {
                                            console.log('************');
                                            console.log(miner, sector);
                                            console.log(preCommitInfo);
                                            console.log('------------');
                                            //console.log(JSON.stringify(data));
                                            console.log('************');
                                        }).catch(error => {
                                            console.log(error);
                                        });
                                    })()*/

                                    bResult = true;
                                }
                            }).catch(error => {
                                console.log(error);
                        });
                    })()

                    }
                }
                //console.log(miner, bResult);
            }).catch(error => {
                console.log(error);
            });
        });
    }).catch(error => {
        console.log(error);
    });
}

if (args[0] === 'test') {
    api = 'http://178.128.158.180:3999/rpc/v0'; // qabot3

    StateMinerPower("t089665").then(data => {
        console.log(data)
    }).catch(error => {
        console.log(error);
    });

    StateMinerInfo("t089665").then(data => {
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