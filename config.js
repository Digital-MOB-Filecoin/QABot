'use strict';

module.exports = {
  backend: {
    api: process.env.BACKEND_API || 'https://competition-backend.dev.interplanetary.one/api/',
  }
  lotus: {
    api: process.env.LOTUS_API || 'http://127.0.0.1:1234/rpc/v0',
    token: process.env.LOTUS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.gYTvmJn6A2TpLgnRTJptetz4L3-HO54XZbDLWB0JzIQ',
  }
};