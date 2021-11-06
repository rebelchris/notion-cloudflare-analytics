import 'dotenv/config.js';

import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_API_DATABASE;

export const getEntries = async (dateFilter) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          property: 'Day',
          date: {
            on_or_after: dateFilter.start.split('T')[0],
          },
        },
        {
          property: 'Day',
          date: {
            on_or_before: dateFilter.end.split('T')[0],
          },
        },
      ],
    },
  });
  return response.results.map((result) => result?.properties?.Day?.date?.start);
};

export const createEntry = (day, entry) => {
  notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Day: {
        date: {
          start: day,
        },
      },
      Visits: {
        number: entry.visits,
      },
      'Page views': {
        number: entry.pageviews,
      },
      'Page load time': {
        number: entry.pageLoadTime,
      },
      'LCP G': {
        number: entry.lcpG,
      },
      'LCP I': {
        number: entry.lcpI,
      },
      'LCP P': {
        number: entry.lcpP,
      },
      'FID G': {
        number: entry.fidG,
      },
      'FID I': {
        number: entry.fidI,
      },
      'FID P': {
        number: entry.fidP,
      },
      'CLS G': {
        number: entry.clsG,
      },
      'CLS I': {
        number: entry.clsI,
      },
      'CLS P': {
        number: entry.clsP,
      },
    },
  });
};

export default {
  createEntry,
  getEntries,
};
