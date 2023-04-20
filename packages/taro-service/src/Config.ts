import {
  createSwcRegister,
  ENTRY,
  getModuleDefaultExport,
  getUserHomeDir,
  OUTPUT_DIR,
  resolveScriptPath,
  SOURCE_DIR,
  TARO_GLOBAL_CONFIG_FILE,
  TARO_GROBAL_CONFIG_DIR
} from '@tarojs/helper'
import * as fs from 'fs-extra'
import * as ora from 'ora'
import * as path from 'path'
import * as merge from 'webpack-merge'

import {
  CONFIG_DIR_NAME,
  DEFAULT_CONFIG_FILE
} from './utils/constants'

import type { IProjectConfig } from '@tarojs/taro/types/compile'

interface IConfigOptions {
  appPath: string
}

export default class Config {
  appPath: string
  configPath: string
  initialConfig: IProjectConfig
  initGlobalConfig: IProjectConfig
  isInitSuccess: boolean
  constructor (opts: IConfigOptions) {
    this.appPath = opts.appPath
    this.init()
  }

  init () {
    this.configPath = resolveScriptPath(path.join(this.appPath, CONFIG_DIR_NAME, DEFAULT_CONFIG_FILE))
    if (!fs.existsSync(this.configPath)) {
      this.initialConfig = {}
      this.isInitSuccess = false      
      const homedir = getUserHomeDir()
      if(!homedir) return console.error('获取不到用户 home 路径')
      const globalPluginConfigPath = path.join(getUserHomeDir(), TARO_GROBAL_CONFIG_DIR, TARO_GLOBAL_CONFIG_FILE)
      const spinner = ora(`开始获取 taro 全局配置文件： ${globalPluginConfigPath}`).start()
      if (!fs.existsSync(globalPluginConfigPath)) {
        this.initGlobalConfig = {}
        spinner.warn(`获取 taro 全局配置文件失败，不存在全局配置文件：${globalPluginConfigPath}`)
      }else{
        try {
          this.initGlobalConfig = fs.readJSONSync(globalPluginConfigPath) || {}
          spinner.succeed('获取 taro 全局配置成功')
        }catch(e){
          spinner.fail(`获取全局配置失败，如果需要启用全局插件请查看配置文件: ${globalPluginConfigPath} `)
        }
      }
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
