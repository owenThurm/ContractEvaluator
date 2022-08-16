const {
    getApiKeyByNetwork,
    getContractSourceCode,
  } = require("./common/lib/explorers");
const { getContractContentList } = require("./common/lib/helpers");
const { exportContractContentsToZip } = require("./common/lib/exporters");
const decompress = require("decompress");
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

require("dotenv").config();

async function processAudit(addresses, network) {
    const apiKey = getApiKeyByNetwork(network);

    if (!apiKey) {
        console.warn("No API key for", network);
    }

    for(let i = 0; i<addresses.length;i++) {
        const contractAddress = addresses[i];
        const result = await getContractSourceCode(
            apiKey,
            network,
            contractAddress
        );
        const sourceCodes = result.data.result;
        const contractContents = getContractContentList(sourceCodes, network);


        const zipName = await exportContractContentsToZip(contractContents, contractAddress);

        const files = await decompress(zipName);

        files.forEach(file => {
            fs.writeFileSync(`contracts/${file.path}`, file.data);
        });

        try {
            await exec('python3 -m slither . --exclude-dependencies --json slither.json');
        } catch {
            const bufferData = fs.readFileSync("slither.json");
            const stData = bufferData.toString();
            const detectors = JSON.parse(stData).results.detectors;
            const detectorMap = {};

            detectors.forEach(detector => {
                let check = detector.check;
                if(detectorMap[check]) {
                    detectorMap[check]++;
                } else {
                    detectorMap[check] = 1;
                }
            });

            fs.unlinkSync("slither.json");
            fs.rmSync("contracts", { recursive: true });
            fs.rmSync("artifacts", { recursive: true });
            fs.mkdir("contracts", (err) => {
                console.log(err);
            });
            return detectorMap;
        }
    }
}


async function main() {
    const audits = [];
    const outData = [];

    const csvWriter = createCsvWriter({
        path: 'out.csv',
        header: [
          {id: 'address', title: 'Address'},
          {id: 'score', title: 'Score'},
          {id: 'abiencoderv2-array', title: 'abiencoderv2-array'},
          {id: 'array-by-reference', title: 'array-by-reference'},
          {id: 'incorrect-shift', title: 'incorrect-shift'},
          {id: 'multiple-constructors', title: 'multiple-constructors'},
          {id: 'name-reused', title: 'name-reused'},
          {id: 'public-mappings-nested', title: 'public-mappings-nested'},
          {id: 'rtlo', title: 'rtlo'},
          {id: 'shadowing-state', title: 'shadowing-state'},
          {id: 'suicidal', title: 'suicidal'},
          {id: 'uninitialized-state', title: 'uninitialized-state'},
          {id: 'uninitialized-storage', title: 'uninitialized-storage'},
          {id: 'unprotected-upgrade', title: 'unprotected-upgrade'},
          {id: 'arbitrary-send', title: 'arbitrary-send'},
          {id: 'controlled-array-length', title: 'controlled-array-length'},
          {id: 'controlled-delegatecall', title: 'controlled-delegatecall'},
          {id: 'delegatecall-loop', title: 'delegatecall-loop'},
          {id: 'msg-value-loop', title: 'msg-value-loop'},
          {id: 'reentrancy-eth', title: 'reentrancy-eth'},
          {id: 'storage-array', title: 'storage-array'},
          {id: 'unchecked-transfer', title: 'unchecked-transfer'},
          {id: 'weak-prng', title: 'weak-prng'},
          {id: 'enum-conversion', title: 'enum-conversion'},
          {id: 'erc20-interface', title: 'erc20-interface'},
          {id: 'erc721-interface', title: 'erc721-interface'},
          {id: 'incorrect-equality', title: 'incorrect-equality'},
          {id: 'locked-ether', title: 'locked-ether'},
          {id: 'mapping-deletion', title: 'mapping-deletion'},
          {id: 'shadowing-abstract', title: 'shadowing-abstract'},
          {id: 'tautology', title: 'tautology'},
          {id: 'write-after-write', title: 'write-after-write'},
          {id: 'boolean-cst', title: 'boolean-cst'},
          {id: 'constant-function-asm', title: 'constant-function-asm'},
          {id: 'constant-function-state', title: 'constant-function-state'},
          {id: 'divide-before-multiply', title: 'divide-before-multiply'},
          {id: 'reentrancy-no-eth', title: 'reentrancy-no-eth'},
          {id: 'reused-constructor', title: 'reused-constructor'},
          {id: 'tx-origin', title: 'tx-origin'},
          {id: 'unchecked-lowlevel', title: 'unchecked-lowlevel'},
          {id: 'unchecked-send', title: 'unchecked-send'},
          {id: 'uninitialized-local', title: 'uninitialized-local'},
          {id: 'unused-return', title: 'unused-return'},
          {id: 'incorrect-modifier', title: 'incorrect-modifier'},
          {id: 'shadowing-builtin', title: 'shadowing-builtin'},
          {id: 'shadowing-local', title: 'shadowing-local'},
          {id: 'uninitialized-fptr-cst', title: 'uninitialized-fptr-cst'},
          {id: 'variable-scope', title: 'variable-scope'},
          {id: 'void-cst', title: 'void-cst'},
          {id: 'calls-loop', title: 'calls-loop'},
          {id: 'events-access', title: 'events-access'},
          {id: 'events-maths', title: 'events-maths'},
          {id: 'incorrect-unary', title: 'incorrect-unary'},
          {id: 'missing-zero-check', title: 'missing-zero-check'},
          {id: 'reentrancy-benign', title: 'reentrancy-benign'},
          {id: 'reentrancy-events', title: 'reentrancy-events'},
          {id: 'timestamp', title: 'timestamp'},
          {id: 'assembly', title: 'assembly'},
          {id: 'assert-state-change', title: 'assert-state-change'},
          {id: 'boolean-equal', title: 'boolean-equal'},
          {id: 'deprecated-standards', title: 'deprecated-standards'},
          {id: 'erc20-indexed', title: 'erc20-indexed'},
          {id: 'function-init-state', title: 'function-init-state'},
          {id: 'low-level-calls', title: 'low-level-calls'},
          {id: 'missing-inheritance', title: 'missing-inheritance'},
          {id: 'naming-convention', title: 'naming-convention'},
          {id: 'pragma', title: 'pragma'},
          {id: 'redundant-statements', title: 'redundant-statements'},
          {id: 'solc-version', title: 'solc-version'},
          {id: 'unimplemented-functions', title: 'unimplemented-functions'},
          {id: 'unused-state', title: 'unused-state'},
          {id: 'costly-loop', title: 'costly-loop'},
          {id: 'dead-code', title: 'dead-code'},
          {id: 'reentrancy-unlimited-gas', title: 'reentrancy-unlimited-gas'},
          {id: 'similar-names', title: 'similar-names'},
          {id: 'too-many-digits', title: 'too-many-digits'},
          {id: 'constable-states', title: 'constable-states'},
          {id: 'external-function', title: 'external-function'},
          {id: 'arbitrary-send-erc20', title: 'arbitrary-send-erc20'},
          {id: 'arbitrary-send-erc20-permit', title: 'arbitrary-send-erc20-permit'}
        ]
      });

    await fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (row) => {
        audits.push({
            "Address": row.Address,
            "Network": row.Network,
            "Score": row.Score
        });
    })
    .on('end', async () => {
        console.log('CSV file successfully processed');

        console.log("NUM AUDITS", audits.length)

        for (let i=0; i < audits.length; i++) {
            const {Address, Network, Score} = audits[i];
            console.log("ITER", Address, Network)
            const detectors = await processAudit([Address], Network);

            console.log("DETECTORS: ", detectors);

            outData.push({
                address: Address,
                score: Score,
                ...detectors
            });
        }

        csvWriter
            .writeRecords(outData)
            .then(()=> console.log('The CSV file was written successfully'));
    });

    await new Promise(resolve => setTimeout(resolve, 900000));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
