const { cyan, green, red } = require('chalk')
const { Jimp } = require('jimp')
const { asyncMakeDirectory } = require('./_utils')

// import config file
const config = require('./config.json')

async function main() {
	console.log(`\nProcessing ${cyan('images')}`)

	try {
		await asyncMakeDirectory('./assets/images')
		for (const file of config.images) {
			// read image file with jimp
			const image = await Jimp.read(file.entry)

			// process and write image file to assets
			if (file.resize) {
				image.resize({ w: file.resize[0], h: file.resize[1] })
			}
			const writeOptions = file.quality
				? { quality: file.quality }
				: undefined
			await image.write(file.output, writeOptions)
			console.log(`${green(file.output)} image processed`)
		}
	} catch (error) {
		console.log(red(error))
	}
}

main()
