#!/usr/bin/env node

/**
 * 使用 Node.js 创建 MongoDB 数据库与用户（无需 mongosh）
 *
 * 用法：
 *   node create_mongodb_user.js --admin-uri "mongodb://admin:密码@127.0.0.1:27017/admin" --db 新库名 --user 新用户名 --pwd 新用户密码
 *
 * 或环境变量：
 *   ADMIN_URI、NEW_DB、NEW_USER、NEW_PWD
 *
 * 示例：
 *   node create_mongodb_user.js --admin-uri "mongodb://admin:seVDewlqwExP@127.0.0.1:27017/admin" --db mydb --user myuser --pwd mypass
 */

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--admin-uri' && argv[i + 1]) {
      args.adminUri = argv[++i];
    } else if (argv[i] === '--db' && argv[i + 1]) {
      args.db = argv[++i];
    } else if (argv[i] === '--user' && argv[i + 1]) {
      args.user = argv[++i];
    } else if (argv[i] === '--pwd' && argv[i + 1]) {
      args.pwd = argv[++i];
    } else if (argv[i] === '--role' && argv[i + 1]) {
      args.role = argv[++i];
    }
  }
  return args;
}

function encodeUriPassword(uri) {
  try {
    const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^/]+)(\/.*)?$/);
    if (!match) return uri;
    const prefix = match[1];
    const authAndHost = match[2];
    const rest = match[3] || '';
    const at = authAndHost.lastIndexOf('@');
    if (at === -1) return uri;
    const userPass = authAndHost.slice(0, at);
    const host = authAndHost.slice(at + 1);
    const colon = userPass.indexOf(':');
    if (colon === -1) return uri;
    const user = userPass.slice(0, colon);
    const pass = userPass.slice(colon + 1);
    const encoded = encodeURIComponent(pass);
    return `${prefix}${user}:${encoded}@${host}${rest}`;
  } catch {
    return uri;
  }
}

async function main() {
  const args = parseArgs();
  const adminUri = args.adminUri || process.env.ADMIN_URI;
  const db = args.db || process.env.NEW_DB;
  const user = args.user || process.env.NEW_USER;
  const pwd = args.pwd || process.env.NEW_PWD;
  const role = args.role || process.env.NEW_ROLE || 'readWrite';

  if (!adminUri || !db || !user || !pwd) {
    console.error(`
用法:
  node create_mongodb_user.js --admin-uri "mongodb://admin:密码@127.0.0.1:27017/admin" --db 新库名 --user 新用户名 --pwd 新用户密码

可选: --role readWrite（默认）| read | dbOwner

或设置环境变量: ADMIN_URI, NEW_DB, NEW_USER, NEW_PWD

示例:
  node create_mongodb_user.js --admin-uri "mongodb://admin:seVDewlqwExP@127.0.0.1:27017/admin" --db mydb --user myuser --pwd mypass
`);
    process.exit(1);
  }

  const uri = encodeUriPassword(adminUri);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });

    const client = mongoose.connection.getClient();
    const targetDb = client.db(db);

    await targetDb.command({
      createUser: user,
      pwd,
      roles: [{ role, db }],
    });

    console.log(`✅ 数据库 "${db}" 已就绪，用户 "${user}" 创建成功。`);
    console.log(`   连接串: mongodb://${user}:<密码>@127.0.0.1:27017/${db}`);
  } catch (e) {
    if (e.codeName === 'DuplicateKey' || (e.message && e.message.includes('already exists'))) {
      console.error(`用户 "${user}" 已存在于数据库 "${db}"。可先删除再创建，或改用其他用户名。`);
    } else {
      console.error('创建失败:', e.message || e);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
