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
    const [objects, setObjects] = useState([]);
    const [history, setHistory] = useState([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [showGrid, setShowGrid] = useState(true);

    // Estado para Notificaciones y Modales
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ open: false, title: '', value: '', onConfirm: null });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
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

    useEffect(() => {
        fetch(`${API_URL}/tenants/${DEFAULT_TENANT_ID}/layouts`)
            .then(res => res.json())
            .then(data => {
                let initialObjects = [];
                if (data && data.length > 0) {
                    initialObjects = data[data.length - 1].data;
                } else {
                    initialObjects = [
                        { id: '1', type: 'tank', x: 200, y: 200, width: 80, height: 120, level: 65, name: 'Tanque A' },
                        { id: 'l1', type: 'line', points: [100, 100, 500, 100] }
                    ];
                }
                setObjects(initialObjects);
                setHistory([initialObjects]);
                setLoading(false);
            })
            .catch(err => { setLoading(false); });
    }, []);

    const saveLayout = async () => {
        try {
            const response = await fetch(`${API_URL}/layouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: DEFAULT_TENANT_ID, name: 'Principal Layout', data: objects }),
            });
            if (response.ok) showToast('Diseño guardado exitosamente');
        } catch (err) { showToast('Error al conectar con el servidor', 'error'); }
    };

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

    if (loading) return <div className="p-10 text-white font-bold animate-pulse">Cargando dashboard...</div>;

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

    return (
        <div className="w-full h-full bg-slate-900 overflow-hidden relative border border-slate-700 rounded-lg shadow-2xl">
            {/* Modal de Edición Personalizado */}
            {modal.open && (
                <div className="absolute inset-0 flex items-center justify-center z-[100] bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-600 w-80">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <PenLine size={18} className="text-blue-400" /> {modal.title}
                        </h3>
                        <input
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white mb-6 outline-none focus:border-blue-500"
                            value={modal.value}
                            onChange={(e) => setModal({ ...modal, value: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') { modal.onConfirm(modal.value); setModal({ ...modal, open: false }); } }}
                        />
                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2 text-slate-400 hover:text-white transition-colors" onClick={() => setModal({ ...modal, open: false })}>Cancelar</button>
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg active:scale-95" onClick={() => { modal.onConfirm(modal.value); setModal({ ...modal, open: false }); }}>Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sistema de Toasts */}
            {toast && (
                <div className={`absolute top-6 right-6 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 z-[100] animate-in slide-in-from-right-10 duration-300
                    ${toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 'bg-slate-800/90 border-blue-500 text-blue-100'}`}>
                    {toast.type === 'error' ? <Trash2 size={18} /> : <Save size={18} />}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            <Stage
                width={window.innerWidth - 300}
                height={window.innerHeight - 100}
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable
                onClick={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
            >
                <Layer>
                    {gridLines}
                </Layer>
                <Layer>
                    {objects.map((obj) => {
                        const commonProps = {
                            key: obj.id,
                            isSelected: obj.id === selectedId,
                            onClick: () => setSelectedId(obj.id),
                            onDelete: () => deleteObject(obj.id),
                            onDblClick: () => updateObjectName(obj.id, obj.name || obj.text),
                            onDragEnd: (e) => {
                                updateObjects(objects.map(o => o.id === obj.id ? { ...o, x: snapToGrid(e.target.x()), y: snapToGrid(e.target.y()) } : o));
                            }
                        };

                        if (obj.type === 'tank') return <Tank {...obj} {...commonProps} />;
                        if (obj.type === 'sensor') return <TempSensor {...obj} {...commonProps} />;
                        if (obj.type === 'label') return <Label {...obj} {...commonProps} />;
                        if (obj.type === 'line') return (
                            <SectorLine {...obj} {...commonProps} onUpdatePoints={(newPoints) => {
                                updateObjects(objects.map(o => o.id === obj.id ? { ...o, points: newPoints } : o));
                            }} />
                        );
                        return null;
                    })}
                </Layer>
            </Stage>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-md h-16 rounded-2xl flex flex-row items-center gap-2 text-white shadow-2xl z-50 border border-slate-600 px-4">
                {/* Botones de Añadir */}
                <button className="p-2.5 hover:bg-blue-600 rounded-xl transition-colors" title="Añadir Tanque" onClick={() => {
                    const id = 't' + Date.now();
                    const off = snapToGrid(getOffset());
                    updateObjects([...objects, { id, type: 'tank', x: 200 + off, y: 200 + off, width: 60, height: 100, level: 50, name: 'Tanque' }]);
                    showToast('Tanque añadido');
                }}><Box size={20} /></button>

                <button className="p-2.5 hover:bg-teal-600 rounded-xl transition-colors" title="Añadir Sensor Temp" onClick={() => {
                    const id = 's' + Date.now();
                    const off = snapToGrid(getOffset());
                    updateObjects([...objects, { id, type: 'sensor', x: 300 + off, y: 200 + off, value: 22.0, name: 'Sensor' }]);
                    showToast('Sensor añadido');
                }}><Thermometer size={20} /></button>

                <button className="p-2.5 hover:bg-slate-600 rounded-xl transition-colors" title="Dibujar Línea" onClick={() => {
                    const id = 'l' + Date.now();
                    const off = snapToGrid(getOffset());
                    updateObjects([...objects, { id, type: 'line', points: [100 + off, 100 + off, 300 + off, 100 + off] }]);
                    showToast('Línea añadida');
                }}><PenLine size={20} /></button>

                <button className="p-2.5 hover:bg-purple-600 rounded-xl transition-colors" title="Añadir Etiqueta" onClick={() => {
                    const id = 'tx' + Date.now();
                    const off = snapToGrid(getOffset());
                    updateObjects([...objects, { id, type: 'label', x: 400 + off, y: 200 + off, text: 'Etiqueta' }]);
                    showToast('Etiqueta añadida');
                }}><Type size={20} /></button>

                <button className={`p-2.5 rounded-xl transition-colors ${showGrid ? 'bg-blue-600' : 'hover:bg-slate-600'}`} title="Mostrar Grilla" onClick={() => setShowGrid(!showGrid)}>
                    <Grid3X3 size={20} />
                </button>

                <button className="p-2.5 hover:bg-slate-600 rounded-xl disabled:opacity-20 transition-opacity" disabled={historyStep === 0} title="Deshacer" onClick={undo}>
                    <RotateCcw size={20} />
                </button>
                <button className="p-2.5 hover:bg-slate-600 rounded-xl disabled:opacity-20 transition-opacity" disabled={historyStep === history.length - 1} title="Rehacer" onClick={redo}>
                    <RotateCw size={20} />
                </button>

                <button className="h-10 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-lg flex items-center gap-2 px-4 transition-all active:scale-95 ml-1" title="Guardar Cambios" onClick={saveLayout}>
                    <Save size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Guardar</span>
                </button>

                <div className="w-px h-6 bg-slate-700 mx-2"></div>

            </div>
        </div>
    );
};

export default IoTCanvas;
