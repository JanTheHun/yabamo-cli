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

### Stopping API engine

```$ yabamo-cli stop --engine testAPI``` will stop the API engine named ```testAPI``` (if running).

```$ yabamo-cli stopall``` will stop all running engines.

### List running engines

```$ yabamo-core list``` will print a list of running API engines.

### Manipulate ```debug``` mode on engine

***This is probably not a good idea when running yabamo from CLI!** see [Debug](#debug) mode.*

You can use ```debug``` command to set or toggle debug mode on a certain route of an engine.

You need to provide name of the engine with ```--engine```, the path and the method with ```--path``` and ```--method``` and you can optionally set true or false by providing it as an argument.

Examples:

```$ yabamo-cli debug true -e testAPI -m GET -p /``` will set debug mode to true on the ```GET /``` route of the API called ```testAPI```. Omitting ```true``` or ```false``` will toggle the value; if debug mode was on, itt will turn it off and vice versa.

### Change response on engine

With ```changeresponse``` command you can override the response sent by a certain API endpoint. For example, let's say you augment the above configuration with a response named ```other``` like this:

```
"responses": {
    "default": "hello world!",
    "other": "HELLLO World!!"
}
```
In this case, by typing ```$ yabamo-cli changeresponse -e testAPI -m GET -p / -r other``` you can switch the current response to ```other```. From now on your API will respond with ```HELLLO World!``` when someone ```GET```s the path ```/``` (e.g. loads ```http://localhost:9000``` in her browser).

## Configuration

* engineName: optional, you can provide a name on start with ```--engine``` (or ```-e```) option. If you fail to provide the name of the API engine either way, the CLI will exit with error.
* port: required, the port number your API will use.
* routes: required, an ```Array``` of routes.
* fallback: optional, this is the response your API will use if no route has been found (your ```404``` response if you will).

### Routes
* path: required
* method: optional, defaults to ```GET```
* responses: required, a key=>value map where ```key``` is the name of the response, ```value``` is the response itself.
* currentResponse: optional, could be the name of one of the responses.


#### Method

Possible values: ```GET```, ```POST```, ```PUT```, ```DELETE``` and ```OPTIONS```

#### Responses

Every response is named. If there is only one response defined, it will be used. If there is more than one but no other indication of which one to use it will default to the first one. If there is a response named ```default```, it will have preference over other responses. If there is a ```currentResponse``` defined, it will have preference over everything else.

If the response is a ```string``` or a ```number``` it will be stringified and sent with ```res.send()```. If it is an ```Object``` or an ```Array``` it will be sent with ```res.json()```.

## Debug

You can set ```debug``` mode on any route. This means that when a request arrives to that route the API will pause and wait either for instruction regarding which possible response to send or until timeout. Default timeout is 30 seconds, you can overwrite it with ```debugTimeout``` (in milliseconds). This means that running yabamo from the CLI with a configuration containing ```debug:true``` on any route or setting debug mode later leads to a situation where requests may be delayed. Use it carefully!