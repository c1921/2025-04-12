import { NodeFactory } from '../factories/NodeFactory';
import type { NodeCreator } from '../factories/NodeFactory';
import { PortType, NodeType } from '../types/node';
import type { BaseNodeData, Node, NodeTypeValue } from '../types/node';

// 自定义节点数据接口示例
interface TimerNodeData extends BaseNodeData {
  delay: number;
  repeat: boolean;
}

// 自定义节点创建器示例：定时器节点
class TimerNodeCreator implements NodeCreator<TimerNodeData> {
  // 使用现有类型作为基础
  getNodeType(): NodeTypeValue {
    return NodeType.CUSTOM;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<TimerNodeData>, id?: string): Node {
    // 合并默认属性和传入的数据
    const nodeData: Partial<TimerNodeData> = {
      ...this.getDefaultProperties(),
      ...data
    };

    // 使用现有节点工厂方法创建节点
    return NodeFactory.createMultiPortNode(
      this.getNodeType(),
      label,
      position,
      1,
      2,
      nodeData,
      id
    );
  }

  getDefaultProperties(): Partial<TimerNodeData> {
    return {
      delay: 1000,
      repeat: false,
      duration: 1500
    };
  }

  getDisplayName(): string {
    return '定时器节点';
  }

  getDisplayClass(): string {
    return 'custom-node';
  }
}

// 完全自定义节点类型示例
class DatabaseNodeCreator implements NodeCreator {
  getNodeType(): NodeTypeValue {
    return NodeType.CUSTOM;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<BaseNodeData>, id?: string): Node {
    // 创建带类型端口的节点
    return NodeFactory.createTypedPortNode(
      this.getNodeType(),
      label || this.getDisplayName(),
      position,
      [PortType.A], // 数据输入端口
      [PortType.B, PortType.C], // 数据输出端口
      {
        dbType: data?.dbType || 'SQL',
        query: data?.query || '',
        ...data
      },
      id
    );
  }

  getDisplayName(): string {
    return '数据库节点';
  }

  getDisplayClass(): string {
    return 'database-node';
  }

  shouldUseTypedPorts(): boolean {
    return true;
  }
}

// 注册额外节点类型函数
export function registerCustomNodes() {
  // 注册自定义节点
  NodeFactory.registerExtraNodeType('timer', new TimerNodeCreator());
  NodeFactory.registerExtraNodeType('database', new DatabaseNodeCreator());
  
  console.log('自定义节点类型已注册');
}

// 插件格式，方便在Vue应用中使用
export default {
  install() {
    registerCustomNodes();
  }
}; 