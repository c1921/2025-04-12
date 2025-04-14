import type { Edge } from '../types/node';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from '@vue-flow/core';
import { PortType } from '../types/node';

// 端口类型颜色映射
const PORT_TYPE_COLORS: Record<PortType, string> = {
  [PortType.A]: '#e91e63',  // 粉红色
  [PortType.B]: '#9c27b0',  // 紫色
  [PortType.C]: '#ff9800',  // 橙色
  [PortType.DEFAULT]: '#3498db'  // 默认蓝色
};

// 边工厂类
export class EdgeFactory {
  // 创建边的静态方法
  static createEdge(source: string, target: string, id?: string, options?: Partial<Edge>): Edge {
    return {
      id: id || `e${source}-${target}`,
      source,
      target,
      ...options
    };
  }

  // 批量创建边
  static createEdges(connections: { source: string, target: string, id?: string, options?: Partial<Edge> }[]): Edge[] {
    return connections.map(conn => this.createEdge(conn.source, conn.target, conn.id, conn.options));
  }

  // 创建边，使用自动生成的UUID
  static createEdgeWithUUID(source: string, target: string, options?: Partial<Edge>): Edge {
    return this.createEdge(source, target, uuidv4(), options);
  }
  
  // 创建数据流边
  static createDataFlowEdge(
    source: string, 
    target: string, 
    id?: string,
    sourceNode?: any,
    sourceHandle?: string
  ): Edge {
    // 默认颜色
    let strokeColor = PORT_TYPE_COLORS[PortType.DEFAULT];
    
    // 如果提供了源节点和句柄，尝试获取端口类型
    if (sourceNode && sourceHandle) {
      const handleIdParts = sourceHandle.split('__');
      if (handleIdParts.length > 1) {
        const portId = handleIdParts[1];
        const sourcePort = sourceNode.data?.ports?.outputs?.find((p: any) => p.id === portId);
        if (sourcePort?.type && PORT_TYPE_COLORS[sourcePort.type as PortType]) {
          strokeColor = PORT_TYPE_COLORS[sourcePort.type as PortType];
        }
      }
    }
    
    return this.createEdge(source, target, id, {
      animated: true,
      label: '数据流',
      markerEnd: MarkerType.ArrowClosed,
      style: { stroke: strokeColor, strokeWidth: 2 }
    });
  }

  // 创建控制流边
  static createControlFlowEdge(source: string, target: string, id?: string): Edge {
    return this.createEdge(source, target, id, {
      animated: false,
      label: '控制流',
      markerEnd: MarkerType.ArrowClosed,
      type: 'step',
      style: { stroke: '#e74c3c', strokeWidth: 2, strokeDasharray: '5,5' }
    });
  }
} 