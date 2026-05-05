import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { Box, Move, Maximize, MousePointer2, Save, Thermometer, PenLine, Trash2, Type } from 'lucide-react';

const API_URL = 'http://localhost/medicion-iot/ws-sensores/web/api';
const DEFAULT_TENANT_ID = 1;

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
                    const dx = e.target.x();
                    const dy = e.target.y();
                    const newPoints = [points[0] + dx, points[1] + dy, points[2] + dx, points[3] + dy];
                    e.target.position({ x: 0, y: 0 });
                    onUpdatePoints(newPoints);
                }}
            />
            {isSelected && (
                <>
                    <Circle
                        x={points[0]} y={points[1]} radius={8} fill="#3498db" draggable
                        onDragMove={(e) => {
                            const newPoints = [e.target.x(), e.target.y(), points[2], points[3]];
                            onUpdatePoints(newPoints);
                        }}
                    />
                    <Circle
                        x={points[2]} y={points[3]} radius={8} fill="#3498db" draggable
                        onDragMove={(e) => {
                            const newPoints = [points[0], points[1], e.target.x(), e.target.y()];
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
    const [selectedId, setSelectedId] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/tenants/${DEFAULT_TENANT_ID}/layouts`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const latestLayout = data[data.length - 1];
                    setObjects(latestLayout.data);
                } else {
                    setObjects([
                        { id: '1', type: 'tank', x: 200, y: 200, width: 80, height: 120, level: 65, name: 'Tanque A' },
                        { id: 'l1', type: 'line', points: [100, 100, 500, 100] }
                    ]);
                }
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
            if (response.ok) alert('Diseño guardado exitosamente');
        } catch (err) { alert('Error al conectar con el servidor'); }
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
        setObjects(objects.filter(o => o.id !== id));
        setSelectedId(null);
    };

    const updateObjectName = (id, currentName) => {
        const newName = prompt('Editar:', currentName);
        if (newName !== null) setObjects(objects.map(o => o.id === id ? { ...o, name: newName || o.name, text: newName || o.text } : o));
    };

    if (loading) return <div className="p-10 text-white">Cargando canvas...</div>;

    const getOffset = () => (objects.length % 10) * 15;

    return (
        <div className="w-full h-full bg-slate-900 overflow-hidden relative border border-slate-700 rounded-lg shadow-2xl">
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
                    {objects.map((obj) => {
                        const commonProps = {
                            key: obj.id,
                            isSelected: obj.id === selectedId,
                            onClick: () => setSelectedId(obj.id),
                            onDelete: () => deleteObject(obj.id),
                            onDblClick: () => updateObjectName(obj.id, obj.name || obj.text),
                            onDragEnd: (e) => {
                                setObjects(objects.map(o => o.id === obj.id ? { ...o, x: e.target.x(), y: e.target.y() } : o));
                            }
                        };

                        if (obj.type === 'tank') return <Tank {...obj} {...commonProps} />;
                        if (obj.type === 'sensor') return <TempSensor {...obj} {...commonProps} />;
                        if (obj.type === 'label') return <Label {...obj} {...commonProps} />;
                        if (obj.type === 'line') return (
                            <SectorLine {...obj} {...commonProps} onUpdatePoints={(newPoints) => {
                                setObjects(objects.map(o => o.id === obj.id ? { ...o, points: newPoints } : o));
                            }} />
                        );
                        return null;
                    })}
                </Layer>
            </Stage>

            <div className="absolute top-4 left-4 bg-slate-800 p-2 rounded flex flex-col gap-2 text-white shadow-lg z-50 border border-slate-600">
                <button className="p-2 hover:bg-blue-600 rounded" title="Añadir Tanque" onClick={() => {
                    const id = 't' + Date.now();
                    const off = getOffset();
                    setObjects([...objects, { id, type: 'tank', x: 200 + off, y: 200 + off, width: 60, height: 100, level: 50, name: 'Tanque' }]);
                }}><Box size={24} /></button>
                <button className="p-2 hover:bg-teal-600 rounded" title="Añadir Sensor Temp" onClick={() => {
                    const id = 's' + Date.now();
                    const off = getOffset();
                    setObjects([...objects, { id, type: 'sensor', x: 300 + off, y: 200 + off, value: 22.0, name: 'Sensor' }]);
                }}><Thermometer size={24} /></button>
                <button className="p-2 hover:bg-slate-600 rounded" title="Dibujar Línea" onClick={() => {
                    const id = 'l' + Date.now();
                    const off = getOffset();
                    setObjects([...objects, { id, type: 'line', points: [100 + off, 100 + off, 300 + off, 100 + off] }]);
                }}><PenLine size={24} /></button>
                <button className="p-2 hover:bg-purple-600 rounded" title="Añadir Etiqueta" onClick={() => {
                    const id = 'tx' + Date.now();
                    const off = getOffset();
                    setObjects([...objects, { id, type: 'label', x: 400 + off, y: 200 + off, text: 'Nueva Etiqueta' }]);
                }}><Type size={24} /></button>

                <div className="w-full h-px bg-slate-700 my-1"></div>
                <button className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white" title="Guardar Cambios" onClick={saveLayout}><Save size={24} /></button>
            </div>
        </div>
    );
};

export default IoTCanvas;
