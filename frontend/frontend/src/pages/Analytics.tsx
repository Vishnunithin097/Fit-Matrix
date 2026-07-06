import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Mon', calories: 2100, protein: 135, water: 2.4 },
  { name: 'Tue', calories: 2250, protein: 144, water: 2.8 },
  { name: 'Wed', calories: 2180, protein: 140, water: 2.6 },
  { name: 'Thu', calories: 2340, protein: 151, water: 3.0 },
  { name: 'Fri', calories: 2300, protein: 148, water: 2.7 },
  { name: 'Sat', calories: 2400, protein: 156, water: 3.1 },
  { name: 'Sun', calories: 2200, protein: 142, water: 2.9 },
];

export default function Analytics() {
  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Performance analytics</p>
          <h1 className="hero-title">Visualize your momentum with clarity.</h1>
        </div>
      </section>

      <motion.div className="chart-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="panel-head">
          <h3>Weekly progress</h3>
          <span className="panel-tag">Calories • Protein • Water</span>
        </div>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#8b8da9" />
              <YAxis stroke="#8b8da9" />
              <Tooltip />
              <Area type="monotone" dataKey="calories" stroke="#a855f7" fillOpacity={1} fill="url(#colorCalories)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
