const dotenv = require("dotenv");
const { check, serve } = require("reserve");

dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env" });

// Exactly AFTER dotenv configuration
const config = require("./serve.config");

check(config).then((configuration) =>
  serve(configuration).on("ready", (cfg) => {
    console.log(`Server running at ${cfg.url}`);
  }),
);
