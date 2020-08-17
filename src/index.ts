#!/usr/bin/env node
import fs from 'fs'
const pm2 = require('pm2')
import * as yargs from 'yargs'
yargs.parse()

const argv: any = yargs
    .command('start <config>', 'start engine with config file', startCommandHandler)
    .usage('Usage: $0 <command> [options]')
    .help('h')
    .command('stop <name>', 'stop engine with given name', stopCommandHandler)
    .command('stopall', 'stop all engine', stopAllCommandHandler)
    .command('list', 'list of running engines', listCommandHandler)
    .argv





async function listCommandHandler() {
    try {
        let list: any[] = await getPm2ProcessList()
        console.log('PM2:', list)
    } catch(err) {
        console.log('error getting list:', err)
    }
}
    
function startCommandHandler(data: any) {
    let config: any = data.argv['_'][1]
    if (config) {
        console.log(`using config file: ${config}`)
        const configFileContent: string = fs.readFileSync(process.cwd().concat(`/${config}`), 'utf8')
        try {
            let config: any = JSON.parse(configFileContent)
            startPm2Process(config)
        } catch (err) {
            console.log('error parsing config file:', err)
            process.exit(-1)
        }
    } else {
        console.log('no config, exiting')
        process.exit(-1)
    }
}

function stopAllCommandHandler() {
    console.log('stopall')
}

async function stopCommandHandler(data: any) {
    let engineName = data.argv['_'][1]
    if (engineName) {
        console.log(`stopping: ${engineName}`)
        try {
            let desc: any = await stopPm2Process(engineName)
            console.log('stop done')
        } catch (err) {
            console.log('error stopping:', err)
        }
    } else {
        console.log('no engine name')
    }

}

async function startPm2Process(config: any) {
    pm2.connect((err: any) => {
        if (err) {
            console.log('error connecting to pm2:', err)
        } else {
            pm2.start({
                name: config.engineName,
                script: './dist/runner.js',
                args: [JSON.stringify(config)],
                autorestart: false
            }, (err: any, apps: any) => {
                if (err) {
                    console.log('error starting:', err)
                }
                console.log(apps[0].pm2_env.name)
                console.log(apps[0].process)
                console.log(apps[0].pid)
                pm2.disconnect()
            })
        }
    })
}

function getPm2ProcessList(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        pm2.connect((err: any) => {
            if (err) {
                reject(`pm2 connection err: ${err}`)
            } else {
                pm2.list((err: any, list: any) => {
                    if (err) {
                        reject(`list error: ${err}`)
                    }
                    let filtered = list.map((l: any) => {
                        return {
                            pid: l.pid,
                            name: l.name,
                            status: l.pm2_env.status
                        }
                    })
                    pm2.disconnect()
                    resolve(filtered)
                })
            }
        })
    })
}

function stopPm2Process(engineName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        pm2.connect((err: any) => {
            if (err) {
                pm2.disconnect()
                reject(`pm2 connection err: ${err}`)
            } else {
                pm2.describe(engineName, (err: any, description: any) => {
                    if (err) {
                        pm2.disconnect()
                        reject(`description error: ${err}`)
                    }
                    if (description.length === 0) {
                        pm2.disconnect()
                        reject(`no engine named "${engineName}"`)
                    } else {
                        pm2.delete(engineName, (err: any, proc: any) => {
                            if (err) {
                                pm2.disconnect()
                                reject(`error stopping "${engineName}": ${err}`)
                            } else {
                                pm2.disconnect()
                                resolve(proc)
                            }
                        })
                    }
                })
            }
        })
    })
}

/* -*- ts -*- */