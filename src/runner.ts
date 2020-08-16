import { ServerInstance, checkConfig } from '@jbp/yabamo-core'
import fs from 'fs'

let envConfig: any = process.env.config
const config = JSON.parse(envConfig)
console.log(config)

run()

async function run() {

    const server = new ServerInstance()
    
    try {
        
        let configCheck = await checkConfig(config)
        console.log('configCheck:', configCheck)
        
        let createResult = await server.create(config)
        console.log(createResult)
        
        let startResult = await server.start()
        console.log(startResult)
        
        let changeResult = await server.changeResponse('GET', '/a', 'other')
        console.log(changeResult)
        
    } catch (err) {
        console.log('error:', err)
        process.exit(-1)
    }
}