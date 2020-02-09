const { cyan, green, red } = require('chalk')
const jimp = require('jimp')
const { asyncMakeDirectory } = require('./_utils')

// import config file
const config = require('./config.json')

async function main() {
	console.log(`\nProcessing ${cyan('images')}`)

	try {
		await asyncMakeDirectory('./assets/images')
		config.images.map(async (file) => {
			// read image file with jimp
			const image = await jimp.read(file.entry)

			// process and write image file to assets
			image.quality(file.quality)
			if (file.resize) {
				image.resize(file.resize[0], file.resize[1])
			}
			image.write(file.output)
			console.log(`${green(file.output)} image processed`)
		})
	} catch (error) {
		console.log(red(error))
	}
}

main()
