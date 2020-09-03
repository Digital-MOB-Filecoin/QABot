const { Client } = require('rpc-websockets');
const config = require('./config');

let api = config.lotus.api;
let token = config.lotus.token;

class LotusWsClient {
    constructor(lotusUrl, authToken) {
        let fullUrl = `${lotusUrl}`;

        if (authToken) {
            fullUrl = fullUrl + `?token=${authToken}`;
        }

        this.ready = false;
        this.client = new Client(fullUrl);
        this.client.on('open', () => {
            this.ready = true;
            console.log('Lotus connection established!\n');
        });
        this.client.on('error', (e) => console.error(e));
        this.client.on('close', () => {
            this.ready = false;
            console.log('Lotus connection closed!\n');
        })
    }

    Close() {
        return this.client.close();
    }

    static Shared() {
        if (!this.instance) {
            this.instance = new LotusWsClient(
                api,
                token,
            );
        }

        return this.instance;
    }

    async Ready() {
        if (this.ready) return;
        const waiter = (resolve) => {
            return () => {
                if (this.ready) resolve();
                const t = setTimeout(waiter(resolve), 500);
            }
        }
        await new Promise(resolve => waiter(resolve)());
    }

    async Version() {
        await this.Ready();
        return await this.client.call('Filecoin.Version');
    }

    async StateListMiners() {
        await this.Ready();
        return await this.client.call('Filecoin.StateListMiners', [null]);
    }

    async StateMinerPower(address) {
        await this.Ready();
        return await this.client.call('Filecoin.StateMinerPower', [address, null]);
    }

    async StateMinerInfo(address) {
        await this.Ready();
        return await this.client.call('Filecoin.StateMinerInfo', [address, null]);
    }

    async ClientQueryAsk(peerId, address) {
        await this.Ready();
        return await this.client.call('Filecoin.ClientQueryAsk', [peerId, address]);
    }

    async NetConnectedness(peerId) {
        await this.Ready();
        return await this.client.call('Filecoin.NetConnectedness', [peerId]);
    }

    async ClientImport(path, isCar) {
        await this.Ready();
        return await this.client.call('Filecoin.ClientImport', [{ path, isCar }]);
    }

    async ClientStartDeal(dataCid, miner, price, duration) {
        await this.Ready();
        return await this.client.call('Filecoin.ClientStartDeal', [{
            Data: {
                TransferType: 'graphsync',
                Root: {
                    '/': dataCid
                },
                PieceCid: null,
                PieceSize: 0
            },
            Wallet: await this.WalletDefaultAddress(),
            Miner: miner,
            EpochPrice: `${price}`,
            MinBlocksDuration: duration,
            FastRetrieval: true
        }]
        );
    }

    async ClientFindData(dataCid) {
        await this.Ready();
        return await this.client.call('Filecoin.ClientFindData', [dataCid]
        );
    }

    async ClientRetrieve(offer, path) {
        await this.Ready();
        return await this.client.call('Filecoin.ClientRetrieve', [offer, { "Path": path, "IsCAR": false }]);
    }

    async AuthVerify(token) {
        await this.Ready();
        return await this.client.call('Filecoin.AuthVerify', [token]);
    }

    async WalletDefaultAddress() {
        await this.Ready();
        return await this.client.call('Filecoin.WalletDefaultAddress');
    }

    async WalletBalance(address) {
        await this.Ready();
        return await this.client.call('Filecoin.WalletBalance', [address])
    }

    async ClientGetDealInfo(dealCid) {
        await this.Ready();
        return await this.client.call('Filecoin.ClientGetDealInfo', [dealCid])
    }
}

var args = process.argv.slice(2);

if (args[0] === 'test-store') {

    const lotus = LotusWsClient.Shared();

    (async () => {
        try {
            const auth = await lotus.AuthVerify(token);
            console.log(auth);

            const miners = await lotus.StateListMiners();

            let topMinersList = new Array;

            var minersSlice = miners;
            while (minersSlice.length) {
                await Promise.all(minersSlice.splice(0, 50).map(async (miner) => {
                    const power = await lotus.StateMinerPower(miner);
                    if (power.MinerPower.QualityAdjPower > 0) {
                        const { PeerId } = await lotus.StateMinerInfo(miner);

                        topMinersList.push({
                            address: miner,
                            peerId: PeerId,
                            online: await lotus.NetConnectedness(PeerId),
                            power: power.MinerPower.QualityAdjPower
                        })
                    }
                }));
            }

            console.log(topMinersList);
            console.log(topMinersList.length);


            var it = 0;
            while (it < topMinersList.length) {
                if (topMinersList[it].online) {
                    try {
                        const queryAsk = await lotus.ClientQueryAsk(topMinersList[it].peerId, topMinersList[it].address);
                        console.log(topMinersList[it].address + '->' + queryAsk.Ask.Price);
                        console.log(topMinersList[it].address + '->' + queryAsk);
                    } catch (e) {
                        console.log('Error: ' + e.message);
                    }
                }

                it++;
            }

            const { '/': dataCid } = await lotus.ClientImport('/root/import2.data');
            console.log(dataCid);

            const epochPrice = '500000000';//'2600';

            it = 0;
            while (it < topMinersList.length) {
                if (topMinersList[it].online) {
                    try {
                        const { '/': proposalCid } = await lotus.ClientStartDeal(dataCid, topMinersList[it].address, epochPrice, 10000);
                        console.log(proposalCid);
                    } catch (e) {
                        console.log('Error: ' + e.message);
                    }
                }

                it++;
            }

            lotus.Close();

        } catch (e) {
            console.log('Error: ' + e.message);
        }

    })();
}

module.exports = {
  LotusWsClient,
}