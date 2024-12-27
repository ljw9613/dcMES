module.exports = {
  configureWebpack: {
    resolve: {
      fallback: {
        // 添加 fallback 配置
      }
    },
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        }
      ]
    }
  }
} 