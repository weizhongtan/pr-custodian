const createScheduler = require('probot-scheduler');

function since(secs) {
  const ttl = secs * 1000
  let date = new Date(new Date() - ttl)

  // GitHub won't allow it
  if (date < new Date(0)) {
    date = new Date(0)
  }
  return date
}

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!');

  const triggers = ['pull_request.opened', 'pull_request.reopened'];

  app.on(triggers, async context => {
    const issueComment = context.issue({ body: 'You opened a PR' });
    await context.github.issues.createComment(issueComment);
  });

  app.on('pull_request.labeled', async context => {
    const label = context.payload.label.name;
    if (label === 'self destruct') {
      const comment = context.issue({ body: 'Your PR will self destruct in 5s' });
      return context.github.issues.createComment(comment);
    }
  })

  createScheduler(app, {
    delay: !!process.env.DISABLE_DELAY, // delay is enabled on first run
    interval: 5000
  })

  app.on('schedule.repository', async context => {
    const owner = 'weizhongtan';
    const repo = 'test';
    // this event is triggered once every day, with a random delay
    const timestamp = since(2).toISOString().replace(/\.\d{3}\w$/, '')

    const query = `repo:${owner}/${repo} is:open updated:<${timestamp} label:"self destruct"`

    const params = { q: query, sort: 'updated', order: 'desc', per_page: 10 }

    const staleItems = (await context.github.search.issues(params)).data.items;

    app.log(staleItems)

    await Promise.all(staleItems.map(async issue => {
      await context.github.issues.createComment({
        owner,
        repo,
        number: issue.number,
        body: 'This PR is about to self destruct',
      })
      await context.github.issues.replaceAllLabels({
        owner,
        repo,
        number: issue.number,
        labels: ['exploded'],
      });
    }))
  })
}
