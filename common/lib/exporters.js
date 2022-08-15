const JSZip = require("jszip");
const fs = require('fs');

const exportContractContentsToZip = async (
  contractContents,
  contractAddress
) => {
  var zip = new JSZip();
  for (const contractContent of contractContents) {
    zip.file(contractContent.path, contractContent.content);
  }
  const zipName = `contract_${contractAddress}.zip`;
  const content = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(zipName, content);
  return zipName;
};

module.exports = {
  exportContractContentsToZip
}
