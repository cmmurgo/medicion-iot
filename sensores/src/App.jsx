import React from 'react';
import IoTCanvas from './components/Canvas';
import './index.css';

function App() {
  return (
    <div className="canvas-container">
      <aside className="sidebar">
        <h1 className="text-xl font-bold mb-6 text-blue-400">IoT FlowSheet</h1>
        <div className="space-y-4">
          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Tenant</h3>
            <p className="text-white">Empresa Demo</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Sensores</h3>
            <p className="text-xs text-slate-400">Próximamente integración Grafana...</p>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <IoTCanvas />
      </main>
    </div>
  );
}

export default App;
