# yabamo-cli

CLI wrapper for the [@jbp/yabamo-core](https://www.npmjs.com/package/@jbp/yabamo-core) library.

## Installation
```npm install -g @jbp/yabamo-cli```

## Usage

```$ yabamo-cli start config.json```

where ```config.json``` is a ```.json``` file describing accessible paths and possible responses for your fake backend. A minimal config file would look something like this:
```
{
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