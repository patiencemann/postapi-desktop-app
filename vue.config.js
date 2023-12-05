const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'com.patienceman.postapi',
        productName: 'Postapi',
        win: {
          icon: 'build/icons/icon.ico'
        },
        mac: {
          icon: 'build/icons/icon.icns'
        },
        linux: {
          icon: 'build/icons/'
        }
      }
    }
  }
})
