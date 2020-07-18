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

function ClientStartDeal(dataRef) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientStartDeal", "params": [dataRef], "id": 0 }));
}

function ClientImport(file) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientImport", "params": [{"Path":file,"IsCAR":false}], "id": 0 }));
}

function ClientFindData(dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientFindData", "params": [{"/":dataCid}], "id": 0 }));
}

function ClientRetrieve(retrievalOffer, outFile) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientRetrieve", "params": [{"Root":{"/":retrievalOffer.Root},"Size":retrievalOffer.Size, "Total":retrievalOffer.Total, "PaymentInterval":retrievalOffer.PaymentInterval, "PaymentIntervalIncrease":retrievalOffer.PaymentIntervalIncrease, "Client": retrievalOffer.Client, "Miner":retrievalOffer.Miner, "MinerPeerID":retrievalOffer.MinerPeerID},{"Path":outFile,"IsCAR":false}], "id": 0 }));
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

function WalletDefaultAddress() {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.WalletDefaultAddress", "params": [], "id": 0 }));
}

function ClientStartDealCmd(dataCid, miner, price, duration) {
    return spawn('lotus', ["client", "deal", dataCid, miner, price, duration], null);
}

function NetConnectedness(peerId) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.NetConnectedness", "params": [peerId], "id": 0 }));
}

function ClientRetrieveCmd(dataCid, outFile) {
    return spawn('lotus', ["client", "retrieve", dataCid, outFile], null);
}

function Version() {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.Version", "params": [], "id": 0 }));
}

function ChainHead() {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainHead", "params": [], "id": 0 }));
}

function ChainGetTipSetByHeight(selectedHeight, headTipSet) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainGetTipSetByHeight", "params": [selectedHeight, headTipSet], "id": 0 }));
}

function ChainGetTipSet(tipSetKey) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainGetTipSet", "params": [tipSetKey], "id": 0 }));
}

function ChainGetNode(nodeCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainGetNode", "params": [nodeCid], "id": 0 }));
}

function ChainGetMessage(messageCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainGetMessage", "params": [messageCid], "id": 0 }));
}

var args = process.argv.slice(2);

if (args[0] === 'test-slc') {
    var cbor = require('cbor');

    api = 'http://104.248.116.108:1234/rpc/v0'; // qabot2
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.b4J6r2hB4FTgHicCUEJZhZzDn9et3Zhqwh8DiNkgxcQ';// qabot2

    (async () => {
        const result = [];
        var version = await Version();
        var chainHead = await ChainHead();

        console.log("version: " + version.result.Version);
        console.log(" chainHead.result.Cids: " + JSON.stringify(chainHead.result.Cids));

        let blocks = [...Array(chainHead.result.Height).keys()];

        var blocksSlice = blocks;
        while (blocksSlice.length) {
            await Promise.all(blocksSlice.splice(0, 50).map(async (block) => {
                try {
                    var selectedHeight = block;
                    var tipSet = (await ChainGetTipSetByHeight(selectedHeight, chainHead.result.Cids)).result;
                    if (tipSet.Blocks) {
                        for (const block of tipSet.Blocks) {
                            const level1Cid = block.Messages['/'];
                            if (level1Cid) {
                                const level2Cids = (await ChainGetNode(level1Cid)).result.Obj.map(obj => obj['/'])
                                for (const level2Cid of level2Cids) {
                                    const messageCids = (await ChainGetNode(level2Cid)).result.Obj[2][2].map(obj => obj['/'])
                                    for (const messageCid of messageCids) {
                                        const message = await ChainGetMessage({ '/': messageCid });
                                        if (message.result.Method === 6) {
                                            var decode = cbor.decode(Buffer.from(message.result.Params, 'base64'));
                                            if (decode[7] > 0) {
                                                result.push({
                                                    height: tipSet.Height,
                                                    miner: block.Miner,
                                                    decode: decode,
                                                    SectorNumber: decode[1],
                                                    ReplaceCapacity: decode[6],
                                                    ReplaceSector: decode[7],
                                                    messageCid,
                                                    ...message
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log('Error: ' + e.message);
                }

            }));

            console.log("Remainig blocks: " + blocksSlice.length + " " + result.length);
        }

        result.forEach(element => {
                console.log(element)
        });

    })();
}

if (args[0] === 'test-ip') {
    api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.h5QDbjr-3cTI3Jnc4xczWvUBpK2-jTM65JOQGj2fnvA';// qabot2

    StateMinerInfo('t02000').then(data => {
        console.log(data);
        NetFindPeer(data.result.PeerId).then(data => {
            console.log(JSON.stringify(data.result.Addrs[2]));
        }).catch(error => {
            console.log(error);
        });
    }).catch(error => {
        console.log(error);
    });
}

if (args[0] === 'test-online') {
    api = 'http://64.227.17.40:3999/rpc/v0';  // qabot1
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.XCVQTyuuh8Qh0_KiQt8f2EuaiYj8UlZ9ns5q29acWAc';// qabot1

    (async () => {
        const {result} = await NetConnectedness('12D3KooWDgdHbJeoVbcGKkvFhB49mP5B2cq5vYuRGNnzSQHSpkhs');
        console.log(result);
        console.log("NetConnectedness " + ((result == 1) ? 'online' : 'offline'));
        const response = await NetConnectedness('12D3KooWNc5J8V3HgMjS63E7zRCqXbfBrRzQp9Bs9oZ5WAPBfeAU');
        console.log(response);
        console.log("NetConnectedness " + ((response.result == 1) ? 'online' : 'offline'));
    })();
}

if (args[0] === 'test-retrive') {
    api = 'http://178.128.158.180:3999/rpc/v0'; // qabot3
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.cTVmgaA1YTMIhwcj-lPRwH0VALPpHojxPycZEP05bcY';// qabot2
    //api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    //api = 'http://64.227.17.40:3999/rpc/v0';  // qabot1


    (async () => {
        const walletDefault = await WalletDefaultAddress();
        const wallet = walletDefault.result;

        console.log(wallet);

        const findData = await ClientFindData('QmdrjQhPaR7MeXFfK8PiFV9oq9Dvme71X1x2kRQX8SxQVs')

        const o = findData.result[0];

        if (findData.result) {
            const retrievalOffer = {
                Root: 'QmdrjQhPaR7MeXFfK8PiFV9oq9Dvme71X1x2kRQX8SxQVs',
                Size: o.Size,
                Total: o.MinPrice,
                PaymentInterval: o.PaymentInterval,
                PaymentIntervalIncrease: o.PaymentIntervalIncrease,
                Client: wallet,
                Miner: o.Miner,
                MinerPeerID: o.MinerPeerID
            }

            ClientRetrieve(retrievalOffer,
                '/root/retrieve/out3.data').then(data => {
                console.log(JSON.stringify(data));
            }).catch(error => {
                console.log(error);
            });
        }
    })();
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

if (args[0] === 'test-store') {
    api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.uxVEWd2TmAX498c4Fak9xmbR9ocXaiYwZuelf4_yluY'; // qabot2

    (async () => {
        try {
            //let miner = 't02041';
            let miner = 't05548';
            const minerInfo = await StateMinerInfo(miner);
            const { PeerId } = minerInfo.result;
            console.log(minerInfo);

            const importData = await ClientImport('/root/import4.log')
            const { '/': dataCid } = importData.result;
            console.log(dataCid);

            const walletDefault = await WalletDefaultAddress();
            const wallet = walletDefault.result;

            console.log(wallet);

            const ask = await ClientQueryAsk(PeerId, miner);
            console.log(ask);

            const epochPrice = '500000000';//'2600';

            const dataRef = {
                Data: {
                    TransferType: 'graphsync',
                    Root: {
                        '/': dataCid
                    },
                    PieceCid: null,
                    PieceSize: 0
                },
                Wallet: wallet,
                Miner: miner,
                EpochPrice: epochPrice,
                MinBlocksDuration: 10000
            }

            const dealData = await ClientStartDeal(dataRef);
            const { '/': proposalCid } = dealData.result;
            console.log(dealData);
            console.log(proposalCid);

        } catch (e) {
            console.log('Error: ' + e.message);
        }

    })();
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
    WalletDefaultAddress,
    NetConnectedness,
    ClientStartDealCmd,
    ClientRetrieveCmd,
    Version,
    ChainHead,
    ChainGetTipSetByHeight,
    ChainGetTipSet,
    ChainGetNode,
    ChainGetMessage,
};