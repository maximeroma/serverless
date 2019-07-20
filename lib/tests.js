const {get} = require("lodash")
const aws4 = require("aws4")
const URL = require("url")
const http = require("superagent")
const mode = process.env.TEST_MODE
const APP_ROOT = "../"

const respondFrom = httpRes => {
  const contentType = get(httpRes, "headers.content-type", "application/json")
  const body = contentType === "application/json" ? httpRes.body : httpRes.text

  return {
    statusCode: httpRes.status,
    body,
    headers: httpRes.headers
  }
}

const signHttpRequest = (url, httpReq) => {
  const urlData = URL.parse(url)
  const opts = {
    host: urlData.hostname,
    path: urlData.pathname
  }

  aws4.sign(opts)

  httpReq
    .set("Host", opts.headers["Host"])
    .set("X-Amz-Date", opts.headers["X-Amz-Date"])
    .set("Authorization", opts.headers["Authorization"])

  if (opts.headers["X-Amz-Security-Token"]) {
    httpReq.set("X-Amz-Security-Token", opts.headers["X-Amz-Security-Token"])
  }
}

const viaHttp = async (relPath, method, opts) => {
  const root = process.env.TEST_ROOT
  const url = `${root}/${relPath}`
  console.log(`invoking via HTTP ${method} ${url}`)

  try {
    const httpReq = http(method, url)
    const body = get(opts, "body")

    if (body) {
      httpReq.send(body)
    }

    if (get(opts, "iam_auth", false) === true) {
      signHttpRequest(url, httpReq)
    }

    const authHeader = get(opts, "auth")
    if (authHeader) {
      httpReq.set("Authorization", authHeader)
    }

    const res = await httpReq
    return respondFrom(res)
  } catch (err) {
    if (err.status) {
      return {
        statusCode: err.status,
        headers: err.response.headers
      }
    } else {
      throw err
    }
  }
}

const viaHandler = (event, functionName) => {
  let handler = require(`${APP_ROOT}/functions/${functionName}`).handler

  return new Promise((resolve, reject) => {
    const context = {}
    const callback = (err, response) => {
      if (err) {
        reject(err)
      } else {
      }

      const contentType = get(
        response,
        "headers.content-type",
        "application/json"
      )

      if (response.body && contentType === "application/json") {
        response.body = JSON.parse(response.body)
      }

      resolve(response)
    }

    handler(event, context, callback)
  })
}

const invoke_get_index = async () => {
  return mode === "handler"
    ? await viaHandler({}, "get-index")
    : await viaHttp("", "GET")
}
const invoke_get_restaurants = async () => {
  return mode === "handler"
    ? await viaHandler({}, "get-restaurants")
    : await viaHttp("restaurants", "GET", {iam_auth: true})
}
const invoke_search_restaurants = async (user, theme) => {
  const body = JSON.stringify({theme})
  const auth = user.idToken

  return mode === "handler"
    ? await viaHandler({body}, "search-restaurants")
    : await viaHttp("restaurants/search", "POST", {body, auth})
}

module.exports = {
  invoke_get_index,
  invoke_get_restaurants,
  invoke_search_restaurants
}
