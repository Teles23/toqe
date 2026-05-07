module.exports = function (options) {
  return {
    ...options,
    externals: [
      ...(Array.isArray(options.externals) ? options.externals : []),
      function ({ request }, callback) {
        if (/^@prisma\//.test(request) || request === 'prisma') {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],
  };
};
