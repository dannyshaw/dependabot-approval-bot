const APPROVE = "APPROVE";
const AUTO_MERGE_MESSAGE = "Dependabot will automatically merge";
const DEPENDABOT = "dependabot-preview[bot]";
const DEPENDABOT_APPROVE_BOT = "dependabot-approve[bot]";

module.exports = app => {
  app.log("App is loaded");
  function isDependabot(context) {
    try {
      const is = context.payload.sender.login === DEPENDABOT;
      app.log(`isDependabot: ${is}`);
      return is;
    } catch (err) {
      app.log(context.payload);
      app.log(err);
      return false;
    }
  }

  function isAutomerging(context) {
    try {
      const is = context.payload.pull_request.body.includes(AUTO_MERGE_MESSAGE);
      app.log(`isAutomerging: ${is}`);
      return is;
    } catch (err) {
      app.log(context.payload);
      app.log(err);
      return false;
    }
  }

  function isDependabotApprover(context) {
    try {
      const is = context.payload.review.user.login === DEPENDABOT_APPROVE_BOT;
      app.log(`isDependabotApprover: ${is}`);
      return is;
    } catch (err) {
      app.log(err);
      return false;
    }
  }

  function isDependabotUser(context) {
    try {
      const is = context.payload.pull_request.user.login === DEPENDABOT;
      app.log(`isDependabotUser: ${is}`);
      return is;
    } catch (err) {
      app.log(context.payload);
      app.log(err);
      return false;
    }
  }

  function approvePr(context) {
    try {
      const params = context.issue({ event: APPROVE });
      return context.github.pullRequests.createReview(params);
    } catch (err) {
      app.log(err);
      app.log(context.payload);
    }
  }

  app.on("pull_request.opened", async context => {
    app.log("Received PR open event");
    if (isDependabot(context) && isAutomerging(context)) {
      app.log("Approving new PR");
      return approvePr(context);
    }
  });

  app.on("pull_request_review.dismissed", async context => {
    app.log("Received PR review dismiss event");
    app.log(context.payload);
    if (
      isDependabot(context) &&
      isAutomerging(context) &&
      isDependabotApprover(context) &&
      isDependabotUser(context)
    ) {
      app.log("Re-approving dismissed approval");
      return approvePr(context);
    }
  });
};
