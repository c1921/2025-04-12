import { Position } from '@vue-flow/core';
import type { GraphNode, Edge as FlowEdge } from '@vue-flow/core';
import type { Component, VNode, RendererElement, RendererNode } from 'vue';

// 节点状态类型
export type NodeStatus = 'idle' | 'running' | 'completed';

// 端口类型枚举
export enum PortType {
  A = 'A',
  B = 'B',
  C = 'C',
  DEFAULT = 'DEFAULT'
}

// 端口接口
export interface Port {
  id: string;
  label?: string;
  position?: Position;
  type?: PortType; // 端口类型，用于确定颜色
}

// 基础节点数据接口
export interface BaseNodeData {
  label?: string;
  status?: NodeStatus;
  [key: string]: any; // 允许扩展其他属性
}

// 定义包含端口的节点数据接口
export interface PortedNodeData extends BaseNodeData {
  ports?: {
    inputs?: Array<Port>;
    outputs?: Array<Port>;
  };
}

// 定义各类型节点的特定数据
export interface InputNodeData extends BaseNodeData {
  sourceType?: string;
  // 输入节点特有属性
}

export interface ProcessNodeData extends PortedNodeData {
  duration?: number;
  // 处理节点特有属性
}

export interface TransformNodeData extends PortedNodeData {
  duration?: number;
  transformRules?: any;
  // 转换节点特有属性
}

export interface FilterNodeData extends PortedNodeData {
  duration?: number;
  filterCondition?: any;
  // 过滤节点特有属性
}

export interface OutputNodeData extends BaseNodeData {
  destination?: string;
  // 输出节点特有属性
}

export interface CustomNodeData extends PortedNodeData {
  duration?: number;
  // 自定义节点特有属性
}

// 节点数据类型联合
export type NodeData = 
  | InputNodeData 
  | ProcessNodeData 
  | TransformNodeData 
  | FilterNodeData 
  | OutputNodeData 
  | CustomNodeData;

// 节点类型常量 - 使用const代替enum以提高灵活性
export const NodeType = {
  INPUT: 'input',
  PROCESS: 'process',
  TRANSFORM: 'transform',
  FILTER: 'filter',
  CUSTOM: 'custom',
  OUTPUT: 'output'
} as const;

// 从常量对象中提取类型
export type NodeTypeValue = typeof NodeType[keyof typeof NodeType];

// 类型守卫函数
export function isInputNode(node: Node): node is Node & { data: InputNodeData } {
  return node.type === NodeType.INPUT;
}

export function isProcessNode(node: Node): node is Node & { data: ProcessNodeData } {
  return node.type === NodeType.PROCESS;
}

export function isTransformNode(node: Node): node is Node & { data: TransformNodeData } {
  return node.type === NodeType.TRANSFORM;
}

export function isFilterNode(node: Node): node is Node & { data: FilterNodeData } {
  return node.type === NodeType.FILTER;
}

export function isOutputNode(node: Node): node is Node & { data: OutputNodeData } {
  return node.type === NodeType.OUTPUT;
}

export function isCustomNode(node: Node): node is Node & { data: CustomNodeData } {
  return node.type === NodeType.CUSTOM;
}

// 节点接口，兼容GraphNode
export interface Node {
  id: string;
  type: NodeTypeValue;
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