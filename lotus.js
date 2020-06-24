'use strict';

const config = require('./config');

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

var args = process.argv.slice(2);

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

            ClientRetrieve2(retrievalOffer,
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
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.h5QDbjr-3cTI3Jnc4xczWvUBpK2-jTM65JOQGj2fnvA'; // qabot2

    (async () => {
        try {
            const minerInfo = StateMinerInfo('t02429');
            console.log(minerInfo);

            return;

            const importData = await ClientImport('/root/import2.log')
            const { '/': dataCid } = importData.result;
            console.log(dataCid);

            const walletDefault = await WalletDefaultAddress();
            const wallet = walletDefault.result;

            console.log(wallet);

            const ask = await ClientQueryAsk('12D3KooWS13JZpyKA7t2awQAnawk4njgA6TYTevi5ocrHxnRGmFY', 't02429');
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
                Miner: 't02429',
                EpochPrice: epochPrice,
                MinBlocksDuration: 10000
            }

            const dealData = await ClientStartDeal(dataRef);
            const { '/': proposalCid } = dealData.result;

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
};