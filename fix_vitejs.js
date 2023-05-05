const { readdirSync, unlinkSync } = require("fs")
const { join } = require("path")

const directory = join(require.resolve("@vite/vitejs-abi"), "../..")
const files = readdirSync(directory)
for(const file of files){
    if(!file.endsWith(".ts"))continue
    const path = join(directory, file)
    unlinkSync(path)
}