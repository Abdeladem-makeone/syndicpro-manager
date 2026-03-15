
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
       <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110`}>
          <i className={`fas ${icon}`}></i>
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
          <div className="flex items-center gap-2">
             <h4 className="text-lg font-black text-slate-800 tracking-tight">{value}</h4>
             {trend && (
                <span className={`text-[9px] font-black flex items-center gap-0.5 ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                   <i className={`fas fa-caret-${trend.isUp ? 'up' : 'down'}`}></i>
                   {trend.value}%
                </span>
             )}
          </div>
       </div>
    </div>
  );
};

export default StatCard;
