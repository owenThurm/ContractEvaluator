const isSingleFileContract = (sourceCode) => {
  return (
    sourceCode.indexOf("pragma") === 0 ||
    sourceCode.indexOf("//") === 0 ||
    sourceCode.indexOf("\r\n") === 0 ||
    sourceCode.indexOf("/*") === 0
  );
};

const isSymbolObject = (network) => {
  return network.indexOf("bsc") >= 0;
};

const parseSourceCodeObject = (sourceCode, network) => {
  if (isSymbolObject(network)) return JSON.parse(sourceCode);
  return JSON.parse(sourceCode.substr(1, sourceCode.length - 2));
};

const getSourcesObject = (parsedSourceCode, network) => {
  if (isSymbolObject(network)) return Object.entries(parsedSourceCode);
  return Object.entries(parsedSourceCode.sources);
};

const getContractContentList = (sourceCodes, network) => {
  const contractContent = [];
  // is array?
  for (const sourceCode of sourceCodes) {
    if (isSingleFileContract(sourceCode.SourceCode)) {
      contractContent.push({
        path: "contract.sol",
        content: sourceCode.SourceCode,
      });
    } else {
      const parsedSourceCode = parseSourceCodeObject(
        sourceCode.SourceCode,
        network
      );
      const sourceObjects = getSourcesObject(parsedSourceCode, network).map(
        (sourceObject) => {
          return {
            path: sourceObject[0],
            content: sourceObject[1].content,
          };
        }
      );
      contractContent.push(...sourceObjects);
    }
  }
  return contractContent;
};

const copyToClipboard = (data) => {
  navigator.clipboard.writeText(data);
};

module.exports = {
  copyToClipboard,
  getContractContentList
}
