const Promise = require("bluebird")
const awscred = Promise.promisifyAll(require("awscred"))

let initialized = false

const initTests = async () => {
  if (initialized) {
    return
  }

  process.env.restaurants_api =
    "https://65lbw6a68l.execute-api.us-east-1.amazonaws.com/dev/restaurants"
  process.env.cognito_user_pool_id = "us-east-1_9zfVQJGMO"
  process.env.cognito_client_id = "3kjhqi44gnci7mfjraijfua11k"
  process.env.restaurants_table = "restaurants"
  process.env.AWS_REGION = "us-east-1"
  process.env.cognito_user_pool_id = "us-east-1_9zfVQJGMO"
  process.env.cognito_client_id = "test_cognito_client_id"
  process.env.cognito_server_client_id = "2nf34svdri72l3j3u4uclir5ka"

  if (!process.env.AWS_ACCESS_KEY_ID) {
    const cred = (await awscred.loadAsync()).credentials
    process.env.AWS_ACCESS_KEY_ID = cred.accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = cred.secretAccessKey

    if (cred.sessionToken) {
      process.env.AWS_SESSION_TOKEN = cred.sessionToken
    }
  }

  initialized = true
}

module.exports.initTests = initTests
