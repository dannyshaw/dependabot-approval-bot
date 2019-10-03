const APPROVE = "APPROVE";
const AUTO_MERGE_MESSAGE = "Dependabot will automatically merge";
const DEPENDABOT = "dependabot-preview[bot]";
const DEPENDABOT_APPROVAL_BOT = "dependabot-approval-bot[bot]";

module.exports = app => {
  app.log("App is loaded");
  function isDependabotActing(context) {
    try {
      // console.log(context.payload)
      const is = context.payload.sender.login === DEPENDABOT;
      app.log(`isDependabotActing: ${is}`);
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

  function isDependabotReview(context) {
    try {
      const is = context.payload.review.user.login === DEPENDABOT_APPROVAL_BOT;
      app.log(`isDependabotReview: ${is}`);
      return is;
    } catch (err) {
      app.log(err);
      return false;
    }
  }

  function isDependabotPr(context) {
    try {
      const is = context.payload.pull_request.user.login === DEPENDABOT;
      app.log(`isDependabotPr: ${is}`);
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
    if (isDependabotActing(context) && isAutomerging(context)) {
      app.log("Approving new PR");
      return approvePr(context);
    }
  });

  app.on("pull_request_review.dismissed", async context => {
    app.log("Received PR review dismiss event");
    app.log(context.payload);
    // note, not checking isAutomerging here as the PR body doesn't have that message
    // at the point where the dismissal comes in, though we can assume if we approved
    // it previously, we should approve it again.
    if (
      isDependabotActing(context) &&
      isDependabotPr(context) &&
      isDependabotReview(context)
    ) {
      app.log("Re-approving dismissed approval");
      return approvePr(context);
    }
  });
};
