const secretOrPrivateKey = "hello  BigManing"; //加密token 校验token时要使用

// 验证密钥是否有效
if (!secretOrPrivateKey || typeof secretOrPrivateKey !== 'string' || secretOrPrivateKey.trim() === '') {
  console.error('警告: JWT密钥无效或未设置，这可能导致token验证失败！');
} else {
  console.log('JWT密钥已配置');
}

module.exports = {
  secretOrPrivateKey
}