# 节点工厂架构与插件式设计

## 概述

本文档介绍了系统中节点工厂的架构设计和插件式实现方式。这种设计解决了以下问题：

- 减少了添加新节点类型时需要修改的代码量
- 提供了统一的节点创建和管理接口
- 增强了类型安全性和代码可维护性
- 支持动态扩展系统功能

## 架构设计

### 核心组件

系统采用了以下核心组件来实现插件式设计：

1. **NodeCreator 接口**：定义了节点创建器的标准接口
2. **NodeFactory 类**：中央节点工厂，管理节点创建器和节点类型注册
3. **自定义节点创建器**：实现 NodeCreator 接口的具体类
4. **动态组件映射**：将注册的节点类型映射到对应的渲染组件

### 类图

```1
┌─────────────────┐      ┌────────────────────┐
│    NodeFactory  │      │ <<interface>>      │
│                 │◄────▶│   NodeCreator<T>  │
└─────────────────┘      └────────────────────┘
         ▲                         ▲
         │                         │
         │                         │
         │                         │
┌─────────────────┐      ┌────────────────────┐
│  注册机制        │      │ 具体节点创建器实现  │
│ registerNode... │◄────▶│ XxxNodeCreator    │
└─────────────────┘      └────────────────────┘
```

## NodeCreator 接口

`NodeCreator` 接口是插件式设计的核心，它定义了节点创建器必须实现的方法：

```typescript
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
```

- **必须实现的方法**：
  - `create()`: 创建节点实例
  - `getNodeType()`: 获取节点类型标识

- **可选实现的方法**：
  - `getDefaultProperties()`: 获取默认属性
  - `getDisplayName()`: 获取显示名称
  - `getDisplayClass()`: 获取CSS类名
  - `getDefaultInputs()`: 获取默认输入端口数量
  - `getDefaultOutputs()`: 获取默认输出端口数量
  - `shouldUseTypedPorts()`: 是否使用类型端口

## NodeFactory 类

`NodeFactory` 是中央节点工厂，负责管理节点创建器和节点类型注册：

```typescript
export class NodeFactory {
  // 存储已注册的节点创建器
  private static nodeCreators: Map<NodeTypeValue, NodeCreator> = new Map();
  // 存储额外的节点类型
  private static extraNodeTypes: Map<string, NodeCreator> = new Map();

  // 注册节点创建器
  static registerNodeCreator(creator: NodeCreator): void { ... }

  // 注册额外节点类型
  static registerExtraNodeType(type: string, creator: NodeCreator): void { ... }

  // 获取所有注册的节点类型信息
  static getRegisteredNodeTypes(): Array<...> { ... }

  // 创建节点方法，根据类型调用相应的创建器
  static createNodeByType(...): Node { ... }

  // 其他方法...
}
```

## 注册机制

系统提供了两种注册节点创建器的方式：

1. **基本节点类型注册**：`registerNodeCreator` 方法用于注册系统基本节点类型

   ```typescript
   NodeFactory.registerNodeCreator(new InputNodeCreator());
   ```

2. **额外节点类型注册**：`registerExtraNodeType` 方法用于注册自定义节点类型

   ```typescript
   NodeFactory.registerExtraNodeType('custom-node-type', new CustomNodeCreator());
   ```

## 节点类型注册流程

完整的节点类型注册流程如下：

1. 在 `src/factories/NodeFactory.ts` 中定义节点创建器类
2. 在 `src/plugins/registerNodes.ts` 中实现自定义节点创建器
3. 通过 Vue 插件机制注册自定义节点类型
4. 在 `main.ts` 中使用节点注册插件
5. 系统启动时自动注册所有节点类型

## 动态组件映射

在 `NodeFlow.vue` 组件中，通过动态组件映射实现了节点类型与渲染组件的关联：

```vue
<template v-for="nodeType in Object.values(registeredNodeTypes)" 
          :key="nodeType" 
          #[`node-${nodeType}`]="nodeProps">
  <UnifiedNode v-bind="nodeProps" />
</template>
```

这种方式避免了为每种节点类型手动编写模板代码，提高了系统的可维护性。

## 类型安全

整个系统中使用了 TypeScript 的泛型和类型检查，确保：

1. 节点创建器与节点数据类型的匹配
2. 节点类型与创建器的正确关联
3. 节点属性和方法的类型安全

例如，`NodeCreator<T extends BaseNodeData>` 接口确保只有正确类型的数据能够传递给节点创建器。

## 优势与收益

这种插件式设计带来的好处包括：

1. **减少重复代码**：新节点类型只需实现创建器并注册一次
2. **单一责任原则**：每个创建器只负责一种节点类型
3. **开闭原则**：扩展新节点类型无需修改现有代码
4. **统一接口**：所有节点类型通过相同的接口创建和管理
5. **自动化集成**：节点类型自动出现在侧边栏和渲染系统中
6. **类型安全**：强类型系统确保数据一致性和正确性

## 实践建议

1. 为每种节点类型创建专用的数据接口，明确定义其属性和行为
2. 充分利用接口的可选方法来定制节点的外观和行为
3. 在创建器中为节点提供合理的默认属性值
4. 使用描述性的类型名称和显示名称
5. 将相关的节点类型组织在同一个插件文件中
6. 为复杂节点类型创建专用的样式和交互逻辑

## 结论

节点工厂的插件式设计大大提高了系统的可扩展性和可维护性。通过统一的接口和注册机制，可以轻松地向系统添加新的节点类型，而无需修改核心代码。这种设计模式是实现灵活、可扩展系统的有效方式。
