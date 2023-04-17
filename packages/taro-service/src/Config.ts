import {
  createSwcRegister,
  ENTRY,
  getModuleDefaultExport,
  getUserHomeDir,
  OUTPUT_DIR,
  resolveScriptPath,
  SOURCE_DIR,
  TARO_GROBAL_PLUGIN_CONFIG_DIR
} from '@tarojs/helper'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as merge from 'webpack-merge'

import {
  CONFIG_DIR_NAME,
  DEFAULT_CONFIG_FILE
} from './utils/constants'

import type { IProjectConfig, PluginItem } from '@tarojs/taro/types/compile'

interface IConfigOptions {
  appPath: string
}

export default class Config {
  appPath: string
  configPath: string
  initialConfig: IProjectConfig
  initGlobalPluginConfig: PluginItem[]
  isInitSuccess: boolean
  constructor (opts: IConfigOptions) {
    this.appPath = opts.appPath
    this.init()
  }

  init () {
    this.configPath = resolveScriptPath(path.join(this.appPath, CONFIG_DIR_NAME, DEFAULT_CONFIG_FILE))
    if (!fs.existsSync(this.configPath)) {
      /**
       * 如果项目 config 不存在，可以查找全局的 plugin-config，这个步骤在这个 branch 进行，不影响主流程
      */
      const initPluginConfigPath = resolveScriptPath(path.join(getUserHomeDir(), TARO_GROBAL_PLUGIN_CONFIG_DIR, DEFAULT_CONFIG_FILE))
      this.initialConfig = {}
      console.log(`获取不到项目 config 文件，开始读取 taro 全局插件配置文件： ${initPluginConfigPath}`)
      if(!fs.existsSync(initPluginConfigPath)) {
        console.log(`获取不到 taro 全局插件配置文件： ${initPluginConfigPath}`)
      } else {
        this.initGlobalPluginConfig = getModuleDefaultExport(require(initPluginConfigPath))
      }

      this.isInitSuccess = false
    } else {
      createSwcRegister({
        only: [
          filePath => filePath.indexOf(path.join(this.appPath, CONFIG_DIR_NAME)) >= 0
        ]
      })
      try {
        this.initialConfig = getModuleDefaultExport(require(this.configPath))(merge)
        this.isInitSuccess = true
      } catch (err) {
        this.initialConfig = {}
        this.isInitSuccess = false
        console.log(err)
      }
    }
  }

  getConfigWithNamed (platform, configName) {
    const initialConfig = this.initialConfig
    const sourceDirName = initialConfig.sourceRoot || SOURCE_DIR
    const outputDirName = initialConfig.outputRoot || OUTPUT_DIR
    const sourceDir = path.join(this.appPath, sourceDirName)
    const entryName = ENTRY
    const entryFilePath = resolveScriptPath(path.join(sourceDir, entryName))

    const entry = {
      [entryName]: [entryFilePath]
    }

    return {
      entry,
      alias: initialConfig.alias || {},
      copy: initialConfig.copy,
      sourceRoot: sourceDirName,
      outputRoot: outputDirName,
      platform,
      framework: initialConfig.framework,
      compiler: initialConfig.compiler,
      cache: initialConfig.cache,
      logger: initialConfig.logger,
      baseLevel: initialConfig.baseLevel,
      csso: initialConfig.csso,
      sass: initialConfig.sass,
      uglify: initialConfig.uglify,
      plugins: initialConfig.plugins,
      projectName: initialConfig.projectName,
      env: initialConfig.env,
      defineConstants: initialConfig.defineConstants,
      designWidth: initialConfig.designWidth,
      deviceRatio: initialConfig.deviceRatio,
      projectConfigName: initialConfig.projectConfigName,
      jsMinimizer: initialConfig.jsMinimizer,
      cssMinimizer: initialConfig.cssMinimizer,
      terser: initialConfig.terser,
      esbuild: initialConfig.esbuild,
      ...initialConfig[configName]
    }
  }
}
