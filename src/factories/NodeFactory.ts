import type { Node, NodeData } from '../types/node';
import { NodeType } from '../types/node';
import { Position } from '@vue-flow/core';
import { v4 as uuidv4 } from 'uuid';

// 添加uuid依赖: npm install uuid @types/uuid

// 节点工厂类
export class NodeFactory {
  // 创建节点的静态方法
  static createNode(
    type: NodeType,
    label: string,
    position: { x: number; y: number },
    data?: Partial<NodeData>,
    id?: string
  ): Node {
    // 基础节点数据
    const baseData: NodeData = {
      label,
      duration: this.getDefaultDuration(type),
      status: 'idle',
      ...data
    };

    // 根据类型确定默认布局方向
    const { sourcePosition, targetPosition } = this.getDefaultPositions();

    // 创建节点
    return {
      id: id || uuidv4(), // 如果没有提供ID，则生成UUID
      type: type,
      label,
      position,
      class: 'light',
      data: baseData,
      sourcePosition,
      targetPosition
    };
  }

  // 根据节点类型获取默认处理时间
  private static getDefaultDuration(type: NodeType): number {
    switch (type) {
      case NodeType.INPUT:
        return 1500;
      case NodeType.PROCESS:
        return 2500;
      case NodeType.TRANSFORM:
        return 3000;
      case NodeType.FILTER:
        return 2000;
      case NodeType.CUSTOM:
        return 2800;
      case NodeType.OUTPUT:
        return 1000;
      default:
        return 2000;
    }
  }

  // 获取默认的连接点位置
  private static getDefaultPositions(isHorizontal: boolean = false) {
    if (isHorizontal) {
      return {
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      };
    }
    return {
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top
    };
  }

  // 创建特定类型的节点
  static createInputNode(label: string, position: { x: number; y: number }, data?: Partial<NodeData>): Node {
    return this.createNode(NodeType.INPUT, label, position, data);
  }

  static createProcessNode(label: string, position: { x: number; y: number }, data?: Partial<NodeData>): Node {
    return this.createNode(NodeType.PROCESS, label, position, data);
  }

  static createTransformNode(label: string, position: { x: number; y: number }, data?: Partial<NodeData>): Node {
    return this.createNode(NodeType.TRANSFORM, label, position, data);
  }

  static createFilterNode(label: string, position: { x: number; y: number }, data?: Partial<NodeData>): Node {
    return this.createNode(NodeType.FILTER, label, position, data);
  }

  static createCustomNode(label: string, position: { x: number; y: number }, data?: Partial<NodeData>): Node {
    return this.createNode(NodeType.CUSTOM, label, position, data);
  }

  static createOutputNode(label: string, position: { x: number; y: number }, data?: Partial<NodeData>): Node {
    return this.createNode(NodeType.OUTPUT, label, position, data);
  }
} 