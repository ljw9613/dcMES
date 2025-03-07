const {
	WXPay,
	WXPayConstants
} = require('wx-js-utils')
let {
	minAppID,
	minAppSecret,
	mchid,
	mchkey,
	TIMEOUT,
	CERT_FILE_CONTENT
} = require("../libs/config")

const pay = new WXPay({
	appId: minAppID,
	mchId: mchid,
	key: mchkey,
	certFileContent: CERT_FILE_CONTENT,
	timeout: TIMEOUT,
	signType: WXPayConstants.SIGN_TYPE_MD5,
	useSandbox: false // 不使用沙箱环境
})
var orderquery = {
	getValue:async function(type,data) {

		// 订单文档的status 0 未支付 1 已支付 2 已关闭
		switch (type) {
			// 订单查询
			case 'orderquery':
				{
					const {
						out_trade_no
					} = data
					// 查询订单

					const {
						return_code,
						...restData
					} = await pay.orderQuery({
						out_trade_no
					})

					return {
						code: return_code === 'SUCCESS' ? 0 : 1,
						data: { ...restData
						}
					}
				}
				// 申请退款
			case 'refund':
				{
					const {
						out_trade_no,
						total_fee
					} = data
					// const orders = await orderCollection.where({out_trade_no}).get()

					// console.log(orders)

					// if (!orders.data.length) {
					//   return {
					//     code: 1,
					//     message: '找不到订单'
					//   }
					// }

					// const order = orders.data[0]
					// const {
					//   total_fee,
					// } = order

					const result = await pay.refund({
						out_trade_no,
						total_fee,
						out_refund_no: out_trade_no,
						refund_fee: total_fee
					})

					const {
						return_code
					} = result
					console.log(return_code)
					if (return_code === 'SUCCESS') {
						// try {
						//   await orderCollection.where({out_trade_no}).update({
						//     data: {
						//       trade_state: 'REFUNDING',
						//       trade_state_desc: '正在退款',
						//       status: 3
						//     }
						//   })
						// } catch (e) {
						//   return {
						//     code: 1,
						//     mesasge: e.message
						//   }
						// }
						return {
							res: "SUCCESS"
						}
					} else {
						return {
							code: 1,
							mesasge: '退款失败，请重试'
						}
					}

					return {
						code: 0,
						data: {}
					}
				}

				// 查询退款情况
			case 'queryrefund':
				{
					const {
						out_trade_no
					} = data

					const result = await pay.refundQuery({
						out_trade_no
					})

					console.log('===queryrefund================')
					console.log(result)
					const {
						refund_status_0,
						return_code
					} = result

					if (return_code === 'SUCCESS' && refund_status_0 === 'SUCCESS') {
						try {
							await orderCollection.where({
								out_trade_no
							}).update({
								data: {
									trade_state: 'REFUNDED',
									trade_state_desc: '已退款',
									status: 4
								}
							})

							return {
								code: 0,
								data: {
									trade_state: 'REFUNDED',
									trade_state_desc: '已退款',
									status: 4
								}
							}
						} catch (e) {
							return {
								code: 0
							}
						}
					} else {
						return {
							code: 0
						}
					}

					return {
						code: 0
					}
				}
		}
	}
}
module.exports = orderquery;
