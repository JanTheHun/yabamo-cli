// import { ServerInstance } from '@jbp/yabamo-core'

import { ServerInstance } from '/home/jan/prog/yabamo-core/dist'
import { YabamoAdmin } from '/home/jan/prog/yabamo-admin/dist/index'

import * as fs from 'fs'

const DEBUG = false

let server: ServerInstance
let admin: YabamoAdmin

attachEventListeners()
run()

function attachEventListeners() {
    process.on('message', function(_data: any) {
        if (server) {
            let data = _data.data || {}
            try {
                let parsedData = JSON.stringify(data)
                if (DEBUG) fs.writeFileSync(__dirname.concat(`/message_${new Date().getTime()}`), parsedData)
            } catch (err) {
                if (DEBUG) fs.writeFileSync(__dirname.concat(`/error_${new Date().getTime()}`), err)
            }
            if (data.command && data.command === 'debug') {

                server.toggleDebugMode(data.method, data.path)?.then(res=> {
                    if (DEBUG) fs.writeFileSync(__dirname.concat(`/result_${new Date().getTime()}`), JSON.stringify(res, null, 2))
                })
                .catch(err=> {
                    if (DEBUG) fs.writeFileSync(__dirname.concat(`/error${new Date().getTime()}`), JSON.stringify(err, null, 2))
                })
    
            } else if (data.command && data.command === 'responsechange') {
                server.changeResponse(data.method, data.path, data.response)?.then(res=> {
                    if (DEBUG) fs.writeFileSync(__dirname.concat(`/result_${new Date().getTime()}`), JSON.stringify(res, null, 2))
                })
                .catch(err=> {
                    if (DEBUG) fs.writeFileSync(__dirname.concat(`/error${new Date().getTime()}`), JSON.stringify(err, null, 2))
                })
            } else {
                if (DEBUG) fs.writeFileSync(__dirname.concat(`/unknown_${new Date().getTime()}`), JSON.stringify(data, null, 2))
            }
        }
    })
}

async function run() {
    try {
        server = new ServerInstance()
        const args = JSON.parse(process.argv[2])
        const { adminPortNumber, config } = args
        if (!config) {
            process.exit(-1)
        }
        if (adminPortNumber) {
            admin = new YabamoAdmin(server, { port: adminPortNumber })
        }
        if (DEBUG) fs.writeFileSync(__dirname.concat(`/args_${new Date().getTime()}`), JSON.stringify(args, null, 2))
        server.on('debug', (msg: any) => { if (DEBUG) fs.writeFileSync(__dirname.concat(`/debug_${new Date().getTime()}`), JSON.stringify(msg, null, 2)) })
        server.on('debugStatus', (msg: any) => { if (DEBUG) fs.writeFileSync(__dirname.concat(`/debugStatus_${new Date().getTime()}`), JSON.stringify(msg, null, 2)) })
        await server.checkConfig(config)
        await server.create(config)
        await server.start()
    } catch (err) {
        console.log(err)
        process.exit(-1)
    }
}