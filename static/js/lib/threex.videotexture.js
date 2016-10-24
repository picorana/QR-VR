var THREEx = THREEx || {};

THREEx.VideoTexture	= function(url){
	// create the video element
	var video	= document.createElement('video');
	var container = document.getElementById( 'container' );
	container.appendChild(video);
	video.width	= 320;
	video.height	= 240;
	video.autoplay	= false;
	video.loop	= false;
	video.autobuffer = false;
	video.src = url;
	video.setAttribute("controls","controls");
	
	//var source = document.createElement('source');
	//source.src = url;

	//video.appendChild(source);

	// expose video as this.video
	this.video	= video;

	// create the texture
	//var texture	= texture_loader.load( video );
	var texture = new THREE.Texture(video);
	// expose texture as this.texture
	this.texture	= texture;

	/**
	 * update the object
	 */
	this.update	= function(){
		if( video.readyState !== video.HAVE_ENOUGH_DATA )	return;
		texture.needsUpdate	= true;		
	};

	/**
	 * destroy the object
	 */
	this.destroy	= function(){
		video.pause();
	};
};
