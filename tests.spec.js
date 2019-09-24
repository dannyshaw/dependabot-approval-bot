const nock = require("nock");
const dependabotApproveBot = require("./index");
const { Probot } = require("probot");
nock.disableNetConnect();

describe("Dependabot Approvals", () => {
  let probot;

  beforeEach(() => {
    probot = new Probot({});
    // Load our app into probot
    const app = probot.load(dependabotApproveBot);

    // just return a test token
    app.app = { getSignedJsonWebToken: () => "test" };
  });

  test("PR meets requirements and is approved", async () => {
    const payload = require("./fixtures/pull_request.opened.by.dependabot.json");
    // console.log(payload)

    const scope = nock("https://api.github.com")
      .post("/repos/dannyshaw/dependabot-approve-bot/pulls/1/reviews", body => {
        expect(body.event).toBe("APPROVE");
        return true
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({ name: "pull_request", payload });
    scope.done()
  });


  test("Approved PR dismissed by dependabot is re-approved", async () => {
    const payload = require("./fixtures/pull_request_review.dismissed.by.dependabot.json");

    const scope = nock("https://api.github.com")
      .post("/repos/dannyshaw/dependabot-approve-bot/pulls/1/reviews", body => {
        expect(body.event).toBe("APPROVE");
        return true
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({ name: "pull_request_review", payload });
    scope.done()
  });
});
