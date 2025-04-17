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
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              warnings: false,
              drop_debugger: true
            },
            output: {
              comments: false
            }
          },
          parallel: true
        })
      ]
    }
  }
} 