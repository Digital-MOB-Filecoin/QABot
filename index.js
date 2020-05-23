const fs = require('fs')
const crypto = require('crypto')
const lotus = require('./lotus');
var uniqueFilename = require('unique-filename')

let stop = false;
let retrievingDataArray = new Array;
let topMinersList = new Array;
let pendingStorageDeals = new Array;

const RETRIVING_ARRAY_MAX_SIZE = 1000000 //items
const BUFFER_SIZE = 65536 //64KB
const MIN_MINER_POWER = 1 //790273982464(736 GiB) //ex
const FILE_SIZE_EXTRA_SMALL = 100
const FILE_SIZE_SMALL = 104857600   //(100MB)
const FILE_SIZE_MEDIUM = 1073741824  //(1GB)
const FILE_SIZE_LARGE = 5368709120  // (5GB)
const MAX_PENDING_STORAGE_DEALS = 5;

const dealStates = [
"StorageDealUnknown",
"StorageDealProposalNotFound",
"StorageDealProposalRejected",
"StorageDealProposalAccepted",
"StorageDealAcceptWait",
"StorageDealStaged",
"StorageDealSealing",
"StorageDealActive",
"StorageDealFailing",
"StorageDealNotFound",
"StorageDealFundsEnsured",
"StorageDealWaitingForDataRequest",
"StorageDealValidating",
"StorageDealTransferring",
"StorageDealWaitingForData",
"StorageDealVerifyData",
"StorageDealEnsureProviderFunds",
"StorageDealEnsureClientFunds",
"StorageDealProviderFunding",
"StorageDealClientFunding",
"StorageDealPublish",
"StorageDealPublishing",
"StorageDealError",
"StorageDealCompleted"
]


function INFO(msg) {
  console.log('\x1b[32m', '[ INFO ] ', '\x1b[0m', msg);
}

function ERROR(msg) {
  console.log('\x1b[31m', '[ ERR  ] ', '\x1b[0m', msg);
}

function WARNING(msg) {
  console.log('\x1b[33m', '[ WARN ] ', '\x1b[0m', msg);
}

function RemoveLineBreaks(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm, "");
}

function RandomTestFilePath() {
  const path = require('path');
  return path.join(process.env.HOME,uniqueFilename('.', 'qab-testfile'));
}

function RandomTestFileSize() {
  return FILE_SIZE_EXTRA_SMALL; //TODO: generate random size [FILE_SIZE_SMALL,FILE_SIZE_MEDIUM,FILE_SIZE_LARGE]
}

function GenerateTestFile(filePath) {
  var size = RandomTestFileSize();

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

  INFO(`GenerateTestFile: ${filePath} sha256: ${testFileHash}`);
  console.log('GenerateTestFile Execution time: %dms', end);

  return testFileHash;
}

function DeleteTestFile(filename) {
  try {
    fs.unlinkSync(filename);
    INFO("DeleteTestFile : " + filename);
  } catch(err) {
    ERROR(err)
  }
}

function GetTopMiners() {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvMiners = createCsvWriter({
    path: 'qabminers.csv',
    header: [
      { id: 'address', title: 'ADDRESS' },
      { id: 'power', title: 'POWER' }
    ]
  });

  lotus.StateListMiners().then(json => {
    json.result.reduce((previousPromise, miner) => {
      return previousPromise.then(() => {
        return lotus.StateMinerPower(miner).then(data => {
          if (data.result.MinerPower.QualityAdjPower > 0) {
            const records = [
              { address: miner, power: data.result.MinerPower.QualityAdjPower }
            ];

            topMinersList.push({
              address: miner,
              power: data.result.MinerPower.QualityAdjPower
            })

            csvMiners.writeRecords(records);
            INFO(miner + " power: " + data.result.MinerPower.QualityAdjPower);
          }
        }).catch(error => {
          ERROR(error);
        });
      });
    }, Promise.resolve());

  }).catch(error => {
    ERROR(error);
  });
}

function LoadTopMiners() {
  return new Promise(function (resolve, reject) {
    const csv = require('csv-parser')
    const fs = require('fs')
    const results = [];
    topMinersList = [];

    fs.createReadStream('qabminers1.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        results.forEach(miner => {
          topMinersList.push({
            address: miner.ADDRESS,
            power: miner.POWER
          })
        });

        INFO("topMinersList: " + topMinersList.length);
        resolve(true);
      });
  })
}

function StorageDeal(miner) {
  return new Promise(function (resolve, reject) {

    INFO("StorageDeal [" + miner + "]");
    lotus.StateMinerInfo(miner).then(data => {
      INFO("StateMinerInfo [" + miner + "] PeerId: " + data.result.PeerId);
      if (data.result.PeerId) {
        lotus.ClientQueryAsk(data.result.PeerId, miner).then(data => {
          if (data.error) {
            ERROR("ClientQueryAsk : " + JSON.stringify(data));
            resolve(false);
          } else if (data.result && data.result.Ask && data.result.Ask.Price) {
            INFO("ClientQueryAsk : " + JSON.stringify(data));
            //generate new file
            var filePath = RandomTestFilePath();
            var fileHash = GenerateTestFile(filePath);

            lotus.ClientImport(filePath).then(data => {
              var dataCid = RemoveLineBreaks(data);
              INFO("ClientImport : " + dataCid);

              INFO("Before ClientStartDeal: " + dataCid + " " + miner + " " + "0.0000000005" + " 10000");

              lotus.ClientStartDeal(dataCid,
                miner, "0.0000000005", 10000).then(data => {
                  var dealCid = RemoveLineBreaks(data);
                  INFO("ClientStartDeal: " + dealCid);

                  //data -> dealCid, miner, filePath, fileHash
                  pendingStorageDeals.push({
                    dealCid: dealCid,
                    miner: miner,
                    filePath: filePath,
                    fileHash: fileHash
                  })

                  //DeleteTestFile(filePath); delete after deal state update

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
      }
    }).catch(error => {
      ERROR(error);
      resolve(false);
    });
})

  //lotus client deal QmPgU56srbA36kzQQP4oQDVASkL4nTYjnf23kosZ2jaN79 t044688 0.0000000005 3840 
  //   returns: bafyreigurzq3gsodgwukadzqfn6fay7bfwz3gimzxuyzn6j4lmeumeupyu [59]
  // lotus client list-deals

}

function RetrievalDeal(dataCid) {
  return new Promise(function (resolve, reject) {
    INFO("RetrievalDeal [" + dataCid + "]");
    outFile = RandomTestFilePath();

    lotus.ClientRetrieve("dataCid", outFile).then(data => {
      console.log(RemoveLineBreaks(data));
      var hash = SHA256FileSync(retrievingDataItem.filename);
      INFO("RetrievalDeal [" + dataCid + "] SHA256: " + hash);
      /*if (hash == retrievingDataItem.hash) {
        INFO(`Retrieved successfully : ${testFileName} sha256: ${hash}`);
      }
      else {
        WARNING(`Retrieving test failed for : ${testFileName} sha256: ${hash}`);
      }*/
    }).catch(error => {
      ERROR(error);
    });
  })
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

function readyToRetrieve(item) {
  var timeDifference = Math.abs(Date.now() - item.timestamp);

  if (timeDifference > 1000 * 10) //10 sec
    return true;

  return false;
}

async function RunStorageDeals() {

  if (pendingStorageDeals.length <= MAX_PENDING_STORAGE_DEALS) {
    var it = 0;
    while (!stop && (it < topMinersList.length)) {
      await StorageDeal(topMinersList[it].address);
      it++;
    }
  }
}

function StorageDealStatus(pendingStorageDeal) {
  return new Promise(function (resolve, reject) {
    INFO("StorageDealStatus: " + pendingStorageDeal.dealCid);
    lotus.ClientGetDealInfo(pendingStorageDeal.dealCid).then(data => {

      if (data && data.result && data.result.State) {

        INFO("ClientGetDealInfo [" + pendingStorageDeal.dealCid + "] State: " + dealStates[data.result.State]);
        INFO("ClientGetDealInfo: " + JSON.stringify(data));

        if (dealStates[data.result.State] == "StorageDealSealing") {
          DeleteTestFile(pendingStorageDeal.filePath);
        }

        //"StorageDeal" + 

        //[ INFO ]   ClientGetDealInfo: {"jsonrpc":"2.0","result":{"ProposalCid":{"/":"bafyreigj7s2e62d3ey6oydr5clkfvcjhohstjlfxt6crgycntf6w64hbmy"},"State":18,"Message":"","Provider":"t03150","PieceCID":{"/":"bafk4chzadcoymvhvdzdzvmipm3uwapw5nebvj4orwqe7tmjjxxqerc6xymzq"},"Size":130048,"PricePerEpoch":"500000000","Duration":13129,"DealID":0},"id":0}

        //if status success add to retriveDealsList, report to BE , delete test file, remove from pendingStorageDeals
        //if failed report to BE , delete test file, remove from pendingStorageDeals
        //if status pending return
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
  var it = 0;
  while (!stop && (it < pendingStorageDeals.length)) {
    await StorageDealStatus(pendingStorageDeals[it]);
    it++;
  }
}

const pause = () => new Promise(res => setTimeout(res, 1000));

const mainLoop = async _ => {
  await LoadTopMiners();

  while (!stop) {
    await RunStorageDeals();
    await CheckPendingStorageDeals();
    await pause();
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
