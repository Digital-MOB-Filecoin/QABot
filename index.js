const fs = require('fs')
const crypto = require('crypto')
const lotus = require('./lotus');
var uniqueFilename = require('unique-filename')

let retrievingDataArray = new Array;
let topMinersList = new Array;
let storagePendingDeals = new Array;

const RETRIVING_ARRAY_MAX_SIZE = 1000000 //items
const BUFFER_SIZE = 65536 //64KB
const MIN_MINER_POWER = 1 //790273982464(736 GiB) //ex
const FILE_SIZE_SMALL = 104857600   //(100MB)
const FILE_SIZE_MEDIUM = 1073741824  //(1GB)
const FILE_SIZE_LARGE = 5368709120  // (5GB)


function INFO(msg) {
  console.log('\x1b[32m', '[ INFO ] ', '\x1b[0m', msg);
}

function ERROR(msg) {
  console.log('\x1b[31m', '[ ERR  ] ', '\x1b[0m', msg);
}

function WARNING(msg) {
  console.log('\x1b[33m', '[ WARN ] ', '\x1b[0m', msg);
}

function RandomTestFilePath() {
  const path = require('path');
  return path.join(process.env.HOME,uniqueFilename('.', 'qab-testfile'));
}

function RandomTestFileSize() {
  return FILE_SIZE_SMALL; //TODO: generate random size [FILE_SIZE_SMALL,FILE_SIZE_MEDIUM,FILE_SIZE_LARGE]
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

            lotus.ClientImport(filePath).then(dataCid => {
              INFO("ClientImport : " + dataCid);

              lotus.ClientStartDeal("bafkreih7ojhsmt6lzljynwrvyo5gggi2wwxa75fdo3fztpiixbtcagbxmi",
                miner, data.result.Ask.Price, 10).then(data => {
                  INFO("ClientStartDeal: " + data);

                  //data -> dealCid, miner, filePath, fileHash
                  storagePendingDeals.push({
                    dealCid: data,
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
      console.log(data);
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
  var it = 0;
  while (it < topMinersList.length) {
    await StorageDeal(topMinersList[it].address);
    it++;
  }
}

function StorageDealStatus(dealCid) {
  return new Promise(function (resolve, reject) {
    lotus.ClientGetDealInfo(dealCid).then(data => {
      INFO("ClientGetDealInfo: " + data);

      //if status success add to retriveDealsList, report to BE , delete test file, remove from storagePendingDeals
      //if failed report to BE , delete test file, remove from storagePendingDeals
      //if status pending return

      resolve(true);

    }).catch(error => {
      ERROR(error);
      resolve(false);
    });
  })
}

async function CheckPendingStorageDeals() {
  var it = 0;
  while (it < storagePendingDeals.length) {
    await StorageDealStatus(storagePendingDeals[it].dealCid);
    it++;
  }
}

LoadTopMiners().then(
  () => RunStorageDeals().then(
    () => CheckPendingStorageDeals().then(
      () => { })));

function shutdown() {
  INFO(`Shutdown`);
  process.exit();
}
// listen for TERM signal .e.g. kill
process.on('SIGTERM', shutdown);
// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutdown);
