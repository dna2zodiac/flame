import {BasicTextParser} from '../lang/common';

export function GenInMemWordIndex(text: string, opt: any): any {
   // index = { token: count }
   // TODO: limit |{token}|
   const index: any = {};
   const parser = new BasicTextParser();
   const tokens = parser.Parse(text, {
      noKeepStop: true,
      nonAsciiWord: true
   }).forEach((token: string) => {
      if (token.length > 100) return; // filter out too long token
      index[token] = (index[token] || 0) + 1;
   });
   return index;
}

export function GenInMemTrigramIndex(text: string, opt: any): any {
   // index = { trigram: [position] }
   // TODO: limit |{trigram}|, |{position}|
   const index: any = {};
   const n = text.length;
   for (let i = 0; i <= n-3; i++) {
      const trigram = text.substring(i, i+3);
      if (!index[trigram]) index[trigram] = [];
      index[trigram].push(i);
   }
   return index;
}
