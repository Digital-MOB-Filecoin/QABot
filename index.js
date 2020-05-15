const fs = require('fs')
const crypto = require('crypto')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'qabresults.csv',
    header: [
        {id: 'file', title: 'FILE'},
        {id: 'sha256', title: 'HASH'},
        {id: 'result', title: 'RESULT'}
    ]
});

var uniqueFilename = require('unique-filename')
let retrievingDataArray = new Array;

const RETRIVING_ARRAY_MAX_SIZE = 1000000 //items
const BUFFER_SIZE = 65536 //64KB
//const MIN_MINER_POWER = 790273982464(736 GiB) //ex
const FILE_SIZE_SMALL  = 104857600   //(100MB)
const FILE_SIZE_MEDIUM = 1073741824  //(1GB)
const FILE_SIZE_LARGE  = 5368709120  // (5GB)

var map = new Map();

function INFO(msg) {
    console.log('\x1b[32m', '[ INFO ] ', '\x1b[0m', msg);
  }
  
  function ERROR(msg) {
    console.log('\x1b[31m', '[ ERR ] ', '\x1b[0m', msg);
  }
  
  function WARNING(msg) {
    console.log('\x1b[33m', '[ WARN ] ', '\x1b[0m', msg);
  }

function GetTopMiners() {
  const childProcess = require('child_process');
  const readline = require('readline');
  let minersList = new Array;

  //lotus state list-miners
  const cspr = childProcess.spawn('lotus', ['state', 'list-miners']);

  const rl = readline.createInterface({ input: cspr.stdout });
  rl.on('line', line => {
    minersList.push({
      miner: line,
      power: 0
    })
  })

  cspr.on('close', (code) => {
    if (code === 0) {
      console.log(`child process exited with code ${code}`);
      minersList.forEach(item => {
        console.log("miner:" + item.miner);
        const cspr_itm = childProcess.spawnSync('lotus', ['state', 'power', item.miner], { encoding: 'utf-8' })
        console.log(cspr_itm.stdout);
      });
    }
  });


}

function GenerateTestFile(path, size) {
  const fd = fs.openSync(path, 'w')
  const hash = crypto.createHash('sha256')

  var start = new Date()

  try {
    for (i = 0; i < size / BUFFER_SIZE; i++) {
      const buffer = crypto.randomBytes(BUFFER_SIZE);
      var bytesWritten = fs.writeSync(fd, buffer, 0, BUFFER_SIZE)
      hash.update(buffer.slice(0, bytesWritten))
    }

  } finally {
    fs.closeSync(fd)
  }

  var end = new Date() - start
  console.log('GenerateTestFile Execution time: %dms', end)

  return hash.digest('hex')
}

function SHA256File (path) {
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

  function SHA256FileSync (path) {
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

GetTopMiners();

mainLoop:while (false){
//1. Generate random test files (100MB, 1GB, 5GB) and import them
var testFileName = uniqueFilename('./test', 'qab-testfile');
var testFileHash = GenerateTestFile(testFileName, FILE_SIZE_LARGE);
INFO(`Generated test file: ${testFileName} sha256: ${testFileHash}`)

//2. Get miners list: lotus state list-miners
//3. Remove miners with power < MIN_MINER_POWER
//4. Sort miner list ?
//5. For each miner store/retrieve data

//fs.removeSync('test');
//fs.mkdirSync('test');



    //Storing Data
    if (retrievingDataArray.length < RETRIVING_ARRAY_MAX_SIZE) {
        //var testFileName = uniqueFilename('./test', 'qab-testfile');
        //var testFileHash = GenerateTestFile(testFileName, FILE_SIZE_MEDIUM);
        //INFO(`Generated test file: ${testFileName} sha256: ${testFileHash}`)

        //Adding a file locally :          lotus client import ./your-example-file.txt
        //Get a list of all miners :       lotus state list-miners
        //Get the requirements of a miner: lotus client query-ask <miner>
        //Store a Data CID with a miner:   lotus client deal <Data CID> <miner> <price> <duration>

        retrievingDataArray.push({
            filename: testFileName,
            hash: testFileHash,
            timestamp: Date.now()
        })
    }

    //Retrieving Data
    if ((retrievingDataArray.length > 0 ) && readyToRetrieve(retrievingDataArray[0])) {
        const retrievingDataItem = retrievingDataArray.shift();
        INFO(`Retrieving : ${retrievingDataItem.filename} sha256: ${retrievingDataItem.hash}`)
        //SHA256File(retrievingDataItem.filename).then((hash) => {
          var hash = SHA256FileSync(retrievingDataItem.filename);
            if (hash == retrievingDataItem.hash) {
                const records = [
                    {file: retrievingDataItem.filename,  sha256: retrievingDataItem.hash, result: 'success'}
                ];
                 
                csvWriter.writeRecords(records);

                INFO(`Retrieved successfully : ${testFileName} sha256: ${hash}`);

            }
            else {
                const records = [
                    {file: retrievingDataItem.filename,  sha256: retrievingDataItem.hash, result: 'failed'}
                ];
                 
                csvWriter.writeRecords(records);

                WARNING(`Retrieving test failed for : ${testFileName} sha256: ${hash}`);
            }
        //})
    }

}


function shutdown(){
  INFO(`Shutdown`);
  break mainLoop;
}
// listen for TERM signal .e.g. kill
process.on('SIGTERM', shutdown);
// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutdown);

//map max number of entries 2^24 -> 16777215
