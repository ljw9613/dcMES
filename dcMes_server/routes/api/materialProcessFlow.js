const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const MaterialProcessFlowService = require("../../services/materialProcessFlowService");

/**
 * @route POST /api/material-process-flow/restore-deleted-node
 * @desc 恢复被删除的节点
 * @access Private
 */
router.post("/restore-deleted-node", auth, async (req, res) => {
  try {
    const { flowRecordId, nodeId } = req.body;
    
    if (!flowRecordId || !nodeId) {
      return res.status(400).json({ message: "流程ID和节点ID不能为空" });
    }
    
    const result = await MaterialProcessFlowService.restoreDeletedNode(
      flowRecordId,
      nodeId,
      req.user.id
    );
    
    res.json({
      code: 200,
      message: "节点恢复成功",
      data: result
    });
  } catch (error) {
    console.error("恢复被删除节点失败:", error);
    res.status(500).json({
      code: 500,
      message: `恢复被删除节点失败: ${error.message}`
    });
  }
});

/**
 * @route GET /api/material-process-flow/deleted-node-history/:flowRecordId
 * @desc 获取流程的删除节点历史
 * @access Private
 */
router.get("/deleted-node-history/:flowRecordId", auth, async (req, res) => {
  try {
    const { flowRecordId } = req.params;
    
    if (!flowRecordId) {
      return res.status(400).json({ message: "流程ID不能为空" });
    }
    
    const result = await MaterialProcessFlowService.getDeletedNodeHistory(flowRecordId);
    
    res.json({
      code: 200,
      data: result
    });
  } catch (error) {
    console.error("获取删除节点历史失败:", error);
    res.status(500).json({
      code: 500,
      message: `获取删除节点历史失败: ${error.message}`
    });
  }
});

/**
 * @route POST /api/material-process-flow/sync-sub-flow
 * @desc 同步子流程到主流程
 * @access Private
 */
router.post("/sync-sub-flow", auth, async (req, res) => {
  try {
    const { mainBarcode, subBarcode } = req.body;
    
    if (!mainBarcode || !subBarcode) {
      return res.status(400).json({ message: "主流程条码和子流程条码不能为空" });
    }
    
    const result = await MaterialProcessFlowService.syncSubFlowToMainFlow(
      mainBarcode,
      subBarcode
    );
    
    res.json({
      code: 200,
      message: "子流程同步成功",
      data: result
    });
  } catch (error) {
    console.error("同步子流程失败:", error);
    res.status(500).json({
      code: 500,
      message: `同步子流程失败: ${error.message}`
    });
  }
});

module.exports = router; 