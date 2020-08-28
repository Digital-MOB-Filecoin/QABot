'use strict';
const bot_config = require('./config');
const bot_region = bot_config.bot.region;

class BackendClient {
    constructor(dummyMode, config) {
        this.dummyMode = dummyMode;
        this.api = config.api;
        this.token = config.token;
    }

    Close() {
        return this.client.close();
    }

    static Shared(dummyMode = false, config) {
        if (!this.instance) {
            this.instance = new BackendClient(
                dummyMode,
                config,
            );
        }

        return this.instance;
    }

    async GetMiners(skip) {
        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        let response;
        try {
            response = await axios.get(this.api + 'miner/bot', {
                params: {
                    all: true,
                    skip: skip
                }
            });
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response;
    }

    async GetCids(skip = 0) {
        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        let response;
        try {
            response = await axios.get(this.api + 'miner/cid', { params: { skip: skip } });
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response;
    }

    async DeleteCid(cid) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        let response;
        try {
            response = await axios.delete(this.api + `miner/cid/${cid}`);
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response;
    }

    async SaveDeal(miner_id, type, success, deal_state, dataCid, dealCid, fileSize, hash, message, deal_created_at) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const MAX_LENGTH = 1000;
        var trimmedMessage = message.length > MAX_LENGTH ?
            message.substring(0, MAX_LENGTH - 3) + "..." :
            message;

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        const data = {
            miner_id: miner_id,
            type: type,
            success: success,
            deal_state: deal_state,
            message: trimmedMessage,
            data_cid: dataCid,
            deal_cid: dealCid,
            deal_created_at: deal_created_at,
            file_size: parseInt(fileSize),
            hash: hash,
            bot_region: bot_region
        };

        let response;
        try {
            response = await axios.post(this.api + 'miner/deal', data);
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response.data;
    }

    async UpdateDeal(id, success, deal_state, hash, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const MAX_LENGTH = 1000;
        var trimmedMessage = message.length > MAX_LENGTH ?
            message.substring(0, MAX_LENGTH - 3) + "..." :
            message;

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        const data = {
            success: success,
            deal_state: deal_state,
            message: trimmedMessage,
            hash: hash,
        };

        let response;
        try {
            response = await axios.put(this.api + 'miner/deal/' + id, data);
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response.data;
    }

    async SaveSLC(miner_id, success, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const MAX_LENGTH = 500;
        var trimmedMessage = message.length > MAX_LENGTH ?
            message.substring(0, MAX_LENGTH - 3) + "..." :
            message;

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        let response;
        try {
            response = await axios.post(this.api + 'miner/slc',
                {
                    miner_id: miner_id,
                    success: success,
                    message: trimmedMessage,
                });
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response;
    }

    async SaveStoreDeal(saveStoreDeal) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.SaveDeal(
            saveStoreDeal.miner_id, 
            'store', 
            saveStoreDeal.success, 
            saveStoreDeal.deal_state, 
            saveStoreDeal.dataCid, 
            saveStoreDeal.dealCid, 
            saveStoreDeal.fileSize, 
            saveStoreDeal.hash, 
            saveStoreDeal.message, 
            saveStoreDeal.deal_created_at);
    }

    async UpdateStoreDeal(updateStoreDeal) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.UpdateDeal(
            updateStoreDeal.id, 
            updateStoreDeal.success, 
            updateStoreDeal.deal_state, 
            updateStoreDeal.hash, 
            updateStoreDeal.message);
    }

    async SaveRetrieveDeal(miner_id, success, dataCid, dealCid, fileSize, hash, message, deal_created_at) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return await this.SaveDeal(miner_id, 'retrieve', success, 'n/a', dataCid, dealCid, fileSize, hash, message, deal_created_at);
    }
}

var args = process.argv.slice(2);
if (args[0] === 'test') {
    const config = require('./config');
    const backend = BackendClient.Shared(false, config.backend_dev);

    /*backend.GetMiners().then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });*/

    (async () => {
        const saveStoreDeal = {
            miner_id: 't01973', 
            success: null, 
            deal_state: 'deal_state1', 
            dataCid: 'datacid_pendingdeals8', 
            dealCid: 'dealcid', 
            fileSize: 0, 
            hash: 'hash1', 
            message: 'message1', 
            deal_created_at: Math.floor(Date.now()/1000),
        };

        const {id} = await backend.SaveStoreDeal(saveStoreDeal);

        const updateStoreDeal = {
            id: id, 
            success: true, 
            deal_state: 'deal_state', 
            hash: 'hash', 
            message: 'message',
        };


        const updateResponse = await backend.UpdateStoreDeal(updateStoreDeal);

        console.log(`SaveStoreDeal id: ${id}`);
        console.log(`UpdateStoreDeal response: ${JSON.stringify(updateResponse)}`);
    })();

    /*backend.SaveRetrieveDeal('t01973', true, 'test121', 'n/a', 100, 'test121', 'test121', Math.floor(Date.now()/1000)).then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });*/


    /*backend.GetCids(0).then(response => {
        console.log('GetCids: ' + JSON.stringify(response.data));
        console.log(response.status);

        const cid = response.data.items[0].data_cid;
        console.log('delete cid: ' + cid);

        backend.DeleteCid(cid).then(response => {
            console.log(response.data);
            console.log(response.status);
        }).catch(error => {
            console.log(error);
        });
    }).catch(error => {
        console.log(error);
    });*/

    /*backend.SaveSLC('t01004', false, 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });*/
}

module.exports = {
    BackendClient
};