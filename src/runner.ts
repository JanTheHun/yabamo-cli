import { ServerInstance } from '@jbp/yabamo-core'

let server: ServerInstance

attachEventListeners()
run()

function attachEventListeners() {
    process.on('message', function(_data: any) {
        if (server) {
            let data = _data.data || {}
            if (data.command && data.command === 'debug') {
                server.toggleDebugMode(data.method, data.path)
            } else if (data.command && data.command === 'responsechange') {
                server.changeResponse(data.method, data.path, data.response)
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
        await server.checkConfig(config)
        await server.create(config)
        await server.start()
    } catch (err) {
        console.log(err)
        process.exit(-1)
    }
}