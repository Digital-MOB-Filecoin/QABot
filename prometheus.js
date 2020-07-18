const client = require('prom-client');
const config = require('./config');

let gateway = new client.Pushgateway(config.prometheus.api);

const gaugePendingStorageDeals = new client.Gauge({
    name: 'PendingStorageDeals',
    help: 'PendingStorageDeals',
});

const gaugeSuccessfulStorageDeals = new client.Gauge({
    name: 'SuccessfulStorageDeals',
    help: 'SuccessfulStorageDeals',
});

const gaugeFailedStorageDeals = new client.Gauge({
    name: 'FailedStorageDeals',
    help: 'FailedStorageDeals',
});

const gaugeSuccessfulRetrieveDeals = new client.Gauge({
    name: 'SuccessfulRetrieveDeals',
    help: 'SuccessfulRetrieveDeals',
});

const gaugeFailedRetrieveDeals = new client.Gauge({
    name: 'FailedRetrieveDeals',
    help: 'FailedRetrieveDeals',
});


function SetPendingStorageDeals(value) {
    gaugePendingStorageDeals.set(value);
    gateway.pushAdd({ jobName: 'stats' }, function (err, resp, body) {});
}

function SetSuccessfulStorageDeals(value) {
    gaugeSuccessfulStorageDeals.set(value);
    gateway.pushAdd({ jobName: 'stats' }, function (err, resp, body) {});
}

function SetFailedStorageDeals(value) {
    gaugeFailedStorageDeals.set(value);
    gateway.pushAdd({ jobName: 'stats' }, function (err, resp, body) {});
}

function SetSuccessfulRetrieveDeals(value) {
    gaugeSuccessfulRetrieveDeals.set(value);
    gateway.pushAdd({ jobName: 'stats' }, function (err, resp, body) {});
}

function SetFailedRetrieveDeals(value) {
    gaugeFailedRetrieveDeals.set(value);
    gateway.pushAdd({ jobName: 'stats' }, function (err, resp, body) {});
}

var args = process.argv.slice(2);

if (args[0] === 'test') {
    SetPendingStorageDeals(100);
    SetSuccessfulStorageDeals(150);
    SetFailedStorageDeals(2000);
    SetSuccessfulRetrieveDeals(300);
    SetFailedRetrieveDeals(400);

    gateway.pushAdd({ jobName: 'stats' }, function (err, resp, body) {});
}

module.exports = {
    SetPendingStorageDeals,
    SetSuccessfulStorageDeals,
    SetFailedStorageDeals,
    SetSuccessfulRetrieveDeals,
    SetFailedRetrieveDeals,
};