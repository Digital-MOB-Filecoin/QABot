const fs = require('fs')
const crypto = require('crypto')
const lotus = require('./lotus');
const prometheus = require('./prometheus');
const isIPFS = require('is-ipfs');
const config = require('./config');
const timestamp = require('time-stamp');
const perf = require('execution-time')();
const { FormatBytes, DealTimeout, TimeDifferenceInHours, TimeDifferenceInSeconds, Timeout } = require('./utils');
const { BackendClient } = require('./backend')
const { LotusWsClient } = require('./lotusws')
const { version } = require('./package.json');

var uniqueFilename = require('unique-filename')

let stop = false;
let topMinersList = new Array;
let cidsList = new Array;
let storageDealsMap = new Map();
let pendingRetriveDealsMap = new Map();
let minersMap = new Map();

let statsStorageDealsPending = 0;
let statsStorageDealsSuccessful = 0;
let statsStorageDealsFailed = 0;
let statsRetrieveDealsSuccessful = 0;
let statsRetrieveDealsFailed = 0;

const RETRIVING_ARRAY_MAX_SIZE = 1000000; //items
const BUFFER_SIZE = 65536; //64KB
const FILE_SIZE_EXTRA_SMALL = 100;
const FILE_SIZE_SMALL = 104857600;   //(100MB)
const FILE_SIZE_MEDIUM = 1073741824;  //(1GB)
const FILE_SIZE_LARGE = 5368709120;  // (5GB)
const MAX_PENDING_STORAGE_DEALS = 10000;
const MIN_DAILY_RATE = 5368709120; //5GB
const MAX_DAILY_RATE = 268435456000; //250GB
const HOUR = 3600;

let backend;
let slcHeight;

const args = require('args')
 
args
  .option('standalone', 'Run the Bot standalone', true)
  .option('standalone_minerlist', 'Get miner list from lotus', false)
  .option('cmdMode', 'Use lotus commands')
  .option('size', 'Test file size', FILE_SIZE_EXTRA_SMALL)
  .option('dev', 'Dev env', false)
  .option('slc', 'Enable/Disable slc', true)
  .option('slcHeight', 'SLC start height', 1)
 
const flags = args.parse(process.argv)

let backendConfig;
if (flags.dev) {
  backendConfig = config.backend_dev;
} else {
  backendConfig = config.backend;
}

if (flags.standalone) {
  backend = BackendClient.Shared(true, backendConfig);
} else {
  backend = BackendClient.Shared(false, backendConfig);
}

if (flags.slcHeight) {
  slcHeight = flags.slcHeight;
}

const pause = (timeout) => new Promise(res => setTimeout(res, timeout));

const dealStates = [
  'StorageDealUnknown',
	'StorageDealProposalNotFound',
	'StorageDealProposalRejected',
	'StorageDealProposalAccepted',
	'StorageDealStaged',
	'StorageDealSealing',
	'StorageDealRecordPiece',
	'StorageDealActive',
	'StorageDealExpired',
	'StorageDealSlashed',
	'StorageDealRejecting',
	'StorageDealFailing',
	'StorageDealFundsEnsured',
	'StorageDealCheckForAcceptance',
	'StorageDealValidating',
	'StorageDealAcceptWait',
	'StorageDealStartDataTransfer',
	'StorageDealTransferring',
	'StorageDealWaitingForData',
	'StorageDealVerifyData',
	'StorageDealEnsureProviderFunds',
	'StorageDealEnsureClientFunds',
	'StorageDealProviderFunding',
	'StorageDealClientFunding',
	'StorageDealPublish',
	'StorageDealPublishing',
	'StorageDealError',
]

function INFO(msg) {
  console.log(timestamp.utc('YYYY/MM/DD:mm:ss:ms'), '\x1b[32m', '[ INFO ] ', '\x1b[0m', msg);
}

function ERROR(msg) {
  console.log(timestamp.utc('YYYY/MM/DD:mm:ss:ms'), '\x1b[31m', '[ ERROR  ] ', '\x1b[0m', msg);
}

function WARNING(msg) {
  console.log(timestamp.utc('YYYY/MM/DD:mm:ss:ms'), '\x1b[33m', '[ WARN ] ', '\x1b[0m', msg);
}

function PASSED(type, miner, msg) {
  const util = require('util');

  let line = util.format('[%s][%s] %s', type, miner, msg);
  console.log(timestamp.utc('YYYY/MM/DD:mm:ss:ms'), '\x1b[36m', '[ PASSED ] ', '\x1b[0m', line);
}

function FAILED(type, miner, msg) {
  const util = require('util');

  let line = util.format('[%s][%s] %s', type, miner, msg);
  console.log(timestamp.utc('YYYY/MM/DD:mm:ss:ms'), '\x1b[31m', '[ FAILED ] ', '\x1b[0m', line);
}

function RemoveLineBreaks(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm, "");
}

function RandomTestFilePath(basePath) {
  const path = require('path');
  return uniqueFilename(basePath, 'qab-testfile');
}

function RandomTestFileSize() {
  return flags.size;
}

function GenerateTestFile(filePath, size) {
  const fd = fs.openSync(filePath, 'w');
  const hash = crypto.createHash('sha256');

  perf.start('GenerateTestFile');

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

  const results = perf.stop('GenerateTestFile');

  INFO(`GenerateTestFile: Execution time: ${results.time} ${filePath} size: ${FormatBytes(size)} sha256: ${testFileHash}`);

  return testFileHash;
}

function DeleteTestFile(filename) {
  try {
    if (fs.existsSync(filename)) {
      //fs.unlinkSync(filename);
      //INFO("DeleteTestFile : " + filename);
    }
  } catch (err) {
    ERROR(err)
  }
}

async function LoadRetrievalList() {
  let tmpCidsList = new Array;
  let bBreak = false;
  let count = 0;
  let skip = 0;

  do {
    await backend.GetCids(skip).then(response => {
      if (response.status == 200 && response.data && response.data.items) {
        let i = 0;
        response.data.items.forEach(item => {
          i++;
          if (item.data_cid && item.miner_id) {
            tmpCidsList.push({
              dataCid: item.data_cid,
              miner: item.miner_id,
              size: item.file_size,
              fileHash: item.hash
            })
          }
        });

        count = response.data.count;
        skip = tmpCidsList.length;
      }
    }).catch(error => {
      console.log(error);
      bBreak = true;
    });

    if (bBreak)
      break;
  }
  while (tmpCidsList.length < count);

  if (tmpCidsList.length) {
    cidsList.length = 0;
    cidsList = [...tmpCidsList];
  }

  INFO("cidsList: " + cidsList.length);
}

async function LoadMinersFromBackend() {
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
              peerId: '',
              power: miner.power,
              price: 0,
              sectorSize: 0,
              online: false
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

async function LoadMinersLotusWs() {
  const lotusWsClient = LotusWsClient.Shared();

  try {
    const miners = await lotusWsClient.StateListMiners();

    var minersSlice = miners;
    while (minersSlice.length) {
      await Promise.all(minersSlice.splice(0, 50).map(async (miner) => {
        const power = await lotusWsClient.StateMinerPower(miner);
        if (power.MinerPower.QualityAdjPower > 0) {
          topMinersList.push({
            address: miner,
            peerId: '',
            power: power.MinerPower.QualityAdjPower,
            price: 0,
            sectorSize: 0,
            online: false
          })
        }
      }));
    }

    lotusWsClient.Close();

    INFO("LoadMinersLotusWs topMinersList: " + topMinersList.length);

  } catch (e) {
    console.log('Error: ' + e.message);
  }
}

async function LoadMiners() {
  if (flags.standalone_minerlist) {
    return await LoadMinersLotusWs();
  } else {
    return await LoadMinersFromBackend();
  }
}

function CalculateStorageDealPrice(askPrice) {
  const BigNumber = require('bignumber.js');

  let x = new BigNumber(askPrice);
  let y = new BigNumber(1000000000000000000);
  return x.dividedBy(y).toString(10);
}

async function StorageDeal(minerData, cmdMode = false) {
  try {
    let miner = minerData.address;
    let sectorSize = minerData.sectorSize;
    let peerId = minerData.peerId;

    INFO("StorageDeal [" + miner + "]");

    //generate new file
    var filePath = RandomTestFilePath(config.bot.import);
    var size = RandomTestFileSize();

    if (size > sectorSize) {
      ERROR(`GenerateTestFile size: ${FormatBytes(size)} > SectorSize: ${FormatBytes(sectorSize)}`);
      size = sectorSize / 2; // TODO remove
    }

    var fileHash = GenerateTestFile(filePath, size);

    let parseImportData;
    const importData = await lotus.ClientImport(filePath);

    if (importData && importData.result && importData.result.Root) {
      parseImportData = importData.result.Root;
    } else if (importData && importData.result) {
      parseImportData = importData.result;
    }

    if (!parseImportData) {
      ERROR('ClientImport failed: ' + JSON.stringify(importData));
      DeleteTestFile(filePath);
      return;
    }

    const { '/': dataCid } = parseImportData;
    INFO("ClientImport : " + JSON.stringify(importData));

    let dealCid;

    if (cmdMode) {
      INFO("Before ClientStartDeal: " + dataCid + " " + miner + " " + CalculateStorageDealPrice(minerData.price) + " 700000");
      var response = await lotus.ClientStartDealCmd(dataCid, miner, CalculateStorageDealPrice(minerData.price), '700000');
      dealCid = RemoveLineBreaks(response);
    } else {
      const walletDefault = await lotus.WalletDefaultAddress();
      const wallet = walletDefault.result;
      const epochPrice = minerData.price;

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
        MinBlocksDuration: 700000
      }

      const dealData = await lotus.ClientStartDeal(dataRef);
      const { '/': proposalCid } = dealData.result;
      dealCid = proposalCid;
    }

    INFO("ClientStartDeal: " + dealCid);

    if (minersMap.has(miner)) {
      let minerData = minersMap.get(miner);
      minerData.currentProposedDeals++;
      minerData.currentProposedDealsSize = minerData.currentProposedDealsSize + size;
      minerData.totalProposedDeals++;
      minerData.totalProposedDealsSize = minerData.totalProposedDealsSize + size;
      minersMap.set(miner, minerData);
    }

    if (!storageDealsMap.has(dealCid)) {
      storageDealsMap.set(dealCid, {
        dataCid: dataCid,
        miner: miner,
        filePath: filePath,
        fileHash: fileHash,
        size: size,
        timestamp: Date.now()
      })
    }
  } catch (e) {
    ERROR('Error: ' + e.message);
  }
}

async function RetrieveDeal(dataCid, retrieveDeal, cmdMode = false) {
  INFO("RetrieveDeal [" + dataCid + "]");

  try {
    let outFile = RandomTestFilePath(config.bot.retrieve);
    const walletDefault = await lotus.WalletDefaultAddress();
    const wallet = walletDefault.result;
    const queryOffer = await lotus.ClientMinerQueryOffer(retrieveDeal.miner, dataCid);

    INFO(`ClientMinerQueryOffer [${retrieveDeal.miner},${dataCid}] ${JSON.stringify(queryOffer)}`);

    const o = queryOffer.result;

    if (queryOffer.result.Err) {
        ERROR(`ClientMinerQueryOffer [${retrieveDeal.miner},${dataCid}] ${JSON.stringify(queryOffer)}`);
        //FAILED -> send result to BE
        FAILED('RetrieveDeal', retrieveDeal.miner, dataCid + ';ClientMinerQueryOffer Err:' + JSON.stringify(queryOffer));
        backend.SaveRetrieveDeal(retrieveDeal.miner, false, dataCid, 'n/a', retrieveDeal.size, retrieveDeal.fileHash, 'ClientMinerQueryOffer Err:' + JSON.stringify(queryOffer));
  } else {
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

      const timeoutInSeconds = 1*60;//1*3600; // 1 hour lotus.ClientRetrieve timeout

      const timeoutPromise = Timeout(timeoutInSeconds);
      let data;

      pendingRetriveDealsMap.set(dataCid, {
        miner: retrieveDeal.miner,
        timestamp: Date.now()
      })

      if (cmdMode) {
        const response = await Promise.race([lotus.ClientRetrieveCmd(retrieveDeal.miner, dataCid, outFile), timeoutPromise]);
        data = RemoveLineBreaks(response);
      } else {
        data = await Promise.race([lotus.ClientRetrieve(retrievalOffer, outFile), timeoutPromise]);
      }

      INFO(JSON.stringify(data));

      pendingRetriveDealsMap.delete(dataCid);
      //backend.DeleteCid(dataCid);

      if (data === 'timeout') {
        FAILED('RetrieveDeal', retrieveDeal.miner, dataCid + `Filecoin.ClientRetrieve timeout ${timeoutInSeconds} Seconds`);
        backend.SaveRetrieveDeal(retrieveDeal.miner, false, dataCid, 'n/a', retrieveDeal.size, retrieveDeal.fileHash, `Filecoin.ClientRetrieve timeout ${timeoutInSeconds} Seconds`);

        statsRetrieveDealsFailed++;
        prometheus.SetFailedRetrieveDeals(statsRetrieveDealsFailed);
      } else if (data.error) {
        FAILED('RetrieveDeal', retrieveDeal.miner, dataCid + ';' + JSON.stringify(data.error));
        backend.SaveRetrieveDeal(retrieveDeal.miner, false, dataCid, 'n/a', retrieveDeal.size, retrieveDeal.fileHash, JSON.stringify(data.error));

        statsRetrieveDealsFailed++;
        prometheus.SetFailedRetrieveDeals(statsRetrieveDealsFailed);
      } else {
        var hash = SHA256FileSync(outFile);
        INFO("RetrieveDeal [" + dataCid + "] SHA256: " + hash);
        if (hash == retrieveDeal.fileHash) {
          //PASSED -> send result to BE
          PASSED('RetrieveDeal', retrieveDeal.miner, dataCid + ';success outFile:' + outFile + 'sha256:' + hash);
          backend.SaveRetrieveDeal(retrieveDeal.miner, true, dataCid, 'n/a', retrieveDeal.size, retrieveDeal.fileHash, 'success');

          statsRetrieveDealsSuccessful++;
          prometheus.SetSuccessfulRetrieveDeals(statsRetrieveDealsSuccessful);
        } else {
          //FAILED -> send result to BE
          FAILED('RetrieveDeal', retrieveDeal.miner, dataCid + ';hash check failed outFile:' + outFile + ' sha256:' + hash + ' original sha256:' + retrieveDeal.fileHash);
          backend.SaveRetrieveDeal(retrieveDeal.miner, false, dataCid, 'n/a', retrieveDeal.size, retrieveDeal.fileHash, 'hash check failed');

          statsRetrieveDealsFailed++;
          prometheus.SetFailedRetrieveDeals(statsRetrieveDealsFailed);
        }
      }
    } 
  } catch (e) {
    ERROR('Error: ' + e.message);
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

async function CalculateMinersDailyRate() {
  var it = 0;
  while (!stop && (it < topMinersList.length)) {

    if (minersMap.has(topMinersList[it].address)) {
      let minerData = minersMap.get(topMinersList[it].address);
      if (TimeDifferenceInHours(minerData.timestamp) >= 24) {
        let dailyRate = (topMinersList[it].power - minerData.power) / 2;
        if (dailyRate < MIN_DAILY_RATE) {
          dailyRate = MIN_DAILY_RATE;
        }
        if (dailyRate > MAX_DAILY_RATE) {
          dailyRate = MAX_DAILY_RATE;
        }

        minerData.dailyRate = dailyRate;
        minerData.power = topMinersList[it].power;
        minerData.currentProposedDeals = 0;
        minerData.currentProposedDealsSize = 0;
        minerData.timestamp = Date.now();

        minersMap.set(topMinersList[it].address, minerData);

        INFO(`CalculateMinersDailyRate [${topMinersList[it].address}] dailyRate: ${FormatBytes(dailyRate)}`);
      }
    } else {
      minersMap.set(topMinersList[it].address, {
        dailyRate: MIN_DAILY_RATE,
        power: topMinersList[it].power,
        currentProposedDeals: 0,
        currentProposedDealsSize: 0,
        totalProposedDeals: 0,
        totalProposedDealsSize: 0,
        totalSuccessfulDeals: 0,
        totalSuccessfulDealsSize: 0,
        timestamp: Date.now()
      });
    }

    it++;
  }
}

async function RunQueryAsks() {
  let tmpMinersList = new Array;

  var minersSlice = topMinersList;
  while (minersSlice.length) {
    await Promise.all(minersSlice.splice(0, 10).map(async (miner) => {
      try {
        const minerInfo = await lotus.StateMinerInfo(miner.address);
        INFO(JSON.stringify(minerInfo));

        let peerId;
        let sectorSize = minerInfo.result.SectorSize;

        if (isIPFS.multihash(minerInfo.result.PeerId)) {
          peerId = minerInfo.result.PeerId;
        } else {
          const PeerId = require('peer-id');
          const binPeerId = Buffer.from(minerInfo.result.PeerId, 'base64');
          const strPeerId = PeerId.createFromBytes(binPeerId);

          peerId = strPeerId.toB58String();
        }

        INFO("StateMinerInfo [" + miner.address + "] PeerId: " + peerId);

        const askResponse = await lotus.ClientQueryAsk(peerId, miner.address);
        if (askResponse.error) {
          INFO("ClientQueryAsk : " + JSON.stringify(askResponse));
          //FAILED -> send result to BE
          FAILED('StoreDeal', miner.address, 'ClientQueryAsk failed : ' + askResponse.error.message);
          backend.SaveStoreDeal(miner.address, false, 'n/a', 'n/a', 0, 'n/a', 'ClientQueryAsk failed : ' + askResponse.error.message);
          statsStorageDealsFailed++;
          prometheus.SetFailedStorageDeals(statsStorageDealsFailed);

          tmpMinersList.push({
            address: miner.address,
            peerId: peerId,
            power: miner.power,
            price: 0,
            sectorSize: sectorSize,
            online: false
          })
        } else {
          tmpMinersList.push({
            address: miner.address,
            peerId: peerId,
            power: miner.power,
            price: askResponse.result.Ask.Price,
            sectorSize: sectorSize,
            online: true
          })
        }
      } catch (e) {
        ERROR('Error: ' + e.message);
      }
    }));
    await pause(1000);
  }

  if (tmpMinersList.length) {
    topMinersList.length = 0;
    topMinersList = [...tmpMinersList];
  }
}

async function RunStorageDeals() {
  var it = 0;
  while (!stop && (it < topMinersList.length)) {
    if (storageDealsMap.size > MAX_PENDING_STORAGE_DEALS) {
      INFO("RunStorageDeals pending storage deals = MAX_PENDING_STORAGE_DEALS");
      break;
    }

    let makeDeal = true;

    if (minersMap.has(topMinersList[it].address)) {
      let minerData = minersMap.get(topMinersList[it].address);
      if (minerData.currentProposedDealsSize >= minerData.dailyRate) {
        makeDeal = false;
        INFO(`DailyRate reached [${topMinersList[it].address}] dailyRate: ${FormatBytes(minerData.dailyRate)}`);
      }
    }

    if (makeDeal && topMinersList[it].online) {
      await StorageDeal(topMinersList[it], flags.cmdMode);
      await pause(1000);
    }
    it++;
  }
}

async function RunRetriveDeals() {
  var it = 0;
  while (!stop && (it < cidsList.length)) {
    if (!pendingRetriveDealsMap.has(cidsList[it].dataCid)) {
      await RetrieveDeal(cidsList[it].dataCid, cidsList[it], flags.cmdMode);
      await pause(1000);
    }
  }
}

async function StorageDealStatus(dealCid, pendingStorageDeal) {
  try {
    var data = await lotus.ClientGetDealInfo(dealCid);
    if (data && data.result && data.result.State) {

      INFO("ClientGetDealInfo [" + dealCid + "] State: " + dealStates[data.result.State] + " dataCid: " + pendingStorageDeal.dataCid);
      INFO("ClientGetDealInfo: " + JSON.stringify(data));


      if (dealStates[data.result.State] == "StorageDealActive") {

        statsStorageDealsSuccessful++;
        prometheus.SetSuccessfulStorageDeals(statsStorageDealsSuccessful);

        DeleteTestFile(pendingStorageDeal.filePath);

        //PASSED -> send result to BE [dealcid;datacid;size]
        PASSED('StoreDeal', pendingStorageDeal.miner, dealCid + ';' + pendingStorageDeal.dataCid + ';' + pendingStorageDeal.size);
        backend.SaveStoreDeal(pendingStorageDeal.miner, true, pendingStorageDeal.dataCid, dealCid, pendingStorageDeal.size, pendingStorageDeal.fileHash, 'success');

        if (minersMap.has(pendingStorageDeal.miner)) {
          let minerData = minersMap.get(pendingStorageDeal.miner);
          minerData.totalSuccessfulDeals++;
          minerData.totalSuccessfulDealsSize = minerData.totalSuccessfulDealsSize + pendingStorageDeal.size;
          minersMap.set(pendingStorageDeal.miner, minerData);
        }

        storageDealsMap.delete(dealCid);
      } else if (dealStates[data.result.State] == "StorageDealExpired") {
        //PASSED -> send result to BE [dealcid;datacid;size]
        PASSED('StoreDeal', pendingStorageDeal.miner, dealCid + ';' + pendingStorageDeal.dataCid + ';' + pendingStorageDeal.size);
        backend.SaveStoreDeal(pendingStorageDeal.miner, true, pendingStorageDeal.dataCid, dealCid, pendingStorageDeal.size, pendingStorageDeal.fileHash, 'success');

        if (minersMap.has(pendingStorageDeal.miner)) {
          let minerData = minersMap.get(pendingStorageDeal.miner);
          minerData.totalSuccessfulDeals++;
          minerData.totalSuccessfulDealsSize = minerData.totalSuccessfulDealsSize + pendingStorageDeal.size;
          minersMap.set(pendingStorageDeal.miner, minerData);
        }

        DeleteTestFile(pendingStorageDeal.filePath);
        storageDealsMap.delete(dealCid);
      } else if (dealStates[data.result.State] == "StorageDealStaged") {
        DeleteTestFile(pendingStorageDeal.filePath);
      } else if (dealStates[data.result.State] == "StorageDealSealing") {
        DeleteTestFile(pendingStorageDeal.filePath);
      } else if (dealStates[data.result.State] == "StorageDealError") {
        //FAILED -> send result to BE

        FAILED('StoreDeal', pendingStorageDeal.miner, dealCid + ';' + pendingStorageDeal.dataCid + ';' + pendingStorageDeal.size + ';' + dealStates[data.result.State]);
        backend.SaveStoreDeal(pendingStorageDeal.miner, false, pendingStorageDeal.dataCid, dealCid, pendingStorageDeal.size, pendingStorageDeal.fileHash, dealStates[data.result.State] + " ClientGetDealInfo: " + JSON.stringify(data));

        statsStorageDealsFailed++;
        prometheus.SetFailedStorageDeals(statsStorageDealsFailed);
        DeleteTestFile(pendingStorageDeal.filePath);
        storageDealsMap.delete(dealCid);
      } else if (DealTimeout(pendingStorageDeal.timestamp)) {
        //FAILED -> send result to BE
        FAILED('StoreDeal', pendingStorageDeal.miner, dealCid + ';' + pendingStorageDeal.dataCid + ';' + pendingStorageDeal.size + ';' + dealStates[data.result.State] + ';' + 'timeout');
        backend.SaveStoreDeal(pendingStorageDeal.miner, false, pendingStorageDeal.dataCid, dealCid, pendingStorageDeal.size, pendingStorageDeal.fileHash, 'timeout in state:' + dealStates[data.result.State]);

        statsStorageDealsFailed++;
        prometheus.SetFailedStorageDeals(statsStorageDealsFailed);
        DeleteTestFile(pendingStorageDeal.filePath);
        storageDealsMap.delete(dealCid);
      }
    } else {
      WARNING("ClientGetDealInfo: " + JSON.stringify(data));
    }
  } catch (e) {
    ERROR('Error: ' + e.message);
  }
}

async function CheckPendingStorageDeals() {
  statsStorageDealsPending = storageDealsMap.size;
  prometheus.SetPendingStorageDeals(statsStorageDealsPending);
  for (const [key, value] of storageDealsMap.entries()) {
    if (stop)
     break;

     await StorageDealStatus(key, value);
     await pause(100);
  }
}

function SLCRange(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

async function RunSLCCheck() {
  var cbor = require('cbor');
  const result = [];
  var chainHead;

  try {
    chainHead = await lotus.ChainHead();
  } catch (e) {
    ERROR('Error: ' + e.message);
  }

  if (slcHeight === chainHead.result.Height) {
    INFO(`RunSLCCheck: Height(${slcHeight}) already checked`);
    return;
  }

  if (!slcHeight) {
    slcHeight = chainHead.result.Height;
    INFO(`RunSLCCheck: set slcHeight to chainHead Height(${chainHead.result.Height})`);
  }

  if (slcHeight > chainHead.result.Height) {
    ERROR(`RunSLCCheck: slcHeight(${slcHeight}) > chainHead Height(${chainHead.result.Height})`);
    return;
  }

  INFO("RunSLCCheck: chainHead " + chainHead.result.Height);

  let blocks = SLCRange(slcHeight, chainHead.result.Height); // [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
  //let blocks = [...Array(chainHead.result.Height).keys()];

  var blocksSlice = blocks;
  while (blocksSlice.length) {
    await Promise.all(blocksSlice.splice(0, 50).map(async (block) => {
      try {
        var selectedHeight = block;
        var tipSet = (await lotus.ChainGetTipSetByHeight(selectedHeight, chainHead.result.Cids)).result;
        if (tipSet.Blocks) {
          for (const block of tipSet.Blocks) {
            const level1Cid = block.Messages['/'];
            if (level1Cid) {
              const level2Cids = (await lotus.ChainGetNode(level1Cid)).result.Obj.map(obj => obj['/'])
              for (const level2Cid of level2Cids) {
                const messageCids = (await lotus.ChainGetNode(level2Cid)).result.Obj[2][2].map(obj => obj['/'])
                for (const messageCid of messageCids) {
                  const message = await lotus.ChainGetMessage({ '/': messageCid });
                  if (message.result.Method === 6) {
                    var decode = cbor.decode(Buffer.from(message.result.Params, 'base64'));
                    if (decode[7] > 0) {
                      backend.SaveSLC(block.Miner, true, message.result.Params);
                      result.push({
                        height: tipSet.Height,
                        miner: block.Miner,
                        decode: decode,
                        SectorNumber: decode[1],
                        ReplaceCapacity: decode[6],
                        ReplaceSector: decode[7],
                        messageCid,
                        ...message
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        ERROR('Error: ' + e.message);
      }

    }));

    INFO("RunSLCCheck: Remainig blocks: " + blocksSlice.length + " found " + result.length);
  }

  result.forEach(element => {
    INFO(element);
  });

  slcHeight = chainHead.result.Height;
}

function PrintStorageStats() {
  INFO("*****************STATS*****************");
  INFO("QABot " + version);
  INFO("StorageDeals: TOTAL : " + (statsStorageDealsPending + statsStorageDealsSuccessful + statsStorageDealsFailed));
  INFO("StorageDeals: PENDING : " + statsStorageDealsPending);
  INFO("StorageDeals: SUCCESSFUL : " + statsStorageDealsSuccessful);
  INFO("StorageDeals: FAILED : " + statsStorageDealsFailed);

  INFO("***************************************");
  for (const [key, value] of minersMap.entries()) {
    if (value.totalProposedDealsSize > 0) {
      INFO(`[${key}] 
      dailyRate: ${FormatBytes(value.dailyRate)} 
      power: ${FormatBytes(value.power)} 
      proposed[${value.currentProposedDeals}]: ${FormatBytes(value.currentProposedDealsSize)} 
      totalProposed[${value.totalProposedDeals}]: ${FormatBytes(value.totalProposedDealsSize)} 
      totalSuccessful[${value.totalSuccessfulDeals}]: ${FormatBytes(value.totalSuccessfulDealsSize)}`);
    }
  }
  INFO("***************************************");
}

function PrintRetrievalStats() {
  INFO("*****************STATS*****************");
  INFO("QABot " + version);
  INFO("RetrieveDeals: TOTAL : " + (statsRetrieveDealsSuccessful + statsRetrieveDealsFailed));
  INFO("RetrieveDeals: SUCCESSFUL : " + statsRetrieveDealsSuccessful);
  INFO("RetrieveDeals: FAILED : " + statsRetrieveDealsFailed);
  INFO("***************************************");
}

const mainLoopStore = async _ => {
  if (flags.standalone_minerlist) {
    await LoadMiners();
  }

  while (!stop) {
    const startLoop = Date.now();
    if (!flags.standalone_minerlist) {
      await LoadMiners();
    }
    await CalculateMinersDailyRate();
    await RunQueryAsks();
    await RunStorageDeals();
    if (flags.slc) {
      await RunSLCCheck();
    }
    await CheckPendingStorageDeals();
    await RunRetriveDeals();

    const loopDuration = TimeDifferenceInSeconds(startLoop);
    const sleepDuration =  (loopDuration < HOUR) ? (HOUR - loopDuration) : 30;

    INFO(`loopDuration: ${loopDuration} Seconds sleepDuration: ${sleepDuration} Seconds`);

    await pause(sleepDuration * 1000);
    PrintStorageStats();
  }
};

const mainLoopRetrieve = async _ => {
  while (!stop) {
    await LoadRetrievalList();
    await RunRetriveDeals();
    await pause(30 * 1000);
    PrintRetrievalStats();
  }
};

if (config.bot.mode == 'store') {
  mainLoopStore();
} else {
  mainLoopRetrieve();
}

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
