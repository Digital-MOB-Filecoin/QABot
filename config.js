'use strict';

module.exports = {
  bot: {
    import: process.env.BOT_IMPORT_PATH || '/root/import/',
    retrieve: process.env.BOT_RETRIEVE_PATH || '/root/retrieve/',
    mode: process.env.BOT_MODE || 'retrieve', // or retrieve
    index: process.env.BOT_INDEX || 0, // current bot index
    total: process.env.BOT_TOTAL || 1, // total number of bots
  },
  backend_dev: {
    api: process.env.BACKEND_API || 'https://competition-backend.dev.interplanetary.one/api/',
    token: process.env.BACKEND_TOKEN || 'eyJpZCI6Miwic2VydmljZV90b2tlbiI6InNlcnZpY2VfdG9rZW4ifQ==',
  },
  backend: {
    api: process.env.BACKEND_API || 'https://api.calibration.spacerace.filecoin.io/api/',
    token: process.env.BACKEND_TOKEN || 'eyJpZCI6Miwic2VydmljZV90b2tlbiI6IkRYMm5KbUJ0SGZTNFN5OXAifQ==',
  },
  lotus: {
    api: process.env.LOTUS_API || 'http://64.227.17.40:1234/rpc/v0',
    token: process.env.LOTUS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.qjzwrdDtfrTGqBP0vYMdmQhV29_X--yHHtb6wXmDuf0',
  },
  prometheus: {
    api: process.env.PUSHGATEWAY_API || 'http://127.0.0.1:9091',
  }
};