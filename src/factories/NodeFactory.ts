import type { 
  Node, 
  BaseNodeData,
  InputNodeData, 
  ProcessNodeData, 
  TransformNodeData, 
  FilterNodeData, 
  CustomNodeData, 
  OutputNodeData, 
  Port,
  NodeTypeValue
} from '../types/node';
import { NodeType, PortType } from '../types/node';
import { Position } from '@vue-flow/core';
import { v4 as uuidv4 } from 'uuid';

// 添加uuid依赖: npm install uuid @types/uuid

// 节点创建器接口
export interface NodeCreator<T extends BaseNodeData = BaseNodeData> {
  create(label: string, position: { x: number; y: number }, data?: Partial<T>, id?: string): Node;
  getNodeType(): NodeTypeValue;
  getDefaultProperties?(): Partial<T>;
  getDisplayName?(): string;
  getDisplayClass?(): string;
  getDefaultInputs?(): number;
  getDefaultOutputs?(): number;
  shouldUseTypedPorts?(): boolean;
}

// 节点工厂类
export class NodeFactory {
  // 存储已注册的节点创建器
  private static nodeCreators: Map<NodeTypeValue, NodeCreator> = new Map();
  // 存储额外的节点类型（非NodeTypeValue的字符串类型）
  private static extraNodeTypes: Map<string, NodeCreator> = new Map();

  // 注册节点创建器
  static registerNodeCreator(creator: NodeCreator): void {
    const nodeType = creator.getNodeType();
    this.nodeCreators.set(nodeType, creator);
  }

  // 注册额外节点类型
  static registerExtraNodeType(type: string, creator: NodeCreator): void {
    this.extraNodeTypes.set(type, creator);
  }

  // 获取所有注册的节点类型信息，用于侧边栏展示
  static getRegisteredNodeTypes(): Array<{
    type: NodeTypeValue | string;
    label: string;
    class: string;
    inputs: number;
    outputs: number;
    typedPorts?: boolean;
  }> {
    const result = [];

    // 处理标准节点类型
    for (const [type, creator] of this.nodeCreators.entries()) {
      result.push({
        type,
        label: creator.getDisplayName?.() || `${type}节点`,
        class: creator.getDisplayClass?.() || `${type}-node`,
        inputs: creator.getDefaultInputs?.() || 1,
        outputs: creator.getDefaultOutputs?.() || 1,
        typedPorts: creator.shouldUseTypedPorts?.() || false
      });
    }

    // 处理额外节点类型
    for (const [type, creator] of this.extraNodeTypes.entries()) {
      result.push({
        type,
        label: creator.getDisplayName?.() || `${type}节点`,
        class: creator.getDisplayClass?.() || 'custom-node',
        inputs: creator.getDefaultInputs?.() || 1,
        outputs: creator.getDefaultOutputs?.() || 1,
        typedPorts: creator.shouldUseTypedPorts?.() || false
      });
    }

    return result;
  }

  // 创建节点方法，根据类型调用相应的创建器
  static createNodeByType(
    type: NodeTypeValue | string,
    label: string,
    position: { x: number; y: number },
    data?: Partial<BaseNodeData>,
    id?: string
  ): Node {
    // 查找注册的节点创建器
    let creator: NodeCreator | undefined;
    
    if (this.isNodeTypeValue(type)) {
      creator = this.nodeCreators.get(type);
    } else {
      creator = this.extraNodeTypes.get(type);
    }

    if (creator) {
      return creator.create(label, position, data, id);
    }

    // 未找到创建器时，使用默认方法创建
    console.warn(`未找到类型 "${type}" 的节点创建器，使用默认方法创建`);
    return this.createNode(type as NodeTypeValue, label, position, data, id);
  }

  // 检查是否为NodeTypeValue
  private static isNodeTypeValue(type: string): type is NodeTypeValue {
    return Object.values(NodeType).includes(type as NodeTypeValue);
  }

  // 创建节点的静态方法
  static createNode<T extends BaseNodeData>(
    type: NodeTypeValue,
    label: string,
    position: { x: number; y: number },
    data?: Partial<T>,
    id?: string
  ): Node {
    // 基础节点数据
    const baseData: BaseNodeData = {
      label,
      status: 'idle',
      ...data
    };

    // 添加默认处理时间（仅对需要的节点类型）
    if (type !== NodeType.INPUT && type !== NodeType.OUTPUT) {
      (baseData as any).duration = this.getDefaultDuration(type);
    }

    // 从数据中提取布局方向
    const isHorizontal = data?.isHorizontal || false;

    // 根据类型和布局方向确定默认连接点位置
    const { sourcePosition, targetPosition } = this.getDefaultPositions(isHorizontal);

    // 创建节点
    return {
      id: id || uuidv4(), // 如果没有提供ID，则生成UUID
      type,
      label,
      position,
      class: 'light',
      data: baseData as any, // 类型断言为对应节点的数据类型
      sourcePosition,
      targetPosition
    };
  }

  // 创建带有多个输入输出端口的节点
  static createMultiPortNode<T extends BaseNodeData>(
    type: NodeTypeValue,
    label: string,
    position: { x: number; y: number },
    inputs: number | Array<Port> = 1,
    outputs: number | Array<Port> = 1,
    data?: Partial<T>,
    id?: string
  ): Node {
    // 处理输入端口
    let inputPorts;
    if (typeof inputs === 'number') {
      inputPorts = Array.from({ length: inputs }, (_, i) => ({
        id: `input_${i+1}`,
        label: `输入 ${i+1}`
      }));
    } else {
      inputPorts = inputs;
    }

    // 处理输出端口
    let outputPorts;
    if (typeof outputs === 'number') {
      outputPorts = Array.from({ length: outputs }, (_, i) => ({
        id: `output_${i+1}`,
        label: `输出 ${i+1}`
      }));
    } else {
      outputPorts = outputs;
    }

    // 组合数据
    const nodeData = {
      ...data,
      ports: {
        inputs: inputPorts,
        outputs: outputPorts
      }
    };

    // 使用基本方法创建节点
    return this.createNode<T>(type, label, position, nodeData as unknown as Partial<T>, id);
  }

  // 创建带有类型端口的节点
  static createTypedPortNode<T extends BaseNodeData>(
    type: NodeTypeValue,
    label: string,
    position: { x: number; y: number },
    inputPortTypes: PortType[] = [],
    outputPortTypes: PortType[] = [],
    data?: Partial<T>,
    id?: string
  ): Node {
    // 创建带类型的输入端口
    const inputPorts: Port[] = inputPortTypes.map((portType, index) => ({
      id: `input_${portType}_${index+1}`,
      label: `${portType}型输入`,
      type: portType
    }));

    // 创建带类型的输出端口
    const outputPorts: Port[] = outputPortTypes.map((portType, index) => ({
      id: `output_${portType}_${index+1}`,
      label: `${portType}型输出`,
      type: portType
    }));

    // 使用已有的方法创建多端口节点
    return this.createMultiPortNode<T>(
      type,
      label,
      position,
      inputPorts,
      outputPorts,
      data,
      id
    );
  }

  // 根据节点类型获取默认处理时间
  private static getDefaultDuration(type: NodeTypeValue): number {
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
  static createInputNode(label: string, position: { x: number; y: number }, data?: Partial<InputNodeData>): Node {
    return this.createNode<InputNodeData>(NodeType.INPUT, label, position, data);
  }

  static createProcessNode(label: string, position: { x: number; y: number }, data?: Partial<ProcessNodeData>): Node {
    return this.createNode<ProcessNodeData>(NodeType.PROCESS, label, position, data);
  }

  static createTransformNode(label: string, position: { x: number; y: number }, data?: Partial<TransformNodeData>): Node {
    return this.createNode<TransformNodeData>(NodeType.TRANSFORM, label, position, data);
  }

  static createFilterNode(label: string, position: { x: number; y: number }, data?: Partial<FilterNodeData>): Node {
    return this.createNode<FilterNodeData>(NodeType.FILTER, label, position, data);
  }

  static createCustomNode(label: string, position: { x: number; y: number }, data?: Partial<CustomNodeData>): Node {
    return this.createNode<CustomNodeData>(NodeType.CUSTOM, label, position, data);
  }

  static createOutputNode(label: string, position: { x: number; y: number }, data?: Partial<OutputNodeData>): Node {
    return this.createNode<OutputNodeData>(NodeType.OUTPUT, label, position, data);
  }

  // 创建包含所有端口类型的示例节点
  static createDemoTypedNode(position: { x: number; y: number }, id?: string): Node {
    return this.createTypedPortNode<CustomNodeData>(
      NodeType.CUSTOM,
      '类型端口演示节点',
      position,
      [PortType.A, PortType.B, PortType.C],
      [PortType.A, PortType.B, PortType.C],
      { duration: 2000 },
      id || 'typed-demo'
    );
  }
}

// 初始化默认节点创建器
class InputNodeCreator implements NodeCreator<InputNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.INPUT;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<InputNodeData>, id?: string): Node {
    return NodeFactory.createNode<InputNodeData>(this.getNodeType(), label, position, data, id);
  }

  getDisplayName(): string {
    return '输入节点';
  }

  getDisplayClass(): string {
    return 'input-node';
  }

  getDefaultInputs(): number {
    return 0;
  }

  getDefaultOutputs(): number {
    return 1;
  }
}

class ProcessNodeCreator implements NodeCreator<ProcessNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.PROCESS;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<ProcessNodeData>, id?: string): Node {
    return NodeFactory.createNode<ProcessNodeData>(this.getNodeType(), label, position, data, id);
  }

  getDisplayName(): string {
    return '处理节点';
  }

  getDisplayClass(): string {
    return 'process-node';
  }
}

class TransformNodeCreator implements NodeCreator<TransformNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.TRANSFORM;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<TransformNodeData>, id?: string): Node {
    return NodeFactory.createNode<TransformNodeData>(this.getNodeType(), label, position, data, id);
  }

  getDisplayName(): string {
    return '转换节点';
  }

  getDisplayClass(): string {
    return 'transform-node';
  }
}

class FilterNodeCreator implements NodeCreator<FilterNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.FILTER;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<FilterNodeData>, id?: string): Node {
    return NodeFactory.createNode<FilterNodeData>(this.getNodeType(), label, position, data, id);
  }

  getDisplayName(): string {
    return '过滤节点';
  }

  getDisplayClass(): string {
    return 'filter-node';
  }
}

class CustomNodeCreator implements NodeCreator<CustomNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.CUSTOM;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<CustomNodeData>, id?: string): Node {
    return NodeFactory.createNode<CustomNodeData>(this.getNodeType(), label, position, data, id);
  }

  getDisplayName(): string {
    return '自定义节点';
  }

  getDisplayClass(): string {
    return 'custom-node';
  }
}

class OutputNodeCreator implements NodeCreator<OutputNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.OUTPUT;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<OutputNodeData>, id?: string): Node {
    return NodeFactory.createNode<OutputNodeData>(this.getNodeType(), label, position, data, id);
  }

  getDisplayName(): string {
    return '输出节点';
  }

  getDisplayClass(): string {
    return 'output-node';
  }

  getDefaultInputs(): number {
    return 1;
  }

  getDefaultOutputs(): number {
    return 0;
  }
}

class MultiPortNodeCreator implements NodeCreator {
  getNodeType(): NodeTypeValue {
    return NodeType.PROCESS;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<BaseNodeData>, id?: string): Node {
    return NodeFactory.createMultiPortNode(this.getNodeType(), label, position, 2, 2, data, id);
  }

  getDisplayName(): string {
    return '多端口节点';
  }

  getDisplayClass(): string {
    return 'process-node';
  }

  getDefaultInputs(): number {
    return 2;
  }

  getDefaultOutputs(): number {
    return 2;
  }
}

class TypedPortNodeCreator implements NodeCreator {
  getNodeType(): NodeTypeValue {
    return NodeType.CUSTOM;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<BaseNodeData>, id?: string): Node {
    return NodeFactory.createTypedPortNode(
      this.getNodeType(),
      label,
      position,
      [PortType.A, PortType.B, PortType.C],
      [PortType.A, PortType.B, PortType.C],
      data,
      id
    );
  }

  getDisplayName(): string {
    return '类型端口节点';
  }

  getDisplayClass(): string {
    return 'custom-node';
  }

  getDefaultInputs(): number {
    return 1;
  }

  getDefaultOutputs(): number {
    return 1;
  }

  shouldUseTypedPorts(): boolean {
    return true;
  }
}

// 注册默认节点创建器
NodeFactory.registerNodeCreator(new InputNodeCreator());
NodeFactory.registerNodeCreator(new ProcessNodeCreator());
NodeFactory.registerNodeCreator(new TransformNodeCreator());
NodeFactory.registerNodeCreator(new FilterNodeCreator());
NodeFactory.registerNodeCreator(new CustomNodeCreator());
NodeFactory.registerNodeCreator(new OutputNodeCreator());

// 注册额外节点类型
NodeFactory.registerExtraNodeType('multi-port', new MultiPortNodeCreator());
NodeFactory.registerExtraNodeType('typed-port', new TypedPortNodeCreator()); 