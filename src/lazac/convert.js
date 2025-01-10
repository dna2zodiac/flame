function CharCount(tokens, st, ed) {
   let c = 0;
   for (let i = st; i < ed; i++) {
      const token = tokens[i];
      c += token.T.length;
   }
   return c;
}

module.exports = {
   CharCount,
};
