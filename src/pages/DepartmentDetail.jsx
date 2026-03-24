import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useRef, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import Breadcrumb from '../components/Breadcrumb';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { departments, firefighters } from '../dataProcessor';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dept = departments.find(d => d.id === Number(id));
  const deptFfs = useMemo(() => firefighters.filter(f => f.departmentId === Number(id)), [id]);
  const statusChartRef = useRef(null);
  const statusCanvasRef = useRef(null);

  useEffect(() => {
    if (!dept) return;
    const stats = dept.stats;
    
    if (statusChartRef.current) statusChartRef.current.destroy();
    statusChartRef.current = new Chart(statusCanvasRef.current, {
      type: 'bar',
      data: {
        labels: ['Passed', 'Failed', 'Expired', 'Out of Service', 'Action Req.'],
        datasets: [{
          data: [stats.pass, 0, 0, stats.oos, stats.repair],
          backgroundColor: ['#22c55e', '#ef4444', '#dc2626', '#f59e0b', '#f97316'],
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, grid: { color: '#f1f5f9' } }, y: { grid: { display: false } } }
      }
    });

    return () => statusChartRef.current?.destroy();
  }, [dept]);

  if (!dept) return <div className="p-8 text-center text-gray-500">Department not found.</div>;

  const passRate = dept.stats.gear_count > 0 ? ((dept.stats.pass / dept.stats.gear_count) * 100).toFixed(1) + '%' : '0%';
  const needAttention = dept.stats.repair + dept.stats.oos;

  const columns = [
    { key: 'id', header: 'ID', render: (r) => <span className="text-gray-400">#{r.id}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'gear', header: 'Gear Items', accessor: (r) => r.stats.total },
    { key: 'lastService', header: 'Last Service', render: (r) => {
      const dates = r.gear.map(g => g.inspDate).filter(Boolean);
      return dates.length > 0 ? dates[0] : '--';
    }},
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => (
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/roster/${r.id}`); }}
        className="text-navy hover:underline text-xs font-medium"
        data-testid={`button-view-${r.id}`}
      >View</button>
    )}
  ];

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Departments', to: '/departments' },
        { label: dept.name }
      ]} />
      <h1 className="text-2xl font-bold text-gray-900 mt-2">{dept.name}</h1>
      <p className="text-gray-500 text-sm mb-6">{dept.stats.ff_count} active personnel · {dept.stats.gear_count} gear items</p>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <KpiCard value={dept.stats.ff_count} label="Active Personnel" color="blue" />
        <KpiCard value={dept.stats.gear_count} label="Gear Assigned" color="green" />
        <KpiCard value={passRate} label="Pass Rate" color="green" />
        <KpiCard value={needAttention} label="Items Need Attention" color="orange" />
        <KpiCard value={0} label="Total Jobs" color="navy" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-surface-border p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Gear Status Breakdown</h3>
          <div style={{ height: 180 }}><canvas ref={statusCanvasRef}></canvas></div>
        </div>
        <div className="bg-white rounded-lg border border-surface-border p-5 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-6"/></svg>
            <span className="text-sm">No job stats available</span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={deptFfs}
        title={`${deptFfs.length} personnel`}
        searchPlaceholder="Search roster..."
        onRowClick={(row) => navigate(`/roster/${row.id}`)}
      />
    </div>
  );
}
