---
title: Processing large files in Node.js
excerpt: 'Insight into how to use Node.js streams to process very large files'
---

Recently I was working on a task that involved reading and processing a large csv (~3GB in size) and uploads a batch of rows to AWS SQS. Being fairly comfortable with Node and how it works I knew that reading such a large file directly using `fs.readFile()` will not work and I needed something else. This pursuit of figuring out the solution is what this post is about.

Before talking about the solution let's see the wrong way of going about this.

### The wrong way

```js
var fs = require('fs')

fs.readFile('very_large.csv', function(err, data) {
	// do something with data
})
```

The above solution will work with small files upto a few MB's but not further because `fs.readFile` will load the entire file in memory. Now generally speaking Node will crash when your memory usage goes beyond certian limit, which looking at such issues community, is somewhere aroung 1.4GB. Sure, you can definetly increase that limit by passing the `--max-old-space-size` command line flag when starting node process but that is not an efficient way to fix this.

The efficient way (and the right tool) for this particular problem are **Node.js Streams**

### Utilizing Node streams

```js
var fs = require('fs')
var data = ''

var readerStream = fs.createReadStream('very_large.csv') //Create a readable stream

readerStream.setEncoding('UTF8') // Set the encoding to be utf8.

// Handle stream events --> data, end, and error
readerStream.on('data', function(chunk) {
	data += chunk
	//do something with data
})

readerStream.on('end', function() {
	console.log(data)
})

readerStream.on('error', function(err) {
	console.log(err.stack)
})
```

Now that we have seen streams example, let's see how we can process large files for a particular use case which consists of different steps. In my particular scenario I had to do the following:

1.  Read rows from a large csv
2.  Send each row as a message AWS SQS queue

> The larger goal of the above process is to read each row from the input csv file and send a message consisting of data from that row into an SQS queue.

### Using streams incorrectly

```js
const fs = require('fs')
const AWS = require('aws-sdk')

let readable = fs.createReadStream('large.csv')
readable.on('data', async (chunk) => {
	let row = parseCsvRow(chunk)
	try {
		for (let i = 0; i < row.length; i++) {
			sendMsgToSqs(row[i])
		}
	} catch (error) {
		console.log(error)
	}
})

readable.on('end', (chunk) => {
	console.log('csv file processed successfully')
})

function sendMsgToSqs(csvRow) {
	let sqsReq = {
		MessageBody: csvRow,
		QueueUrl: '<your sqs queue endpoint>'
	}
	return new Promise((resolve, reject) => {
		this.sqs.sendMessage(sqsReq, function(err, data) {
			if (err) {
				reject()
			} else {
				//all msgs sent successfully
				resolve()
			}
		})
	})
}
```

So why is the above solution incorrect?

Running above code over a file with millions of rows will eventually crash the Node process even though we are using stream to read its content. The reason for that is - once the file is read and a row is parsed, we send a message to AWS SQS which is an **async** operation. This means that each network request can take its own sweet time to execute.

The stream which is reading the csv file is not aware of this and it continues to read rows as quickly as it can. Now consider hundreds of rows being read and parsed very quickly by incoming data from reading stream, this would mean hundreds of network requests being generated concurrently. Considering we have limited bandwidth, not all requests finish immediately and Node's event loop will have to preserve each request details in memory until it completes.

As requests begin to get clogged up Node will eventually crash when we hit memory limits. So let's fix this.

### The right way

So before looking at the possible solution, let's think about the problem we are trying to solve. Even though we are using stream to read from the csv file, we are not able to instruct or inform that stream that the consumer on the other end is slow and that it needs to slow down and pause when this situation occurs. So we need some API in Node's stream module that allows us to do this.

That particular API is **`stream.pipe`**

In general, you can use `pipe()` on any readable stream. Examples of a readable stream can be as follows

-   Reading a file
-   Executing a select query on a database
-   HTTP Response
-   Any many more...

Piping is a mechanism where we provide the output of one stream as the input to another stream. Lets fix our example using `stream.pipe()`

```js
//pushToSqs.js
const stream = require('stream');
const AWS = require('aws-sdk');

class PushToSqs extends stream.Transform {
	constructor(options = {}) {
		super({ ...options, objectMode: true })
		// Create an SQS service object
		this.sqs = new AWS.SQS({
			region: 'ap-southeast-2',
			apiVersion: '2012-11-05'
		});
	}

	async _transform(chunk, encoding, done) {
		try {
			let csvRow = parseCsvRow(chunk.toString())
			await this.sendBatchMsgToSqs(csvRow)
		} catch (error) {
			done(error)
		}
	}

	sendBatchMsgToSqs(csvRow) {
		let sqsReq = {
			MessageBody: csvRow,
			QueueUrl: '<your sqs queue endpoint>'
		}
		return new Promise((resolve, reject) => {
			this.sqs.sendMessage(sqsReq, function(err, data) {
				if (err) {
					reject()
				} else {
					//all msgs sent successfully
					resolve()
				}
			})
		})
	}
}
```
```js
//index.js
const fs = require('fs');
const stream = require('stream');
const PushToSqs = require('./pushToSqs');
let readable = fs.createReadStream('large.csv');
readable.pipe(new PushToSqs());
```

> `pipe` in basic UNIX/Linux terminology is a command which lets you transfer the output of one command as input to another command. In Node.js streams, we can interpret it as the ability to transfer the output of readable stream to another readable/writable stream.

Looking at the above code you may have a question why do we have to create a separate file with some weird class syntax extending some other weird `stream.Transform` class and all that. Relax I got an explanation which we'll look into it a bit.

In the above code, the magic happens in `readable.pipe(new PushToSqs());` line in `index.js`. Here we are passing on the data received from our readable stream i.e. the stream that is reading our csv file in chunks and passing on those chunks to the other stream i.e. `PushToSqs` class that we have hand-coded. The effect of using pipe here is that now our readable stream is smart and knows if the stream that it is piping data into is slowing down or performing normally and accordingly it pauses/continues reading from a csv file on its own without us writing a single line of code!

### Understanding the need of writing a custom Transform stream

Now coming back to that weird custom syntax in PushToSqs class. Whenever we need to pipe our readable stream to any other stream, that other stream has to be either a readable stream or a writable stream or a transform stream or a duplex stream. This basically means we cannot have an arbitrary random function in argument to the `pipe` function above. We just need to supply either of the streams I mentioned earlier.


```js
const fs = require('fs');
const zlib = require('zlib');
let readable = fs.createReadStream('large.csv');

readable
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream('large.csv.gz'));
```

You must have seen examples like the one above over the internet where people use various 3rd party libraries and get their job done. So why cannot we use any such popular library and get the job done without going into the hassle of creating our own stream? 

Looking at the example above, what is does is - read a large csv file, compress it and write it back to disk, all using streams. The zlib 3rd party package provides the compression logic and fs inbuilt package does the job of writing a file to disk. Now let's focus on the problem statement that we looked at earlier at the start of this article - **read a csv and each row should be sent as a message to sqs**.

I did not find any 3rd party module with such kind of custom business logic that fits my requirement and hence the need for writing our own custom stream class!

I will not go into detail what is a Transform stream but I'll just add few details so that it is easy to understand what is going on in the code. The transform stream is basically used for transforming the stream of bytes from an incoming stream and sending it to the next stream. The `_transform` function at line 134 in `PushToSqs` class is called every time it receives data from upstream. In this case, we do our thing of sending a message to AWS SQS and then call the `done()` callback which informs Node that this particular chunk has been processed successfully and we are ready to process the next chunk of data.

### Error handling

Look at this sentence from Node.js documentation for [readable.pipe](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options)

> One important caveat is that if the Readable stream emits an error during processing, the Writable destination is not closed automatically. If an error occurs, it will be necessary to manually close each stream to prevent memory leaks.

So what that means for our solution is that if for some reason or the other our readable stream which is reading from the csv file has some error and file cannot be read anymore (can be corrupted bytes, disk read error, etc ) then the other streams which are receiving the data from our csv won't know about that and they keep running waiting for data from the readable stream. This may seem not so serious but suppose we have many streams piped on our readable stream something like below

```
let readable = fs.createReadStream('large.csv');

readable
    .pipe(streamA())
	.pipe(streamB())
	.pipe(streamC())
	.pipe(streamD())
	.pipe(streamE())
```

All the streams that are being piped into a chain or sorts will keep running even though the readable stream has errored out. Ideally, in this case, we should also let all other streams down the line have this information that an error has occurred upstream and you need to exit gracefully so that everything is cleaned up and we do not have memory leaks. But when using stream.pipe we have to do this ourselves by writing proper error handlers and manually close down another stream whenever errors occur.

But there is a better solution avaialble since Node.js 10.x - [stream.pipeline](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback)

```js
//index.js
const fs = require('fs');
const { pipeline } = require('stream');
const PushToSqs = require('./pushToSqs');
let readable = fs.createReadStream('large.csv');

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.
pipeline(
	readable,
	new PushToSqs(),	
	(err) => {
		if (err) {
			//if error occurs any where in any stream, the errors are forwarded
			//and cleanup is performed where we can clear things up before exiting
			console.error('Pipeline failed.', err);
		} else {
			//will get called when all the data from source stream as passed through all other
			//streams successfully and there is nothing more to be done. 
			console.log('Pipeline succeeded.');
		}
	}
);
```

Using `stream.pipeline` closes all streams in case of errors in any of the streams in the chain and allows you to run any error handling logic that you may want to for clearing things before exiting, thus preventing memory leaks.

### Conclusion

That is it. We saw the correct and incorrect ways of going about dealing with large files in Node.js and creating a custom hand made stream class suiting our needs. I hope this helps someone out there save some hours trying to process a large file in Node.

Cheers!

PS - As there is no comments feature on my blog yet feel free to reach out to me on [Twitter](https://twitter.com/vinayn_b)