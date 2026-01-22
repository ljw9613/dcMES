
	var functions_inorder  = [];
    
	//======================================================================================================================
	//@description	清空数据
	function init(){
		functions_inorder=[];
	}
	//======================================================================================================================
	//@description	连接打印机USB
	//@param {String} usbPrinter:	usb路徑(USBPath)，若参数为空字串{"openport_usb" :""}则自动连接找到的第一台打印机
	function openport_usb(usbPrinter){
		 functions_inorder.push({"openport_usb" : usbPrinter});
	}
	//======================================================================================================================
	//@description  连接打印机网络
	//@param {String} ip:	打印机IP地址
	//@param {String} port:	打印机网络端口
	function openport_net(ip, port){
		 functions_inorder.push({"openport_net" : ip + "," + port});
	}
	//======================================================================================================================
	//@description	连接打印机Driver
	//@param {String} driverName:	driver名稱
	function openport_driver(driverName){
		 functions_inorder.push({"openport_driver" : driverName});
	}
	//======================================================================================================================
	//@description  中断打印机连线
	function closeport(){
		 functions_inorder.push({"closeport" : ""});
	}
	//======================================================================================================================
	//@description	清除打印机Buffer
	function clearbuffer(){
		 functions_inorder.push({"clearbuffer" : ""});
	}
	//======================================================================================================================
	//@description	设定标签资讯
	//@param {String} width_mm:		标签宽度(单位mm)
	//@param {String} height_mm:	标签高度(单位mm)
	//@param {String} speed:		打印速度
	//@param {String} density:		打印浓度
	//@param {String} sensor:		標籤種類["0":GAP, "1":BLINE]
	//@param {String} gap_height:	间隙高度(单位mm)
	//@param {String} gap_offset:	间隙偏移(单位mm)
	
	function setup(width_mm, height_mm, speed, density, sensor, gap_height, gap_offset){
		 functions_inorder.push({"setup" : width_mm + "," + height_mm + "," +speed + "," +density + "," +sensor + "," +gap_height + "," +gap_offset});
	}
	//======================================================================================================================
	//@description	打印条码
	//@param {String} x:			条码x轴座标(单位dot)
	//@param {String} y:			条码y轴座标(单位dot)
	//@param {String} type:			条码类型["128", "128M", "EAN128", "25", "25C", "39", "39C", "93", "EAN13", "EAN13+2", "EAN13+5", "EAN8", "EAN8+2", "EAN8+5", "CODA", "POST", "UPCA", "UPCA+2", "UPCA+5", "UPCE", "UPCE+2", "UPCE+5", "CPOST", "MSI", "MSIC", "PLESSEY", "ITF14", "EAN14", "11", "TELEPEN", "TELEPENN", "PLANET", "CODE49", "DPI", "DPL"]
	//@param {String} height:		条码高度
	//@param {String} readable:		条码可读性["0":无, "1":置左, "2":置中, "3":置右]
	//@param {String} rotation:		条码旋转["0":无, "90":90度, "180":180度, "270":270度]
	//@param {String} narrow:		条码窄元件宽度[详见TSPL手册BARCODE条目]
	//@param {String} wide:			条码宽元件宽度[详见TSPL手册BARCODE条目]
	//@param {String} code:			条码内容
	
	function barcode(x, y, type, height, readable, rotation, narrow, wide, code){
		if(code.charAt(0) == '@')
			functions_inorder.push({"barcode" : x + "," + y + ",\"" + type + "\"," + height + "," + readable + "," + rotation + "," + narrow + "," + wide + "," + code });
		else
			functions_inorder.push({"barcode" : x + "," + y + ",\"" + type + "\"," + height + "," + readable + "," + rotation + "," + narrow + "," + wide + ",\"" + code + "\"" });
	}
	
	//======================================================================================================================
	//@description	打印文字
	//@param {String} x:		文字x轴座标(单位dot)
	//@param {String} y:		文字y轴座标(单位dot)
	//@param {String} fonttype:	内建字型名称["0", "1", "2", "3", "4", "5", "6", "7", "8", "ROMAN.TTF"] 或 下载字型名称
	//@param {String} rotation:	文字旋转["0":无, "90":90度, "180":180度, "270":270度]
	//@param {String} xmul:		文字x轴放大率
	//@param {String} ymul:		文字y轴放大率
	//@param {String} text:		打印文字
	
	function printerfont(x, y, fonttype, rotation, xmul, ymul, text){
		if(text.charAt(0) == '@')
			functions_inorder.push({"printerfont" : x + "," + y + ",\"" +fonttype + "\"," + rotation + "," +xmul + "," + ymul + "," + text});
		else
			functions_inorder.push({"printerfont" : x + "," + y + ",\"" +fonttype + "\"," + rotation + "," +xmul + "," + ymul + ",\"" + text + "\"" });
	}
	//======================================================================================================================
	//@description	发送指令到打印机
	//@param {String} cmd:	指令
	function sendcommand(cmd){
		 functions_inorder.push({"sendcommand" : cmd});
	}
	//======================================================================================================================
	//@description	发送指令到打印机,加上换行符号(\r\n)
	//@param {String} cmd:	指令
	function sendcommand_crlf(cmd){
		 functions_inorder.push({"sendcommand_crlf" : cmd});
	}
	//======================================================================================================================
	//@description	打印标签
	//@param {String} sets:		份数
	//@param {String} copies:	张数
	function printlabel(sets, copies){
		 functions_inorder.push({"printlabel" : sets + "," + copies});
	}
	//======================================================================================================================
	//@description	下载PCX
	//@param {String} file_path:	档案路径
	//@param {String} image_name:	保存名称
	function downloadpcx(file_path, image_name){
			functions_inorder.push({"downloadpcx" : file_path + "," + image_name});
	}
	//======================================================================================================================
	//@description	跳过下一张标签
	function formfeed(){
			functions_inorder.push({"formfeed" : ""});
	}
	//======================================================================================================================
	//@description	关闭backfeed功能
	function nobackfeed(){
			functions_inorder.push({"nobackfeed" : ""});
	}
	//======================================================================================================================
	//@description	打印文字
	//@param {String} x:				文字x轴座标(单位dot)
	//@param {String} y:				文字y轴座标(单位dot)
	//@param {String} fontheight:		文字大小
	//@param {String} rotation:			文字旋转["0":无, "90":90度, "180":180度, "270":270度]
	//@param {String} fontstyle:		文字样式["0":无, "1":斜体, "2":粗体, "3":斜体+粗体]
	//@param {String} fontunderline:	文字底线["0":无, "1":底线]
	//@param {String} szFaceName:		字型名称[例:"Arial"]
	//@param {String} text:				打印文字
	function windowsfont(x, y, fontheight, rotation, fontstyle, fontunderline, szFaceName, text) {
		functions_inorder.push({"windowsfont" : x + "," + y + "," +fontheight + "," + rotation + "," + fontstyle + "," +fontunderline + "," + szFaceName + "," + text});
	}
	//======================================================================================================================
	//@description	发送位元组数据到打印机
	//@param {String} cmd:	指令
	function sendUint8Array(uint8_arr){
		 functions_inorder.push({"sendUint8Array" : Base64.fromUint8Array(uint8_arr)});
	}
	
	
	//======================================================================================================================
	//@description	返回打印机状态
	function printerstatus(){
		 functions_inorder.push({"printerstatus" : ""});
	}
	//======================================================================================================================
	//@description	返回打印机名称
	function printername(){
		 functions_inorder.push({"printername" : ""});
	}
	//======================================================================================================================
	//@description	返回打印机序号
	function printerserial(){
		 functions_inorder.push({"printerserial" : ""});
	}
