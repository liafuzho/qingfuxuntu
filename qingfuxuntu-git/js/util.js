var Util = ()=>{
	return Util.prototype.init();
}
Util.prototype = {
	init:function(){
		return this;
	},
	sendQingfuXuntuEvent:function(name,data){
		window.dispatchEvent(new CustomEvent(name,{'detail':data}));
	},
	injectClientJS:async function(eid, etype, eurl, eattr={}){
		const script = document.createElement('script');
		script.setAttribute('id',eid);
		script.setAttribute('type',etype);
		for (let k in eattr){
			script.setAttribute(k,eattr[k]);
		}
		script.src = chrome.extension.getURL(eurl);
		const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
		head.appendChild(script);
		return new Promise((resolve, reject)=>{
			resolve({'state':true,'data':'ok'});
		})
	},
	getAllImage:function(){
		let img_list = [];
		let body_img = this.getBodyImg();
		let iframe_img  = this.getIFrameImg();
		img_list = [...body_img, ...iframe_img];
		img_list = [...new Set(img_list)];
		let pack_imgs = [];
		for(img of img_list){
			pack_imgs.push(img);
		}
		return pack_imgs;
	},
	getBodyImg:function(){
		let img_list = [];
		for (let img of $('img:not(#qingfu_xuntu_ui img,#qingfu_xuntu_select_one_image img)')){
			let a_img = this.getImgSrc(img);
			if (a_img){
				img_list.push(a_img);
				UI().markAImage(img,a_img);
			}
		}
		for (let img of $('*[style*="background"][style*="url"]:not(#qingfu_xuntu_ui *)')){
			let a_img = this.getDivImgSrc(img);
			if (a_img){
				img_list.push(a_img);
				UI().markAImage(img,a_img);
			}
		}
		img_list = [...new Set(img_list)];
		return img_list;
	},
	getIFrameImg:function(){
		let img_list = [];
		for (let iframe of $('body iframe')){
			for (let img of $(iframe).contents().find('img:not(#qingfu_xuntu_ui img,#qingfu_xuntu_select_one_image img)')){
				let a_img = this.getImgSrc(img);
				if (a_img){
					img_list.push(a_img);
					UI().markAImage(img,a_img);
				}
			}
			for (let img of $(iframe).contents().find('*[style*="background"][style*="url"]:not(#qingfu_xuntu_ui *)')){
				let a_img = this.getDivImgSrc(img);
				if (a_img){
					img_list.push(a_img);
					UI().markAImage(img,a_img);
				}
			}
		}
		img_list = [...new Set(img_list)];
		return img_list;
	},
	getImgSrc:function(img){
		if (this.delByHeightAndWidthRatio(img)){
			return false;
		}
		return this.safeGetImgSrc(img);
	},
	getDivImgSrc:function(img){
		if (this.delByHeightAndWidthRatio(img)){
			return false;
		}
		return this.safeGetBackgroundSrc(img);
	},
	delByHeightAndWidthRatio:function(img){
		let max_side = img.naturalWidth;
		let min_side = img.naturalHeight;
		if (img.naturalWidth<img.naturalHeight){
			max_side = img.naturalHeight;
			min_side = img.naturalWidth;
		}
		if (max_side<100){
			return true;
		}
		if (max_side/min_side>=5){
			return true;
		}
		return false;
	},
	distance:function(h1,h2){ 
		let dist = 0;
		h2.split('').forEach((val,i)=>{
			if(val!=h1.charAt(i))dist += 1;
		})
		return dist;
	},
	safeGetBackgroundSrc:function(img){
		let img_src = $(img).css('background-image').replace(/(url\(|\)|'|")/gi,'');
		if (img_src.length==0){
			img_src = $(img).css('background').replace(/(url\(|\)|'|")/gi,'');
		}
		if (img_src.length>0&&this.checkUrlIsValid(img_src)){
			return img_src;
		}
		return false;
	},
	checkUrlIsValid:function(url){
		try {
			return new URL(url);
		} catch(_){
			return false;
		}
	},
	timeoutPromise:function(timeout){
		return new Promise((resolve, reject)=>{
			setTimeout(()=>{
				resolve({'state':false,'data':'timeout'});
			},timeout*1000);
		});
	},
	sendMessagePromise:function(data){
		return new Promise((resolve, reject)=>{
			chrome.extension.sendRequest(data,response=>{
				if(data==undefined||response==undefined||!response.hasOwnProperty('state')||!response.hasOwnProperty('data')){
					return reject(null);
				}
				if(response.state) {
					resolve(response);
				} else {
					reject(response.data);
				}
			});
		});
	},
	safeGetImgSrc:function(img){
		let isrc = $(img).attr('src');
		let isrcset = $(img).attr('srcset');
		let img_src = '';
		if (isrc!=undefined&&isrc.length>0){
			img_src = img.src;
		}else if (isrcset!=undefined&&isrcset.length>0){
			let rsrcset = img.srcset.split(',');
			if (rsrcset.length>0){
				img_src = rsrcset[0];
			}
		}
		if (this.checkUrlIsValid(img_src)){
			return img_src;
		}
		return false;
	},
	getImgDataFromBack:async function(img){
		let data = null;
		await Promise.race([this.timeoutPromise(60),this.sendMessagePromise({'type':'getimg','data':img})])
		.then(response=>{
			data = response.data;
		})
		.catch(error=>{
			console.log('get image data from back error:',error);
		}).finally(()=>{
			this.sendQingfuXuntuEvent('qingfu_xuntu_client_imgs_data',{type:'data',list:{'id':img.id,'url':img.url,'src':img.src,'data':data,'type':img.type,'from':'back','end':true,'ts':img.ts}});
		})
	},
	getScreenshotFromBack:async function(info){
		let data = null;
		await Promise.race([this.timeoutPromise(60),this.sendMessagePromise({'type':'screenshot'})])
		.then(response=>{
			data = response.data;
		})
		.catch(error=>{
			console.log('get screenshot from back error:',error);
		}).finally(()=>{
			this.sendQingfuXuntuEvent('qingfu_xuntu_client_imgs_data',{type:'screenshot',list:{'id':info.id,'url':data,'src':info.src,'data':data,'type':'screenshot','from':'back','end':true,'ts':info.ts,'zone':info.zone}});
		});
	},
	getImgHashFromBack:async function(img){
		const hash = await Promise.race([this.timeoutPromise(60),this.sendMessagePromise({'type':'calimghash','data':img})])
		.then(response=>{
			return response.data;
		})
		.catch(error=>{
			console.log('get img hash from back error:',error);
		})
		return hash;
	},
}
