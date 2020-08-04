'use strict';

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

    GetMiners(skip) {
        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }
        
        return axios.get(this.api + 'miner/bot', {
            params: {
                all: true,
                skip: skip
            }
        })
    }

    GetCids(skip) {
        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }
        
        return axios.get(this.api + 'miner/cid', {
            params: {
                skip: skip
            }
        })
    }

    DeleteCid(cid) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        return axios.delete(this.api + 'miner/cid',
            {
                cid: cid,
            })
    }

    SaveDeal(miner_id, type, success, dataCid, dealCid, fileSize, hash, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const MAX_LENGTH = 500;
        var trimmedMessage = message.length > MAX_LENGTH ?
            message.substring(0, MAX_LENGTH - 3) + "..." :
            message;

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        return axios.post(this.api + 'miner/deal',
            {
                miner_id: miner_id,
                type: type,
                success: success,
                message: trimmedMessage,
                data_cid: dataCid,
                deal_cid: dealCid,
                file_size: fileSize,
                hash: hash
              })
    }

    SaveSLC(miner_id, success, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const MAX_LENGTH = 500;
        var trimmedMessage = message.length > MAX_LENGTH ?
            message.substring(0, MAX_LENGTH - 3) + "..." :
            message;

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        return axios.post(this.api + 'miner/slc',
            {
                miner_id: miner_id,
                success: success,
                message: trimmedMessage,
            })
    }

    SaveStoreDeal(miner_id, success, dataCid, dealCid, fileSize, hash, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.SaveDeal(miner_id, 'store', success, dataCid, dealCid, fileSize, hash, message);
    }

    SaveRetrieveDeal(miner_id, success, dataCid, dealCid, fileSize, hash, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.SaveDeal(miner_id, 'retrieve', success, dataCid, dealCid, fileSize, hash, message);
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

    backend.SaveStoreDeal('t05992', true, 'bafk2bzacectugewoaqpxcvl3ka5mpsq6wjqunfq3cyfjupsk7dpp5kiqut242', 'n/a', 0, '86f61cd1e84e491b4aec695f0274fd653b7363b4caccd7d5dc690e98001efc0e', 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    backend.SaveRetrieveDeal('t05992', false, 'dataCid', 'dealCid', 100, 'bafk2bzacectugewoaqpxcvl3ka5mpsq6wjqunfq3cyfjupsk7dpp5kiqut242', 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    backend.GetCids(0).then(response => {
        console.log('GetCids: ' + JSON.stringify(response.data));
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    backend.SaveSLC('t01004', false, 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });
}

module.exports = {
    BackendClient
};