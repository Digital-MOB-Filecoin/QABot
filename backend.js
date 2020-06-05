'use strict';

const config = require('./config');

function GetMiners() {
    const axios = require('axios');
    return axios.get(config.backend.api + 'miner')
}

function SaveDeal(miner_id, type, success, message) {
    const axios = require('axios');

    return axios.post(config.backend.api + 'miner/deal',
        {
            miner_id: miner_id,
            type: type,
            success: success,
            message: message,
        })
}

function SaveStoreDeal(miner_id, success, message) {
    return SaveDeal(miner_id, 'store', success, message)
}

function SaveRetrieveDeal(miner_id, success, message) {
    return SaveDeal(miner_id, 'retrieve', success, message)
}

var args = process.argv.slice(2);
if (args[0] === 'test') {
    GetMiners().then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    SaveStoreDeal('t0239267', true, 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });

    SaveRetrieveDeal('t0239267', true, 'test').then(response => {
        console.log(response.data);
        console.log(response.status);
    }).catch(error => {
        console.log(error);
    });
}

module.exports = {
  GetMiners,
  SaveStoreDeal,
  SaveRetrieveDeal
};