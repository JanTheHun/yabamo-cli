import { ServerInstance } from '@jbp/yabamo-core'
import * as fs from 'fs'
async function run() {
    try {
        process.on('message', function(data: any) {
            try {
                let parsedData = JSON.stringify(data)
                fs.writeFileSync(__dirname.concat('/log11'), parsedData)
                // server.toggleDebugMode(data.data.method, data.data.path)
            } catch (err) {
                fs.writeFileSync(__dirname.concat('/log11'), err)
            }
        })
        const config = JSON.parse(process.argv[2])
        if (!config) {
            process.exit(-1)
        }
        const server = new ServerInstance()
        await server.checkConfig(config)
        await server.create(config)
        await server.start()
    } catch (err) {
        console.log(err)
        process.exit(-1)
    }
}
run()