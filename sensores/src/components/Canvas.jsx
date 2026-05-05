import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { Box, Move, Maximize, MousePointer2, Save, Thermometer, PenLine, Trash2, Type, Grid3X3, RotateCcw, RotateCw } from 'lucide-react';

const API_URL = 'http://localhost/medicion-iot/ws-sensores/web/api';
const DEFAULT_TENANT_ID = 1;
const GRID_SIZE = 20;

const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const Tank = ({ id, x, y, width, height, level, name, isSelected, onClick, onDragEnd, onDblClick, onDelete }) => {
    return (
        <Group x={x} y={y} draggable onDragEnd={onDragEnd} onClick={onClick} onDblClick={onDblClick}>
            <Rect
                width={width}
                height={height}
                fill="#2c3e50"
                stroke={isSelected ? "#3498db" : "#ecf0f1"}
                strokeWidth={isSelected ? 4 : 2}
                cornerRadius={5}
            />
            <Rect
                x={2}
                y={height - (height * (level / 100)) - 2}
                width={width - 4}
                height={(height * (level / 100))}
                fill="#3498db"
                cornerRadius={[0, 0, 3, 3]}
            />
            <Text
                text={name}
                fontSize={14}
                fill={isSelected ? "#3498db" : "#ecf0f1"}
                fontStyle='bold'
                y={-20}
                width={width}
                align="center"
            />
            {isSelected && <DeleteButton x={width - 10} y={-10} onDelete={onDelete} />}
        </Group>
    );
};

const TempSensor = ({ x, y, name, value, isSelected, onClick, onDragEnd, onDblClick, onDelete }) => {
    return (
        <Group x={x} y={y} draggable onDragEnd={onDragEnd} onClick={onClick} onDblClick={onDblClick}>
            <Circle
                radius={25}
                fill="#1abc9c"
                stroke={isSelected ? "#3498db" : "#ecf0f1"}
                strokeWidth={isSelected ? 4 : 2}
            />
            <Text text="°C" fontSize={12} fill="white" x={-10} y={-15} />
            <Text text={`${value}°`} fontSize={14} fill="white" fontStyle="bold" x={-15} y={2} width={30} align="center" />
            <Text text={name} fontSize={12} fill={isSelected ? "#3498db" : "#ecf0f1"} y={30} x={-40} width={80} align="center" />
            {isSelected && <DeleteButton x={20} y={-20} onDelete={onDelete} />}
        </Group>
    );
};

const Label = ({ x, y, text, isSelected, onClick, onDragEnd, onDblClick, onDelete }) => {
    return (
        <Group x={x} y={y} draggable onDragEnd={onDragEnd} onClick={onClick} onDblClick={onDblClick}>
            <Text
                text={text}
                fontSize={18}
                fill={isSelected ? "#3498db" : "#ecf0f1"}
                fontStyle="bold"
            />
            {isSelected && <DeleteButton x={-15} y={-15} onDelete={onDelete} />}
        </Group>
    );
};

const SectorLine = ({ id, points, isSelected, onClick, onDragEnd, onDelete, onUpdatePoints }) => {
    return (
        <Group>
            <Line
                points={points}
                stroke={isSelected ? "#3498db" : "#95a5a6"}
                strokeWidth={isSelected ? 6 : 4}
                lineCap="round"
                lineJoin="round"
                dash={isSelected ? [10, 5] : []}
                onClick={onClick}
                draggable
                onDragEnd={(e) => {
                    const dx = snapToGrid(e.target.x());
                    const dy = snapToGrid(e.target.y());
                    const newPoints = [
                        snapToGrid(points[0] + dx),
                        snapToGrid(points[1] + dy),
                        snapToGrid(points[2] + dx),
                        snapToGrid(points[3] + dy)
                    ];
                    e.target.position({ x: 0, y: 0 });
                    onUpdatePoints(newPoints);
                }}
            />
            {isSelected && (
                <>
                    <Circle
                        x={points[0]} y={points[1]} radius={8} fill="#3498db" draggable
                        onDragEnd={(e) => {
                            const newPoints = [snapToGrid(e.target.x()), snapToGrid(e.target.y()), points[2], points[3]];
                            onUpdatePoints(newPoints);
                        }}
                    />
                    <Circle
                        x={points[2]} y={points[3]} radius={8} fill="#3498db" draggable
                        onDragEnd={(e) => {
                            const newPoints = [points[0], points[1], snapToGrid(e.target.x()), snapToGrid(e.target.y())];
                            onUpdatePoints(newPoints);
                        }}
                    />
                    <DeleteButton x={(points[0] + points[2]) / 2} y={(points[1] + points[3]) / 2 - 15} onDelete={onDelete} />
                </>
            )}
        </Group>
    );
};

const DeleteButton = ({ x, y, onDelete }) => (
    <Group x={x} y={y} onClick={(e) => { e.cancelBubble = true; onDelete(); }}>
        <Circle radius={10} fill="#e74c3c" />
        <Text text="×" fontSize={16} fill="white" x={-5} y={-9} width={10} align="center" />
    </Group>
);

const IoTCanvas = () => {
    // Estados de datos
    const [layouts, setLayouts] = useState([]);
    const [currentLayout, setCurrentLayout] = useState(null);
    const [objects, setObjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de Editor
    const [history, setHistory] = useState([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);

    // Estado para Notificaciones y Modales
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ open: false, title: '', value: '', onConfirm: null });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Cargar todas las salas al inicio
    const fetchLayouts = () => {
        setLoading(true);
        fetch(`${API_URL}/tenants/${DEFAULT_TENANT_ID}/layouts`)
            .then(res => res.json())
            .then(data => {
                const sorted = Array.isArray(data) ? [...data].sort((a, b) => b.id - a.id) : [];
                setLayouts(sorted);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchLayouts();
    }, []);

    const openLayout = (layout) => {
        setCurrentLayout(layout);
        setObjects(layout.data || []);
        setHistory([layout.data || []]);
        setHistoryStep(0);
        setSelectedId(null);
    };

    const createNewLayout = () => {
        setModal({
            open: true,
            title: 'Nueva Sala',
            value: '',
            isConfirm: false,
            onConfirm: async (name) => {
                if (!name) return showToast('El nombre es obligatorio', 'error');
                const newLayout = {
                    tenant_id: DEFAULT_TENANT_ID,
                    name: name,
                    data: [] // Enviamos el array vacío
                };
                try {
                    const res = await fetch(`${API_URL}/layouts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newLayout)
                    });
                    const data = await res.json();

                    if (res.ok) {
                        showToast(`Sala "${name}" creada`);
                        fetchLayouts();
                        openLayout(data);
                    } else {
                        // Si hay errores de validación (por ejemplo, nombre duplicado)
                        const errorMsg = Array.isArray(data) ? data[0].message : (data.message || 'Error de validación');
                        showToast(errorMsg, 'error');
                    }
                } catch (err) {
                    showToast('Error de conexión con el servidor', 'error');
                }
            }
        });
    };

    const saveLayout = async () => {
        if (!currentLayout) return;
        try {
            const response = await fetch(`${API_URL}/layouts/${currentLayout.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...currentLayout, data: objects }),
            });
            if (response.ok) {
                showToast('Cambios guardados');
                // Actualizar la lista localmente sin recargar todo
                setLayouts(layouts.map(l => l.id === currentLayout.id ? { ...l, data: objects } : l));
            }
        } catch (err) { showToast('Error al conectar con el servidor', 'error'); }
    };

    const updateObjects = (newObjects) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newObjects);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setObjects(newObjects);
    };

    const undo = () => {
        if (historyStep > 0) {
            const nextStep = historyStep - 1;
            setHistoryStep(nextStep);
            setObjects(history[nextStep]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            setObjects(history[nextStep]);
        }
    };

    const deleteLayout = async (id) => {
        setModal({
            open: true,
            title: '¿Eliminar sala?',
            value: 'Esta acción no se puede deshacer.',
            isConfirm: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/layouts/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast('Sala eliminada correctamente');
                        fetchLayouts();
                    }
                } catch (err) { showToast('Error al eliminar', 'error'); }
            }
        });
    };

    const deleteObject = (id) => {
        updateObjects(objects.filter(o => o.id !== id));
        setSelectedId(null);
        showToast('Elemento eliminado');
    };

    const updateObjectName = (id, currentName) => {
        setModal({
            open: true,
            title: 'Editar nombre',
            value: currentName,
            onConfirm: (newValue) => {
                updateObjects(objects.map(o => o.id === id ? { ...o, name: newValue || o.name, text: newValue || o.text } : o));
            }
        });
    };

    const getOffset = () => (objects.length % 10) * 15;

    const gridLines = [];
    if (showGrid) {
        const width = 2000;
        const height = 2000;
        for (let i = 0; i <= width / GRID_SIZE; i++) {
            gridLines.push(<Line key={`v${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, height]} stroke="#2c3e50" strokeWidth={1} />);
        }
        for (let j = 0; j <= height / GRID_SIZE; j++) {
            gridLines.push(<Line key={`h${j}`} points={[0, j * GRID_SIZE, width, j * GRID_SIZE]} stroke="#2c3e50" strokeWidth={1} />);
        }
    }

    // EVENTOS DE NAVEGACIÓN
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
        setScale(newScale);
        setPosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    };

    if (loading) return <div className="p-20 text-blue-400 font-bold text-2xl flex flex-col items-center gap-4 animate-pulse"><Maximize size={48} className="animate-spin" /> Cargando Sistema...</div>;

    return (
        <div className="w-full h-screen bg-slate-50 overflow-hidden relative border border-slate-200 rounded-lg shadow-2xl flex flex-col">

            {/* VISTA CONDICIONAL: LOBBY O EDITOR */}
            {!currentLayout ? (
                /* --- VISTA LISTADO DE SALAS --- */
                <div className="w-full flex-1 p-10 overflow-y-auto bg-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <header className="mb-10 flex justify-between items-end border-b border-slate-300 pb-8">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Panel de Control</h1>
                                <p className="text-slate-600 font-bold tracking-wide uppercase text-xs">Gestión de Salas y Planos</p>
                            </div>
                            <button
                                onClick={createNewLayout}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center gap-2 active:scale-95"
                            >
                                <Box size={22} /> NUEVA SALA
                            </button>
                        </header>

                        <div className="bg-white rounded-3xl border border-slate-300 overflow-hidden shadow-xl">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-200">
                                        <th className="px-6 py-5 text-slate-700 font-black uppercase text-[10px] tracking-[0.2em] border-b border-r border-slate-400 w-24"># ID</th>
                                        <th className="px-6 py-5 text-slate-700 font-black uppercase text-[10px] tracking-[0.2em] border-b border-r border-slate-400">NOMBRE DE LA SALA</th>
                                        <th className="px-6 py-5 text-slate-700 font-black uppercase text-[10px] tracking-[0.2em] border-b border-r border-slate-400">DISPOSITIVOS</th>
                                        <th className="px-6 py-5 text-slate-700 font-black uppercase text-[10px] tracking-[0.2em] border-b border-r border-slate-400">CREADA EL</th>
                                        <th className="px-6 py-5 text-slate-700 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-400 text-right">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {layouts.map((l, index) => (
                                        <tr key={l.id} className={`${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50 transition-all group`}>
                                            <td className="px-6 py-4 border-b border-r border-slate-400">
                                                <span className="text-blue-600 font-mono font-bold text-sm bg-blue-100 px-2 py-1 rounded-md">{l.id}</span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-r border-slate-400">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-slate-900 font-bold text-base tracking-tight">{l.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-r border-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]" />
                                                    <span className="text-slate-700 font-medium text-sm">{l.data?.length || 0} objetos</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-r border-slate-400">
                                                <span className="text-slate-600 font-medium text-xs font-mono">
                                                    {l.created_at ? new Date(l.created_at).toLocaleDateString() : '---'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-slate-400 text-right">
                                                <div className="flex justify-end gap-3 translate-x-2">
                                                    <button onClick={() => openLayout(l)} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all" title="Abrir">
                                                        <Maximize size={18} />
                                                    </button>
                                                    <button onClick={() => deleteLayout(l.id)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all" title="Eliminar">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {layouts.length === 0 && (
                                <div className="py-20 text-center">
                                    <Maximize size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 text-lg font-medium">No hay salas registradas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* --- VISTA EDITOR DE CANVAS --- */
                <div className="flex-1 relative">
                    <div className="absolute top-4 left-6 z-10 flex items-center gap-4 bg-slate-800/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50">
                        <h2 className="text-white font-black uppercase tracking-[0.2em] text-sm">{currentLayout.name}</h2>
                    </div>

                    <Stage
                        width={window.innerWidth - 300}
                        height={window.innerHeight - 200}
                        onWheel={handleWheel}
                        scaleX={scale}
                        scaleY={scale}
                        x={position.x}
                        y={position.y}
                        draggable
                        onClick={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
                    >
                        <Layer>{gridLines}</Layer>
                        <Layer>
                            {objects.map((obj) => (
                                <React.Fragment key={obj.id}>
                                    {obj.type === 'tank' && <Tank {...obj} isSelected={obj.id === selectedId} onClick={() => setSelectedId(obj.id)} onDelete={() => deleteObject(obj.id)} onDblClick={() => updateObjectName(obj.id, obj.name)} onDragEnd={(e) => updateObjects(objects.map(o => o.id === obj.id ? { ...o, x: snapToGrid(e.target.x()), y: snapToGrid(e.target.y()) } : o))} />}
                                    {obj.type === 'sensor' && <TempSensor {...obj} isSelected={obj.id === selectedId} onClick={() => setSelectedId(obj.id)} onDelete={() => deleteObject(obj.id)} onDblClick={() => updateObjectName(obj.id, obj.name)} onDragEnd={(e) => updateObjects(objects.map(o => o.id === obj.id ? { ...o, x: snapToGrid(e.target.x()), y: snapToGrid(e.target.y()) } : o))} />}
                                    {obj.type === 'label' && <Label {...obj} isSelected={obj.id === selectedId} onClick={() => setSelectedId(obj.id)} onDelete={() => deleteObject(obj.id)} onDblClick={() => updateObjectName(obj.id, obj.text)} onDragEnd={(e) => updateObjects(objects.map(o => o.id === obj.id ? { ...o, x: snapToGrid(e.target.x()), y: snapToGrid(e.target.y()) } : o))} />}
                                    {obj.type === 'line' && <SectorLine {...obj} isSelected={obj.id === selectedId} onClick={() => setSelectedId(obj.id)} onDelete={() => deleteObject(obj.id)} onUpdatePoints={(points) => updateObjects(objects.map(o => o.id === obj.id ? { ...o, points } : o))} />}
                                </React.Fragment>
                            ))}
                        </Layer>
                    </Stage>

                    {/* Barra de Herramientas Editor */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-md h-16 rounded-2xl flex flex-row items-center gap-2 text-white shadow-2xl z-50 border border-slate-600 px-4">
                        <button className="p-2.5 hover:bg-blue-600 rounded-xl transition-colors" title="Añadir Tanque" onClick={() => {
                            const id = 't' + Date.now();
                            const off = snapToGrid(getOffset());
                            updateObjects([...objects, { id, type: 'tank', x: 200 + off, y: 200 + off, width: 60, height: 100, level: 50, name: 'Tanque' }]);
                            showToast('Tanque añadido');
                        }}><Box size={20} /></button>
                        <button className="p-2.5 hover:bg-teal-600 rounded-xl transition-colors" title="Sensor" onClick={() => {
                            const id = 's' + Date.now();
                            const off = snapToGrid(getOffset());
                            updateObjects([...objects, { id, type: 'sensor', x: 300 + off, y: 200 + off, value: 22.0, name: 'Sensor' }]);
                            showToast('Sensor añadido');
                        }}><Thermometer size={20} /></button>
                        <button className="p-2.5 hover:bg-slate-600 rounded-xl transition-colors" title="Línea" onClick={() => {
                            const id = 'l' + Date.now();
                            const off = snapToGrid(getOffset());
                            updateObjects([...objects, { id, type: 'line', points: [100 + off, 100 + off, 300 + off, 100 + off] }]);
                            showToast('Línea añadida');
                        }}><PenLine size={20} /></button>
                        <button className="p-2.5 hover:bg-purple-600 rounded-xl transition-colors" title="Texto" onClick={() => {
                            const id = 'tx' + Date.now();
                            const off = snapToGrid(getOffset());
                            updateObjects([...objects, { id, type: 'label', x: 400 + off, y: 200 + off, text: 'Etiqueta' }]);
                            showToast('Etiqueta añadida');
                        }}><Type size={20} /></button>

                        <div className="w-px h-6 bg-slate-700 mx-1"></div>

                        <button className={`p-2.5 rounded-xl transition-colors ${showGrid ? 'bg-blue-600' : 'hover:bg-slate-600'}`} title="Grilla" onClick={() => setShowGrid(!showGrid)}><Grid3X3 size={20} /></button>
                        <button className="p-2.5 hover:bg-slate-600 rounded-xl disabled:opacity-20 translate-y-px" disabled={historyStep === 0} onClick={undo}><RotateCcw size={20} /></button>
                        <button className="p-2.5 hover:bg-slate-600 rounded-xl disabled:opacity-20 translate-y-px" disabled={historyStep === history.length - 1} onClick={redo}><RotateCw size={20} /></button>

                        <div className="w-px h-6 bg-slate-700 mx-1"></div>

                        <button className="h-10 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-lg flex items-center gap-2 px-6 transition-all active:scale-95 font-bold" onClick={saveLayout}><Save size={18} /> GUARDAR</button>
                        <button onClick={() => { setCurrentLayout(null); fetchLayouts(); }} className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 h-10 px-4 rounded-xl border border-slate-600 transition-all font-bold flex items-center gap-2 pr-4"><RotateCcw size={16} className="-scale-x-100" /> SALAS</button>
                    </div>
                </div>
            )}

            {/* --- COMPONENTES GLOBALES (SIEMPRE VISIBLES) --- */}

            {/* Modal dinámico */}
            {modal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-[500] bg-slate-950/80 backdrop-blur-md px-4">
                    <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <h3 className={`text-2xl font-black mb-4 flex items-center gap-3 ${modal.isConfirm ? 'text-red-400' : 'text-white'}`}>
                            {modal.isConfirm ? <Trash2 size={24} /> : <PenLine size={24} className="text-blue-400" />}
                            {modal.title}
                        </h3>
                        {modal.isConfirm ? (
                            <p className="text-slate-400 mb-8 font-medium">{modal.value}</p>
                        ) : (
                            <input
                                autoFocus
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white mb-8 outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                                value={modal.value}
                                onChange={(e) => setModal({ ...modal, value: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') { modal.onConfirm(modal.value); setModal({ ...modal, open: false }); } }}
                            />
                        )}
                        <div className="flex justify-end gap-3">
                            <button className="px-5 py-3 text-slate-400 font-bold hover:text-white" onClick={() => setModal({ ...modal, open: false })}>CANCELAR</button>
                            <button className={`px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 ${modal.isConfirm ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`} onClick={() => { modal.onConfirm(modal.value); setModal({ ...modal, open: false }); }}>{modal.isConfirm ? 'ELIMINAR' : 'ACEPTAR'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Estilo Alert (Centro Superior) */}
            {toast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-full duration-500 max-w-md w-full px-4">
                    <div className={`px-8 py-4 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-2 flex items-center justify-center gap-4 backdrop-blur-2xl
                        ${toast.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' : 'bg-slate-800/90 border-blue-500 text-blue-100'}`}>
                        <div className={`w-3 h-3 rounded-full animate-ping shrink-0 ${toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'}`} />
                        <span className="font-black text-lg tracking-wide uppercase text-center">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IoTCanvas;
