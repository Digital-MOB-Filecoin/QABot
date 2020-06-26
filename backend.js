'use strict';

const config = require('./config');

class BackendClient {
    constructor(dummyMode) {
        this.dummyMode = dummyMode;
    }

    Close() {
        return this.client.close();
    }

    static Shared(dummyMode = false) {
        if (!this.instance) {
            this.instance = new BackendClient(
                dummyMode,
            );
        }

        return this.instance;
    }

    GetMiners(skip) {
        const axios = require('axios');
        return axios.get(config.backend.api + 'miner/bot', {
            params: {
                all: true,
                skip: skip
            }
        })
    }

    SaveDeal(miner_id, type, success, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        const axios = require('axios');
        axios.defaults.headers.common = { 'Authorization': `Bearer ${config.backend.token}` }

        return axios.post(config.backend.api + 'miner/deal',
            {
                miner_id: miner_id,
                type: type,
                success: success,
                message: message,
            })
    }

    SaveStoreDeal(miner_id, success, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.SaveDeal(miner_id, 'store', success, message);
    }

    SaveRetrieveDeal(miner_id, success, message) {
        if (this.dummyMode)
            return Promise.resolve('dummy');

        return this.SaveDeal(miner_id, 'retrieve', success, message);
    }
}

var args = process.argv.slice(2);
if (args[0] === 'test') {
    const backend = BackendClient.Shared(true);

    backend.GetMiners().then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    backend.SaveStoreDeal('t01891', false, 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    backend.SaveRetrieveDeal('t01891', false, 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });
}

module.exports = {
    BackendClient
};