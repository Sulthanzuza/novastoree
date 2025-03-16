module.exports = {
  ifCond: function (v1, v2, options) {
      if (v1 === v2) {
          return options.fn(this);
      }
      return options.inverse(this);
  },
  chunk: function (array, chunkSize, options) {
      if (!Array.isArray(array) || chunkSize <= 0) {
          return options.inverse(this);
      }

      const chunks = [];
      for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
      }

      let result = '';
      chunks.forEach(chunk => {
          result += options.fn(chunk);
      });

      return result;
  },add: function(a, b) {
    return a + b;
}
};
