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
                if(detector[check]) {
                    detectorMap[check]++;
                } else {
                    detectorMap[check] = 1;
                }
            });

            console.log(detectorMap);
        }
    }
}


async function main() {
    const addresses = ["0x722c386178187d6ad0cba49ad9c5024eea88d113"];

    const network = "bsc";

    await processAudit(addresses, network);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
