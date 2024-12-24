const {BasicTextParser} = require('../../lazac/common');

function GenInMemWordIndex(text, opt) {
   // index = { token: count }
   // TODO: limit |{token}|
   const index = {};
   const parser = new BasicTextParser();
   const tokens = parser.Parse(text, {
      noKeepStop: true,
      nonAsciiWord: true
   }).forEach((token) => {
      if (token.length > 100) return; // filter out too long token
      index[token] = (index[token] || 0) + 1;
   });
   return index;
}

function GenInMemTrigramIndex(text, opt) {
   // index = { trigram: [position] }
   // TODO: limit |{trigram}|, |{position}|
   const index = {};
   const n = text.length;
   for (let i = 0; i <= n-3; i++) {
      const trigram = text.substring(i, i+3);
      if (!index[trigram]) index[trigram] = [];
      index[trigram].push(i);
   }
   return index;
}

module.exports = {
   GenInMemWordIndex,
   GenInMemTrigramIndex,
};
