import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { Box, Move, Maximize, MousePointer2, Save } from 'lucide-react';

const API_URL = 'http://localhost/medicion-iot/ws-sensores/web/api';
const DEFAULT_TENANT_ID = 1;

const Tank = ({ id, x, y, width, height, level, name, isSelected, onClick, onDragEnd, onDblClick, onDelete }) => {
    return (
        <Group
            x={x}
            y={y}
            draggable
            onDragEnd={onDragEnd}
            onClick={onClick}
            onDblClick={onDblClick}
        >
            {/* Tank Body */}
            <Rect
                width={width}
                height={height}
                fill="#2c3e50"
                stroke={isSelected ? "#3498db" : "#ecf0f1"}
                strokeWidth={isSelected ? 4 : 2}
                cornerRadius={5}
            />
            {/* Liquid Level */}
            <Rect
                x={2}
                y={height - (height * (level / 100)) - 2}
                width={width - 4}
                height={(height * (level / 100))}
                fill="#3498db"
                cornerRadius={[0, 0, 3, 3]}
            />
            {/* Label */}
            <Text
                text={name}
                fontSize={14}
                fill={isSelected ? "#3498db" : "#ecf0f1"}
                fontStyle='bold'
                y={-20}
                width={width}
                align="center"
            />

            {/* Delete button (only if selected) */}
            {isSelected && (
                <Group
                    x={width - 10}
                    y={-10}
                    onClick={(e) => {
                        e.cancelBubble = true; // Empieza y termina aquí para que no deseleccione al borrar
                        onDelete();
                    }}
                >
                    <Circle
                        radius={10}
                        fill="#e74c3c"
                    />
                    <Text
                        text="×"
                        fontSize={16}
                        fill="white"
                        x={-5}
                        y={-9}
                        width={10}
                        align="center"
                    />
                </Group>
            )}
        </Group>
    );
};

const IoTCanvas = () => {
    const [objects, setObjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        fetch(`${API_URL}/tenants/${DEFAULT_TENANT_ID}/layouts`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const latestLayout = data[data.length - 1];
                    setObjects(latestLayout.data);
                } else {
                    setObjects([
                        { id: '1', type: 'tank', x: 100, y: 100, width: 80, height: 120, level: 65, name: 'Tanque 1' },
                        { id: '2', type: 'tank', x: 300, y: 150, width: 80, height: 120, level: 30, name: 'Tanque 2' }
                    ]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading layout:", err);
                setLoading(false);
            });
    }, []);

    const saveLayout = async () => {
        try {
            const response = await fetch(`${API_URL}/layouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tenant_id: DEFAULT_TENANT_ID,
                    name: 'Principal Layout',
                    data: objects
                }),
            });
            if (response.ok) {
                alert('Diseño guardado en la base de datos');
            } else {
                const result = await response.json();
                alert('Error al guardar: ' + JSON.stringify(result));
            }
        } catch (err) {
            console.error("Error saving layout:", err);
            alert('Error al conectar con el servidor');
        }
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;

        setScale(newScale);
        setPosition({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    if (loading) return <div className="p-10 text-white">Cargando canvas...</div>;

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
                onClick={(e) => {
                    // Deselect if clicking on empty space
                    if (e.target === e.target.getStage()) {
                        setSelectedId(null);
                    }
                }}
            >
                <Layer>
                    {objects.map((obj) => {
                        if (obj.type === 'tank') {
                            return (
                                <Tank
                                    key={obj.id}
                                    {...obj}
                                    isSelected={obj.id === selectedId}
                                    onClick={() => setSelectedId(obj.id)}
                                    onDblClick={() => {
                                        const newName = prompt('Nuevo nombre del tanque:', obj.name);
                                        if (newName !== null) {
                                            setObjects(objects.map(o => o.id === obj.id ? { ...o, name: newName } : o));
                                        }
                                    }}
                                    onDelete={() => {
                                        setObjects(objects.filter(o => o.id !== obj.id));
                                        setSelectedId(null);
                                    }}
                                    onDragEnd={(e) => {
                                        const newObjs = objects.map(o =>
                                            o.id === obj.id ? { ...o, x: e.target.x(), y: e.target.y() } : o
                                        );
                                        setObjects(newObjs);
                                    }}
                                />
                            );
                        }
                        return null;
                    })}
                </Layer>
            </Stage>

            {/* Controls */}
            <div className="absolute top-4 left-4 bg-slate-800 p-2 rounded flex flex-col gap-2 text-white shadow-lg z-50">
                <button
                    className="p-2 hover:bg-blue-600 rounded"
                    title="Añadir Tanque"
                    onClick={() => {
                        const id = Math.random().toString(36).substr(2, 9);
                        const newX = 50 + (objects.length * 20);
                        const newY = 50 + (objects.length * 20);
                        setObjects([...objects, { id, type: 'tank', x: newX, y: newY, width: 60, height: 100, level: 50, name: 'Nuevo Tanque' }]);
                    }}
                >
                    <Box size={24} />
                </button>
                <button className="p-2 hover:bg-blue-600 rounded" title="Puntero">
                    <MousePointer2 size={24} />
                </button>
                <div className="w-full h-px bg-slate-700 my-1"></div>
                <button
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
                    title="Guardar Cambios"
                    onClick={saveLayout}
                >
                    <Save size={24} />
                </button>
            </div>
        </div>
    );
};

export default IoTCanvas;
