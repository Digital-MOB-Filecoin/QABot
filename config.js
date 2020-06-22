'use strict';

module.exports = {
  bot: {
    import: process.env.BOT_IMPORT_PATH || '/root/import',
    retrieve: process.env.BOT_RETRIEVE_PATH || '/root/retrieve',
  },
  backend: {
    api: process.env.BACKEND_API || 'https://competition-backend.dev.interplanetary.one/api/',
    token: process.env.BACKEND_TOKEN || 'eyJpZCI6Miwic2VydmljZV90b2tlbiI6InNlcnZpY2VfdG9rZW4ifQ==',
  },
  lotus: {
    api: process.env.LOTUS_API || 'http://127.0.0.1:3999/rpc/v0',
    token: process.env.LOTUS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.C0uuTLjRnMQth6J4jhs3FlA1kT9hprtPPxNYJYDaLY8',
  }
};