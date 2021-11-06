import 'dotenv/config.js';
import fetch from 'node-fetch';

const percentage = (number, total) => {
  return Number(((number / total) * 100).toFixed(0) / 100);
};

const mapAnalyticsPerDay = (analytics) => {
  const combined = analytics.reduce((prev, source) => {
    source.forEach((el) => {
      const date = el.date;
      delete el.date;
      if (prev[date]) {
        prev[date] = { ...prev[date], ...el };
      } else {
        prev[date] = el;
      }
    });
    return prev;
  }, []);
  return combined;
};

const mapPerformance = (performance) => {
  return performance.map((item) => {
    const {
      dimensions,
      total: { pageLoadTime },
    } = item;
    return { ...dimensions, pageLoadTime };
  });
};

const mapStatistics = (statistics) => {
  return statistics.map((item) => {
    const {
      dimensions,
      pageviews,
      sum: { visits },
    } = item;
    return { ...dimensions, pageviews, visits };
  });
};

const mapVitals = (vitals) => {
  return vitals.map((item) => {
    const {
      dimensions,
      sum: {
        clsGood,
        clsNeedsImprovement,
        clsPoor,
        clsTotal,
        fidGood,
        fidNeedsImprovement,
        fidPoor,
        fidTotal,
        lcpGood,
        lcpNeedsImprovement,
        lcpPoor,
        lcpTotal,
      },
    } = item;
    return {
      ...dimensions,
      clsG: percentage(clsGood, clsTotal),
      clsI: percentage(clsNeedsImprovement, clsTotal),
      clsP: percentage(clsPoor, clsTotal),
      fidG: percentage(fidGood, fidTotal),
      fidI: percentage(fidNeedsImprovement, fidTotal),
      fidP: percentage(fidPoor, fidTotal),
      lcpG: percentage(lcpGood, lcpTotal),
      lcpI: percentage(lcpNeedsImprovement, lcpTotal),
      lcpP: percentage(lcpPoor, lcpTotal),
    };
  });
};

const fetchAnalytics = (dateFilter) => {
  return fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'X-AUTH-EMAIL': process.env.CLOUDFLARE_EMAIL,
      Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: `{"query":"query RumAnalyticsTimeseriesBydateGroupedByall(\\n\\t$accountTag: string\\n\\t$filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject\\n) {\\n\\tviewer {\\n\\t\\taccounts(filter: { accountTag: $accountTag }) {\\n\\t\\t\\tstatistics: rumPageloadEventsAdaptiveGroups(limit: 5000, filter: $filter) {\\n\\t\\t\\t\\tpageviews: count\\n\\t\\t\\t\\tsum {\\n\\t\\t\\t\\t\\tvisits\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tdimensions {\\n\\t\\t\\t\\t\\tdate\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n      performance: rumPerformanceEventsAdaptiveGroups(limit: 5000, filter: $filter) {\\n        dimensions { date }\\n        total: quantiles {\\n          pageLoadTime: pageLoadTimeP50\\n        }\\n      }\\n      vitals: rumWebVitalsEventsAdaptiveGroups(limit: 5000, filter: $filter) {\\n        dimensions {\\n          date\\n        }\\n        sum {\\n          clsGood\\n          clsNeedsImprovement\\n          clsPoor\\n          clsTotal\\n          fidGood\\n          fidNeedsImprovement\\n          fidPoor\\n          fidTotal\\n          lcpGood\\n          lcpNeedsImprovement\\n          lcpPoor\\n          lcpTotal\\n        }\\n      }\\n\\t\\t}\\n\\t}\\n}","variables":{"accountTag":"${process.env.CLOUDFLARE_ACCOUNT_TAG}","filter":{"AND":[{"datetime_geq":"${dateFilter.start}","datetime_leq":"${dateFilter.end}"}]}},"operationName":"RumAnalyticsTimeseriesBydateGroupedByall"}`,
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => {
      console.error(err);
    });
};

export const getAnalytics = async (dateFilter) => {
  const { data } = await fetchAnalytics(dateFilter);
  const { performance, statistics, vitals } = data.viewer.accounts[0];
  return await mapAnalyticsPerDay([
    await mapPerformance(performance),
    await mapStatistics(statistics),
    await mapVitals(vitals),
  ]);
};
export default {
  getAnalytics,
};
