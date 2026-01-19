import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import api from '../api/axios';

export default function ChartExample() {
  const [series, setSeries] = useState([]);
  useEffect(() => { (async () => {
    try {
      const { data } = await api.get('/analytics/messages-per-day');
      setSeries(data.series);
    } catch {
      const demo = [ ['2026-01-10', 12], ['2026-01-11', 22], ['2026-01-12', 9], ['2026-01-13', 18], ['2026-01-14', 30] ];
      setSeries(demo.map(([d, v]) => [new Date(d).getTime(), v]));
    }
  })(); }, []);

  const options = {
    title: { text: 'Messages per day' },
    xAxis: { type: 'datetime' },
    series: [{ type: 'line', name: 'Messages', data: series }]
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
