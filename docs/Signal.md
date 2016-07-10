# Signal

## new Signal(\[params\[, options\]\])

* `params` {Array} Parameters of the signal. Defaults to `[]`.
* `options` {Object} Options that allow finetuning of the signal.

Returns a new Signal object with parameters specified in `params`.

Each element of the `params` array has to be an object with the two properties:
`type` and `name` specifying the datatype of the parameter and its name.
The type is currently ignored.

## signal.execute(...args)

Executes the signal.

## signal.connect(...args)

## signal.disconnect(...args)

## signal.isConnected(...args)

## signal.signal

Returns a function that runs `signal.execute(...args)` when called and has
`connect`, `disconnect` and `isConnected` properties that call corresponding
methods from the `signal`.

## Class Method: Signal.signal(\[params\[, options\]\])

Constructs a `Signal` instance with the given `params` and `options` and returns
its `.signal` property.
