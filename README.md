# yabamo-cli

CLI wrapper for the [@jbp/yabamo-core](https://www.npmjs.com/package/@jbp/yabamo-core) library.

## Installation
```npm install -g @jbp/yabamo-cli```

## Usage

### Starting API engine
```$ yabamo-cli start --config config.json```

where ```config.json``` is a ```.json``` file describing accessible paths and possible responses for your fake backend. A minimal config file would look something like this:
```
{
    "engineName": "testAPI",
    "port": "9000",
    "routes": [
        {
            "path": "/",
            "responses": {
                "default": "hello world!"
            }
        }
    ]
}
```
This very basic API responds to any request on its root (```http://localhost:9000```) with a simple "hello world!" string.

You can provide the name of the API engine with ```--engine``` option:

```$ yabamo-cli start --config config.json --engine Engine1```

It overrides the name provided in config and if none exists, the CLI will exit with error.

### Stopping engine

```$ yabamo-core stop --engine testAPI``` will stop the API engine ```testAPI``` (if running).

### List running engines

```$ yabamo-core list``` will print a list of running API engines.