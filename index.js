//* E-COMMERCE SITE
const connectionToDataBase = require('./src/config/db')
const keys = require('./src/config/keys')
const server = require('./src/router/app')

//* CONNECT TO DATABASE
connectionToDataBase()

//* CONNECT TO SERVER
const port = keys.SERVER_PORT || 4000

server.listen(port, () => {
  console.log(`server listening on port ${port}`)
})
