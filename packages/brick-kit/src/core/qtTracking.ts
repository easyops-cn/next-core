// 页面编码映射默认值，需与 QT 平台「埋点方案」登记一致（确认项 #11）；
// 可由 bootstrap settings 的 misc.qtTracking.pageConfig 整体覆盖
const DEFAULT_PAGE_CONFIG = {
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

export interface QtTrackingOptions {
  // QT SDK 集成地址（QT 平台生成的「SDK 集成代码」中的 script src，
  // 如官方 CDN 地址 https://g.alicdn.com/QTSDK/...，不含 appkey）
  sdkSrc?: string;
  // QT 应用 appkey：集成代码为裸 src 时需另配，经 aplus.setMetaInfo 注入；
  // 若 SDK src 的 query 已带 appkey 则可省略
  appKey?: string;
  // 日志上报域名：私有云/专有云部署必配（如金风环境
  // https://quickaplus-he-api-cn-shanghai.aliyuncs.com）；
  // 公有云默认收数域名可省略
  trackDomain?: string;
  // 页面编码映射，传入则整体替换内置默认
  pageConfig?: Record<string, unknown>;
}

function pushCommand(action: string, ...args: unknown[]): void {
  ((window as any).aplus_queue as AplusCommand[]).push({
    action,
    arguments: args,
  });
}

let userSet = false;

// 登出后 username 为 undefined：置空账号，退回设备维度
function pushUserMeta(username: string | undefined): void {
  if (username) {
    pushCommand("aplus.setMetaInfo", "_user_id", username);
    userSet = true;
  } else if (userSet) {
    pushCommand("aplus.setMetaInfo", "_user_id", "");
    userSet = false;
  }
}

function loadSdk(sdkSrc: string | undefined): void {
  // SDK 集成地址未配置时不加载，避免未绑定 appkey 的空跑；
  // SDK 加载后将按序消费 aplus_queue 积压指令并开始上报
  if (!sdkSrc) {
    return;
  }
  const script = document.createElement("script");
  script.src = sdkSrc;
  document.head.appendChild(script);
}

export function initialize(options: QtTrackingOptions = {}): void {
  const w = window as any;
  // aplus 指令队列必须先于 SDK 存在，SDK 加载后按序消费
  w.aplus_queue = w.aplus_queue || [];
  if (options.appKey) {
    pushCommand("aplus.setMetaInfo", "appKey", options.appKey);
  }
  if (options.trackDomain) {
    pushCommand("aplus.setMetaInfo", "trackDomain", options.trackDomain);
  }
  pushCommand(
    "aplus.setMetaInfo",
    "pageConfig",
    options.pageConfig ?? DEFAULT_PAGE_CONFIG
  );
  loadSdk(options.sdkSrc);
}

export function setUser(username: string | undefined): void {
  pushUserMeta(username);
}
