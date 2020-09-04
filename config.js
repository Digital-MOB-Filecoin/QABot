'use strict';

module.exports = {
  bot: {
    import: process.env.BOT_IMPORT_PATH || '/root/import/',
    retrieve: process.env.BOT_RETRIEVE_PATH || '/root/retrieve/',
    mode: process.env.BOT_MODE || 'retrieve', // or store or serial-retrieve
    index: process.env.BOT_INDEX || 0, // current bot index
    total: process.env.BOT_TOTAL || 1, // total number of bots
    min_daily_rate: process.env.MIN_DAILY_RATE || 10, //GB
    max_daily_rate: process.env.MAX_DAILY_RATE || 125, //GB
    startup_delay: process.env.STARTUP_DELAY || 0, //hours
    proposal_window: process.env.PROPOSAL_WINDOW || 3600, //seconds
    retrieval_window: process.env.RETRIEVAL_WINDOW || 3600, //seconds
    region: process.env.REGION || 'US-EAST', //bot region
    max_pending_retrieval_deals: process.env.MAX_PENDING_RETRIEVAL_DEALS || 200, 
    deal_epochs: process.env.DEAL_EPOCHS || 5760, //epochs for 48 hours
    startup_maintenance_delay: process.env.STARTUP_MAINTENANCE_DELAY || 0, //hours
  },
  backend_dev: {
    api: process.env.BACKEND_API || '',
    token: process.env.BACKEND_TOKEN || '',
  },
  backend: {
    api: process.env.BACKEND_API || '',
    token: process.env.BACKEND_TOKEN || '',
  },
  lotus: {
    api: process.env.LOTUS_API || '',
    token: process.env.LOTUS_TOKEN || '',
  },
  prometheus: {
    api: process.env.PUSHGATEWAY_API || 'http://127.0.0.1:9091',
  }
};