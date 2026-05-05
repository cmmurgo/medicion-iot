import React from 'react';
import IoTCanvas from './components/Canvas';
import './index.css';

function App() {
  return (
    <div className="canvas-container">
      <aside className="sidebar">
        <h1 className="text-xl font-bold mb-6 text-blue-400">SENSORES</h1>
        <div className="space-y-4">
          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Empresa Demo</h3>       
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
