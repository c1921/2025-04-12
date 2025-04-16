# 添加自定义节点类型流程

## 概述

本文档描述了如何在系统中添加新的节点类型。采用插件式设计后，添加新节点类型变得简单高效，只需要在几个特定位置进行修改，而不需要修改多个组件。

## 添加新节点类型的步骤

### 1. 定义节点数据接口

在`src/types/node.ts`中，为新节点类型定义特定的数据接口：

```typescript
// 新节点数据接口示例
export interface NewNodeData extends BaseNodeData {  // 或 extends PortedNodeData
  // 添加特定于该节点类型的属性
  specialProperty?: string;
  additionalConfig?: number;
}
```

### 2. 创建节点创建器类

在`src/plugins/registerNodes.ts`文件中，创建一个实现`NodeCreator`接口的新类：

```typescript
// 自定义节点创建器
class NewNodeCreator implements NodeCreator<NewNodeData> {
  // 指定节点类型
  getNodeType(): NodeTypeValue {
    return NodeType.CUSTOM;  // 或其他基本类型
  }

  // 创建节点
  create(label: string, position: { x: number; y: number }, data?: Partial<NewNodeData>, id?: string): Node {
    // 合并默认属性和传入数据
    const nodeData: Partial<NewNodeData> = {
      ...this.getDefaultProperties(),
      ...data
    };

    // 基于需求调用合适的工厂方法
    return NodeFactory.createMultiPortNode(
      this.getNodeType(),
      label,
      position,
      2,  // 输入端口数量
      1,  // 输出端口数量
      nodeData,
      id
    );
  }

  // 设置默认属性
  getDefaultProperties(): Partial<NewNodeData> {
    return {
      specialProperty: "default",
      additionalConfig: 100,
      duration: 2000
    };
  }

  // 设置显示名称
  getDisplayName(): string {
    return '新自定义节点';
  }

  // 设置CSS类名
  getDisplayClass(): string {
    return 'new-node';
  }

  // 设置输入端口数量
  getDefaultInputs(): number {
    return 2;
  }

  // 设置输出端口数量
  getDefaultOutputs(): number {
    return 1;
  }

  // 是否使用类型端口
  shouldUseTypedPorts(): boolean {
    return false;
  }
}
```

### 3. 注册节点创建器

在同一文件(`src/plugins/registerNodes.ts`)内的`registerCustomNodes`函数中注册新节点创建器：

```typescript
// 注册额外节点类型函数
export function registerCustomNodes() {
  // 注册已有自定义节点
  NodeFactory.registerExtraNodeType('timer', new TimerNodeCreator());
  NodeFactory.registerExtraNodeType('database', new DatabaseNodeCreator());
  
  // 注册新节点类型
  NodeFactory.registerExtraNodeType('new-node', new NewNodeCreator());
  
  console.log('自定义节点类型已注册');
}
```

### 4. 添加节点样式

在`src/assets/styles/custom-nodes.css`文件中，为新节点添加CSS样式：

```css
/* 新节点样式 */
.vue-flow__node-new-node .unified-node,
.new-node {
  background-color: #f0f5ff;
  border-color: #597ef7;
  position: relative;
}

.vue-flow__node-new-node .node-header,
.new-node .node-header {
  background-color: #597ef7;
  color: white;
}

.vue-flow__node-new-node .node-icon,
.new-node .node-icon {
  color: #597ef7;
}
```

### 5. (可选) 添加特定图标或行为

如果需要为新节点类型添加特定图标或行为，可以在`UnifiedNode.vue`组件中进行扩展：

1. 修改图标渲染逻辑
2. 添加节点类型特定的事件处理
3. 添加特定的UI元素或交互

## 工作原理

添加新节点后，系统会：

1. 在应用启动时执行注册步骤(`main.ts`中注册的`registerNodesPlugin`)
2. `NodeFactory.getRegisteredNodeTypes()`方法将返回包含新节点的类型列表
3. `NodeSidebar.vue`会自动从工厂获取所有注册的节点类型并在侧边栏显示
4. `NodeFlow.vue`通过动态组件映射将所有注册的节点类型关联到统一的渲染组件
5. 拖放时使用`createNodeByType`创建节点实例

## 测试新节点

添加完成后，可以通过以下方式测试新节点：

1. 重新启动应用，新节点类型应出现在侧边栏
2. 拖放节点到画布上，检查是否正确创建
3. 检查节点的UI样式是否符合预期
4. 测试节点的特定功能和与其他节点的连接

## 注意事项

- 确保节点类型名称在系统中唯一
- 类型接口应明确定义，以确保类型安全
- 为复杂节点类型使用`shouldUseTypedPorts`启用类型化端口
- 注意正确处理节点方向(`isHorizontal`属性)以支持水平和垂直布局

## 示例：添加API请求节点

下面是一个具体示例，展示如何添加一个用于发送API请求的节点：

### 1. 定义数据接口

```typescript
// 在 src/types/node.ts 中
export interface ApiRequestNodeData extends BaseNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
}
```

### 2. 创建节点创建器

```typescript
// 在 src/plugins/registerNodes.ts 中
class ApiRequestNodeCreator implements NodeCreator<ApiRequestNodeData> {
  getNodeType(): NodeTypeValue {
    return NodeType.CUSTOM;
  }

  create(label: string, position: { x: number; y: number }, data?: Partial<ApiRequestNodeData>, id?: string): Node {
    const nodeData: Partial<ApiRequestNodeData> = {
      ...this.getDefaultProperties(),
      ...data
    };

    return NodeFactory.createMultiPortNode(
      this.getNodeType(),
      label,
      position,
      1,  // 一个输入
      2,  // 两个输出（成功和失败）
      nodeData,
      id
    );
  }

  getDefaultProperties(): Partial<ApiRequestNodeData> {
    return {
      url: 'https://api.example.com',
      method: 'GET',
      timeout: 5000,
      duration: 2500
    };
  }

  getDisplayName(): string {
    return 'API请求节点';
  }

  getDisplayClass(): string {
    return 'api-node';
  }
}
```

### 3. 注册节点

```typescript
// 在 src/plugins/registerNodes.ts 中的 registerCustomNodes 函数中
NodeFactory.registerExtraNodeType('api-request', new ApiRequestNodeCreator());
```

### 4. 添加样式

```css
/* 在 src/assets/styles/custom-nodes.css 中 */
.vue-flow__node-api-request .unified-node,
.api-node {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.vue-flow__node-api-request .node-header,
.api-node .node-header {
  background-color: #1890ff;
  color: white;
}
```

通过遵循这些步骤，可以轻松地向系统添加新的节点类型，同时保持代码的一致性和可维护性。
