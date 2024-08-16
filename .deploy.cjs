const { spawn } = require('child_process')
const { sep } = require('path')
const dotenv = require('dotenv')

const dotEnvTypes = ['.deploy', '.production', '']

;['.local', ''].forEach((dotenvClass) => {
  dotEnvTypes.forEach((dotenvType) => {
    dotenv.config({ path: '.env' + dotenvType + dotenvClass })
  })
})

const commands = [
  //
  'react-scripts build',
  `cp build${sep}index.html build${sep}404.html`,
  'gh-pages -d build',
]

const executor = async (commands) => {
  for (const row of commands) {
    const [command, options] = Array.isArray(row) ? row : [row]
    const processOpts = { stdio: 'inherit', shell: true, ...options }
    const process = spawn(command, processOpts)
    const returncode = await new Promise((resolve, reject) => {
      process.on('exit', resolve)
    })
    if (returncode !== 0) throw new Error(JSON.stringify({ command, returncode }, null, 2))
  }
}

executor(commands)
