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
            '--help': Boolean,
            '--config': String,
            '--engine': String,
            '--path': String,
            '--method': String,
            '--admin': Number,
            '--response': String,
         
            '-h': '--help',
            '-c': '--config',
            '-e': '--engine',
            '-p': '--path',
            '-m': '--method',
            '-a': '--admin',
            '-r': '--response'
        })
        let { command, params } = getCommand(args)
        if (command === null ) {
            console.log('missing command')
            printHelp()
        } else if (command === 'start') {
            startCommandHandler({configName: args['--config'], params, engineName: args['--engine'], adminPortNumber: args['--admin']})
        } else if (command === 'stop') {
            stopCommandHandler(args['--engine'])
        } else if (command === 'stopall') {
            stopAllCommandHandler()
        } else if (command === 'list') {
            listCommandHandler()
        } else if (command === 'changeresponse') {
            changeResponseCommandHandler({path: args['--path'], method: args['--method'], engineName: args['--engine'], responseName: args['--response']})
        } else if (command === 'debug') {
            let debug: boolean | undefined = params && params.length ? (params[0].toLowerCase() === 'true' ? true : false) : undefined
            debugCommandHandler({ engineName: args['--engine'], path: args['--path'], method: args['--method'], debug })
        } else if (command === 'help') {
            printHelp()
        } else if (command === 'examples') {
            printExamples()
        }
    } catch (err) {
        console.log(err.message)
        printHelp()
    }
}
    
async function startCommandHandler(data: any) {
    let { configName, params, engineName, adminPortNumber } = data
    if (configName) {
        console.log(`\nusing config file: ${configName}`)
    } else {
        console.log('error: config file required')
    }
    
    let adminNeeded: boolean = params && params.length && params[0] === 'admin' ? true : false
    if (adminNeeded) {
        console.log('ADMIN needed')
    }
    try {
        const configFileContent: string = fs.readFileSync(process.cwd().concat(`/${configName}`), 'utf8')
        let config: any = JSON.parse(configFileContent)
        let startResult: any = await startPm2Process(config, engineName, adminPortNumber)
        console.log(`\n${startResult}\n`)
    } catch (err) {
        console.log('error starting API engine:', err)
        process.exit(-1)
    }
}

async function stopCommandHandler(engineName: any) {
    if (engineName) {
        try {
            let stopResult: any = await stopPm2Process(engineName)
            console.log(`\n${engineName} stopped\n`)
        } catch (err) {
            console.log('error stopping:', err)
        }
    } else {
        console.log('engine name required')
    }
}

async function stopAllCommandHandler() {
    try {
        let list = await getPm2ProcessList()
        if (list.length) {
            let engines = list.map(l=> { return l.name })
            for (let e of engines) {
                await stopPm2Process(e)
                console.log('STOPPED:', e)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

async function listCommandHandler() {
    try {
        let list: any[] = await getPm2ProcessList()
        if  (list && list.length) {
            console.log('running API engines:\n')
            list.forEach((e:any) => {
                console.log(`\tpid:${e.pid}\t\tname:${e.name}\t\tstatus:${e.status}\n`)
            })
        } else {
            console.log('no API engines running')
        }
    } catch(err) {
        console.log('error getting list:', err)
    }
}

function changeResponseCommandHandler(data: any) {
    let { path, method, engineName, responseName } = data
    if (engineName && path && method && responseName) {
        let data: any = {
            command: 'responsechange',
            path: path,
            method: method,
            response: responseName
        }
        sendMessageToPm2Process(engineName, data)
    } else {
        console.log('something is missing...', engineName, path, method)
    }
}

function debugCommandHandler(data: any) {
    console.log(data)
    let {engineName, path, method, debug } = data
    if (engineName && path && method) {
        let data: any = {
            command: 'debug',
            path: path,
            method: method
        }
        if (debug !== undefined) {
            data.debug = debug
        }
        sendMessageToPm2Process(engineName, data)
    } else {
        console.log('something is missing...', engineName, path, method)
    }
}

async function checkIfEngineIsRunning(engineName: string): Promise<any> {
    return new Promise((resolve, reject) => {
        pm2.connect((err: any) => {
            if (err) {
                let errorMessage = `error connecting to pm2:${err}`
                reject(errorMessage)
            } else {
                pm2.list((err: any, list: any) => {
                    if (err) {
                        reject(`list error: ${err}`)
                    }
                    let filtered = list.find((l: any) => {
                        return l.name === engineName
                    })
                    pm2.disconnect()
                    if (filtered && filtered.name) {
                        resolve(filtered)
                    } else {
                        resolve(null)
                    }
                })
            }
        })
    })
}

async function sendMessageToPm2Process(engineName: string, data: any): Promise<any> {
    try {
        let engine = await checkIfEngineIsRunning(engineName)
        if (engine) {
            pm2.connect((err: any) => {
                if (err) {
                    console.log('error connecting to pm2:', err)
                } else {
                    let dataDTO: any = {
                        data: data,
                        topic: 'communication'
                    }
                    pm2.sendDataToProcessId(engine.pm_id, dataDTO, (err: any, res: any) => {
                        if (err) {
                            throw(`list error: ${err}`)
                        }
                        pm2.disconnect()
                    })
                }
            })
        } else {
            console.log(`engine "${engineName}" not running`)
        }
    } catch (err) {
        console.log('error checkIfEngineIsRunning:', err)
    }
}

async function startPm2Process(config: any, _engineName: string, adminPortNumber: number) {
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
                    reject(errorMsg)
                } else {
                    pm2.start({
                        name: engineName,
                        script: __filename.replace('index.js', 'runner.js'),
                        args: [ JSON.stringify( { config, adminPortNumber } ) ],
                        autorestart: false
                    }, (err: any, apps: any) => {
                        if (err) {
                            let errorMsg = `error starting: ${err}`
                            reject(errorMsg)
                        }
                        let result = `${apps[0].pm2_env.name} started`
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
                    // console.log(list)
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

async function stopPm2Process(engineName: string): Promise<any[]> {
    // console.log(`stopping ${engineName}`)
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

function getCommand(args: any): { command: string | null, params: string[] | null} {
    const commands = ['list', 'start', 'stop', 'stopall', 'changeresponse', 'debug', 'help', 'examples']
    let parsedCommand = args && args['_'] && args['_'].length ? args['_'].filter( (a: string) => {return commands.indexOf(a.toLowerCase()) !== -1}) : null
    if (parsedCommand && parsedCommand.length === 1) {
        return { command: parsedCommand[0], params: args['_'].slice(1) }
    } else {
        return { command:null, params: null}
    }
}

function printHelp() {
    console.log('\nUsage:\nyabamo-client <command> [options]')

    console.log('\nCommands:')
    console.log('\n\tstart\t\tstart an engine from config file (provided in --config)')
    console.log('\n\tstop\t\tstop an engine with given name (provided in --engine)')
    console.log('\n\tstopall\t\tstop all running engines')
    console.log('\n\tlist\t\tlist of running engines')
    console.log('\n\tchangeresponse\tchange response on engine described by --engine, on route desribed by --path and --method, to the response name given in --response')
    console.log('\n\tdebug\t\ttoggle or set debug mode on engine described by --engine, on route desribed by --path and --method')

    console.log('\nOptions:')
    console.log('\n\t--config, -c\tconfig file for the API')
    console.log('\n\t--engine, -e\tAPI engine name')
    console.log('\n\t--method, -e\tHttp method (GET, POST, PUT, DELTE, OPTIONS) that along with --path decribes a certain route of the API (e.g.: GET /)')
    console.log('\n\t--path, -e\tpath that along with --method decribes a certain route of the API (e.g.: GET /)')
    console.log('\n\t--response, -e\tresponse name')

    console.log('\n')
    process.exit(-1)
}

function printExamples() {
    console.log('\nExamples:')
    console.log('\nyabamo-cli start -c config.json\n\tstart API engine from file "config.json"')
    console.log('\nyabamo-cli start -c config.json -e TestEngine\n\tstart API engine from file "config.json" with the name "TestEngine"')
    console.log('\nyabamo-cli stop -e TestEngine\n\tstop API engine with the name "TestEngine"')
    console.log('\nyabamo-cli list\n\tlist of running engines')

    console.log('\n')
    process.exit(-1)
}

/* -*- ts -*- */