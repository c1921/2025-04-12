import { NodeFactory } from '../factories/NodeFactory';
import type { XYPosition } from '@vue-flow/core';
import type { BaseNodeData } from '../types/node';

// 侧边栏节点类型接口
interface SidebarNodeType {
  type: string;
  label: string;
  class: string;
  inputs: number;
  outputs: number;
  typedPorts?: boolean;
}

/**
 * 处理节点拖放，根据拖放的节点类型创建新节点
 * @param event 拖放事件
 * @param position 拖放位置
 * @returns 创建的节点，如果失败则返回undefined
 */
export function handleNodeDrop(
  event: DragEvent,
  position: XYPosition
) {
  if (!event.dataTransfer) return;

  // 尝试从拖放数据中获取节点类型信息
  try {
    const nodeTypeData = event.dataTransfer.getData('application/vueflow');
    if (!nodeTypeData) return;

    const nodeType = JSON.parse(nodeTypeData) as SidebarNodeType;
    const { type } = nodeType;
    
    // 使用新的节点创建方法创建节点
    return NodeFactory.createNodeByType(
      type,
      nodeType.label,
      { x: position.x, y: position.y },
      // 可以在这里添加额外的数据
      {} as Partial<BaseNodeData>
    );
  } catch (error) {
    console.error('处理节点拖放时出错:', error);
    return undefined;
  }
}

/**
 * 根据节点类型和位置创建节点
 * 适用于程序化创建节点的场景
 */
export function createNodeAt(
  type: string,
  label: string,
  position: { x: number; y: number },
  data?: Partial<BaseNodeData>
) {
  return NodeFactory.createNodeByType(type, label, position, data);
} 