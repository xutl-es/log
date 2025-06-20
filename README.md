# @xutl/log

A simple logging utility that let's you split out different loag-realms (severities) to different destinations.

It is highly configurable and serves well for debug outputs while not overly impacting the standard execution.

## Usage

`npm install --save @xutl/log`

```typescript
import { Logger } from '@xutl/log';

/*
type LoggerConfig = {
	[pattern: string]: {
		format?: FormatID; // 'JSONLog' | 'RawData' | 'Console'
		destination: string; // a filename or 'stderr' | 'stdout' | 'null'
		mode?: PipeModes; // 'STREAM' or 'SYNC'
		options?: Omit<Util.InspectOptions, 'maxArrayLength' | 'maxStringLength' | 'breakLength' | 'compact'>;
	};
};
*/
const config = {
	'a:*:c': { destination: '/logs/{2}.log' },
	'a:x:**:c': { destination: '/logs/{3}.log' }
};
const logger = Logger.define({
	machine: 'identifier', // arbitrary meta-information to output onto each logline
}, config );
logger.log('error', 'my msg %d', 1);
logger.error('my msg %d', 1);

logger.add('custom:realm');
```
