'use strict';

module.exports = {
  backend: {
    api: process.env.BACKEND_API || 'https://competition-backend.dev.interplanetary.one/api/',
    token: process.env.BACKEND_TOKEN || 'eyJpZCI6Miwic2VydmljZV90b2tlbiI6InNlcnZpY2VfdG9rZW4ifQ==',
  },
  lotus: {
    api: process.env.LOTUS_API || 'http://127.0.0.1:3999/rpc/v0',
  }
};