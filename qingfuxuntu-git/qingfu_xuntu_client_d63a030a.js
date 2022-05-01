var QingfuXuntuClient_d63a030a = ()=>{
	return QingfuXuntuClient_d63a030a.prototype.init();
}
QingfuXuntuClient_d63a030a.prototype = {
	init:function(){
		this.Run_Worker = false;
		this.Img_Temp = [];
		this.SAMPLE_SIZE = 32;
		this.Img_Type = ['image/jpeg','image/jpg','image/png','image/webp','image/bmp'];
		return this;
	},
	getImgData:async function(img,type){
		let src = img.url;
		if(img.data!=''){
			src = img.data;
		}
		let ts = img.ts;
		if(type=='screenshot'){
			src = await this.getScreenshot(src,img.zone);
		}
		let img_data = null;
		if(type=='simple'){
			img_data = await this.calImgSimpleData(src);
		}else{
			img_data = await this.calImgData(src);
		}
		img_data = Object.assign({},img,img_data);
		img_data['from'] = 'client';
		img_data['ts'] = ts;
		img_data['src'] = img.src;
		window.dispatchEvent(new CustomEvent('qingfu_xuntu_front_imgs_data',{'detail':img_data}));
	},
	runWorker:async function(imgs){
		for(img of imgs){
			this.getImgData(img.list,img.type);
		}
		this.Run_Worker = false;
		if(this.Img_Temp.length>0){
			window.dispatchEvent(new CustomEvent('qingfu_xuntu_front_imgs_data',{detail:{type:'data',list:[]}}));
		}
	},
	calcWidthAndHeight:function(width,height,size){
		let scale_rate = 1;
		if(width>=height&&width>size){
			scale_rate = size/width;
		}
		if(height>width&&height>size){
			scale_rate = size/height;
		}
		width *= scale_rate;
		height *= scale_rate;
		return [parseInt(width),parseInt(height)];
	},
	colorToGrey:function(img_data){
		sig_channel = [];
		for(let j=0;j<img_data.height;j++){
			for(let i=0;i<img_data.width;i++){
				let index = (i*4)*img_data.width+(j*4);
				let red = img_data.data[index];
				let green = img_data.data[index+1];
				let blue = img_data.data[index+2];
				let alpha = img_data.data[index+3];
				let L = red*299/1000+green*587/1000+blue*114/1000;
				img_data.data[index] = L;
				img_data.data[index+1] = L;
				img_data.data[index+2] = L;
				img_data.data[index+3] = alpha;
			}
		}
		return img_data;
	},
	asyncReadData:function(data,type='base64'){
		return new Promise((resolve,reject)=>{
			let reader = new FileReader();
			reader.onload = ev=>{
				resolve(ev.target.result);
			}
			reader.onerror = ()=>{
				reject('read data error'+reader.error);
			}
			if(type=='base64'){
				reader.readAsDataURL(data);
			}else if(type=='buffer'){
				reader.readAsArrayBuffer(data);
			}
		})
	},
	fetchTimeout:async function(url, option={}, timeout=10*1000){
		if(!this.checkUrlIsValid(url))return false;
		const controller = new AbortController();
		setTimeout(()=>controller.abort(),timeout);
		option['signal'] = controller.signal;
		const imblob = await fetch(url,option).then(r=>r.blob()).catch(err=>err);
		return imblob;
	},
	getScreenshot:async function(img, zone){
		const is_url = this.checkUrlIsValid(img);
		let imblob = null;
		if(is_url.protocol==='data:'){
			imblob = this.base64JPGToBlob(img);
		}else{
			imblob = await this.fetchTimeout(img);
		}
		if(!(imblob instanceof Blob))return {'state':false};
		let im = await createImageBitmap(imblob).then(r=>r).catch(err=>false);
		if(!im)return {'state':false,'url':img};
		let canvas256 = new OffscreenCanvas(zone.width,zone.height);
		let ctx256 = canvas256.getContext('2d');
		ctx256.imageSmoothingEnabled = true;
		ctx256.imageSmoothingQuality = 'high';
		const scale_rate = window.devicePixelRatio;
		ctx256.drawImage(im,zone.start_x*scale_rate,zone.start_y*scale_rate,zone.width*scale_rate,zone.height*scale_rate,0,0,zone.width,zone.height);
		let imblob256 = await canvas256.convertToBlob({type:'image/jpeg',quality:60});
		let imb64_256 = await this.asyncReadData(imblob256);
		return imb64_256;
	},
	calImgData:async function(img,quality=60){
		const is_url = this.checkUrlIsValid(img);
		let imblob = null;
		if(is_url.protocol==='data:'){
			imblob = this.base64JPGToBlob(img);
		}else{
			imblob = await this.fetchTimeout(img);
		}
		if(!(imblob instanceof Blob))return {'state':false};
		if (!this.Img_Type.includes(imblob.type))return {'state':false};
		let im = await createImageBitmap(imblob).then(r=>r).catch(err=>false);
		if(!im)return {'state':false,'url':img};
		let s256= this.calcWidthAndHeight(im.width,im.height,256);
		let canvas256 = new OffscreenCanvas(s256[0],s256[1]);
		let ctx256 = canvas256.getContext('2d');
		ctx256.imageSmoothingEnabled = true;
		ctx256.imageSmoothingQuality = 'high';
		ctx256.drawImage(im,0,0,canvas256.width,canvas256.height);
		let imblob256 = await canvas256.convertToBlob({type:'image/jpeg',quality:quality});
		let imb64_256 = await this.asyncReadData(imblob256);
		let canvas128 = new OffscreenCanvas(128,128);
		let ctx128 = canvas128.getContext('2d');
		ctx128.drawImage(im,0,0,canvas128.width,canvas128.height);
		let img_data_128 = ctx128.getImageData(0,0,canvas128.width,canvas128.height);
		img_data_128 = this.colorToGrey(img_data_128);
		ctx128.putImageData(img_data_128,0,0);
		let imblob128 = await canvas128.convertToBlob({type:'image/jpeg',quality:quality});
		return {'state':true,'blob256':imblob256,'blob128':imblob128,'imb64_256':imb64_256,'s256':s256};
	},
	calImgSimpleData:async function(img){
		imblob = this.base64JPGToBlob(img);
		if(!(imblob instanceof Blob))return {'state':false};
		let im = await createImageBitmap(imblob).then(r=>r).catch(err=>false);
		if(!im)return {'state':false,'url':img};
		let canvas256 = new OffscreenCanvas(im.width,im.height);
		let ctx256 = canvas256.getContext('2d');
		ctx256.imageSmoothingEnabled = true;
		ctx256.imageSmoothingQuality = 'high';
		ctx256.drawImage(im,0,0,canvas256.width,canvas256.height);
		let imblob256 = await canvas256.convertToBlob({type:'image/jpeg',quality:100});
		let canvas128 = new OffscreenCanvas(128,128);
		let ctx128 = canvas128.getContext('2d');
		ctx128.drawImage(im,0,0,canvas128.width,canvas128.height);
		let img_data_128 = ctx128.getImageData(0,0,canvas128.width,canvas128.height);
		img_data_128 = this.colorToGrey(img_data_128);
		ctx128.putImageData(img_data_128,0,0);
		let imblob128 = await canvas128.convertToBlob({type:'image/jpeg',quality:100});
		return {'state':true,'blob256':imblob256,'blob128':imblob128,'imb64_256':img,'s256':[im.width,im.height]};
	},
	base64JPGToBlob:function(img){
		const byte_char = atob(img.split(',')[1]);
		const byte_numb = new Array(byte_char.length);
		for (let i = 0; i < byte_char.length; i++) {
			byte_numb[i] = byte_char.charCodeAt(i);
		}
		const byte_array = new Uint8Array(byte_numb);
		return new Blob([byte_array], {type: 'image/jpeg'});
	},
	addQingfuXuntuEvent:function(){
		window.addEventListener('qingfu_xuntu_client_imgs_data', ev=>{
			this.Img_Temp = [...this.Img_Temp, ev.detail];
			this.Img_Temp = [...new Set(this.Img_Temp)];
			if(this.Run_Worker){
				return;
			}
			const r_imgs = this.Img_Temp;
			this.Img_Temp = [];
			this.Run_Worker = true;
			this.runWorker(r_imgs);
		})
	},
	checkUrlIsValid:function(url){
		try {
			return new URL(url);
		} catch(_){
			return false;
		}
	},
}

async function allok_d63a030a(){
	QingfuXuntuClient_d63a030a().addQingfuXuntuEvent();
}

allok_d63a030a();