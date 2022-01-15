const express = require("express");
const timeout = require("connect-timeout");
const puppeteer = require("puppeteer-extra");
const userAgent = require("random-useragent");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();

app.use(timeout("30s"));
app.use(haltOnTimeout);

const chromeOptions = {
  headless: true,
  defaultViewport: null,
  args: ["--incognito", "--no-sandbox", "--single-process", "--no-zygote"],
};

puppeteer.use(stealthPlugin());

app.get("/:username", async (req, res) => {
  const browser = await puppeteer.launch(chromeOptions);
  const page = await browser.newPage();

  await page.setUserAgent(userAgent.getRandom());
  await page.setJavaScriptEnabled(true);
  await page.setDefaultNavigationTimeout(0);

  await page.evaluateOnNewDocument(() => {
    // Pass webdriver check
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  await page.evaluateOnNewDocument(() => {
    // Pass chrome check
    window.chrome = {
      runtime: {},
      // etc.
    };
  });

  await page.evaluateOnNewDocument(() => {
    //Pass notifications check
    const originalQuery = window.navigator.permissions.query;
    return (window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters));
  });

  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, "plugins", {
      // This just needs to have `length > 0` for the current test,
      // but we could mock the plugins too if necessary.
      get: () => [1, 2, 3, 4, 5],
    });
  });

  await page.evaluateOnNewDocument(() => {
    // Overwrite the `languages` property to use a custom getter.
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  await page.goto(
    "https://grin.co/wp-admin/admin-ajax.php?action=imc_engagement&imc_url=https://instagram.com/" +
      req.params.username
  );

  let response;

  const jsonresponse = await page.evaluate(() => {
    return JSON.parse(document.querySelector("body").innerText);
  });

  await browser.close();
  let query = req.query.data;

  if (query) {
    response = jsonresponse["user_profile"][req.query.data];
  }

  res.json({
    data: response ? response : jsonresponse,
  });
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
