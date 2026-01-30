import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { Box, Move, Maximize, MousePointer2 } from 'lucide-react';

const Tank = ({ x, y, width, height, level, name, onDragEnd, onTransformEnd }) => {
    return (
        <Group
            x={x}
            y={y}
            draggable
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
        >
            {/* Tank Body */}
            <Rect
                width={width}
                height={height}
                fill="#2c3e50"
                stroke="#ecf0f1"
                strokeWidth={2}
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
                fill="#ecf0f1"
                y={-20}
                width={width}
                align="center"
            />
            {/* Percentage */}
            <Text
                text={`${level}%`}
                fontSize={12}
                fill="#ffffff"
                x={0}
                y={height / 2 - 6}
                width={width}
                align="center"
            />
        </Group>
    );
};

const IoTCanvas = () => {
    const [objects, setObjects] = useState([
        { id: '1', type: 'tank', x: 100, y: 100, width: 80, height: 120, level: 65, name: 'Tanque 1' },
        { id: '2', type: 'tank', x: 300, y: 150, width: 80, height: 120, level: 30, name: 'Tanque 2' }
    ]);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

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

    return (
        <div className="w-full h-full bg-slate-900 overflow-hidden relative border border-slate-700 rounded-lg shadow-2xl">
            <Stage
                width={window.innerWidth - 300} // Sidebar offset
                height={window.innerHeight - 100}
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable
            >
                <Layer>
                    {/* Grid lines can be added here */}
                    {objects.map((obj) => {
                        if (obj.type === 'tank') {
                            return (
                                <Tank
                                    key={obj.id}
                                    {...obj}
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
            <div className="absolute top-4 left-4 bg-slate-800 p-2 rounded flex flex-col gap-2 text-white shadow-lg">
                <button className="p-2 hover:bg-blue-600 rounded" title="Añadir Tanque" onClick={() => {
                    const id = Math.random().toString(36).substr(2, 9);
                    setObjects([...objects, { id, type: 'tank', x: 50, y: 50, width: 60, height: 100, level: 50, name: 'Nuevo Tanque' }]);
                }}>
                    <Box size={24} />
                </button>
                <button className="p-2 hover:bg-blue-600 rounded" title="Puntero">
                    <MousePointer2 size={24} />
                </button>
            </div>
        </div>
    );
};

export default IoTCanvas;
