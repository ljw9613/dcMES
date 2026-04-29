const path = require("path");
const { spawnSync } = require("child_process");

const commonEnv = {
  VUE_APP_HIPRINT_WS_ADDRESS: "ws://127.0.0.1:17521",
  VUE_APP_TSC_WS_ADDRESS: "ws://127.0.0.1:8888"
};

const targets = [
  // {
  //   id: "domestic-line",
  //   name: "国内产线正式环境",
  //   publicPath: "/dcMes/",
  //   outputDir: "../dcMes_server/admin",
  //   activityEnabled: false,
  //   env: {
  //     VUE_APP_BASE_API: "http://192.168.6.250/dcMes_server/api/v1",
  //     VUE_APP_UPLOADS: "http://192.168.6.250/dcMes_server/",
  //     VUE_APP_WS_ADDRESS: "ws://172.18.100.10:2223"
  //   }
  // },
  // {
  //   id: "domestic-admin",
  //   name: "国内管理后台正式环境",
  //   publicPath: "/dcMesManage/",
  //   outputDir: "../dcMes_server/adminManage",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "http://192.168.6.250/dcMesAdmin_server/api/v1",
  //     VUE_APP_UPLOADS: "http://192.168.6.250/dcMesAdmin_server/",
  //     VUE_APP_WS_ADDRESS: "ws://172.18.100.10:2223"
  //   }
  // },
  // {
  //   id: "domestic-admin-quality",
  //   name: "国内管理后台品质正式环境",
  //   publicPath: "/dcMesPzManage/",
  //   outputDir: "../dcMes_server/adminPzManage",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "https://192.168.6.250/dcMesAdmin_server/api/v1",
  //     VUE_APP_UPLOADS: "https://192.168.6.250/dcMesAdmin_server/",
  //     VUE_APP_WS_ADDRESS: "ws://172.18.100.10:2223"
  //   }
  // },
  // {
  //   id: "domestic-test",
  //   name: "国内测试环境",
  //   publicPath: "/dcMesCs/",
  //   outputDir: "../dcMes_server/adminCs",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "http://192.168.6.250/dcMesCs_server/api/v1",
  //     VUE_APP_UPLOADS: "http://192.168.6.250/dcMesCs_server/",
  //     VUE_APP_WS_ADDRESS: "ws://192.168.6.250:2211"
  //   }
  // },
  // {
  //   id: "vietnam-prod",
  //   name: "越南正式环境",
  //   publicPath: "/dcMesVN/",
  //   outputDir: "../dcMes_server/adminVN2",
  //   activityEnabled: false,
  //   env: {
  //     VUE_APP_BASE_API: "http://10.0.50.250/dcMesVN_server/api/v1",
  //     VUE_APP_UPLOADS: "http://10.0.50.250/dcMesVN_server/",
  //     VUE_APP_WS_ADDRESS: "ws://10.0.10.252:2223"
  //   }
  // },
  // {
  //   id: "vietnam-admin",
  //   name: "越南管理后台正式环境",
  //   publicPath: "/dcMesManageVN/",
  //   outputDir: "../dcMes_server/adminManageVN2",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "http://10.0.50.250/dcMesAdminVN_server/api/v1",
  //     VUE_APP_UPLOADS: "http://10.0.50.250/dcMesAdminVN_server/",
  //     VUE_APP_WS_ADDRESS: "ws://10.0.10.252:2223"
  //   }
  // },
  // {
  //   id: "vietnam-admin-quality",
  //   name: "越南管理后台品质正式环境",
  //   publicPath: "/dcMesPzManageVN/",
  //   outputDir: "../dcMes_server/adminPzManageVN2",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "https://10.0.50.250/dcMesAdminVN_server/api/v1",
  //     VUE_APP_UPLOADS: "https://10.0.50.250/dcMesAdminVN_server/",
  //     VUE_APP_WS_ADDRESS: "ws://10.0.10.252:2223"
  //   }
  // },
  // {
  //   id: "vietnam-domestic",
  //   name: "越南国内环境",
  //   publicPath: "/dcMesVNCN/",
  //   outputDir: "../dcMes_server/adminVNCN2",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "http://10.0.10.240/dcMesVN_server/api/v1",
  //     VUE_APP_UPLOADS: "http://10.0.10.240/dcMesVN_server/",
  //     VUE_APP_WS_ADDRESS: "ws://10.0.10.252:2223"
  //   }
  // },
  // {
  //   id: "vietnam-test",
  //   name: "越南测试环境",
  //   publicPath: "/dcMesVNCS/",
  //   outputDir: "../dcMes_server/adminVNCS",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "http://10.0.50.250/dcMesCsVN_server/api/v1",
  //     VUE_APP_UPLOADS: "http://10.0.50.250/dcMesCsVN_server/",
  //     VUE_APP_WS_ADDRESS: "ws://10.0.50.250:2211"
  //   }
  // },
  // {
  //   id: "vietnam-domestic-test",
  //   name: "越南国内测试环境",
  //   publicPath: "/dcMesVNCNCS/",
  //   outputDir: "../dcMes_server/adminVNCNCS",
  //   activityEnabled: true,
  //   env: {
  //     VUE_APP_BASE_API: "http://10.0.10.240/dcMesCsVN_server/api/v1",
  //     VUE_APP_UPLOADS: "http://10.0.10.240/dcMesCsVN_server/",
  //     VUE_APP_WS_ADDRESS: "ws://10.0.10.240:2211"
  //   }
  // }
   {
    id: "vietnam-domestic-test",
    name: "越南临时生产环境",
    publicPath: "/dcMesVNAK/",
    outputDir: "../dcMes_server/dcMesVNAK",
    activityEnabled: true,
    env: {
      VUE_APP_BASE_API: "http://192.168.96.235/dcMesVNAK_server/api/v1",
      VUE_APP_UPLOADS: "http://192.168.96.235/dcMesVNAK_server/",
      VUE_APP_WS_ADDRESS: "ws://14.241.190.210:2223"
    }
  }
];

const args = process.argv.slice(2);
const shouldListTargets = args.indexOf("--list") !== -1 || args.indexOf("-l") !== -1;
const requestedTargetIds = args.filter(arg => arg !== "--list" && arg !== "-l");

function printTargets() {
  console.log("可用打包版本：");
  targets.forEach(target => {
    console.log(`- ${target.id}：${target.name}，输出 ${target.outputDir}，活动超时校验${target.activityEnabled ? "启用" : "禁用"}`);
  });
}

if (shouldListTargets) {
  printTargets();
  process.exit(0);
}

const selectedTargets = requestedTargetIds.length
  ? targets.filter(target => requestedTargetIds.indexOf(target.id) !== -1)
  : targets;
const unknownTargetIds = requestedTargetIds.filter(
  targetId => !targets.some(target => target.id === targetId)
);

if (unknownTargetIds.length) {
  console.error(`未知打包版本：${unknownTargetIds.join(", ")}`);
  printTargets();
  process.exit(1);
}

const serviceBinName = process.platform === "win32" ? "vue-cli-service.cmd" : "vue-cli-service";
const vueCliService = path.resolve(__dirname, "..", "node_modules", ".bin", serviceBinName);

selectedTargets.forEach((target, index) => {
  const env = Object.assign({}, process.env, commonEnv, target.env, {
    NODE_ENV: "production",
    BUILD_PUBLIC_PATH: target.publicPath,
    BUILD_OUTPUT_DIR: target.outputDir,
    VUE_APP_ACTIVITY_MONITOR_ENABLED: String(target.activityEnabled)
  });

  console.log("");
  console.log(`========== [${index + 1}/${selectedTargets.length}] ${target.name} ==========`);
  console.log(`版本 ID：${target.id}`);
  console.log(`访问路径：${target.publicPath}`);
  console.log(`输出目录：${target.outputDir}`);
  console.log(`活动超时校验：${target.activityEnabled ? "启用" : "禁用"}`);

  const result = spawnSync(vueCliService, ["build"], {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    console.error(`打包失败：${target.name}`);
    process.exit(result.status || 1);
  }
});

console.log("");
console.log("全部版本打包完成。");
