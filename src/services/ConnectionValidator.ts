import type { Connection, Node } from '@vue-flow/core';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ValidationCallbacks {
  showValidationMessage?: (message: string, isValid: boolean) => void;
  hideValidationMessage?: () => void;
}

export class ConnectionValidator {
  private timeoutId: number | null = null;

  /**
   * 验证连接是否有效
   * 
   * @param connection 要验证的连接
   * @param nodes 当前节点列表
   * @param callbacks 可选的验证回调函数
   * @returns 验证结果
   */
  public validateConnection(
    connection: Connection,
    nodes: Node[],
    callbacks?: ValidationCallbacks
  ): ValidationResult {
    // 没有源或目标，或者没有句柄标识符，不能验证
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return { isValid: false };
    }
    
    // 查找源节点和目标节点
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      return { isValid: false };
    }

    // 1. 验证连接方向 (输出端口 -> 输入端口)
    const directionValidation = this.validateConnectionDirection(connection);
    if (!directionValidation.isValid) {
      this.handleValidationResult(directionValidation, callbacks);
      return directionValidation;
    }
    
    // 2. 验证端口类型匹配
    const typeValidation = this.validatePortTypes(connection, sourceNode, targetNode);
    if (!typeValidation.isValid) {
      this.handleValidationResult(typeValidation, callbacks);
      return typeValidation;
    }
    
    // 验证通过
    return { isValid: true };
  }

  /**
   * 验证连接方向
   * 只能从输出端口连接到输入端口
   */
  private validateConnectionDirection(connection: Connection): ValidationResult {
    const isSourceOutput = connection.sourceHandle!.includes('__') 
      ? connection.sourceHandle!.startsWith(`${connection.source}__output_`)
      : true; // 默认端口默认为输出
    
    const isTargetInput = connection.targetHandle!.includes('__')
      ? connection.targetHandle!.startsWith(`${connection.target}__input_`)
      : true; // 默认端口默认为输入
    
    if (!isSourceOutput || !isTargetInput) {
      return { 
        isValid: false,
        message: '❌ 连接失败：只能从输出端口连接到输入端口'
      };
    }
    
    return { isValid: true };
  }

  /**
   * 验证端口类型是否匹配
   */
  private validatePortTypes(
    connection: Connection,
    sourceNode: Node,
    targetNode: Node
  ): ValidationResult {
    // 提取端口ID
    const sourceHandleId = connection.sourceHandle!.split('__')[1];
    const targetHandleId = connection.targetHandle!.split('__')[1];
    
    // 如果不是自定义端口，允许连接
    if (!sourceHandleId || !targetHandleId) {
      return { isValid: true };
    }
    
    // 查找源端口和目标端口
    const sourceOutputs = sourceNode.data?.ports?.outputs || [];
    const targetInputs = targetNode.data?.ports?.inputs || [];
    
    const sourcePort = sourceOutputs.find((port: any) => port.id === sourceHandleId);
    const targetPort = targetInputs.find((port: any) => port.id === targetHandleId);
    
    // 如果端口没有类型定义，允许连接
    if (!sourcePort?.type || !targetPort?.type) {
      return { isValid: true };
    }
    
    // 检查端口类型是否匹配
    const isTypeMatch = sourcePort.type === targetPort.type;
    
    if (!isTypeMatch) {
      return { 
        isValid: false,
        message: `❌ 连接失败：${sourcePort.type}型输出 ≠ ${targetPort.type}型输入（需类型相同）`
      };
    }
    
    return { isValid: true };
  }

  /**
   * 处理验证结果，显示或隐藏验证消息
   */
  private handleValidationResult(
    result: ValidationResult,
    callbacks?: ValidationCallbacks
  ): void {
    // 如果设置了回调函数且有错误消息，则显示验证消息
    if (callbacks?.showValidationMessage && !result.isValid && result.message) {
      callbacks.showValidationMessage(result.message, result.isValid);
      
      // 清除之前的定时器
      if (this.timeoutId !== null) {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      // 3秒后自动隐藏错误消息
      this.timeoutId = window.setTimeout(() => {
        if (callbacks.hideValidationMessage) {
          callbacks.hideValidationMessage();
        }
        this.timeoutId = null;
      }, 3000);
    }
  }
  
  /**
   * 清除当前验证状态
   */
  public clearValidation(callbacks?: ValidationCallbacks): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (callbacks?.hideValidationMessage) {
      callbacks.hideValidationMessage();
    }
  }
} 