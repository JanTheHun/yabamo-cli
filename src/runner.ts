import { ServerInstance, checkConfig } from '@jbp/yabamo-core'
const config = JSON.parse(process.argv[2])
if (config) {
    run()
} else {
    process.exit(-1)
}
async function run() {
    const server = new ServerInstance()
    try {
        await checkConfig(config)
        await server.create(config)
        await server.start()
    } catch (err) {
        console.log(err)
        process.exit(-1)
    }
}