const createScheduler = require('probot-scheduler');

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!');

  app.on(['pull_request.opened', 'pull_request.reopened'], async context => {
    const issueComment = context.issue({ body: 'You opened a PR' });
    await context.github.issues.createComment(issueComment);

    const closePR = context.issue({ state: 'closed' });
    app.log('doing stuff')
    return context.github.pullRequests.update(closePR);
  });

  createScheduler(app, {
    delay: !!process.env.DISABLE_DELAY, // delay is enabled on first run
    interval: 24 * 60 * 60 * 1000 // 1 day
  })

  app.on('schedule.repository', context => {
    // this event is triggered once every day, with a random delay
  })
}
