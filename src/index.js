const express = require("express");
const https = require("https");

const app = express();

app.get("/:username", (req, res) => {
  const username = req.params.username;
  const query = req.query.data;

  https.get(
    "https://grin.co/wp-admin/admin-ajax.php?action=imc_engagement&imc_url=https://instagram.com/" +
      username,
    (response) => {
      var body = "";

      response.on("data", (data) => {
        body += data;
      });

      response.on("end", () => {
        let data = JSON.parse(body);

        if (query) {
          let extractedData = data["user_profile"][query];
          data = {};
          data[query] = extractedData;
        }

        res.json(data);
      });
    }
  );
});

app.use("*", (req, res) =>
  res.json({
    statusCode: "404",
    message: "Could not be found",
  })
);

function haltOnTimeout(req, res, next) {
  if (!req.timedout) next();
}

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("Server is upp on port " + port));
