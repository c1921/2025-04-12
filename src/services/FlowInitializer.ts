import { NodeType, PortType } from '../types/node';
import { NodeFactory } from '../factories/NodeFactory';
import { EdgeFactory } from '../factories/EdgeFactory';
import type { Node, Edge } from '@vue-flow/core';

export class FlowInitializer {
  // 生成初始节点
  static createInitialNodes(): Node[] {
    // 创建初始节点和边
    const input1Id = 'input-1';
    const process1Id = 'process-1';
    const transform1Id = 'transform-1';
    const output1Id = 'output-1';
    const multiPortId = 'multi-port-1';
    const typedPortId = 'typed-port-1';

    return [
      // 输入节点只有输出端口
      NodeFactory.createNode(NodeType.INPUT, '输入节点 1', { x: 0, y: 0 }, {
        ports: {
          inputs: [],
          outputs: [{ id: 'output_1', label: '输出 1' }]
        }
      }, input1Id),
      
      NodeFactory.createNode(NodeType.PROCESS, '处理节点 1', { x: 250, y: 0 }, {
        ports: {
          inputs: [{ id: 'input_1', label: '输入 1' }],
          outputs: [{ id: 'output_1', label: '输出 1' }]
        }
      }, process1Id),
      
      NodeFactory.createNode(NodeType.TRANSFORM, '转换节点 1', { x: 500, y: 0 }, {
        ports: {
          inputs: [{ id: 'input_1', label: '输入 1' }],
          outputs: [{ id: 'output_1', label: '输出 1' }]
        }
      }, transform1Id),
      
      // 输出节点只有输入端口
      NodeFactory.createNode(NodeType.OUTPUT, '输出节点 1', { x: 750, y: 0 }, {
        ports: {
          inputs: [{ id: 'input_1', label: '输入 1' }],
          outputs: []
        }
      }, output1Id),
      
      // 多端口节点示例
      NodeFactory.createMultiPortNode(
        NodeType.PROCESS, 
        '多端口节点', 
        { x: 250, y: 200 }, 
        3,  // 3个输入端口
        2,  // 2个输出端口
        { duration: 4000 },  // 其他数据
        multiPortId
      ),
      
      // 类型端口演示节点
      NodeFactory.createTypedPortNode(
        NodeType.CUSTOM,
        '类型端口节点',
        { x: 500, y: 200 },
        [PortType.A, PortType.B, PortType.C],  // 输入端口类型
        [PortType.A, PortType.B, PortType.C],  // 输出端口类型
        { duration: 2500 },
        typedPortId
      )
    ];
  }

  // 生成初始连接边
  static createInitialEdges(): Edge[] {
    const input1Id = 'input-1';
    const process1Id = 'process-1';
    const transform1Id = 'transform-1';
    const output1Id = 'output-1';
    const multiPortId = 'multi-port-1';
    const typedPortId = 'typed-port-1';

    return [
      EdgeFactory.createDataFlowEdge(input1Id, process1Id, 'edge-1'),
      EdgeFactory.createDataFlowEdge(process1Id, transform1Id, 'edge-2'),
      EdgeFactory.createDataFlowEdge(transform1Id, output1Id, 'edge-3'),
      
      // 多端口节点的连接线
      EdgeFactory.createDataFlowEdge(input1Id, `${multiPortId}__input_1`, 'edge-4'),
      EdgeFactory.createDataFlowEdge(process1Id, `${multiPortId}__input_2`, 'edge-5'),
      EdgeFactory.createDataFlowEdge(`${multiPortId}__output_1`, output1Id, 'edge-6'),
      
      // 类型端口节点的连接线
      EdgeFactory.createDataFlowEdge(transform1Id, `${typedPortId}__input_A_1`, 'edge-7'),
      EdgeFactory.createDataFlowEdge(`${typedPortId}__output_B_1`, output1Id, 'edge-8')
    ];
  }

  // 创建新节点方法
  static createNewNode(nodeType: any, position: any, nodeCount: number, nodeId?: string): Node {
    // 创建新节点ID
    const id = nodeId || `${nodeType.type}-${Date.now()}`;
    
    // 根据节点类型创建对应节点
    if (nodeType.type === 'multi-port') {
      // 创建多端口节点
      return NodeFactory.createMultiPortNode(
        NodeType.PROCESS,
        `${nodeType.label} ${nodeCount + 1}`,
        position,
        nodeType.inputs || 2,
        nodeType.outputs || 2,
        { duration: 3000 },
        id
      );
    } else if (nodeType.type === 'typed-port') {
      // 创建带有类型端口的节点
      return NodeFactory.createTypedPortNode(
        NodeType.CUSTOM,
        `类型端口节点 ${nodeCount + 1}`,
        position,
        [PortType.A, PortType.B, PortType.C],
        [PortType.A, PortType.B, PortType.C],
        { duration: 2500 },
        id
      );
    } else {
      // 创建普通节点
      return NodeFactory.createNode(
        nodeType.type,
        `${nodeType.label} ${nodeCount + 1}`,
        position,
        { duration: 3000 },
        id
      );
    }
  }
} 