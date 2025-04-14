import type { Edge } from '../types/node';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from '@vue-flow/core';

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
  static createDataFlowEdge(source: string, target: string, id?: string): Edge {
    return this.createEdge(source, target, id, {
      animated: true,
      label: '数据流',
      markerEnd: MarkerType.ArrowClosed,
      style: { stroke: '#3498db', strokeWidth: 2 }
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