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

    async SaveDeal(miner_id, type, success, dataCid, dealCid, fileSize, hash, message, deal_created_at) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const MAX_LENGTH = 500;
        var trimmedMessage = message.length > MAX_LENGTH ?
            message.substring(0, MAX_LENGTH - 3) + "..." :
            message;

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${this.token}` }

        const data = {
            miner_id: miner_id,
            type: type,
            success: success,
            message: trimmedMessage,
            data_cid: dataCid,
            deal_cid: dealCid,
            deal_created_at: deal_created_at,
            file_size: parseInt(fileSize),
            hash: hash
        };

        let response;
        try {
            response = await axios.post(this.api + 'miner/deal', data);
        } catch (e) {
            console.error('Respose: ' + JSON.stringify(e.response.data));
        }

        return response;
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

    async SaveStoreDeal(miner_id, success, dataCid, dealCid, fileSize, hash, message, deal_created_at) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.SaveDeal(miner_id, 'store', success, dataCid, dealCid, fileSize, hash, message, deal_created_at);
    }

    async SaveRetrieveDeal(miner_id, success, dataCid, dealCid, fileSize, hash, message, deal_created_at) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return await this.SaveDeal(miner_id, 'retrieve', success, dataCid, dealCid, fileSize, hash, message, deal_created_at);
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

    backend.SaveStoreDeal('t03292', true, 'test', 'n/a', 0, 'test', 'test', Math.floor(Date.now()/1000)).then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    backend.SaveRetrieveDeal('t03292', true, 'test', 'n/a', 100, 'test', 'test', Math.floor(Date.now()/1000)).then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });


    backend.GetCids(0).then(response => {
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
    });

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