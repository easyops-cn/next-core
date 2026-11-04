import { getAuth } from "../auth.js";

// 页面编码映射，需与 QT 平台「埋点方案」登记一致（确认项 #11）
const PAGE_CONFIG = {
  hashMode: false,
  "/next/portal": { pageName: "itops_portal", pageTitle: "首页" },
  "/next/itsc-ticket-center/ticket-apply": {
    pageName: "ticket_apply",
    pageTitle: "工单创建",
  },
  "/next/events/events-list": {
    pageName: "events_list",
    pageTitle: "事件中心",
  },
  "/next/architecture-observe/system-monitoring/overall-view": {
    pageName: "overall_view",
    pageTitle: "态势感知",
  },
  "/next/architecture-observe/system-monitoring/qt-frontend-monitoring": {
    pageName: "qt_frontend_monitoring",
    pageTitle: "前端监控",
  },
  "/next/next-cmdb-instance-management": {
    pageName: "cmdb_home",
    pageTitle: "IT资源管理",
    // 常用模型访问页为同前缀动态路由（实例列表 /next/:objectId/list、
    // 实例详情 /next/:objectId/instance/:instanceId，见 cmdb-instance-management
    // Pages/List、Pages/InstanceInstanceId 的 route.yaml），细分页面编码需按
    // QT pageConfig 匹配语义联调确定（确认项 #6/#11）
  },
  // 模型配置页实际路由 ${APP.homepage}/object/:objectId（cmdb-model-management
  // Pages/ObjectId/route.yaml:84），objectId 为字符串（如 HOST）而非数字
  "/next/cmdb-model-management": {
    pageName: "model_detail",
    pageTitle: "模型页",
    regRule: /\/cmdb-model-management\/object\/[^/]+/,
  },
};

interface AplusCommand {
  action: string;
  arguments: unknown[];
}

function pushCommand(action: string, ...args: unknown[]): void {
  ((window as any).aplus_queue as AplusCommand[]).push({
    action,
    arguments: args,
  });
}

let userSet = false;

// 登出后 getAuth().username 为 undefined：置空账号，退回设备维度
function pushUserMeta(username: string | undefined): void {
  if (username) {
    pushCommand("aplus.setMetaInfo", "_user_id", username);
    userSet = true;
  } else if (userSet) {
    pushCommand("aplus.setMetaInfo", "_user_id", "");
    userSet = false;
  }
}

function loadSdk(): void {
  // QT SDK 集成代码占位 — appkey 物料到位后，在此动态 createElement("script")
  // 加载金风提供的 aplus 集成地址；到位前保持空实现，禁止空跑部署。
  // SDK 加载后将按序消费 aplus_queue 积压指令并开始上报。
}

export function initialize(): void {
  const w = window as any;
  // aplus 指令队列必须先于 SDK 存在，SDK 加载后按序消费
  w.aplus_queue = w.aplus_queue || [];
  pushCommand("aplus.setMetaInfo", "pageConfig", PAGE_CONFIG);
  loadSdk();
}

export function setUser(): void {
  pushUserMeta(getAuth().username);
}
