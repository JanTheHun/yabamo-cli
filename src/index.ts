#!/usr/bin/env node
import fs from 'fs'
import { spawn } from 'child_process'
import { ServerInstance, checkConfig } from '@jbp/yabamo-core'
import * as yargs from 'yargs'
yargs.parse()


// import * as command from 'commander'
// const program = new command.Command()
// program
//     .command('start <config>')
//     .description('start engine')
//     .action((source, destination) => {
//         console.log('start:', destination.args)
//         startCommandHandler(destination.args[0])
//     })

// program.command('stop')
//     .description('stop engine')
//     .action((source, destination) => {
//         console.log('stop')
//         // stopCommandHandler()
//     })

// program.parse(process.argv)

// if (program.config) {
//     console.log('config file:', program.config)
// }

// if (program.start) {
//     console.log('start', program.start)
// }


const argv = yargs
    .command('start <config>', 'start engine with config file', startCommandHandler)
    .usage('Usage: $0 <command> [options]')
    .help('h')
    .command('stop [name]', 'stop engine', stopCommandHandler)
    .command('stopall', 'stop all engine', stopAllCommandHandler)
    .argv

console.log('arguments:', argv)

console.log()
    
function startCommandHandler(data: any) {
    let config = data.argv['_'][1]
    console.log('CONFIG:', config)
    if (config) {
        console.log(`using config file: ${config}`)
        const configFileContent = fs.readFileSync(process.cwd().concat(`/${config}`), 'utf8')
        try {
            let config: any = JSON.parse(configFileContent)
            main(config)
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

function stopCommandHandler(data: any) {
    let _arguments = data.argv['_']
    console.log(_arguments)
    let engineName = _arguments[1]
    if (engineName) {
        console.log(`stopping: ${engineName}`)
    } else {
        console.log('no engine name')
    }

}

async function main(config: any) {

    let out = fs.openSync('./out.log', 'w')
    let err = fs.openSync('./out.log', 'w')
    const runner = spawn('node', ['./dist/runner.js'], {
        detached: true,
        stdio: [ 'ignore', out, err ],
        env: { config: JSON.stringify(config)}
    })

    runner.unref()
    // const server = new ServerInstance()
    
    // try {
        
    //     let configCheck = await checkConfig(config)
    //     console.log('configCheck:', configCheck)

    //     let createResult = await server.create(config)
    //     console.log(createResult)

    //     let startResult = await server.start()
    //     console.log(startResult)

    //     let changeResult = await server.changeResponse('GET', '/a', 'other')
    //     console.log(changeResult)
    
    // } catch (err) {
    //     console.log('error:', err)
    //     process.exit(-1)
    // }

}
