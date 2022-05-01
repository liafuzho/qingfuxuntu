var WASM, SE, TOOLS, MAIN;
var SW = {};
var Limit_Imgs = 10;

var SearchEngine = document.createElement('script');
function loadScript(src, callback) {
    SearchEngine.src = chrome.extension.getURL(src);
    SearchEngine.addEventListener('load', callback, false);
    document.head.appendChild(SearchEngine);
}

var WasmSafe = ()=>{
	return WasmSafe.prototype.init();
}

WasmSafe.prototype = {
	init:function(){
		return this;
	},
	loadWasm:async function(module, imports){
		if (typeof Response === 'function' && module instanceof Response) {
			if (typeof WebAssembly.instantiateStreaming === 'function') {
				try {
					return await WebAssembly.instantiateStreaming(module, imports);
				} catch (e) {
					if (module.headers.get('Content-Type') != 'application/wasm') {
						console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
					} else {
						throw e;
					}
				}
			}
			const bytes = await module.arrayBuffer();
			return await WebAssembly.instantiate(bytes, imports);
		} else {
			const instance = await WebAssembly.instantiate(module, imports);
			if (instance instanceof WebAssembly.Instance) {
				return { instance, module };
			} else {
				return instance;
			}
		}
	},
	initWasm:async function(input){
		if (typeof input === 'undefined') {
			input = new URL(chrome.extension.getURL('wasm_safe_bg.wasm'));
		}
		let cachegetUint8Memory0 = null;
		const getUint8Memory0 = ()=>{
			if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
				cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
			}
			return cachegetUint8Memory0;
		}
		let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })
		cachedTextDecoder.decode()
		const getStringFromWasm0 = (ptr, len)=>{
			return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
		}
		const imports = {};
		imports.wbg = {};
		imports.wbg.__wbg_alert_a7f8eaa0d1164ae4 = (arg0, arg1)=>{
			alert(getStringFromWasm0(arg0, arg1));
		};
		if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
			input = fetch(input);
		}
		const { instance, module } = await this.loadWasm(await input, imports);
		wasm = instance.exports;
		this.initWasm.__wbindgen_wasm_module = module;
		return wasm;
	},
	spreadWasm:async function(){
		return new Promise((resolve,reject)=>{
			this.initWasm().then(module=>{
				this.WasmSafe = module;
				resolve({'state':true,'data':'ok'});
			})
			.catch(err=>reject({'state':true,'data':err}));
		});
	},
	imgFeature:function(img_buf, ext_info){
		const img_len = img_buf.byteLength;
		const img_ptr = this.WasmSafe.alloc(img_len);
		const img_array = new Uint8Array(this.WasmSafe.memory.buffer, img_ptr, img_len);
		img_array.set(new Uint8Array(img_buf));
		const encoder = new TextEncoder();
		const ext_buf = encoder.encode(ext_info);
		const ext_len = ext_buf.length;
		const ext_ptr = this.WasmSafe.alloc(ext_len);
		const ext_array = new Uint8Array(this.WasmSafe.memory.buffer, ext_ptr, ext_len);
		ext_array.set(new Uint8Array(ext_buf));
		const res_ptr = this.WasmSafe.imageFeature(img_ptr, img_len, ext_ptr, ext_len);
		const u8s = new Uint8Array(new Uint8Array(this.WasmSafe.memory.buffer, res_ptr, 8));
		this.WasmSafe.dealloc(res_ptr, 8);
		let hash = '';
		for (u8 of u8s){
			const bin = (Array(8).join('0')+u8.toString(2)).slice(-8);
			hash += (Array(8).join('0')+u8.toString(2)).slice(-8);
		}
		return hash;
	},
}

var Main = ()=>{
	return Main.prototype.init();
}

Main.prototype = {
	init:function(){
		this.addClickListen();
		return this;
	},
	addClickListen:function(){
		chrome.browserAction.onClicked.addListener(tab=>{
			chrome.tabs.executeScript(null,
			{file:'front.js'})
		})
	},
	searchImg:async function(imgs, tab_id, from){
		SW[tab_id] = new Worker('./js/search.js');
		SW[tab_id].onmessage = (ev)=>{
			if(ev.data.type=='imghash'){
				ev.data.img_info.hash = WASM.imgFeature(ev.data.buf,'hsadfasdfklj');
				chrome.tabs.sendRequest(ev.data.tab_id, {img:ev.data.img_info});
			}else if(ev.data.type=='imgend'){
				this.searchImgStop(ev.data.tab_id);
			}else if(ev.data.type=='imgerror'){
				chrome.tabs.sendRequest(tab_id, {img:-1,from:ev.data.from});
			}
		}
		return SW[tab_id].postMessage({imgs,tab_id,from});
	},
	searchImgStop:function(tab_id){
		chrome.tabs.sendRequest(tab_id, {img:0});
		SW[tab_id].terminate();
		delete SW[tab_id];
	},
	getImgData:async function(request, get_bs64=true, get_blob=false){
		return await TOOLS.getImgData(request,get_bs64,get_blob);
	},
	screenshot:async function(){
		return new Promise((resolve,reject)=>{
			chrome.tabs.captureVisibleTab(null,{format:"jpeg",quality:60},data=>{
				resolve(data);
			});
		});
	},
	openHelpHtml:function(){
		chrome.tabs.create({ url: 'html/help.html' });
	},
	calImgHash:async function(img){
		const [buf, info] = await TOOLS.calImgHashData(img);
		const hash = WASM.imgFeature(buf,'hsadfasdfklj');
		return {hash,info:info};
	},
}

async function compareImg(imgs){
	let idata = {'ts':1621418420,'tk':'6047b2344be241837f768c18f1b30114','img':[]};
	if(Array.isArray(imgs)){
		for(img of imgs){
			idata['img'].push({'id':img['id'],'data':img['imb64_256']});
		}
	}else{
		idata['img'].push({'id':imgs['id'],'data':imgs['imb64_256']});
	}
	let base_url = 'http://106.38.197.12:35020/warrior';
	let rhead = new Headers();
	rhead.append("Content-Type","application/json");
	idata = JSON.stringify(idata);
	let roption = {
		method: 'POST',
		headers: rhead,
		body: idata,
		redirect: 'follow',
		responseType: 'json'
	};
	let response = await TOOLS.fetchTimeout(base_url,roption,30);
	if (!response.ok){
		throw new Error('compare image response was not ok.');
	}
	let result = await response.json();
	if(result.state=='1'){
		let nimgs = [];
		for(res of result.ok){
			let clues = [];
			for(clue of res.result){
				let iurl = 'http://img.zuopintong.com/tmp/'+clue[3];
				let b64 = await TOOLS.getImgData(iurl).then(r=>r.data,err=>'error');
				clues.push([clue[4],b64]);
			}
			nimgs.push({'iid':res.iid,'result':clues});
		}
		result.ok = nimgs;
	}
	return result;
}

chrome.extension.onRequest.addListener((request, sender, sendResponse)=>{
	switch(request.type){
		case 'search':
			chrome.tabs.getSelected(null,(tabs)=>{MAIN.searchImg(request.data,tabs.id,request.from)});
			sendResponse({'state':true,'data':{}});
			return true;
		case 'searchstop':
			chrome.tabs.getSelected(null,(tabs)=>{MAIN.searchImgStop(tabs.id)});
			sendResponse({'state':true,'data':{}});
			return true;
		case 'getimg':
			MAIN.getImgData(request.data.url)
			.then(result=>sendResponse({'state':true,'url':request.data.url,'data':result.data}))
			.catch(error=>sendResponse({'state':false,'url':request.data.url,'data':error.message}));
			return true;
		case 'screenshot':
			MAIN.screenshot()
			.then(result=>sendResponse({'state':true,'data':result}))
			.catch(error=>sendResponse({'state':false,'data':error.message}));
			return true;
		case 'openhelp':
			MAIN.openHelpHtml();
			sendResponse({'state':true,'data':{}});
			return true;
		case 'calimghash':
			MAIN.calImgHash(request.data)
			.then(result=>sendResponse({'state':true,'data':result}))
			.catch(error=>sendResponse({'state':false,'data':error.message}));
			return true;
	}
})

async function init(){
	WASM = WasmSafe();
	await WASM.spreadWasm();
	loadScript('./js/tools.js',()=>{TOOLS = Tools()});
	MAIN = Main();
}
init();