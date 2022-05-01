var Tools = ()=>{
	return Tools.prototype.init();
}

Tools.prototype = {
	init:function(){
		return this;
	},
	asyncReadData:function(data){
		return new Promise((resolve,reject)=>{
			const reader = new FileReader();
			reader.onload = ev=>{
				resolve(ev.target.result);
			}
			reader.onerror = ()=>{
				reject('read data error'+reader.error);
			}
			reader.readAsDataURL(data);
		})
	},
	checkUrlIsValid:function(url){
		try {
			return new URL(url);
		} catch(err){
			return false;
		}
	},
	fetchTimeout:async function(url, option={}, timeout=10*1000){
		if(!this.checkUrlIsValid(url))return false;
		const controller = new AbortController();
		setTimeout(()=>controller.abort(),timeout);
		option['signal'] = controller.signal;
		const response = await fetch(url,option).then(r=>r).catch(err=>err);
		return response;
	},
	getImgData:async function(request, get_bs64=true, get_blob=false){
		const response = await TOOLS.fetchTimeout(request,{method:'get',responseType:'blob',redirect:'follow'});
		if(!response.ok){
			throw new Error('get image data response was not ok.');
		}
		let img_data = await response.blob();
		img_data = await this.resizeImg(img_data,256,false,60);
		result = {'type':img_data.type,'size':img_data.size};
		if(get_bs64){
			const base64 = await TOOLS.asyncReadData(img_data);
			result['data'] = base64;
		}
		if(get_blob){
			result['blob'] = img_data;
		}
		return result;
	},
	calImgHashData:async function(img){
		let imblob = await TOOLS.fetchTimeout(img,option={},30*1000);
		if(!imblob.ok)return [false,{}];
		imblob = await imblob.blob();
		if(!(imblob instanceof Blob))return [false,{}];
		const im = await createImageBitmap(imblob).then(r=>r).catch(err=>false);
		if(!im)return [false,{}];
		const canvas64 = new OffscreenCanvas(64,64)
		let ctx64 = canvas64.getContext('2d');
		ctx64.drawImage(im,0,0,canvas64.width,canvas64.height);
		const imblob64 = await canvas64.convertToBlob({type:'image/png',quality:60});
		const imbuf64 = await imblob64.arrayBuffer();
		const imgdata64 = ctx64.getImageData(0,0,canvas64.width,canvas64.height);
		return [imbuf64, {data:imgdata64.data,height:canvas64.height,width:canvas64.width,channels:4}];
	},
	calcWidthAndHeightWithMax:function(width,height,size){
		let scale_rate = 1;
		if(width<=height){
			scale_rate = size/width;
		}
		if(height<width){
			scale_rate = size/height;
		}
		width *= scale_rate;
		height *= scale_rate;
		return [parseInt(width),parseInt(height)];
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
	resizeImg:async function(blob,size,with_max=true,quality=100){
		const im = await createImageBitmap(blob).then(r=>r).catch(err=>false);
		if(!im)return {'state':false,'url':img};
		let csize = null;
		if(with_max){csize = this.calcWidthAndHeightWithMax(im.width,im.height,size);}
		else{csize = this.calcWidthAndHeight(im.width,im.height,size);}
		const canvas = new OffscreenCanvas(csize[0],csize[1]);
		let ctx = canvas.getContext('2d');
		ctx.drawImage(im,0,0,canvas.width,canvas.height);
		return await canvas.convertToBlob({type:'image/jpeg',quality:quality});
	},
	uuidV4:function() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
}