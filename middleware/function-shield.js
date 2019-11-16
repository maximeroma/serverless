const FunctionShield = require("@puresec/function-shield");

module.exports = () => {
  return {
    before: (_, next) => {
      FunctionShield.configure({
        policy: {
          outbound_connectivity: "block",
          read_write_tmp: "alert",
          create_child_process: "block"
        },
        token: process.env.FUNCTION_SHIELD_TOKEN
      });

      next();
    }
  };
};
