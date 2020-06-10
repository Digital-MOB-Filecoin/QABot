'use strict';

module.exports = {
  backend: {
    api: process.env.BACKEND_API || 'https://competition-backend.dev.interplanetary.one/api/',
  },
  lotus: {
    api: process.env.LOTUS_API || 'http://127.0.0.1:3999/rpc/v0',
  }
};