import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { RADAR_LABELS } from '../utils/chartConfig';
import '../styles/RadarChart.css';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * 공용 레이더 차트 컴포넌트
 * @param {{ scores: number[], count: number } | null} radarData - computeRadarScores 반환값
 * @param {string} emptyMessage - 데이터 없을 때 표시할 문구
 * @param {string} color - 차트 강조색 (CSS 색상 문자열)
 */
function RadarChart({ radarData, emptyMessage = '아직 평가 데이터가 없습니다.', color = '#2ecc71' }) {
  if (!radarData) {
    return (
      <div className="radar-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const { scores, count } = radarData;

  const data = {
    labels: RADAR_LABELS,
    datasets: [
      {
        data: scores,
        backgroundColor: color + '33',
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw.toFixed(1)}점`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          display: false,
        },
        pointLabels: {
          font: { size: 12, weight: '600' },
          color: '#495057',
        },
        grid: { color: '#dee2e6' },
        angleLines: { color: '#dee2e6' },
      },
    },
  };

  return (
    <div className="radar-wrap">
      <div className="radar-chart-area">
        <Radar data={data} options={options} />
      </div>
      <p className="radar-count">평가 {count}건 기반</p>
    </div>
  );
}

export default RadarChart;
