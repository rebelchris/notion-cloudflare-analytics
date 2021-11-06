import { getAnalytics } from './cloudflare.js';
import { createEntry, getEntries } from './notion.js';

const yesterday = new Date();
yesterday.setHours(0, 0, 0);

const lastWeek = new Date(yesterday);
lastWeek.setDate(lastWeek.getDate() - 2);

const dateFilter = {
  start: lastWeek.toISOString(),
  end: yesterday.toISOString(),
};

const existingNotionEntries = await getEntries(dateFilter);

getAnalytics(dateFilter).then((data) => {
  for (let day in data) {
    if (!existingNotionEntries.includes(day)) {
      createEntry(day, data[day]);
    }
  }
});
console.log('all done');
