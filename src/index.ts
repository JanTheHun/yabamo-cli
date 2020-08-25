#!/usr/bin/env node
import fs from 'fs'
const pm2 = require('pm2')
const arg = require('arg')
let args: any

main()

async function main() {
    try 
    {
        args = arg({
            // Types
            '--help': Boolean,
            '--config': String,
            '--engine': String,
         
            // Aliases
            '-h': '--help',
            '-c': '--config',
            '-e': '--engine'
                                      //     result is stored in --name
        })

        let command = getCommand(args)
        if (command === null ) {
            console.log('missing command')
            printHelp()
        } else if (command === 'start') {
            let configName = args['--config']
            let engineName = args['--engine']
            if (configName) {
                startCommandHandler(configName, engineName)
            } else {
                console.log('config file required')
                printHelp()
            }
        } else if (command === 'stop') {
            let engineName = args['--engine']
            if (engineName) {
                stopCommandHandler(engineName)
            } else {
                console.log('engine name required')
                printHelp()
            }
        } else if (command === 'stopall') {
            stopAllCommandHandler()
        } else if (command === 'list') {
            listCommandHandler()
        } else if (command === 'changeresponse') {
            
        }
    } catch (err) {
        console.log(err.message)
        printHelp()
    }
}


function getCommand(args: any) {
    const commands = ['list', 'start', 'stop', 'stopall', 'changeresponse']
    let parsedCommand = args && args['_'] && args['_'].length ? args['_'].filter( (a: string) => {return commands.indexOf(a.toLowerCase()) !== -1}) : null
    if (parsedCommand && parsedCommand.length === 1) {
        return parsedCommand[0]
    } else {
        return null
    }
}

function printHelp() {
    console.log('\nUsage:\nyabamo-client <command> [options]')

    console.log('\nCommands:')
    console.log('\n\tstart\t\tstart an engine from config file (provided in --config)')
    console.log('\n\tstop\t\tstop an engine with given name (provided in --engine)')
    console.log('\n\tlist\t\tlist of running engines')

    console.log('\nOptions:')
    console.log('\n\t--config, -c\tconfig file for the API')
    console.log('\n\t--engine, -e\tAPI engine name')

    console.log('\nExamples:')
    console.log('\nyabamo-cli start -c config.json\n\tstart API engine from file "config.json"')
    console.log('\nyabamo-cli start -c config.json -e TestEngine\n\tstart API engine from file "config.json" with the name "TestEngine"')
    console.log('\nyabamo-cli stop -e TestEngine\n\tstop API engine with the name "TestEngine"')
    console.log('\nyabamo-cli list\n\tlist of running engines')

    console.log('\n')
    process.exit(-1)
}

async function listCommandHandler() {
    try {
        let list: any[] = await getPm2ProcessList()
        if  (list && list.length) {
            console.log(list)
        } else {
            console.log('no API engines running')
        }
    } catch(err) {
        console.log('error getting list:', err)
    }
}
    
async function startCommandHandler(configName: string, engineName?: string) {
    if (configName) {
        console.log(`using config file: ${configName}`)
        const configFileContent: string = fs.readFileSync(process.cwd().concat(`/${configName}`), 'utf8')
        try {
            let config: any = JSON.parse(configFileContent)
            let startResult: any = await startPm2Process(config, engineName)
            console.log(startResult)
        } catch (err) {
            console.log('error starting API engine:', err)
            process.exit(-1)
        }
    } else {
        console.log('no config, exiting')
        process.exit(-1)
    }
}

function stopAllCommandHandler() {
    console.log('TODO: stopall')
}


async function stopCommandHandler(engineName: any) {
    if (engineName) {
        try {
            let stopResult: any = await stopPm2Process(engineName)
            console.log(`${engineName} stopped`)
        } catch (err) {
            console.log('error stopping:', err)
        }
    } else {
        console.log('no engine name')
    }
}


async function checkIfEngineIsRunning(engineName: string): Promise<any> {
    return new Promise((resolve, reject) => {
        pm2.connect((err: any) => {
            if (err) {
                console.log('error connecting to pm2:', err)
            } else {
                pm2.list((err: any, list: any) => {
                    if (err) {
                        reject(`list error: ${err}`)
                    }
                    let filtered = list.find((l: any) => {
                        return l.name === engineName
                    })
                    pm2.disconnect()
                    resolve(filtered)
                })
            }
        })
    })
}


async function startPm2Process(config: any, _engineName?: string) {
    return new Promise((resolve, reject) => {
        let engineName = _engineName ? _engineName : config.engineName
        if (!engineName) {
            reject('no engine name!')
        }
        checkIfEngineIsRunning(engineName)
        .then( async (res: any) => {
            if (res && res.name === engineName) {
                console.log(`${engineName} already running, restarting`)
                try {
                    await stopPm2Process(engineName)
                } catch (err) {
                    reject(err)
                }
            }
            pm2.connect((err: any) => {
                if (err) {
                    let errorMsg = `error connecting to pm2: ${err}`
                    console.log(errorMsg)
                    reject(errorMsg)
                } else {
                    pm2.start({
                        name: engineName,
                        script: './dist/runner.js',
                        args: [JSON.stringify(config)],
                        autorestart: false
                    }, (err: any, apps: any) => {
                        if (err) {
                            let errorMsg = `error starting: ${err}`
                            console.log(errorMsg)
                            reject(errorMsg)
                        }
                        let result = `${apps[0].pm2_env.name} started`
                        // console.log(result)
                        // console.log(apps[0].process)
                        // console.log(apps[0].pid)
                        pm2.disconnect()
                        resolve(result)
                    })
                }
            })
        })
        .catch( (err: any) => {
            let errorMsg = `error connecting to pm2: ${err}`
            console.log(errorMsg)
            reject(errorMsg)
        })
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
    console.log(`stopping ${engineName}`)
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