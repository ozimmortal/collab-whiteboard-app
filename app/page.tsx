"use client";

import { useEffect, useState,useRef, use } from "react";
import { socket } from "@/socket";
import { Stage, Layer, Rect, Circle,Text,Arrow,Line,Transformer } from 'react-konva';
import { cn } from "@/lib/utils"
import { v4 as uuid } from "uuid";
import {
  Lock,
  Hand,
  MousePointer2,
  Square,
  Diamond,
  Circle as c,
  ArrowRight,
  Minus,
  Pencil,
  Type
} from "lucide-react"
import { set } from "react-hook-form";

const tools = [
  { icon: Lock, label: "Lock" },
  { icon: Hand, label: "Hand" },
  { icon: MousePointer2, label: "Select" },
  { icon: Square, label: "Rectangle" },
  { icon: c, label: "Circle" },
  { icon: ArrowRight, label: "Arrow" },
  { icon: Minus, label: "Line" },
  { icon: Type, label: "Text" },
]

interface Shapes{
  id:string,
  type:string,
  color:string,
  x?:number,
  y?:number,
  width?:number,
  height?:number,
  fill?:boolean,
  text?:string,
  fontSize?:number,
  italic?:boolean,
  rotation?:number,
  radius?:number,
  points?:number[],
  

}
export default function Home() {
  const [mousePos, setMousePos] = useState({});
  const [users, setUsers] = useState([]);
  const [shapes, setShapes] = useState<Shapes[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("Select");
  const [screenDraggable, setScreenDraggable] = useState(false);
  const stageRef = useRef(null);
  const currentShapeId = useRef<string | null>('');
  const [selectedId, setSelectedId] = useState(null);
  const transformerRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (transformerRef.current && layerRef.current) {
      console.log(selectedId);
      const selectedNode = layerRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId]);

  useEffect(() => {
    //socket.emit('object-change',shapes)
    console.log("changed");
  }, [shapes]);

  useEffect(() => {
    socket.on('object-changed', (data) => {
      console.log('Received object-changed event:', data);
      if (data) setShapes(data);
    });
  
    return () => {
      socket.off('object-changed'); // Clean up to avoid duplicate listeners
    };
  }, []);
  
  const isDrawing = useRef(false);
  const [elementsDraggable, setElementsDraggable] = useState(false);
  function onPointerDown() {
    if(selectedTool === 'Hand' || selectedTool === 'Lock' || selectedTool === 'Select')return
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    const id = uuid();
    currentShapeId.current = id;
    isDrawing.current = true
    switch(selectedTool){
      case 'Rectangle':
        const rect:Shapes = {
          id,
          type: "Rectangle",
          x: pos.x,
          y: pos.y,
          width: 20,
          height: 20,
          color: "blue",
        };
        setShapes([...shapes,rect]);
        break;
      case 'Circle':
        const circle:Shapes = {
          id,
          type: "Circle",
          x: pos.x,
          y: pos.y,
          radius: 20,
          color: 'red',
        }
        setShapes([...shapes,circle]);
        break;
      case 'Arrow':
        const arrow:Shapes = {
          id,
          type: "Arrow",
          points: [pos.x, pos.y, pos.x + 20, pos.y + 20],
          color: 'red',
        }
        setShapes([...shapes,arrow]);
        break;
      case 'Line':
        const line:Shapes = {
          id,
          type: "Line",
          x: pos.x,
          y: pos.y,
          color: 'red',
        }
        break;
    }
    
  }
  function onPointerMove() {
    if(selectedTool === 'Hand' || selectedTool === 'Lock' || selectedTool === 'Select' || !isDrawing.current)return
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    socket.emit('object-change',shapes)
    switch(selectedTool){
      case 'Rectangle':
        setShapes((prevShapes) => {
          const updatedShapes = prevShapes.map((shape) => {
            if (shape.id === currentShapeId.current && shape.type == 'Rectangle') {
              return {
                ...shape,
                width: pos.x - shape.x,
                height: pos.y - shape.y,
              };
            }
            return shape;
          });
          return updatedShapes;
        });
        break;
      case 'Circle':
        setShapes((prevShapes) => {
          const updatedShapes = prevShapes.map((shape) => {
            if (shape.id === currentShapeId.current && shape.type == 'Circle') {
              return {
                ...shape,
                radius: Math.sqrt((pos.y-shape.y)**2 + (pos.x - shape.x)**2),

              };
            }
            return shape;
          });
          return updatedShapes;
        });
        case 'Arrow':
          setShapes((prevShapes) => {
            const updatedShapes = prevShapes.map((shape) => {
              if (shape.id === currentShapeId.current && shape.type == 'Arrow') {
                return {
                  ...shape,
                  points:[shape.points[0],shape.points[1],pos.x,pos.y],
  
                };
              }
              return shape;
            });
            return updatedShapes;
          });
        
      
    }
  }
  function onPointerUp() {
    isDrawing.current = false;
  }  
  function Toolbar() {
    function handleClick(label:string){
      setSelectedTool(label)
      if(label === 'Hand'){
        setScreenDraggable(true)
        return
      }
      if(label === 'Select') {
        setElementsDraggable(true)
        return
      }
      setScreenDraggable(false) 
      setElementsDraggable(false)
    }
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 p-1.5 rounded-lg bg-zinc-900 shadow-lg flex gap-0.5 z-50 cursor-pointer">
        {tools.map((tool) => (
          <button
            key={tool.label}
            onClick={() => {
              handleClick(tool.label)
              
            }}
            className={cn(
              "relative group p-2 rounded-md transition-colors duration-150",
              selectedTool === tool.label ? "bg-indigo-600 text-white" : "text-zinc-100 hover:bg-zinc-800",
            )}
            title={tool.label}
          >
            <tool.icon className="w-5 h-5" />
            <span className="sr-only">{tool.label}</span>
          </button>
        ))}
      </div>
    )
    }
  useEffect(() => {
   document.addEventListener('mousemove', (e) => {
    setMousePos({x: e.clientX, y: e.clientY})
    socket.emit('mousemove', {x: e.clientX, y: e.clientY})
   })
  })
  socket.on('connect', () => {
    console.log('connected')
  })
  return(
    <div className="h-screen w-screen relative"> 
    <Toolbar  /> 
    <Stage onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onTransform={(e)=>{socket.emit('object-change',shapes)}} onDblClick={()=>{setSelectedId(null)}} width={window.innerWidth} height={window.innerHeight} draggable={screenDraggable} ref={stageRef} className={cn('',selectedTool!=='Select'  ? ' cursor-crosshair' : ' ',selectedTool==='Hand'?'cursor-grab':'')}>
      <Layer ref={layerRef} > 
        {shapes.map((shape) => {
  switch (shape.type) {
    case 'Rectangle':
      return (
        <Rect
          key={shape.id}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.color}
          draggable={elementsDraggable}
          onClick={() =>{ setSelectedId(shape.id);}}
          onDragMove={(e) => {
            let x = e.currentTarget.attrs.x;
            let y = e.currentTarget.attrs.y;
            setShapes((prevShapes) =>
              prevShapes.map((s) =>
                s.id === shape.id ? { ...s, x, y } : s
              )
            );

            socket.emit('object-change',shapes)
          }}
          
          onTransformStart={(e) => {
            const node = e.target;
            setShapes((prev) =>{
              console.log(prev, "prev")
              const updatedShapes = prev.map((s) =>
                s.id === shape.id ? { ...s, x: node.x(), y: node.y(), width: node.width(), height: node.height() } : s
              )
              console.log(updatedShapes ,"updated")
              return updatedShapes
            }
            );
            socket.emit('object-change',shapes)
            
          }}
        />
      );
    case 'Circle':
      return (
        <Circle
          key={shape.id}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          radius={shape.radius}
          fill={shape.color}
          draggable={elementsDraggable}
          onClick={() => setSelectedId(shape.id)}
          onDragMove={(e) => {
            let x = e.currentTarget.attrs.x;
            let y = e.currentTarget.attrs.y;
            setShapes((prevShapes) =>
              prevShapes.map((s) =>
                s.id === shape.id ? { ...s, x, y } : s
              )
            );
          }}
          onTransform={(e) => {
            const node = e.target;
            setShapes((prev) =>
              prev.map((s) =>
                s.id === shape.id ? { ...s, x: node.x(), y: node.y(), radius: node.radius() } : s
              )
            );
          }}
        />
      );
      case 'Line':
        return (
          <Line
            key={shape.id}
            id={shape.id}
            points={shape.points}
            stroke={shape.color}
            strokeWidth={2}
            draggable={elementsDraggable}
            onClick={() => setSelectedId(shape.id)}
            onDragMove={(e) => {
              const newPoints = [...shape.points];
              newPoints[0] = e.currentTarget.attrs.points[0];
              newPoints[1] = e.currentTarget.attrs.points[1];
              setShapes((prevShapes) =>
                prevShapes.map((s) =>
                  s.id === shape.id ? { ...s, points: newPoints } : s
                )
              );
            }}
            onTransform={(e) => {
              const node = e.target;
              setShapes((prev) =>
                prev.map((s) =>
                  s.id === shape.id ? { ...s, points: node.points() } : s
                )
              );
            }}
          />
        );
    case 'Arrow':
      return (
        <Arrow
          key={shape.id}
          id={shape.id}
          points={shape.points}
          stroke={shape.color}
          draggable={elementsDraggable}
          onClick={() => setSelectedId(shape.id)}
          onDragMove={(e) => {
            const newPoints = [...shape.points];
            newPoints[0] = e.currentTarget.attrs.points[0];
            newPoints[1] = e.currentTarget.attrs.points[1];
            setShapes((prevShapes) =>
              prevShapes.map((s) =>
                s.id === shape.id ? { ...s, points: newPoints } : s
              )
            );
          }}
          onTransform={(e) => {
            const node = e.target;
            setShapes((prev) =>
              prev.map((s) =>
                s.id === shape.id ? { ...s, points: node.points() } : s
              )
            );
          }}
        />
      );
    default:
      return null;
  }
})}
      <Transformer ref={transformerRef} />
      </Layer>
    </Stage>
  </div>

  )
}

