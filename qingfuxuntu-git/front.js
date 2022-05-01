var front = null;
var default_config = {similar_search_engine:{'vcg':true,'hello':true,'veer':true,'unsplash':true,'getty':false,'huitu':true,'shutter':false,'dreams':false,'pond5':false,'adobe':false,'istock':false,'rf123':false,'mauritius':false,'alamy':false}};

var Front = (UI, Util, WASM)=>{
	return Front.prototype.init(UI, Util, WASM);
}
Front.prototype = {
	init:function(UI, Util, WASM){
		this.initConfig();
		this.config = {};
		this.UI = UI;
		this.Util = Util;
		this.UI.createQingfuXuntuUI();
		this.UI.switchSelect();
		return this;
	},
	initConfig:function(reset=false){
		if(reset){
			this.config = default_config;
			chrome.storage.local.set({'COPYRIGHT_RADAR_CONFIG':default_config});
			return;
		}
		chrome.storage.local.get('COPYRIGHT_RADAR_CONFIG', v=>{
			if(v.COPYRIGHT_RADAR_CONFIG){
				this.config = v.COPYRIGHT_RADAR_CONFIG;
			}else{
				this.config = default_config;
				chrome.storage.local.set({'COPYRIGHT_RADAR_CONFIG':default_config});
			}
		})
	},
	getImgData:function(){
		window.addEventListener('qingfu_xuntu_front_imgs_data', ev=>{
			if(ev.detail.state){
				if(ev.detail.from=='client'){
					const pure_img = {'state':ev.detail['state'],'id':ev.detail['id'],'url':ev.detail['url'],'src':ev.detail['src'],'imb64_256':ev.detail['imb64_256'],'ts':ev.detail.ts};
					this.UI.addImgToPanel(pure_img);
					const to_hash = {data:ev.detail['imb64_256'],from_url:'',height:0,width:0,source:'sample',ts:ev.detail.ts,url:''};
					this.UI.processSearchImg(to_hash);
					this.UI.relieveSearchRunShow();
				}
			}else{
				if(ev.detail.from=='client'){
					if(ev.detail.end==undefined){
						this.Util.getImgDataFromBack(ev.detail);
						return;
					}
				}
				const pure_img = {'state':ev.detail['state'],'id':ev.detail['id'],'url':ev.detail['url'],'src':ev.detail['src'],'ts':ev.detail.ts};
				this.UI.addImgErrorToPanel(pure_img);
			}
		})
	},
	getImgHash:function(){
		chrome.extension.onRequest.addListener((request, sender, sendResponse)=>{
			if (request.img===0){
				return this.UI.addSimilarImgEnd();
			}else if(request.img===-1){
				return this.UI.addSearchErrorNotice(request.from);
			}
			this.UI.processSearchImg(request.img);
			this.UI.relieveSearchRunShow();
		});
	},
	qingfuXuntuListener:function(){
		this.getImgData();
		this.getImgHash();
	}
}

async function init(){
	const self_id = '#qingfu_xuntu_ui';
	if ($(self_id).length>0){
		if ($(self_id).css('visibility')=='hidden'){
			front = $(self_id).data('front');
			front.UI.showQingfuXuntuUI();
		}
	}else{
		const util = Util();
		await util.injectClientJS('qingfuxuntu_d63a030a','text/javascript','qingfu_xuntu_client_d63a030a.js');
		const ui = UI();
		front = Front(ui, util);
		front.qingfuXuntuListener();
		$(self_id).data('front',front);
	}
}

init();