import { Position } from '@vue-flow/core';
import type { GraphNode, Edge as FlowEdge } from '@vue-flow/core';
import type { Component, VNode, RendererElement, RendererNode } from 'vue';

// 节点状态类型
export type NodeStatus = 'idle' | 'running' | 'completed';

// 节点数据接口
export interface NodeData {
  label?: string;
  duration?: number; // 改为可选，如果不存在会使用默认值
  status?: NodeStatus; // 初始可以为undefined
  [key: string]: any; // 允许扩展其他属性
}

// 节点类型枚举
export enum NodeType {
  INPUT = 'input',
  PROCESS = 'process',
  TRANSFORM = 'transform',
  FILTER = 'filter',
  CUSTOM = 'custom',
  OUTPUT = 'output'
}

// 节点接口，兼容GraphNode
export interface Node {
  id: string;
  type: string;
  label: string | VNode<RendererNode, RendererElement, { [key: string]: any; }> | Component | undefined;
  position: { x: number; y: number };
  class: string;
  data: NodeData;
  sourcePosition?: Position;
  targetPosition?: Position;
}

// 边接口
export interface Edge {
  id: string;
  source: string;
  target: string;
  // 添加其他可能的FlowEdge属性
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
  [key: string]: any;
}

// 工作流接口
export interface Workflow {
  nodes: GraphNode[];
  edges: FlowEdge[];
} 