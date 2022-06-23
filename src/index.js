const express = require("express");
const cors = require("cors");
const timeout = require("connect-timeout");
const https = require("https");
const url = require("url");
const { SocksProxyAgent } = require("socks-proxy-agent");

const app = express();

app.use(cors());
app.use(timeout(240000));
app.use(haltOnTimeout);

app.get("/:username", (req, res) => {
  const username = req.params.username;
  const query = req.query.data;

  https
    .get(
      "https://grin.co/wp-admin/admin-ajax.php?action=imc_engagement&imc_url=https://instagram.com/" +
        username,
      {
        timeout: 240000,
      },
      (response) => {
        var body = "";

        response.on("data", (data) => {
          body += data;
        });

        response.on("end", () => {
          try {
            let data = JSON.parse(body);

            if (query) {
              let extractedData = data["user_profile"]
                ? data["user_profile"][query]
                : null;
              data = {};
              data[query] = extractedData;
            }

            res.json(data);
          } catch(e) {
            res.status(400).json({});
          }
        });
      }
    )
    .on("error", (e) =>
      res.json({
        statusCode: 500,
        message: "Something went wrong, please try again later",
      })
    );
});

app.use("*", (req, res) =>
  res.json({
    statusCode: "404",
    message: "Could not be found",
  })
);

app.get("/testApi/:username", (req, res) => {
  const username = req.params.username;

  const proxy =
  "socks5://cbwCCAgVPUe1UxinihKaTJx5:5wz8Y1w9sFi3uF95syXA8J6C@stockholm.se.socks.nordhold.net:1080";

  var endpoint =
    "https://grin.co/wp-admin/admin-ajax.php?action=imc_engagement&imc_url=https://instagram.com/" +
    username;

  const agent = new SocksProxyAgent(proxy);

  const opts = url.parse(endpoint);
  opts.agent = agent;

  https
    .get(opts, function (response) {
      res.send(response.headers)
    })
    .on("error", function (e) {
      res.json(e);
    });
})

function haltOnTimeout(req, res, next) {
  if (!req.timedout) next();
}

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("Server is up on port " + port));
