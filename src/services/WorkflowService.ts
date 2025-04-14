import type { NodeStatus, Workflow } from '../types/node';
import { useVueFlow } from '@vue-flow/core';
import type { GraphNode } from '@vue-flow/core';

// 工作流服务类
export class WorkflowService {
  private vueFlow: ReturnType<typeof useVueFlow>;
  private isRunning: boolean = false;

  constructor(vueFlowInstance: ReturnType<typeof useVueFlow>) {
    this.vueFlow = vueFlowInstance;
  }

  // 重置所有节点状态
  resetAllNodes(): void {
    this.vueFlow.getNodes.value.forEach(node => {
      node.data = { ...node.data, status: 'idle' as NodeStatus };
      node.class = 'light';
    });
    this.vueFlow.setNodes([...this.vueFlow.getNodes.value]);
  }

  // 更新节点状态
  updateNodeStatus(nodeId: string, status: NodeStatus): void {
    const node = this.vueFlow.findNode(nodeId);
    if (node) {
      node.data = { ...node.data, status };
      
      // 更新节点的类
      const statusClass = status === 'running' ? 'running' : status === 'completed' ? 'completed' : 'light';
      node.class = statusClass;
      
      // 更新节点
      this.vueFlow.setNodes([...this.vueFlow.getNodes.value]); 
    }
  }

  // 执行单个节点
  executeNode(nodeId: string): Promise<void> {
    return new Promise((resolve) => {
      // 更新节点状态为运行中
      this.updateNodeStatus(nodeId, 'running');
      
      // 获取节点的执行时间
      const node = this.vueFlow.findNode(nodeId);
      const duration = node?.data?.duration || 2000;
      
      // 模拟节点执行
      setTimeout(() => {
        // 更新节点状态为已完成
        this.updateNodeStatus(nodeId, 'completed');
        resolve();
      }, duration);
    });
  }

  // 查找起始节点（输入类型的节点）
  findStartNodes(): GraphNode[] {
    return this.vueFlow.getNodes.value.filter(node => node.type === 'input');
  }

  // 查找下一个节点
  findNextNodes(nodeId: string): string[] {
    return this.vueFlow.getEdges.value
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }

  // 递归处理节点
  async processNode(nodeId: string): Promise<void> {
    // 执行当前节点
    await this.executeNode(nodeId);
    
    // 查找下一个节点
    const nextNodeIds = this.findNextNodes(nodeId);
    
    // 顺序执行下一个节点
    for (const nextNodeId of nextNodeIds) {
      await this.processNode(nextNodeId);
    }
  }

  // 运行工作流
  async runWorkflow(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // 重置所有节点状态
    this.resetAllNodes();
    
    // 查找起始节点
    const startNodes = this.findStartNodes();
    
    // 从每个起始节点开始执行
    for (const startNode of startNodes) {
      await this.processNode(startNode.id);
    }
    
    this.isRunning = false;
    console.log('工作流执行完成！');
  }

  // 获取工作流运行状态
  isWorkflowRunning(): boolean {
    return this.isRunning;
  }

  // 导出工作流配置
  exportWorkflow(): Workflow {
    return {
      nodes: this.vueFlow.getNodes.value,
      edges: this.vueFlow.getEdges.value
    };
  }

  // 导入工作流配置
  importWorkflow(workflow: Workflow): void {
    this.vueFlow.setNodes(workflow.nodes);
    this.vueFlow.setEdges(workflow.edges);
  }
} 