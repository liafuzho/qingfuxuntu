importScripts('./tools.js')

var TOOLS, SE;
var Search_Similar_Image_Task_Pool = {};

var SearchEngine = ()=>{
	return SearchEngine.prototype.init();
}

SearchEngine.prototype = {
	init:function(){
		this.img_limit = 8;
		return this;
	},
	searchImg:async function(imgs, tab_id, from){
		const blob = await TOOLS.getImgData(imgs[0].imb64_256,false,true).then(r=>r.blob,err=>'error');
		Search_Similar_Image_Task_Pool[tab_id] = {id:imgs[0].ts,list:{}};
		for(a_from in from){
			if(a_from=='vcg'&&from[a_from])this.fromVCG(blob, tab_id, imgs[0].ts);
			if(a_from=='hello'&&from[a_from])this.fromHello(blob, tab_id, imgs[0].ts);
			if(a_from=='veer'&&from[a_from])this.fromVeer(blob, tab_id, imgs[0].ts);
			if(a_from=='unsplash'&&from[a_from])this.fromUnsplash(blob, tab_id, imgs[0].ts);
			if(a_from=='getty'&&from[a_from])this.fromGetty(blob, tab_id, imgs[0].ts);
			if(a_from=='huitu'&&from[a_from])this.fromHuitu(blob, tab_id, imgs[0].ts);
			if(a_from=='shutter'&&from[a_from])this.fromShutter(blob, tab_id, imgs[0].ts);
			if(a_from=='dreams'&&from[a_from])this.fromDreams(blob, tab_id, imgs[0].ts);
			if(a_from=='pond5'&&from[a_from])this.fromPond5(blob, tab_id, imgs[0].ts);
			if(a_from=='adobe'&&from[a_from])this.fromAdobe(blob, tab_id, imgs[0].ts);
			if(a_from=='istock'&&from[a_from])this.fromIstock(blob, tab_id, imgs[0].ts);
			if(a_from=='rf123'&&from[a_from])this.from123rf(blob, tab_id, imgs[0].ts);
			if(a_from=='mauritius'&&from[a_from])this.fromMauritius(blob, tab_id, imgs[0].ts);
			if(a_from=='alamy'&&from[a_from])this.fromAlamy(blob, tab_id, imgs[0].ts);
		}
		return true;
	},
	fromVCG:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['vcg']={state:0};
			const host = 'https://www.vcg.com';
			let url = host + '/api/common/upload';
			const rhead = new Headers();
			const base64 = await TOOLS.asyncReadData(blob);
			rhead.append("Content-Type","application/json");
			const raw = JSON.stringify({'image_content':base64});
			let roption = {
				method: 'post',
				headers: rhead,
				redirect: 'follow',
				body: raw
			};
			let response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request vcg img url error.');
			}
			let img_url = (await response.text()).slice(1,-1)
			if (!TOOLS.checkUrlIsValid(img_url)){
				throw new Error('get vcg img url error.');
			}
			url = host + '/api/common/searchImage?url=' + encodeURIComponent(img_url)
			roption = {
				method: 'get',
				redirect: 'follow',
			}
			response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request vcg sim query error.');
			}
			let result = await response.json();
			imgs = result.list.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'vcg',from_url:null,height:img.height,width:img.width,url:'http:'+img.equalh_url,data:null,ts:task_id,down_url:host+'/creative/'+img.id};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'vcg',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'vcg');
		}
	},
	fromHello:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['hello']={state:0};
			const host = 'https://api.hellorf.com';
			let url = host + '/hellorf/file/upload/similar?version=staging';
			let form_data = new FormData();
			form_data.append('qqfile', blob, '<image>');
			let roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request hello fetch error.');
			}
			let result = await response.json();
			if(result.result!=true){
				throw new Error('request hello sim query error.');
			}
			url = host + '/hellorf/image/search/similar?version=staging';
			const rhead = new Headers();
			rhead.append("Content-Type", "application/json");
			const raw = JSON.stringify({'url':result.file.url});
			roption = {
				method: 'post',
				headers: rhead,
				redirect: 'follow',
				body: raw
			};
			response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request hello fetch error.');
			}
			result = await response.json();
			if(result.result!=true){
				throw new Error('request hello sim query 2 error.');
			}
			url = 'https://www.hellorf.com/image/search-graph?file='+result.data;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request hello get result error.');
			}
			result = await response.text();
			let pattern = /<script id="__NEXT_DATA__" type="application\/json">.+?<\/script>/i;
			result = result.match(pattern);
			if(result.length!=1){
				throw new Error('request hello match pattern error.');
			}
			pattern = /{.*}/;
			result = result[0].match(pattern);
			if(result.length!=1){
				throw new Error('request hello match pattern 2 error.');
			}
			let imgs = {};
			imgs = JSON.parse(result);
			imgs = imgs.props.pageProps.initialProps.images.data.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				const down_url = 'https://www.hellorf.com/image/show/'+img.id+'?source=search_file';
				let img_info = {type:1,free:0,source:'hello',from_url:null,height:null,width:null,url:img.preview260_url,data:null,ts:task_id,down_url:down_url};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'hello',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'hello');
		}
	},
	fromShutter:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['shutter']={state:0};
			const host = 'https://www.shutterstock.com';
			let url = host + '/napi/images/reverse-image-search';
			let form_data = new FormData();
			form_data.append('image', blob, 'photo.jpg');
			let roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request shutter fetch error.');
			}
			let result = await response.json();
			if(result.length<=0){
				throw new Error('get shutter photo id error.');
			}
			url = host + '/search/ris/' + encodeURIComponent(result.join(','));
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request shutter get result error.');
			}
			result = await response.text();
			let pattern = /window.__INITIAL_STATE__=".+?";/i;
			result = result.match(pattern);
			if(result.length!=1){
				throw new Error('request shutter match pattern error.');
			}
			pattern = /{.*}/;
			result = result[0].match(pattern);
			if(result.length!=1){
				throw new Error('request shutter match pattern 2 error.');
			}
			let imgs = [];
			result = '"'+result[0]+'"';
			result = JSON.parse(JSON.parse(result));
			for(let key in result.imageData.images){
				imgs.push(result.imageData.images[key]);
			}
			imgs = imgs.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				const down_url = 'https://www.hellorf.com/image/show/'+img.id+'?source=search_file';
				let img_info = {type:1,free:0,source:'shutter',from_url:null,height:img.displays['260nw'].height,width:img.displays['260nw'].width,url:img.displays['260nw'].src,data:null,ts:task_id,down_url:host+img.link};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'shutter',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'shutter');
		}
	},
	fromVeer:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['veer']={state:0};
			const host = 'https://www.veer.com';
			let url = host + '/api2/resImageIstock/searchResimageByImage?type=3&anonyUid=JDL7FKI341M4&favorid=&st=';
			let form_data = new FormData();
			form_data.append('file', blob, 'photo.jpg');
			let roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request veer fetch error.');
			}
			let result = await response.json();
			if(result.code!=200){
				throw new Error('request veer fetch result error.')
			}
			url = host + '/api2/resImageIstock/searchResimageByImage?type=1&url='+result.data.url+'&anonyUid=JDL7FKI341M4&favorid=&st=';
			roption = {
				method: 'post',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request veer fetch error.');
			}
			result = await response.json();
			if(result.code!=200){
				throw new Error('request veer fetch result error.');
			}
			imgs = result.data.list.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'veer',from_url:null,height:img.picHeight,width:img.picWidth,url:'http://'+img.oss400,data:null,ts:task_id,down_url:host+'/photo/'+img.id};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'veer',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'veer');
		}
	},
	fromUnsplash:async function(blob, tab_id, task_id){
		try{
			blob = await TOOLS.resizeImg(blob,258)	//unsplash不支持256以下的图片;
			Search_Similar_Image_Task_Pool[tab_id]['list']['unsplash']={state:0};
			const host = 'https://unsplash.com';
			const time_out = 30*1000;
			let url = host + '/napi/search/by_image/upload?content_type=image/jpeg';
			let roption = {
				method: 'get',
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request unsplash fetch search parameter error.');
			}
			let result = await response.json();
			if (!TOOLS.checkUrlIsValid(result.url)){
				throw new Error('request unsplash fetch search parameter result error.');
			}
			url = result.url;
			let form_data = new FormData();
			form_data.append("key",result.fields.key);
			form_data.append("Content-Type",result.fields['Content-Type']);
			form_data.append("success_action_status",result.fields.success_action_status);
			form_data.append("policy",result.fields.policy);
			form_data.append("x-amz-credential",result.fields['x-amz-credential']);
			form_data.append("x-amz-algorithm",result.fields['x-amz-algorithm']);
			form_data.append("x-amz-date",result.fields['x-amz-date']);
			form_data.append("x-amz-signature",result.fields['x-amz-signature']);
			form_data.append("file",blob,'photo.jpg');
			roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request unsplash fetch search parameter error.');
			}
			result = await response.text();
			let pattern = /<Key>.+?<\/Key>/i;
			result =  result.match(pattern);
			const key = result[0].slice(5,-6);
			url = host + '/napi/search/by_image';
			form_data = new FormData();
			form_data.append("upload",key);
			roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request unsplash fetch uuid error.');
			}
			result = await response.json();
			url += '/'+result.uuid+'?per_page=20&page=1';
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request unsplash fetch search parameter error.');
			}
			result = await response.json();
			imgs = result.results.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:1,source:'unsplash',from_url:null,height:img.height,width:img.width,url:img.urls.small,data:null,ts:task_id,down_url:img.links.html};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'unsplash',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'unsplash');
		}
	},
	fromGetty:async function(blob, tab_id, task_id){
		try{
			blob = await TOOLS.resizeImg(blob,258);
			Search_Similar_Image_Task_Pool[tab_id]['list']['getty']={state:0};
			const host = 'https://www.gettyimages.com';
			const time_out = 30*1000;
			let url = host + '/search/search-by-image/upload_data/'+new Date().getTime()+'?assettype=image';
			let roption = {
				method: 'get',
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request getty fetch search parameter error.');
			}
			let result = await response.json();
			if (!TOOLS.checkUrlIsValid(result.post_url)){
				throw new Error('request getty fetch search parameter result error.');
			}
			url = result.post_url
			roption = {
				method: 'put',
				body: blob,
				redirect: 'follow',
			}
			response = await TOOLS.fetchTimeout(url,roption,time_out)
			if (!response.ok){
				throw new Error('request getty fetch search parameter error.')
			}
			url = host + result.search_url;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request getty fetch search result error.');
			}
			result = await response.text();
			let pattern = /<script type="application\/json" data-component='Search'>[\s\S]+?<\/script>/i;
			result = result.match(pattern);
			if(result.length!=1){
				throw new Error('request getty match pattern error.');
			}
			pattern = /{.*}/;
			result = result[0].match(pattern);
			if(result.length!=1){
				throw new Error('request getty match pattern 2 error.');
			}
			let imgs = {};
			imgs = JSON.parse(result);
			imgs = imgs.search.gallery.assets.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'getty',from_url:null,height:img.maxDimensions.height,width:img.maxDimensions.width,url:img.thumbUrl,data:null,ts:task_id,down_url:host+img.landingUrl};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'getty',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'getty');
		}
	},
	fromHuitu:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['huitu']={state:0};
			const host = 'https://soso-pic.huitu.com';
			let url = host + '/searchbypic/PostData';
			let form_data = new FormData();
			form_data.append('Files', blob, 'photo.jpg');
			let roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request huitu fetch error.');
			}
			let result = await response.text();
			let pattern = /{.*}/;
			result = result.match(pattern);
			if(result.length!=1){
				throw new Error('request huitu match pattern 2 error.');
			}
			let params = null;
			params = JSON.parse(result);
			url = host + '/searchbypic?imgurl=' + params.ImgUrl;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption);
			if (!response.ok){
				throw new Error('request huitu fetch search result error.');
			}
			result = await response.text();
			pattern = /(?<=<ul id="seo-img-outer"[\s\S]+?)(<img.*>)/ig;
			result = result.match(pattern);
			if(result.length<=0){
				throw new Error('request huitu match pattern error.');
			}
			imgs = result.slice(0,this.img_limit);
			pattern = /(?<=(src=)|(url=))(".+?")/ig;
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				const [src, url] = img.match(pattern);
				let img_info = {type:1,free:0,source:'huitu',from_url:null,height:null,width:null,url:`http:${src.slice(1,-1)}`,data:null,ts:task_id,down_url:`http:${url.slice(1,-1)}`};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'huitu',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'huitu');
		}
	},
	fromDreams:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['dreams']={state:0};
			const host = 'https://www.dreamstime.com';
			const time_out = 30*1000;
			let url = host + '/ajax/ping.php?_=' + new Date().getTime();
			let roption = {
				method: 'get',
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request dreams fetch security error.');
			}
			let result = await response.text();
			if(result.length!=32){
				throw new Error('request dreams security error.');
			}
			const securitycheck = result;
			url = host + '/ajax/puzzle.php';
			let form_data = new FormData();
			form_data.append('securitycheck',securitycheck);
			form_data.append('puzzle',blob,'photo.jpg');
			roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request dreams fetch search error.');
			}
			result = await response.json();
			url = host + '/search.php';
			form_data = new FormData();
			form_data.append('puzzle','1');
			form_data.append('puzzle_exact','0');
			form_data.append('puzzle_matches','');
			form_data.append('puzzle_data','');
			form_data.append('securitycheck',securitycheck);
			form_data.append('puzzle_aids',result.puzzle_aids);
			roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request dreams fetch search result error.');
			}
			result = await response.text();
			result = result.replace(/[\r\n]/g,'').replace(/\s{2,}/g,' ');
			let pattern = /<i class="icon icon-plus"><\/i> <a href=.+?> <img .+? <\/a>/g;
			result = result.match(pattern);
			const imgs = result.slice(0,this.img_limit);
			pattern = /(?<=(href=)|(data-src=))(".+?")/g;
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				const [src, url] = img.match(pattern);
				let img_info = {type:1,free:0,source:'dreams',from_url:null,height:null,width:null,url:url.slice(1,-1),data:null,ts:task_id,down_url:src.slice(1,-1)}
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'dreams',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'dreams');
		}
	},
	fromPond5:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['pond5']={state:0};
			const host = 'https://www.pond5.com';
			const time_out = 30*1000;
			let url = host + '/ajax/reverse-search';
            const img_bs64 = await TOOLS.asyncReadData(blob);
            const im = await createImageBitmap(blob).then(r=>r).catch(err=>false);
            const raw = JSON.stringify({'bm':128,'properties':{'clientExecTime':2,'height':im.height,'location':null,'mediaType':'Photos','method':'select','name':'photo.jpg','orientation':-1,'size':blob.size,'type':blob.type,'width':im.width},'thumbnails':[img_bs64]});
			let roption = {
				method: 'post',
                body: raw,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request pond5 fetch security error.');
			}
			let result = await response.json();
            url = host + '/index.php?page=ajax_search&bmtext=photos&pagenum=1&bm=2176&q=vissim:'+result.hash+'&qorg=sr&sb=1&pages=0&searchLayout=paginated&previewSize=small&perPage=48&currency=';
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request pond5 fetch result response error.');
			}
			result = await response.json();
			if(result.status!=200){
				throw new Error('request pond5 fetch result error.');
			}
			let imgs = result.output.searchResultsData.prePromoResults.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'pond5',from_url:null,height:null,width:null,url:img.imgSrc,data:null,ts:task_id,down_url:img.itemLink};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'pond5',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'pond5');
		}
	},
	fromAdobe:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['adobe']={state:0};
			const host = 'https://stock.adobe.com';
			const time_out = 30*1000;
			let url = host + '/visualsearchsupport';
            let form_data = new FormData();
			form_data.append('image',blob,'photo.jpg');
			let roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request adobe fetch search code error.');
			}
			let result = await response.json();
			if(result.native_visual_search.length<=0){
				throw new Error('request adobe fetch search code length error.');
			}
			url = host + '/search/images?filters[content_type:image]=1&filters[content_type:photo]=1&native_visual_search='+result.native_visual_search+'&search_type=visual-search-browse';
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request adobe fetch result response error.');
			}
			result = await response.text();
			let pattern = /<script type="application\/json" id="image-detail-json">[\s\S]+?<\/script>/i;
			result = result.match(pattern);
			if(result.length!=1){
				throw new Error('request adobe match pattern error.');
			}
			pattern = /{.*}/;
			result = result[0].match(pattern);
			if(result.length!=1){
				throw new Error('request adobe match pattern 2 error.');
			}
			let imgs = [];
			result = JSON.parse(result[0]);
			for(let key in result){
				imgs.push(result[key]);
			}
			imgs = imgs.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'adobe',from_url:null,height:null,width:null,url:img.thumbnail_url,data:null,ts:task_id,down_url:img.content_url};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'adobe',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'adobe');
		}
	},
	fromIstock:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['istock']={state:0};
			const host = 'https://www.istockphoto.com';
			const time_out = 30*1000;
			let url = host + '/search/search-by-image/upload_data/'+new Date().getTime()+'?assettype=image';
			let roption = {
				method: 'get',
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request istock fetch search code error.');
			}
			let result = await response.json();
			url = result.post_url;
			if (!TOOLS.checkUrlIsValid(url)){
				throw new Error('get istock search url error.');
			}
			const search_url = result.search_url;
			roption = {
				method: 'put',
				body: blob,
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request istock fetch search error.');
			}
			url = host + search_url;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request istock fetch search code error.');
			}
			result = await response.text();
			let pattern = /<script type="application\/json" data-component='Search'>[\s\S]+?<\/script>/i;
			result = result.match(pattern);
			if(result.length!=1){
				throw new Error('request istock match pattern error.');
			}
			pattern = /{.*}/;
			result = result[0].match(pattern);
			if(result.length!=1){
				throw new Error('request istock match pattern 2 error.');
			}
			let imgs = [];
			result = JSON.parse(result[0]);
			imgs = result.search.gallery.assets;
			imgs = imgs.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'istock',from_url:null,height:null,width:null,url:img.thumbUrl,data:null,ts:task_id,down_url:host+img.landingUrl};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'istock',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'istock');
		}
	},
	from123rf:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['rf123']={state:0};
			const host = 'https://www.123rf.com';
			const time_out = 30*1000;
			let url = host + '/apicore/search/reverse/upload';
			const rhead = new Headers();
			rhead.append("Content-Type","application/json");
			const base64 = await TOOLS.asyncReadData(blob);
			const raw = JSON.stringify({'image_base64':base64});
			let roption = {
				method: 'post',
				headers: rhead,
				redirect: 'follow',
				body: raw
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request 123rf img url error.');
			}
			let result = await response.json();
			url = host + '/apicore/search/reverse?fid=' + result.data.fid;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request 123rf sim query error.');
			}
			result = await response.json();
			imgs = result.data.slice(1,this.img_limit+1);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'rf123',from_url:null,height:img.attributes.height,width:img.attributes.width,url:img.attributes.thumbnail_url,data:null,ts:task_id,down_url:host+img.attributes.detail_url};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'rf123',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'rf123');
		}
	},
	fromMauritius:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['mauritius']={state:0};
			const host = 'https://mauritius.rocketloop.ai';
			const time_out = 30*1000;
			let url = host + '/image_search';
			let form_data = new FormData();
			form_data.append('image_file',blob,'photo.jpg');
			let roption = {
				method: 'post',
				body: form_data,
				redirect: 'follow',
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request mauritius fetch search code error.');
			}
			let result = await response.json();
			let data = [];
			for(d of result.data){
				data.push(d[2]);
			}
			const data_string = data.join(',');
			url = 'https://api.mauritius.sodatech.com/assets?page=1&itemsPerPage=10&lang=en&collection=&picIds=' + data_string ;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request mauritius sim query error.');
			}
			result = await response.json();
			imgs = result.data.slice(0,this.img_limit);
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let img_info = {type:1,free:0,source:'mauritius',from_url:null,height:img.height,width:img.width,url:img.associatedMedia[0].contentUrl,data:null,ts:task_id,down_url:'https://www.mauritius-images.com/asset/'+img.id};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'mauritius',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'mauritius');
		}
	},
	fromAlamy:async function(blob, tab_id, task_id){
		try{
			Search_Similar_Image_Task_Pool[tab_id]['list']['alamy']={state:0};
			const host = 'https://www.alamy.com';
			const time_out = 30*1000;
			let url = 'https://h2wt5rqha4.execute-api.eu-west-1.amazonaws.com/LIVE/get-reverseimage-presigned-url';
			const uuid = TOOLS.uuidV4();
			const rhead = new Headers();
			rhead.append("Content-Type", "application/json");
			const raw = JSON.stringify({'fileName':uuid+'.jpg'});
			roption = {
				method: 'post',
				headers: rhead,
				redirect: 'follow',
				body: raw
			};
			let response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request alamy fetch search code error.');
			}
			let result = await response.json();
			url = result.url;
			if (!TOOLS.checkUrlIsValid(url)){
				throw new Error('get alamy search url error.');
			}
			const search_url = result.search_url;
			roption = {
				method: 'put',
				body: blob,
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request alamy fetch search error.');
			}
			url = 'https://www.alamy.com/search/Proxy/ImageMoreBySearchProxy.aspx?foo=bar&st=98&pn=1&ps=100&sortby=2&qt=&qt_raw=&qn=&lic=3&edrf=0&mr=0&pr=0&aoa=1&creative=&videos=&nu=&ccc=&bespoke=&apalib=&ag=0&hc=0&et=0x000000000000000000000&vp=0&loc=0&ot=0&imgt=0&dtfr=&dtto=&size=0xFF&blackwhite=&cutout=&archive=1&name=&groupid=&pseudoid=&userid=&id=&a=&xstx=0&cbstore=1&resultview=sortbyPopular&lightbox=&gname=&gtype=&apalic=&tbar=0&pc=&simid=&cap=1&customgeoip=&vd=0&cid=&pe=&so=&lb=&pl=0&plno=&fi=0&langcode=en&upl=0&cufr=&cuto=&howler=&cvrem=0&cvtype=0&cvloc=0&cl=0&upfr=&upto=&primcat=&seccat=&cvcategory=*&restriction=&collectiontype=&random='+new Date().getTime()+'&ispremium=1&flip=0&contributorqt=&plgalleryno=&plpublic=0&viewaspublic=0&isplcurate=0&imageurl='+uuid+'.jpg&saveQry=&editorial=1&t=0&filters=0' ;
			roption = {
				method: 'get',
				redirect: 'follow',
			};
			response = await TOOLS.fetchTimeout(url,roption,time_out);
			if (!response.ok){
				throw new Error('request alamy sim query error.');
			}
			result = await response.text();
			let pattern = /<I .+? \/>/gi;
			result = result.match(pattern);
			if(result.length==0){
				throw new Error('request alamy match pattern error.');
			}
			imgs = result.slice(0,this.img_limit);
			pattern = /(?<=(AR=)|(ID=))(".+?")/g;
			for(img of imgs){
				if(task_id!=Search_Similar_Image_Task_Pool[tab_id].id){
					return;
				}
				let [ar, id] = img.match(pattern);
				ar = (ar.slice(1,-1)).toLowerCase();
				id = (id.slice(2,-2)).toLowerCase().replace(/-/g,'');
				let img_info = {type:1,free:0,source:'alamy',from_url:null,height:null,width:null,url:'https://h1.alamy.com/zooms/3/'+id+'/'+ar+'.jpg',data:null,ts:task_id,down_url:'https://www.alamy.com/search/imageresults.aspx?qt='+ar};
				img_info.data = await TOOLS.getImgData(img_info.url).then(r=>r.data,err=>'error');
				this.calImgHash(tab_id,img_info);
			}
		}catch(err){
			console.log(err.stack);
			postMessage({type:'imgerror',from:'alamy',tab_id});
		}finally {
			this.chkSimilarImgEnd(tab_id, 'alamy');
		}
	},
	calImgHash:async function(tab_id, img_info){
		let [buf, info] = await TOOLS.calImgHashData(img_info.data);
		if(!buf)return;
		img_info.info = info;
		postMessage({type:'imghash',img_info,buf,tab_id});
	},
	chkSimilarImgEnd:function(tab_id, from){
		Search_Similar_Image_Task_Pool[tab_id]['list'][from]={state:1};
		for (let k in Search_Similar_Image_Task_Pool[tab_id]['list']){
			if (Search_Similar_Image_Task_Pool[tab_id]['list'][k].state===0){
				return;
			}
		}
		postMessage({type:'imgend',tab_id});
	},
}

TOOLS = Tools();
SE = SearchEngine();

onmessage = function(ev) {
	SE.searchImg(ev.data.imgs, ev.data.tab_id, ev.data.from);
}