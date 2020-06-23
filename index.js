const fs = require('fs')
const crypto = require('crypto')
const lotus = require('./lotus');
const backend = require('./backend');
const isIPFS = require('is-ipfs');
const config = require('./config');


var uniqueFilename = require('unique-filename')

let stop = false;
let topMinersList = new Array;
let storageDealsMap = new Map();
let retriveDealsMap = new Map();

let statsStorageDealsPending = 0;
let statsStorageDealsSuccessful = 0;
let statsStorageDealsFailed = 0;
let statsRetrieveDealsSuccessful = 0;
let statsRetrieveDealsFailed = 0;

const RETRIVING_ARRAY_MAX_SIZE = 1000000 //items
const BUFFER_SIZE = 65536 //64KB
const MIN_MINER_POWER = 1 //790273982464(736 GiB) //ex
const FILE_SIZE_EXTRA_SMALL = 100
const FILE_SIZE_SMALL = 104857600   //(100MB)
const FILE_SIZE_MEDIUM = 1073741824  //(1GB)
const FILE_SIZE_LARGE = 5368709120  // (5GB)
const MAX_PENDING_STORAGE_DEALS = 100;

const dealStates = [
  'StorageDealUnknown',
  'StorageDealProposalNotFound',
  'StorageDealProposalRejected',
  'StorageDealProposalAccepted',
  'StorageDealStaged',
  'StorageDealSealing',
  'StorageDealActive',
  'StorageDealFailing',
  'StorageDealNotFound',
  // Internal
  'StorageDealFundsEnsured',          // Deposited funds as neccesary to create a deal, ready to move forward
  'StorageDealWaitingForDataRequest', // Client is waiting for a request for the deal data
  'StorageDealValidating',            // Verifying that deal parameters are good
  'StorageDealAcceptWait',            // Deciding whether or not to accept the deal
  'StorageDealTransferring',          // Moving data
  'StorageDealWaitingForData',        // Manual transfer
  'StorageDealVerifyData',            // Verify transferred data - generate CAR / piece data
  'StorageDealEnsureProviderFunds',   // Ensuring that provider collateral is sufficient
  'StorageDealEnsureClientFunds',     // Ensuring that client funds are sufficient
  'StorageDealProviderFunding',       // Waiting for funds to appear in Provider balance
  'StorageDealClientFunding',         // Waiting for funds to appear in Client balance
  'StorageDealPublish',               // Publishing deal to chain
  'StorageDealPublishing',            // Waiting for deal to appear on chain
  'StorageDealError',                 // deal failed with an unexpected error
  'StorageDealCompleted',             // on provider side, indicates deal is active and info for retrieval is recorded
]

function INFO(msg) {
  console.log('\x1b[32m', '[ INFO ] ', '\x1b[0m', msg);
}

function ERROR(msg) {
  console.log('\x1b[31m', '[ ERROR  ] ', '\x1b[0m', msg);
}

function WARNING(msg) {
  console.log('\x1b[33m', '[ WARN ] ', '\x1b[0m', msg);
}

function PASSED(type, miner, msg) {
  const util = require('util');

  let line = util.format('[%s][%s] %s', type, miner, msg);
  console.log('\x1b[36m', '[ PASSED ] ', '\x1b[0m', line);
}

function FAILED(type, miner, msg) {
  const util = require('util');

  let line = util.format('[%s][%s] %s', type, miner, msg);
  console.log('\x1b[31m', '[ FAILED ] ', '\x1b[0m', line);
}

function RemoveLineBreaks(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm, "");
}

function RandomTestFilePath() {
  const path = require('path');
  return path.join(process.env.HOME,uniqueFilename('.', 'qab-testfile'));
}

function RandomTestFileSize() {
  return FILE_SIZE_LARGE; //TODO: generate random size [FILE_SIZE_SMALL,FILE_SIZE_MEDIUM,FILE_SIZE_LARGE]
}

function GenerateTestFile(filePath, size) {
  const fd = fs.openSync(filePath, 'w');
  const hash = crypto.createHash('sha256');

  var start = new Date();

  try {
    for (i = 0; i < size / BUFFER_SIZE; i++) {
      const buffer = crypto.randomBytes(BUFFER_SIZE);
      var bytesWritten = fs.writeSync(fd, buffer, 0, BUFFER_SIZE);
      hash.update(buffer.slice(0, bytesWritten));
    }

  } finally {
    fs.closeSync(fd);
  }

  var testFileHash = hash.digest('hex');
  var end = new Date() - start;

  INFO(`GenerateTestFile: ${filePath} size: ${size} sha256: ${testFileHash}`);
  console.log('GenerateTestFile Execution time: %dms', end);

  return testFileHash;
}

function DeleteTestFile(filename) {
  try {
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename);
      INFO("DeleteTestFile : " + filename);
    }
  } catch (err) {
    ERROR(err)
  }
}

async function LoadMiners() {
  let tmpMinersList = new Array;
  let bBreak = false;
  let count = 0;
  let skip = 0;

  do {
    await backend.GetMiners(skip).then(response => {
      if (response.status == 200 && response.data && response.data.items) {
        let i = 0;
        response.data.items.forEach(miner => {
          i++;
          if (miner.id && miner.power) {
            tmpMinersList.push({
              address: miner.id,
              power: miner.power
            })
          }
        });

        count = response.data.count;
        skip = tmpMinersList.length;
      }
    }).catch(error => {
      console.log(error);
      bBreak = true;
    });

    if (bBreak)
      break;
  }
  while (tmpMinersList.length < count);

  if (tmpMinersList.length) {
    topMinersList.length = 0;
    topMinersList = [...tmpMinersList];
  }

  INFO("topMinersList: " + topMinersList.length);
}

function CalculateStorageDealPrice(askPrice) {
  const BigNumber = require('bignumber.js');

  let x = new BigNumber(askPrice);
  let y = new BigNumber(1000000000000000000);
  return x.dividedBy(y).toString(10);
}

function StorageDeal(miner) {
  return new Promise(function (resolve, reject) {

    INFO("StorageDeal [" + miner + "]");
    lotus.StateMinerInfo(miner).then(data => {
      if (data.result && data.result.PeerId) {
        let peerId;
        let sectorSize = data.result.SectorSize;

        if (isIPFS.multihash(data.result.PeerId)) {
          peerId = data.result.PeerId
        } else {
          const PeerId = require('peer-id');
          const binPeerId = Buffer.from(data.result.PeerId, 'base64');
          const strPeerId = PeerId.createFromBytes(binPeerId);

          peerId = strPeerId.toB58String();
        }

        INFO("StateMinerInfo [" + miner + "] PeerId: " + peerId);
        lotus.ClientQueryAsk(peerId, miner).then(data => {
          if (data.error) {
            ERROR("ClientQueryAsk : " + JSON.stringify(data));
            //FAILED -> send result to BE
            INFO('StoreDeal', miner, 'ClientQueryAsk failed : ' + data.error.message);
            backend.SaveStoreDeal(miner, false, 'ClientQueryAsk failed : ' + data.error.message);
            statsStorageDealsFailed++;
            resolve(false);
          } else if (data.result && data.result.Ask && data.result.Ask.Price) {
            INFO("ClientQueryAsk : " + JSON.stringify(data));
            let price = CalculateStorageDealPrice(data.result.Ask.Price);
            //generate new file
            var filePath = RandomTestFilePath();
            var size = RandomTestFileSize();

            if (size > sectorSize) {
              ERROR(`GenerateTestFile size: ${size} SectorSize: ${sectorSize}`);
              size = sectorSize / 2; // TODO remove
            }

            var fileHash = GenerateTestFile(filePath, size);

            lotus.ClientImport(filePath).then(data => {
              const { '/': dataCid }  = data.result;

              INFO("ClientImport : " + dataCid);
              INFO("Before ClientStartDeal: " + dataCid + " " + miner + " " + price + " 10000");

              lotus.ClientStartDeal(dataCid,
                miner, price, '10000').then(data => {
                  var dealCid = RemoveLineBreaks(data);
                  INFO("ClientStartDeal: " + dealCid);

                  if (!storageDealsMap.has(dealCid)) {
                    storageDealsMap.set(dealCid, {
                      dataCid: dataCid,
                      miner: miner,
                      filePath: filePath,
                      fileHash: fileHash,
                      timestamp: Date.now()
                    })
                  }

                  resolve(true);
                }).catch(error => {
                  ERROR(error);
                  resolve(false);
                });
            }).catch(error => {
              ERROR(error);
              resolve(false);
            });
          }
        }).catch(error => {
          ERROR(error);
          resolve(false);
        });
      } else {
        ERROR("StateMinerInfo : " + JSON.stringify(data));
        resolve(false);
      }
    }).catch(error => {
      ERROR(error);
      resolve(false);
    });
  })
}

async function StoreDeal2(miner) {
  INFO("StorageDeal [" + miner + "]");
  try {
    const minerInfo = await lotus.StateMinerInfo(miner);

    let peerId;
    let sectorSize = data.result.SectorSize;

    if (isIPFS.multihash(data.result.PeerId)) {
      peerId = data.result.PeerId;
    } else {
      const PeerId = require('peer-id');
      const binPeerId = Buffer.from(data.result.PeerId, 'base64');
      const strPeerId = PeerId.createFromBytes(binPeerId);

      peerId = strPeerId.toB58String();
    }

    INFO("StateMinerInfo [" + miner + "] PeerId: " + peerId);

    const askResponse = await lotus.ClientQueryAsk(peerId, miner);
    if (askResponse.error) {
      ERROR("ClientQueryAsk : " + JSON.stringify(askResponse));
      //FAILED -> send result to BE
      INFO('StoreDeal', miner, 'ClientQueryAsk failed : ' + askResponse.error.message);
      backend.SaveStoreDeal(miner, false, 'ClientQueryAsk failed : ' + askResponse.error.message);
      statsStorageDealsFailed++;
    } else {

      //generate new file
      var filePath = RandomTestFilePath();
      var size = RandomTestFileSize();

      if (size > sectorSize) {
        ERROR(`GenerateTestFile size: ${size} SectorSize: ${sectorSize}`);
        size = sectorSize / 2; // TODO remove
      }

      var fileHash = GenerateTestFile(filePath, size);

      const importData = await lotus.ClientImport(filePath);
      const { '/': dataCid } = importData.result;
      INFO("ClientImport : " + dataCid);

      const walletDefault = await lotus.WalletDefaultAddress();
      const wallet = walletDefault.result;

      const epochPrice = '500000000';//'2600';

      const dataRef = {
        Data: {
          TransferType: 'graphsync',
          Root: {
            '/': dataCid
          },
          PieceCid: null,
          PieceSize: 0
        },
        Wallet: wallet,
        Miner: miner,
        EpochPrice: epochPrice,
        MinBlocksDuration: 10000
      }

      const dealData = await lotus.ClientStartDeal2(dataRef);
      const { '/': proposalCid } = dealData.result;

      INFO("ClientStartDeal: " + proposalCid);

      if (!storageDealsMap.has(proposalCid)) {
        storageDealsMap.set(proposalCid, {
          dataCid: dataCid,
          miner: miner,
          filePath: filePath,
          fileHash: fileHash,
          timestamp: Date.now()
        })
      }
    }

  } catch (e) {
    ERROR('Error: ' + e.message);
  }
}

async function RetrieveDeal(dataCid, retrieveDeal) {
    INFO("RetrieveDeal [" + dataCid + "]");
    let outFile = RandomTestFilePath();

    const walletDefault = await lotus.WalletDefaultAddress();
    const wallet = walletDefault.result;

    console.log(wallet);

    const findData = await lotus.ClientFindData(dataCid)

    const o = findData.result[0];

    if (findData.result) {
      const retrievalOffer = {
        Root: dataCid,
        Size: o.Size,
        Total: o.MinPrice,
        PaymentInterval: o.PaymentInterval,
        PaymentIntervalIncrease: o.PaymentIntervalIncrease,
        Client: wallet,
        Miner: o.Miner,
        MinerPeerID: o.MinerPeerID
      }

      await lotus.ClientRetrieve(retrievalOffer, outFile).then(data => {
          INFO(JSON.stringify(data));
          var hash = SHA256FileSync(outFile);
          INFO("RetrieveDeal [" + dataCid + "] SHA256: " + hash);
          if (hash == retrieveDeal.fileHash) {
            //PASSED -> send result to BE
            PASSED('RetrieveDeal', retrieveDeal.miner, 'success outFile:' + outFile + 'sha256:' + hash);
            backend.SaveRetrieveDeal(retrieveDeal.miner, true, 'success');
    
            statsRetrieveDealsSuccessful++;
            DeleteTestFile(retrieveDeal.filePath);
            retriveDealsMap.delete(dataCid);
          }
          else {
            //FAILED -> send result to BE
            FAILED('RetrieveDeal', retrieveDeal.miner, 'hash check failed outFile:' + outFile + ' sha256:' + hash + ' original sha256:' + retrieveDeal.fileHash);
            backend.SaveRetrieveDeal(retrieveDeal.miner, false, 'hash check failed');
    
            statsRetrieveDealsFailed++;
            DeleteTestFile(retrieveDeal.filePath);
            retriveDealsMap.delete(dataCid);
          }
        }).catch(error => {
          ERROR(error);
        });
    }
}




function SHA256File(path) {
  return new Promise((resolve, reject) => {
    const output = crypto.createHash('sha256')
    const input = fs.createReadStream(path)

    input.on('error', (err) => {
      reject(err)
    })

    output.once('readable', () => {
      resolve(output.read().toString('hex'))
    })

    input.pipe(output)
  })
}

function SHA256FileSync(path) {
  const fd = fs.openSync(path, 'r')
  const hash = crypto.createHash('sha256')
  const buffer = Buffer.alloc(BUFFER_SIZE)

  try {
    let bytesRead

    do {
      bytesRead = fs.readSync(fd, buffer, 0, BUFFER_SIZE)
      hash.update(buffer.slice(0, bytesRead))
    } while (bytesRead === BUFFER_SIZE)
  } finally {
    fs.closeSync(fd)
  }

  return hash.digest('hex')
}

function DealTimeout(timestamp) {
  var timeDifference = Math.abs(Date.now() - timestamp);

  if (timeDifference > 1000 * 3600 * 48) //48 hours
    return true;

  return false;
}

async function RunStorageDeals() {
    var it = 0;
    while (!stop && (it < topMinersList.length)) {
      if (storageDealsMap.size > MAX_PENDING_STORAGE_DEALS) {
        INFO("RunStorageDeals pending storage deals = MAX_PENDING_STORAGE_DEALS");
        break;
      }

      await StorageDeal2(topMinersList[it].address);
      await pause(1000);
      it++;
    }
}

async function RunRetriveDeals() {
  for (const [key, value] of retriveDealsMap.entries()) {
    if (stop)
     break;

    await RetrieveDeal(key, value);
    await pause(1000);
  }
}

function StorageDealStatus(dealCid, pendingStorageDeal) {
  return new Promise(function (resolve, reject) {
    lotus.ClientGetDealInfo(dealCid).then(data => {
      if (data && data.result && data.result.State) {

        INFO("ClientGetDealInfo [" + dealCid + "] State: " + dealStates[data.result.State] + " dataCid: " + pendingStorageDeal.dataCid);
        INFO("ClientGetDealInfo: " + JSON.stringify(data));


        if (dealStates[data.result.State] == "StorageDealActive") {

          statsStorageDealsSuccessful++;

          //DeleteTestFile(pendingStorageDeal.filePath); TODO

          if (!retriveDealsMap.has(pendingStorageDeal.dataCid)) {
            retriveDealsMap.set(pendingStorageDeal.dataCid, {
              miner: pendingStorageDeal.miner,
              filePath: pendingStorageDeal.filePath,
              fileHash: pendingStorageDeal.fileHash,
              timestamp: Date.now()
            })
          }


          //PASSED -> send result to BE
          PASSED('StoreDeal', pendingStorageDeal.miner, 'success dataCid:' + pendingStorageDeal.dataCid, 'dealCid:' + pendingStorageDeal.dealCid);
          backend.SaveStoreDeal(pendingStorageDeal.miner, true, 'success');

          storageDealsMap.delete(dealCid);
        } else if (dealStates[data.result.State] == "StorageDealCompleted") {
          if (retriveDealsMap.has(pendingStorageDeal.dataCid)) {
            retriveDealsMap.delete(pendingStorageDeal.dataCid);
          }

          storageDealsMap.delete(dealCid);
          DeleteTestFile(pendingStorageDeal.filePath);
        } else if (dealStates[data.result.State] == "StorageDealStaged") {
          //DeleteTestFile(pendingStorageDeal.filePath); TODO
        } else if (dealStates[data.result.State] == "StorageDealSealing") {
          //DeleteTestFile(pendingStorageDeal.filePath); TODO
        } else if (dealStates[data.result.State] == "StorageDealError") {
          //FAILED -> send result to BE
          FAILED('StoreDeal', pendingStorageDeal.miner, 'state StorageDealError');
          backend.SaveStoreDeal(pendingStorageDeal.miner, false, 'state StorageDealError');

          statsStorageDealsFailed++;
          DeleteTestFile(pendingStorageDeal.filePath);
          storageDealsMap.delete(dealCid);
        } else if (DealTimeout(pendingStorageDeal.timestamp)) {
          //FAILED -> send result to BE
          FAILED('StoreDeal', pendingStorageDeal.miner, 'timeout in state: ' + dealStates[data.result.State]);
          backend.SaveStoreDeal(pendingStorageDeal.miner, false, 'timeout in state: ' + dealStates[data.result.State]);

          storageDealsMap.delete(dealCid);
          statsStorageDealsFailed++;
          DeleteTestFile(pendingStorageDeal.filePath);
        }

        resolve(true);
      } else {
        WARNING("ClientGetDealInfo: " + JSON.stringify(data));
        resolve(false);
      }
    }).catch(error => {
      ERROR(error);
      resolve(false);
    });
  })
}

async function CheckPendingStorageDeals() {
  statsStorageDealsPending = storageDealsMap.size;
  for (const [key, value] of storageDealsMap.entries()) {
    if (stop)
     break;

     await StorageDealStatus(key, value);
     await pause(100);
  }
}

function SectorLifeCycle(miner) {

}

function RunSLCCheck() {

}

function PrintStats() {
  INFO("*****************STATS*****************");
  INFO("StorageDeals: TOTAL : " + (statsStorageDealsPending + statsStorageDealsSuccessful + statsStorageDealsFailed));
  INFO("StorageDeals: PENDING : " + statsStorageDealsPending);
  INFO("StorageDeals: SUCCESSFUL : " + statsStorageDealsSuccessful);
  INFO("StorageDeals: FAILED : " + statsStorageDealsFailed);

  INFO("RetrieveDeals: TOTAL : " + (statsRetrieveDealsSuccessful + statsRetrieveDealsFailed));
  INFO("RetrieveDeals: SUCCESSFUL : " + statsRetrieveDealsSuccessful);
  INFO("RetrieveDeals: FAILED : " + statsRetrieveDealsFailed);
  INFO("***************************************")
}

const pause = (timeout) => new Promise(res => setTimeout(res, timeout));

const mainLoop = async _ => {
  while (!stop) {
    await LoadMiners();
    await RunStorageDeals();
    await CheckPendingStorageDeals();
    await RunRetriveDeals();
    await pause(2000);

    PrintStats();
  }
};

mainLoop();

function shutdown() {
  stop = true;

  setTimeout(() => { 
    INFO(`Shutdown`);
    process.exit(); 
  }, 3000);
}
// listen for TERM signal .e.g. kill
process.on('SIGTERM', shutdown);
// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutdown);
