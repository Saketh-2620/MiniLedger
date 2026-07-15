const cron = require('node-cron');
const {
  runWeeklySummaryForAll,
  runMonthlyReportForAll,
} = require('./notificationService');

/**
 * Weekly summary — every Monday at 8:00 AM server time
 * Cron: "0 8 * * 1"
 */
cron.schedule('0 8 * * 1', async () => {
  try {
    await runWeeklySummaryForAll();
  } catch (err) {
    console.error('[Scheduler] Weekly summary cron error:', err);
  }
});

/**
 * Monthly report — 1st of every month at 8:00 AM server time
 * Cron: "0 8 1 * *"
 */
cron.schedule('0 8 1 * *', async () => {
  try {
    await runMonthlyReportForAll();
  } catch (err) {
    console.error('[Scheduler] Monthly report cron error:', err);
  }
});

console.log('[Scheduler] Notification jobs registered: weekly (Mon 8AM), monthly (1st 8AM)');
