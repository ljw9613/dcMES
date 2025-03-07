const crypto = require('crypto');

// 密钥对生成 http://web.chacuo.net/netrsakeypair

const publicKey = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAL63OGu6h2qVcV0G1LrNoq24OGG+sa5z
8plWsczFa76ohFErp4ANDUOxujiXEABiSBOJNZ5Jx02N19hW13wOx70CAwEAAQ==
-----END PUBLIC KEY-----`

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIBOwIBAAJBAL63OGu6h2qVcV0G1LrNoq24OGG+sa5z8plWsczFa76ohFErp4AN
DUOxujiXEABiSBOJNZ5Jx02N19hW13wOx70CAwEAAQJAFS8FydWIuBqMYoBhPbSc
pr4pKRZE5zNC1axvCGc/XghpX5eCrPaNMkm+SHgrOXaXFKgfY7ZuTVuSLGtJ6DtH
UwIhAPoOuhCReAVjtFYr3CdDhAFNKh0cbIMHK8AH7mitcQ2rAiEAwz955bCghlwP
3mOczJTsvwnHqfb+w1L1vdtLJQaGiDcCIQC5+dX8mJRxPbRUGo7ETPySkzdtK0Sx
NtYdHkj8ZXKdvQIgSV/wem5PVU8Bs6yxv3x0IDMXsvscsODbczcXXVm/cy8CIQCV
LgMgH/pBm+pQWjJ+Om0I7hlkVfoeeID8vg8MoGowjA==
-----END RSA PRIVATE KEY-----`;


function decrypt(key) {
    const priKey = crypto.createPrivateKey(privateKey);
    const decryptedPassword = crypto.privateDecrypt(
        {
            key: priKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(key, 'base64')
    ).toString('utf8');
    console.log(decryptedPassword)
    return decryptedPassword;
}

module.exports = decrypt
