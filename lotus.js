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

function ClientRemoveImport(importID) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientRemoveImport", "params": [importID], "id": 0 }));
}

function ClientFindData(dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientFindData", "params": [{"/":dataCid}, null], "id": 0 }));
}

function ClientMinerQueryOffer(miner, dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientMinerQueryOffer", "params": [miner, {"/":dataCid}, null], "id": 0 }));
}

function ClientRetrieve(retrievalOffer, outFile) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientRetrieve", "params": [retrievalOffer,{"Path":outFile,"IsCAR":false}], "id": 0 }));
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

function ClientRetrieveCmd(miner, dataCid, outFile) {
    return spawn('lotus', ["client", "retrieve", "--miner=" + miner, dataCid, outFile], null);
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

function WalletBalance(wallet) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.WalletBalance", "params": [wallet], "id": 0 }));
}

function ClientDealSize(dataCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ClientDealSize", "params": [{"/":dataCid}], "id": 0 }));
}

function StateGetActor(address, tipSetKey) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.StateGetActor", "params": [address, tipSetKey], "id": 0 }));
}

function ChainGetParentMessages(blockCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainGetParentMessages", "params": [{"/":blockCid}], "id": 0 }));
}

function ChainGetParentReceipts(blockCid) {
    return LotusCmd(JSON.stringify({ "jsonrpc": "2.0", "method": "Filecoin.ChainGetParentReceipts", "params": [{"/":blockCid}], "id": 0 }));
}

var args = process.argv.slice(2);

function SLCRange(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

if (args[0] === 'test-balance') {
    //api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    //token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.qJO3-Y_GGW0jnbN-xKlaP4KOIAR-buez1yLI_EZrfTw';// qabot2

    (async () => {
        const dealSize = await ClientDealSize("bafykbzacec2mek5eduoz6doe46ta34oomyimd2fsolc7daqsbxv6pb75ska4q");

        console.log(dealSize);

        const walletDefault = await WalletDefaultAddress();
        const wallet = walletDefault.result;

        console.log('wallet: ' + wallet);

        const w2 = 't1siyoql22zryui54bo6ht36w4k3slb5yi4oj53sa';

        const balance = await WalletBalance(wallet);

        const BigNumber = require('bignumber.js');

        let x = new BigNumber(balance.result);
        let y = new BigNumber(1000000000000000000);
        console.log(x.dividedBy(y).toString(10));

        console.log(balance.result);
    })();
}

/*
type SectorPreCommitInfo struct {
	SealProof       abi.RegisteredSealProof
	SectorNumber    abi.SectorNumber
	SealedCID       cid.Cid `checked:"true"` // CommR
	SealRandEpoch   abi.ChainEpoch
	DealIDs         []abi.DealID
	Expiration      abi.ChainEpoch
	ReplaceCapacity bool // Whether to replace a "committed capacity" no-deal sector (requires non-empty DealIDs)
	// The committed capacity sector to replace, and it's deadline/partition location
	ReplaceSectorDeadline  uint64
	ReplaceSectorPartition uint64
	ReplaceSectorNumber    abi.SectorNumber
}
*/

if (args[0] === 'test-slc') {
    var cbor = require('cbor');

    //api = 'http://104.248.116.108:1234/rpc/v0'; // qabot2
    //token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.b4J6r2hB4FTgHicCUEJZhZzDn9et3Zhqwh8DiNkgxcQ';// qabot2

    (async () => {
        const result = [];
        var version = await Version();
        var chainHead = await ChainHead();

        console.log("version: " + version.result.Version);
        console.log(" chainHead.result.Cids: " + JSON.stringify(chainHead.result.Cids));

        const { '/': minerCode } = (await StateGetActor('t01000', chainHead.Height)).result.Code;
        console.log('minerCode: ' + minerCode);

        //let blocks = [...Array(chainHead.result.Height).keys()];
        //let blocks = [11740];
        let blocks = SLCRange(11730, chainHead.result.Height);

        var blocksSlice = blocks;
        while (blocksSlice.length) {
            await Promise.all(blocksSlice.splice(0, 10).map(async (block) => {
                try {
                    var selectedHeight = block;
                    var tipSet = (await ChainGetTipSetByHeight(selectedHeight, chainHead.result.Cids)).result;

                    const { '/': blockCid } = tipSet.Cids[0];

                    let messages = (await ChainGetParentMessages(blockCid)).result;
                    let receipts = (await ChainGetParentReceipts(blockCid)).result; 

                    if (!messages) {
                        messages = [];
                      }
                
                    messages = messages.map((msg, r) => ({...msg.Message, cid: msg.Cid, receipt: receipts[r]}))

                    for (const msg of messages) {
                        const { '/': cid } = msg.cid;
                        if (msg.Method === 6) {
                            var decode = cbor.decode(Buffer.from(msg.Params, 'base64'));
                            if (decode[6] == true) {
                                const { '/': currentMinerCode } = (await StateGetActor(msg.To, chainHead.Height)).result.Code;
                                if (currentMinerCode == minerCode && msg.receipt.ExitCode == 0) {
                                    console.log('Height: ' + selectedHeight + ' cid: ' + cid + ' miner: ' + msg.To + ' Params: ' + decode);
                                    result.push({
                                        height: tipSet.Height,
                                        miner: msg.To,
                                        decode: decode,
                                        SectorNumber: decode[1],
                                        ReplaceCapacity: decode[6],
                                        ReplaceSectorNumber: decode[9],
                                        cid: cid,
                                    });
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
    //api = 'http://178.128.158.180:3999/rpc/v0'; // qabot3
    //token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.ev6YqAE4OkXaI7RGRpxKjalTdLltLI4T3tjWcBrON_c';// qabot2
    //api = 'http://104.248.116.108:3999/rpc/v0'; // qabot2
    //api = 'http://64.227.17.40:3999/rpc/v0';  // qabot1


    (async () => {
        const walletDefault = await WalletDefaultAddress();
        const wallet = walletDefault.result;

        console.log('wallet: ' + wallet);

        //t01399,bafk2bzaceaisfbrub4cblcycc26m7lcwu7wsvvq7cxf7sdrj4jegqwntnm7ri
        //t02486,bafk2bzaceahxe5uhvfzbahupe56usqrqc3223weh44od5oc7a63kx3ipppbvs


        const dataCid = 'bafk2bzaceahxe5uhvfzbahupe56usqrqc3223weh44od5oc7a63kx3ipppbvs';

        const queryOffer = await ClientMinerQueryOffer('t02486', dataCid);

        console.log(JSON.stringify(queryOffer));

        if (queryOffer.result.Err) {
            console.error('ClientMinerQueryOffer:' + queryOffer.result.Err);
            return;
        }

        const o = queryOffer.result;

        if (queryOffer.result) {
            const retrievalOffer = {
                Root: o.Root,
                Piece: null,
                Size: o.Size,
                Total: o.MinPrice,
                UnsealPrice: o.UnsealPrice,
                PaymentInterval: o.PaymentInterval,
                PaymentIntervalIncrease: o.PaymentIntervalIncrease,
                Client: wallet,
                Miner: o.Miner,
                MinerPeer: o.MinerPeer
              }

            ClientRetrieve(retrievalOffer,
                '/root/out_r124.data').then(data => {
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
                MinBlocksDuration: 10000,
                FastRetrieval: true
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
    ClientMinerQueryOffer,
    ClientGetDealInfo,
    ClientStartDeal,
    ClientImport,
    ClientRemoveImport,
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
    WalletBalance,
    ClientDealSize,
    StateGetActor,
    ChainGetParentMessages,
    ChainGetParentReceipts,
};