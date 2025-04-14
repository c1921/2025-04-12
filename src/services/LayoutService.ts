import { useVueFlow, Position } from '@vue-flow/core';
import dagre from '@dagrejs/dagre';

// 布局方向枚举
export enum LayoutDirection {
  VERTICAL = 'TB',    // Top to Bottom
  HORIZONTAL = 'LR'   // Left to Right
}

// 布局选项接口
export interface LayoutOptions {
  rankdir?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  nodesep?: number;
  ranksep?: number;
  ranker?: string;
  padding?: number;   // fitView的内边距
  onLayoutStart?: () => void; // 布局开始回调
  onLayoutEnd?: () => void;   // 布局结束回调
}

// 布局服务类
export class LayoutService {
  private vueFlow: ReturnType<typeof useVueFlow>;
  private currentDirection: LayoutDirection = LayoutDirection.VERTICAL;

  constructor(vueFlowInstance: ReturnType<typeof useVueFlow>) {
    this.vueFlow = vueFlowInstance;
  }

  // 执行布局
  applyLayout(
    direction: LayoutDirection = LayoutDirection.VERTICAL, 
    options: Partial<LayoutOptions> = {}
  ): void {
    // 触发布局开始事件
    options.onLayoutStart?.();
    
    // 保存当前布局方向
    this.currentDirection = direction;
    
    const nodes = this.vueFlow.getNodes.value;
    const edges = this.vueFlow.getEdges.value;
    
    console.log('布局前节点:', nodes);
    
    const { nodes: layoutedNodes } = this.getLayoutedElements(
      JSON.parse(JSON.stringify(nodes)),
      edges,
      { 
        rankdir: direction, 
        nodesep: options.nodesep || 80, 
        ranksep: options.ranksep || 100,
        nodeWidth: options.nodeWidth,
        nodeHeight: options.nodeHeight,
        ranker: options.ranker || 'network-simplex',
        padding: options.padding
      }
    );

    // 更新节点的位置
    this.vueFlow.setNodes(layoutedNodes);
    console.log('布局后节点:', layoutedNodes);
    
    // 使用 Vue Flow 内置的 fitView 功能，将所有节点适应到视图中
    setTimeout(() => {
      this.vueFlow.fitView({ 
        padding: options.padding !== undefined ? options.padding : 0.2,
        includeHiddenNodes: false
      });
      
      // 触发布局结束事件
      options.onLayoutEnd?.();
    }, 10);
  }

  // 获取当前布局方向
  getCurrentDirection(): LayoutDirection {
    return this.currentDirection;
  }

  // Dagre 图布局算法
  private getLayoutedElements(nodes: any[], edges: any[], options: LayoutOptions) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHorizontal = options.rankdir === LayoutDirection.HORIZONTAL;
    
    // 设置布局方向和节点间距
    dagreGraph.setGraph({
      rankdir: options.rankdir || LayoutDirection.VERTICAL,
      nodesep: options.nodesep || 50,
      ranksep: options.ranksep || 80,
      ranker: options.ranker || 'network-simplex',
    });

    // 添加节点，使用动态获取节点尺寸
    nodes.forEach((node) => {
      // 尝试获取实际节点尺寸
      const graphNode = this.vueFlow.findNode(node.id);
      const nodeWidth = options.nodeWidth || 
                        (graphNode?.dimensions?.width) || 180;
      const nodeHeight = options.nodeHeight || 
                         (graphNode?.dimensions?.height) || 100;
                       
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // 添加边
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // 执行布局算法
    dagre.layout(dagreGraph);

    // 应用布局结果到节点
    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      if (!nodeWithPosition) {
        console.warn(`节点 ${node.id} 在布局计算后未找到位置信息`);
        return node;
      }
      
      // 获取节点尺寸用于居中偏移计算
      const graphNode = this.vueFlow.findNode(node.id);
      const nodeWidth = options.nodeWidth || 
                        (graphNode?.dimensions?.width) || 180;
      const nodeHeight = options.nodeHeight || 
                         (graphNode?.dimensions?.height) || 100;
      
      // 把布局后的坐标应用到节点
      node.targetPosition = isHorizontal ? Position.Left : Position.Top;
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

      // 计算居中偏移
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };

      return node;
    });

    return { nodes, edges };
  }
}

// 快速布局composable
export function useLayout() {
  const vueFlow = useVueFlow();
  const layoutService = new LayoutService(vueFlow);
  
  // 简化的布局函数
  const layout = (direction: LayoutDirection = LayoutDirection.VERTICAL, options: Partial<LayoutOptions> = {}) => {
    layoutService.applyLayout(direction, options);
  };
  
  // 垂直布局快捷方法
  const layoutVertical = (options: Partial<LayoutOptions> = {}) => {
    layout(LayoutDirection.VERTICAL, options);
  };
  
  // 水平布局快捷方法
  const layoutHorizontal = (options: Partial<LayoutOptions> = {}) => {
    layout(LayoutDirection.HORIZONTAL, options);
  };
  
  return {
    layoutService,
    layout,
    layoutVertical,
    layoutHorizontal,
    getCurrentDirection: () => layoutService.getCurrentDirection()
  };
} 