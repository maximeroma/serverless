const correlationIds = require("../lib/correlation-ids")
const log = require("../lib/log")

module.exports = config => {
  let rollback = undefined

  const isDebugEnabled = () => {
    const context = correlationIds.get()

    if (context["Debug-Log-Enabled"] === "true") {
      return true
    }

    return config.sampleRate && Math.random() <= config.sampleRate
  }

  return {
    before: (handler, next) => {
      if (isDebugEnabled()) {
        rollback = log.enableDebug()
      }

      next()
    },
    after: (handler, next) => {
      if (rollback) {
        rollback()
      }

      next()
    },
    onError: (handler, next) => {
      const {awsRequestId} = handler.context
      const invocationEvent = JSON.stringify(handler.event)
      log.error(
        "invocation failed",
        {awsRequestId, invocationEvent},
        handler.error
      )
      next(handler.error)
    }
  }
}
