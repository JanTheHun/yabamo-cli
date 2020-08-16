import fs from 'fs'
import { ServerInstance, checkConfig } from '@jbp/yabamo-core'
let server = new ServerInstance()

const configFileContent = fs.readFileSync('./config.json', 'utf8')
let config: any = null
try {
    config = JSON.parse(configFileContent)
    let configCheck = checkConfig(config)
} catch (err) {
    console.log('oops:', err)
    process.exit(-1)
}

let timeout_1: number = 1000
let timeout_2: number = 8000

const useCallbacks: boolean = false

if (useCallbacks) {
    mainWithCallbacks()
} else {
    mainAsyncWithPromises()
}

async function mainAsyncWithPromises() {

    
    try {


        let startResult = await server.create(config)
        console.log('startResult:', startResult)

        let serverStartResult = await server.start()
        console.log('serverStartResult:', serverStartResult)

        setTimeout(async () => {
            try {
                let methodChangeResult = await server.changeResponse('POST', '/api/something', 'other')
                console.log('methodChangeResult:', methodChangeResult)
            } catch (err) {
                console.log('error changing response:', err)
            }
        }, timeout_1)

        // setTimeout(async () => {
        //     try {
        //         let stopResult = await server.stop()
        //         console.log('stopResult:', stopResult)
        //     } catch(err) {
        //         console.log('error stopping engine:', err)
        //     }
        // }, timeout_2)

    }
    catch(err) {
        console.log('ERROR:', err)
    }

}

async function mainWithCallbacks() {

    server.create(config, (res: any, err: any) => {
        if (err) {
            console.log('error creating engine:', err)
        } else {
            console.log('success creating engine:', res)
            server.start((res0: any, err0: any) => {
                if (err0) {
                    console.log('error starting:', err0)
                } else {
                    console.log('success starting:', res0)
                    setTimeout(() => {
                        server.changeResponse('POST', '/api/something', 'other',((res2: any, err2: any) => {
                            if (err2) {
                                console.log('error on changing method:', err2)
                            } else {
                                console.log('success on changing method:', res2)

                                // setTimeout(() => {
                                //     server.stop((res3: any, err3: any) => {
                                //         if (err3) {
                                //             console.log('error stopping:', err3)
                                //         } else {
                                //             console.log('success stopping:', res3)
                                //         }
                                //     })
                                // }, timeout_2)
                            }
                        }))
                    }, timeout_1)
                }
            })
        }
    })
}
