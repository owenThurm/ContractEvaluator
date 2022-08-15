const isSingleFileContract = (sourceCode: string) => {
  return (
    sourceCode.indexOf("pragma") === 0 ||
    sourceCode.indexOf("//") === 0 ||
    sourceCode.indexOf("\r\n") === 0 ||
    sourceCode.indexOf("/*") === 0
  );
};

const isSymbolObject = (network: string) => {
  return network.indexOf("bsc") >= 0;
};

const parseSourceCodeObject = (sourceCode: any, network: string) => {
  console.log("HERE")
  //if (isSymbolObject(network)) return JSON.parse(sourceCode);
  const res = JSON.parse(sourceCode.substr(1, sourceCode.length - 2));
  console.log(res);
  return res;
};

const getSourcesObject = (parsedSourceCode: any, network: string) => {
  console.log(parsedSourceCode);
  //if (isSymbolObject(network)) return Object.entries(parsedSourceCode);
  return Object.entries(parsedSourceCode.sources);
};

export const getContractContentList = (sourceCodes: any, network: string) => {
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
        (sourceObject: any) => {
          return {
            path: sourceObject[0],
            content: sourceObject[1].content,
          };
        }
      );
      console.log(sourceObjects);
      contractContent.push(...sourceObjects);
    }
  }
  return contractContent;
};

export const copyToClipboard = (data: string) => {
  navigator.clipboard.writeText(data);
};
