'use strict';
	
	Physijs.scripts.worker = 'js/physijs_worker.js';
	Physijs.scripts.ammo = 'ammo.js';
	
	var initScene, render, input, vehicle, ball, loader, bucket,
		ground_material, crane_material, ground_constraint, controls, ambientLight, container,
		renderer, render_stats, physics_stats, scene, ground_geometry, ground, light, camera,
		crane = {};
	var score = 0;
	initScene = function() {
		initGraphics();
		addGround();
		addSkybox();
		addBall();
		addBucket();
		addCrane(new THREE.Vector3( 30, 0, 0 ));
		inputDetect();
		//printMass(scene);

		requestAnimationFrame( render );
		scene.simulate();
	};
	
	var i = 0;
	render = function() {
		if(i == 10){

		i=0;
		}else{i++}

		requestAnimationFrame( render );
		controls.update();
		renderer.render( scene, camera );
		render_stats.update();
	};
	function onWindowResize() {
	    camera.aspect = window.innerWidth / window.innerHeight;
	    camera.updateProjectionMatrix();
	    renderer.setSize( window.innerWidth, window.innerHeight );
	}
	function onCollision(other_object, linear_velocity, angular_velocity ){
		if(other_object.name==="bucket"){
			score++;
			relocateBall();
			relocateBucket();
			document.getElementById( 'score' ).innerHTML=score.toString();
		}
	}
	function relocateBall(){
		var range =10+Math.random()*30;
		ball.position.y = 16;
		ball.position.x = ((2*Math.floor(Math.random()*2))-1)*range;
		ball.position.z = ((2*Math.floor(Math.random()*2))-1)*range;
		ball.__dirtyPosition = true;//disable physics temporarily
	    
	    ball.setLinearVelocity(new THREE.Vector3(0, 0, 0));
	    ball.setAngularVelocity(new THREE.Vector3(0, 0, 0));
	}
	function relocateBucket(){
		var range =10+Math.random()*30;
		var ypos =15+Math.random()*10;
		bucket.position.y = ypos;
		bucket.position.x = ((2*Math.floor(Math.random()*2))-1)*range;
		bucket.position.z = ((2*Math.floor(Math.random()*2))-1)*range;
		bucket.__dirtyPosition = true;//disable physics temporarily
	    
	    bucket.setLinearVelocity(new THREE.Vector3(0, 0, 0));
	    bucket.setAngularVelocity(new THREE.Vector3(0, 0, 0));
	}
	function updateVehicleSteering(){
		if ( input && vehicle ) {
			if ( input.direction !== null ) {
				input.steering += input.direction / 50;
				if ( input.steering < -.6 ) input.steering = -.6;
				if ( input.steering > .6 ) input.steering = .6;
			}else{
				if(input.steering < 0 - 1/50){
					input.steering += 1/50;
				}else if(input.steering > 0 + 1/50){
					input.steering -= 1/50;
				}else{
					input.steering = 0;
				}
			}
			vehicle.setSteering( input.steering, 0 );
			vehicle.setSteering( input.steering, 1 );

			if ( input.parking_break === true && input.break !== true){
				vehicle.setBrake( 15, 2 );
				vehicle.setBrake( 15, 3 );
			} else if(input.parking_break === false && input.break !== true){
				vehicle.setBrake( 0, 2 );
				vehicle.setBrake( 0, 3 );
			}

			if ( input.break === true ) {
				vehicle.setBrake( 30, 2 );
				vehicle.setBrake( 30, 3 );
			}else{
				if ( input.parking_break === false){
					vehicle.setBrake( 0, 2 );
					vehicle.setBrake( 0, 3 );
				}
			}

			if ( input.power !== null ) {
				vehicle.applyEngineForce( input.power );
			} else {
				vehicle.applyEngineForce( 0 );
			}
		}
	}
	function initGraphics() {
		container = document.getElementById( 'viewport' );

	    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );

	    loader = new THREE.TextureLoader();

	    //scene = new THREE.Scene();
	    scene = new Physijs.Scene;
		scene.setGravity(new THREE.Vector3( 0, -10, 0 ));
		scene.addEventListener(
			'update',
			function() {
				updateVehicleSteering();
				scene.simulate( undefined, 2 );
				physics_stats.update();
			}
		);

		camera.position.set( 60, 50, 60 );

	    controls = new THREE.OrbitControls( camera );
	    controls.target.y = 2;

	    renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setClearColor( 0xbfd1e5 );
	    renderer.setPixelRatio( window.devicePixelRatio );
	    renderer.setSize( window.innerWidth, window.innerHeight );
	    renderer.shadowMap.enabled = true;
	    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		ambientLight = new THREE.AmbientLight( 0x404040 );
		scene.add( ambientLight );

	    light = new THREE.DirectionalLight( 0xffffff, 1 );
	    //light = new THREE.SpotLight( 0xffffff);
	    light.position.set( -100, 100, 100 );
		light.castShadow = true;
		var d = 100;

	    light.shadow.camera.left = -d;
	    light.shadow.camera.right = d;
	    light.shadow.camera.top = d;
	    light.shadow.camera.bottom = -d;

	    light.shadow.camera.visible = true;

	    light.shadow.camera.near = 1;
	    light.shadow.camera.far = 500;
	    light.shadow.camera.fov = 30;

	    light.shadow.mapSize.x = 1024;
	    light.shadow.mapSize.y = 1024;

	    scene.add( light );


	    container.innerHTML = "";

	    container.appendChild( renderer.domElement );

	    render_stats = new Stats();
		render_stats.domElement.style.position = 'absolute';
		render_stats.domElement.style.top = '0px';
		render_stats.domElement.style.zIndex = 100;
		container.appendChild( render_stats.domElement );
		
		physics_stats = new Stats();
		physics_stats.domElement.style.position = 'absolute';
		physics_stats.domElement.style.top = '50px';
		physics_stats.domElement.style.zIndex = 100;
		container.appendChild( physics_stats.domElement );

	    //

	    window.addEventListener( 'resize', onWindowResize, false );
    }
    function setXLock(constrain){
    	var tolerance = 0.005;
		var angle = constrain.getAngle(0);
		constrain.setAngularLowerLimit( new THREE.Vector3( angle - tolerance, 0, 0 ) );
		constrain.setAngularUpperLimit( new THREE.Vector3( angle + tolerance, 0, 0 ) );
	}
	function setYLock(constrain){
    	var tolerance = 0.005;
		var angle = constrain.getAngle(1);
		constrain.setAngularLowerLimit( new THREE.Vector3( 0, angle - tolerance, 0 ) );
		constrain.setAngularUpperLimit( new THREE.Vector3( 0, angle + tolerance, 0 ) );
	}
	function RotationLock(){
    	//crane.base.bottom.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    	//crane.base.bottom.setAngularVelocity(new THREE.Vector3(0, 0, 0));
    	var tolerance = 0.005;
		var angle = crane.rotation_constrain.getAngle();
    	crane.rotation_constrain.setLimits(angle - tolerance,angle + tolerance,0,0);
	}
	function RotationUnlock(){
    	crane.rotation_constrain.setLimits(0.1,0,0,0,);
    }
    function printMass(mesh){
    	if(mesh.children && mesh.children.length){
			var i;
			var len = mesh.children.length;
			for (i=0; i < len; i++) { 
				console.log(mesh.children[i].name + ": " +  mesh.children[i].mass);
				printMass(mesh.children[i]);
			}
    	}
	}
	function addGround(){
		ground_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial({ 
				map: loader.load( 'images/grass/grass03.jpg' ),
				normalMap: loader.load( 'images/grass/grass03_n.jpg' ),
				specularMap: loader.load( 'images/grass/grass03_s.jpg' ) }),
			.8, // high friction
			.4 // low restitution
		);
		ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
		ground_material.map.repeat.set( 10, 10 );
		
		// Ground
		var NoiseGen = new SimplexNoise;
		
		ground_geometry = new THREE.PlaneGeometry( 1000, 1000, 100, 100 );
		for ( var i = 0; i < ground_geometry.vertices.length; i++ ) {
			var vertex = ground_geometry.vertices[i];
			vertex.z = NoiseGen.noise( vertex.x / 200, vertex.y / 200 ) * 2;
		}
		ground_geometry.computeFaceNormals();
		ground_geometry.computeVertexNormals();
		
		// If your plane is not square as far as face count then the HeightfieldMesh
		// takes two more arguments at the end: # of x faces and # of y faces that were passed to THREE.PlaneMaterial
		ground = new Physijs.HeightfieldMesh(
			ground_geometry,
			ground_material,
			0, // mass
			100,
			100
		);
		ground.rotation.x = Math.PI / -2;
		ground.receiveShadow = true;
		scene.add( ground );
	}
	function addSkybox(){
		scene.background = new THREE.CubeTextureLoader()
		.setPath( 'images/skybox/' )
		.load( [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ] );
		
		var fogColor = new THREE.Color(0xffffff);
		scene.background = fogColor;
		scene.fog = new THREE.Fog(fogColor, 1, 500);
	}
	function addBall(){
		var ball_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial({ color: 0xff0000 }),
			.8, // high friction
			.6 // low restitution
		);
		
		ball = new Physijs.SphereMesh(
			new THREE.SphereGeometry(1.5, 10, 10),
			ball_material,
			5 // mass
		);
		ball.receiveShadow = ball.castShadow = true;
		ball.name = "ball";

		var range =10+Math.random()*30;
		ball.position.y = 16;
		ball.position.x = ((2*Math.floor(Math.random()*2))-1)*range;
		ball.position.z = ((2*Math.floor(Math.random()*2))-1)*range;
		scene.add( ball );
		ball.setDamping(0.5,0.5);

		ball.addEventListener( 'collision', onCollision);
	}
	function addBucket(){
		var bucked_segment_height = 3;
		var bucked_segment_width = 0.1;
		var bucked_segment_length = 2.5;
		var r = bucked_segment_length*Math.sqrt(3)/2;
		var bucket_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
			.2, // high friction
			.2 // low restitution
		);

		var bucket_segment1 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( bucked_segment_width, bucked_segment_height, bucked_segment_length),
			bucket_material,
			0
		);
		bucket_segment1.position.set(r,bucked_segment_height/2,0);
		bucket_segment1.receiveShadow = bucket_segment1.castShadow = true;
		bucket_segment1.name = "bucket_segment1";

		var bucket_segment2 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( bucked_segment_width, bucked_segment_height, bucked_segment_length),
			bucket_material,
			0
		);
		bucket_segment2.position.set(-r,bucked_segment_height/2,0);
		bucket_segment2.receiveShadow = bucket_segment2.castShadow = true;
		bucket_segment2.name = "bucket_segment2";

		var bucket_segment3 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( bucked_segment_width, bucked_segment_height, bucked_segment_length),
			bucket_material,
			0
		);
		bucket_segment3.position.set(r/2,bucked_segment_height/2,-r/2-r/3);
		bucket_segment3.rotation.y = Math.PI/3;
		bucket_segment3.receiveShadow = bucket_segment3.castShadow = true;
		bucket_segment3.name = "bucket_segment3";

		var bucket_segment4 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( bucked_segment_width, bucked_segment_height, bucked_segment_length),
			bucket_material,
			0
		);
		bucket_segment4.position.set(-r/2,bucked_segment_height/2,-r/2-r/3);
		bucket_segment4.rotation.y = -Math.PI/3;
		bucket_segment4.receiveShadow = bucket_segment4.castShadow = true;
		bucket_segment4.name = "bucket_segment4";

		var bucket_segment5 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( bucked_segment_width, bucked_segment_height, bucked_segment_length),
			bucket_material,
			0
		);
		bucket_segment5.position.set(-r/2,bucked_segment_height/2,r/2+r/3);
		bucket_segment5.rotation.y = Math.PI/3;
		bucket_segment5.receiveShadow = bucket_segment5.castShadow = true;
		bucket_segment5.name = "bucket_segment5";

		bucket = new Physijs.CylinderMesh(
			new THREE.CylinderGeometry( r, r, bucked_segment_width, 30 ),
			bucket_material,
			0
		);

		var bucket_segment6 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( bucked_segment_width, bucked_segment_height, bucked_segment_length),
			bucket_material,
			0
		);
		bucket_segment6.position.set(r/2,bucked_segment_height/2,r/2+r/3);
		bucket_segment6.rotation.y = -Math.PI/3;
		bucket_segment6.receiveShadow = bucket_segment6.castShadow = true;
		bucket_segment6.name = "bucket_segment6";

		bucket = new Physijs.CylinderMesh(
			new THREE.CylinderGeometry( r, r, bucked_segment_width, 30 ),
			bucket_material,
			0
		);
		bucket.receiveShadow = bucket.castShadow = true;
		bucket.name = "bucket";

		bucket.add(bucket_segment1);
		bucket.add(bucket_segment2);
		bucket.add(bucket_segment3);
		bucket.add(bucket_segment4);
		bucket.add(bucket_segment5);
		bucket.add(bucket_segment6);

		var range =10+Math.random()*30;
		var ypos =15+Math.random()*10;
		bucket.position.y = ypos;
		bucket.position.x = ((2*Math.floor(Math.random()*2))-1)*range;
		bucket.position.z = ((2*Math.floor(Math.random()*2))-1)*range;

		scene.add(bucket);
	}
	function createClaw(pos, rot){
		var segment_length = 1.5;
		var segment_size = 0.6;
		var fromcenter = Math.sqrt(2)*segment_length/4;
		var claw = {};

		var claw_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial({ color: 0x222222 }),
			.99, // high friction
			.2 // low restitution
		);
		// segment 1
		claw.segment1 = new Physijs.BoxMesh(
			new THREE.BoxGeometry( segment_size/2, segment_size, segment_length),
			claw_material,
			5
		);
		claw.segment1.position.set(pos.x,pos.y,pos.z);
		claw.segment1.rotation.set(rot.x,rot.y,rot.z);
		claw.segment1.receiveShadow = claw.segment1.castShadow = true;
		claw.segment1.name = "calw_segment1";
		// segment 2
		claw.segment2 = new Physijs.BoxMesh(
			new THREE.BoxGeometry( segment_size/2, segment_size, segment_length),
			claw_material,
			5
		);
		claw.segment2.position.set(segment_length/2,0,segment_length/2+fromcenter);
		claw.segment2.rotation.y = Math.PI / 3;
		claw.segment2.receiveShadow = claw.segment2.castShadow = true;
		claw.segment2.name = "calw_segment2";

		// segment 3
		claw.segment3 = new Physijs.BoxMesh(
			new THREE.BoxGeometry( segment_size/2, segment_size, segment_length),
			claw_material,
			5
		);
		claw.segment3.position.set(segment_length/2,0,-segment_length/2-fromcenter);
		claw.segment3.rotation.y = -Math.PI / 3;
		claw.segment3.receiveShadow = claw.segment3.castShadow = true;
		claw.segment3.name = "calw_segment3";

		claw.segment1.add( claw.segment3 );
		claw.segment1.add( claw.segment2 );
		return claw.segment1;
	}
	function addCrane(pos){
		var liftup = 5;
		pos.y += liftup + 2.5/2;
		crane_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial({ map: loader.load( 'images/metal/Metal_Galvanized_001_basecolor.jpg' ),
				normalMap: loader.load( 'images/metal/Metal_Galvanized_001_normal.jpg' ) }),
			.5, // high friction
			.2 // low restitution
		);
		crane_material.map.wrapS = crane_material.map.wrapT = THREE.RepeatWrapping;
		crane_material.map.repeat.set( 1, 1 );

		var spacing = 0.0;
		//Bottom Cylinder
		var cyli_radius = 3;
		var cyli_height = 0.5;
		crane.cylinder = new Physijs.CylinderMesh(
			new THREE.CylinderGeometry( cyli_radius, cyli_radius, cyli_height, 30 ),
			crane_material,
			200
		);
		crane.cylinder.position.set(pos.x,pos.y+spacing+cyli_height/2,pos.z);
		crane.cylinder.receiveShadow = crane.cylinder.castShadow = true;
		crane.cylinder.name = "crane_rotatating_cylinder"
		scene.add( crane.cylinder );

		var base_width = 6;
		var base_length = 8;
		var base_height = 2;

		// FIRST ARM
		var arm1_size = 1.5;
		var arm1_length = 10;
		crane.arm1 = new Physijs.BoxMesh(
			new THREE.BoxGeometry( arm1_size, arm1_size, arm1_length),
			crane_material,
			20
		);
		crane.arm1.position.set(pos.x,pos.y+cyli_height+base_height+arm1_size/2,pos.z+arm1_length/2+base_length/2);
		crane.arm1.receiveShadow = crane.arm1.castShadow = true;
		crane.arm1.name = "crane_arm1";
		scene.add( crane.arm1 );
		// SECOND ARM
		var arm2_size = 1.5;
		var arm2_length = 8;
		crane.arm2 = new Physijs.BoxMesh(
			new THREE.BoxGeometry( arm2_size, arm2_size, arm2_length),
			crane_material,
			20
		);
		crane.arm2.position.set(pos.x,pos.y+cyli_height+base_height+arm2_size/2,pos.z+arm2_length/2+base_length/2+arm1_length);
		crane.arm2.receiveShadow = crane.arm2.castShadow = true;
		crane.arm2.name = "crane_arm2";
		scene.add( crane.arm2 );
		// THIRD ARM
		var arm3_size = 1.5;
		var arm3_length = 10;
		crane.arm3 = new Physijs.BoxMesh(
			new THREE.BoxGeometry( arm3_size, arm3_size, arm3_length),
			crane_material,
			20
		);
		crane.arm3.position.set(pos.x,pos.y+cyli_height+base_height+arm3_size/2,pos.z+arm3_length/2+base_length/2+arm1_length+arm2_length);
		crane.arm3.receiveShadow = crane.arm3.castShadow = true;
		crane.arm3.name = "crane_arm3";
		scene.add( crane.arm3 );

		// CLAW
		crane.claw = {};
		//claw ball
		var sphere_radius = 0.75;
		crane.claw.ball = new Physijs.SphereMesh(
			new THREE.SphereGeometry(sphere_radius,10,10),
			crane_material, 
			5
		);
		crane.claw.ball.position.set(pos.x,pos.y+cyli_height+base_height+arm3_size/2,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius);
		crane.claw.ball.receiveShadow = crane.claw.ball.castShadow = true;
		crane.claw.ball.name = "crane_claw_ball";
		scene.add(crane.claw.ball);
		crane.claw.ball.setDamping(0.1,0.5);

		// single claw
		crane.claw.claw1 = createClaw(new THREE.Vector3( pos.x-2,pos.y+cyli_height+base_height+arm3_size/2,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+2.5 ), new THREE.Vector3( 0, 0, 0 ));
		crane.claw.claw2 =createClaw(new THREE.Vector3( pos.x+2,pos.y+cyli_height+base_height+arm3_size/2,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+2.5 ), new THREE.Vector3( 0, 0, Math.PI ));
		crane.claw.claw3 =createClaw(new THREE.Vector3( pos.x,pos.y+cyli_height+base_height+arm3_size/2-2, pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+2.5 ), new THREE.Vector3( 0, 0, Math.PI / 2 ));
		crane.claw.claw4 =createClaw(new THREE.Vector3( pos.x,pos.y+cyli_height+base_height+arm3_size/2+2, pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+2.5 ), new THREE.Vector3( 0, 0, -Math.PI / 2 ));
		scene.add(crane.claw.claw1);
		scene.add(crane.claw.claw2);
		scene.add(crane.claw.claw3);
		scene.add(crane.claw.claw4);
		crane.claw.claw1.setDamping(0.1,0.5);
		crane.claw.claw2.setDamping(0.1,0.5);
		crane.claw.claw3.setDamping(0.1,0.5);
		crane.claw.claw4.setDamping(0.1,0.5);


		//BASE
		crane.base = {};
		//bottom part
		crane.base.bottom = new Physijs.BoxMesh(
			new THREE.BoxGeometry( base_width,base_height, base_length),
			crane_material,
			200
		);
		crane.base.bottom.position.set(pos.x,pos.y+spacing+cyli_height+base_height/2+spacing,pos.z);
		crane.base.bottom.receiveShadow = crane.base.bottom.castShadow = true;
		crane.base.bottom.name = "crane_base_bottom";
		//scene.add( crane.base.bottom );
		
		// right part
		var side_width = (base_width - arm1_size)/2;
		crane.base.right = new Physijs.BoxMesh(
		new THREE.BoxGeometry( side_width, arm1_size, base_length ),
		crane_material,
			200
		);
		//crane.base.right.position.set(pos.x - (side_width + arm1_size)/2,pos.y+cyli_height+base_height+arm1_size/2,pos.z);
		crane.base.right.position.set(-(side_width + arm1_size)/2,0,arm1_size/2);
		crane.base.right.receiveShadow = crane.base.right.castShadow = true;
		crane.base.right.name = "crane_base_right";
		//scene.add( crane.base.right );
		// left part
		crane.base.left = new Physijs.BoxMesh(
		new THREE.BoxGeometry( side_width, arm1_size, base_length ),
		crane_material,
			200
		);
		//crane.base.left.position.set(pos.x + (side_width + arm1_size)/2,pos.y+cyli_height+base_height+arm1_size/2,pos.z); // no parent
		crane.base.left.position.set((side_width + arm1_size)/2,0,arm1_size/2);
		crane.base.left.receiveShadow = crane.base.left.castShadow = true;
		crane.base.left.name = "crane_base_left";
		//scene.add( crane.base.left );
		// middle part
		crane.base.middle = new Physijs.BoxMesh(
		new THREE.BoxGeometry( arm1_size, arm1_size, base_length - arm1_size ),
		crane_material,
			200
		);
		//crane.base.middle.position.set(pos.x,pos.y+cyli_height+base_height+arm1_size/2,pos.z-arm1_size/2);
		crane.base.middle.position.set(0, arm1_size/2+base_height/2,-arm1_size/2);
		crane.base.middle.receiveShadow = crane.base.middle.castShadow = true;
		crane.base.middle.name = "crane_base_middle";

		crane.base.middle.add(crane.base.left);
		crane.base.middle.add(crane.base.right);
		crane.base.bottom.add(crane.base.middle);
		scene.add( crane.base.bottom );

		//SUSPENTION

		//Wheel geometry
		var wheel_radius = 1.5;
		var wheel_height = 1.5;
		var wheel_spacing = 0.5;
		var wheel_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial({ color: 0x444444 }),
			.9,
			.2
		);
		var wheel = new THREE.CylinderGeometry( wheel_radius, wheel_radius, wheel_height, 20 );
		wheel.rotateZ(Math.PI / 2);

		// middle Z suspension mesh
		var suspention_height = 2.5;
		var suspention_width = base_width -2;
		var suspention_lenght = base_length + 2;
		crane.base.suspention = new Physijs.BoxMesh(
		new THREE.BoxGeometry( suspention_width, suspention_height, suspention_lenght),
		crane_material,
			500
		);
		crane.base.suspention.receiveShadow = crane.base.suspention.castShadow = true;
		crane.base.suspention.name = "crane_base_suspention_Z";

		// middle X suspension mesh
		var suspension_middle_length = suspention_lenght - 2*wheel_radius - wheel_spacing/2;
		var suspension_middle_width = suspention_width + 2*wheel_height + 2* wheel_spacing;
		crane.base.suspention_middle = new Physijs.BoxMesh(
		new THREE.BoxGeometry( suspension_middle_width, suspention_height, suspension_middle_length),
		crane_material,
			500
		);
		crane.base.suspention_middle.receiveShadow = crane.base.suspention_middle.castShadow = true;
		crane.base.suspention_middle.name = "crane_base_suspention_X";
		crane.base.suspention_middle.position.z += suspention_lenght/2-suspension_middle_length/2;
		// conector
		var connector_width = 3;
		var connector_length = 1;
		var connector_height = 2;
		crane.base.connector = new Physijs.BoxMesh(
		new THREE.BoxGeometry( connector_width, connector_height, connector_length),
		crane_material,
			50
		);
		crane.base.connector.position.set(0,0,pos.z+suspention_lenght/2+connector_length/2);
		crane.base.connector.receiveShadow = crane.base.connector.castShadow = true;
		crane.base.connector.name = "crane_base_connector";
		// Top plane
		var suspension_plane_thickness = 0.5;
		crane.base.suspention_plane = new Physijs.BoxMesh(
		new THREE.BoxGeometry( suspension_middle_width, suspension_plane_thickness, suspention_lenght),
		crane_material,
			20
		);
		crane.base.suspention_plane.position.y += -suspension_plane_thickness/2 + suspention_height/2;
		crane.base.suspention_plane.receiveShadow = crane.base.suspention_plane.castShadow = true;
		crane.base.suspention_plane.name = "crane_base_suspention_plane";

		crane.base.suspention.add( crane.base.suspention_middle );
		crane.base.suspention.add( crane.base.suspention_plane );
		crane.base.suspention.add( crane.base.connector );
		crane.base.suspention.position.set(pos.x, pos.y-suspention_height/2, pos.z);

		// LEGS

		// leg1
		var leg_width = 0.5;
		var leg_length = suspention_height + suspension_plane_thickness + 1 - 0.2;
		crane.base.leg1 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( leg_width, leg_width, leg_length),
		crane_material,
			5
		);
		crane.base.leg1.position.set(pos.x+suspension_middle_width/2+leg_width/2, pos.y-leg_width/2, pos.z+suspention_lenght/2-leg_length/2);
		crane.base.leg1.receiveShadow = crane.base.leg1.castShadow = true;
		crane.base.leg1.name = "crane_base_leg1";
		scene.add(crane.base.leg1);

		// leg2
		crane.base.leg2 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( leg_width, leg_width, leg_length),
		crane_material,
			5
		);
		crane.base.leg2.position.set(pos.x+suspension_middle_width/2+leg_width/2, pos.y-leg_width/2, pos.z-suspention_lenght/2+leg_length/2);
		crane.base.leg2.receiveShadow = crane.base.leg2.castShadow = true;
		crane.base.leg2.name = "crane_base_leg2";
		scene.add(crane.base.leg2);

		// leg3
		crane.base.leg3 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( leg_width, leg_width, leg_length),
		crane_material,
			5
		);
		crane.base.leg3.position.set(pos.x-suspension_middle_width/2-leg_width/2, pos.y-leg_width/2, pos.z+suspention_lenght/2-leg_length/2);
		crane.base.leg3.receiveShadow = crane.base.leg3.castShadow = true;
		crane.base.leg3.name = "crane_base_leg3";
		scene.add(crane.base.leg3);

		// leg4
		crane.base.leg4 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( leg_width, leg_width, leg_length),
		crane_material,
			5
		);
		crane.base.leg4.position.set(pos.x-suspension_middle_width/2-leg_width/2, pos.y-leg_width/2, pos.z-suspention_lenght/2+leg_length/2);
		crane.base.leg4.receiveShadow = crane.base.leg4.castShadow = true;
		crane.base.leg4.name = "crane_base_leg4";
		scene.add(crane.base.leg4);

		// FRONT PART

		// middle Z suspension2 mesh
		var suspension2_height = 2.5;
		var suspension2_width = base_width -2;
		var suspension2_lenght = 4;
		crane.base.suspension2 = new Physijs.BoxMesh(
		new THREE.BoxGeometry( suspension2_width, suspension2_height, suspension2_lenght),
		crane_material,
			500
		);
		crane.base.suspension2.receiveShadow = crane.base.suspension2.castShadow = true;
		crane.base.suspension2.name = "crane_base_suspension2";

		// middle X suspension2 mesh
		var suspension2_middle_length = 0.5;
		var suspension2_middle_width = suspension2_width + 2*wheel_height + 2* wheel_spacing;
		crane.base.suspension2_middle = new Physijs.BoxMesh(
		new THREE.BoxGeometry( suspension2_middle_width, suspension2_height, suspension2_middle_length),
		crane_material,
			500
		);
		crane.base.suspension2_middle.receiveShadow = crane.base.suspension2_middle.castShadow = true;
		crane.base.suspension2_middle.name = "crane_base_suspension2_middle";
		crane.base.suspension2_middle.position.z+=suspension2_lenght/2-suspension2_middle_length/2;
		
		// Top
		var suspension2_top_thickness = suspension_plane_thickness + cyli_height + base_height;
		crane.base.suspension2_top = new Physijs.BoxMesh(
		new THREE.BoxGeometry( suspension2_middle_width, suspension2_top_thickness, suspension2_lenght),
		crane_material,
			20
		);
		crane.base.suspension2_top.position.y += suspension2_height/2 + cyli_height/2 + base_height/2 ;
		crane.base.suspension2_top.receiveShadow = crane.base.suspension2_top.castShadow = true;
		crane.base.suspension2_top.name = "crane_base_suspension2_top";

		crane.base.suspension2.add( crane.base.suspension2_middle );
		crane.base.suspension2.add( crane.base.suspension2_top );
		crane.base.suspension2.position.z += suspention_lenght/2+suspension2_lenght/2+connector_length;
		crane.base.suspention.add( crane.base.suspension2 );


		// BUILD VEHICLE
		vehicle = new Physijs.Vehicle(crane.base.suspention, new Physijs.VehicleTuning(
			6.88,
			0.83,
			0.9,
			500,
			10.5,
			6000
		));
		scene.add( vehicle );

		for ( var i = 0; i < 4; i++ ) {
			vehicle.addWheel(
				wheel,
				wheel_material,
				new THREE.Vector3(
						i % 2 === 0 ? -suspention_width/2 -wheel_height/2 - wheel_spacing : suspention_width/2 + wheel_height/2 + wheel_spacing,
						-1,
						i < 2 ? suspention_lenght/2+connector_length+suspension2_lenght-suspension2_middle_length-wheel_radius-wheel_spacing/2 : -suspention_lenght/2+wheel_radius
				),
				new THREE.Vector3( 0, -1, 0 ),
				new THREE.Vector3( -1, 0, 0 ),
				0.5,
				1.5,
				i < 2 ? false : true
			);
		}
		input = {
			power: null,
			direction: null,
			reverse: null,
			parking_break: false,
			steering: 0
		};
		
			
		//CONSTRAINS

		// rotate
		crane.rotation_constrain = new Physijs.HingeConstraint(
	    crane.cylinder, // First object to be constrained
	    crane.base.bottom,
	    new THREE.Vector3(pos.x,pos.y + cyli_height/2, pos.z ), // point in the scene to apply the constraint
	    new THREE.Vector3( 0, 1, 0 )
		);
		scene.addConstraint( crane.rotation_constrain );
		crane.rotation_constrain.setLimits(
		    0, // minimum angle of motion, in radians
		    0, // maximum angle of motion, in radians
		    0, // applied as a factor to constraint error
		    0, // controls bounce at limit (0.0 == no bounce)
		);
		
		// base to the suspension
		crane.baseAndSuspension = new Physijs.DOFConstraint(
		    crane.cylinder, // First object to be constrained
		    crane.base.suspention, // OPTIONAL second object - if omitted then physijs_mesh_1 will be constrained to the scene
		    new THREE.Vector3( pos.x, pos.y, pos.z ) // point in the scene to apply the constraint
		);
		scene.addConstraint( crane.baseAndSuspension );
		crane.baseAndSuspension.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.baseAndSuspension.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// first arm to base
		crane.baseAndFirstArm = new Physijs.DOFConstraint(
	    crane.arm1, // First object to be constrained
	    crane.base.bottom, // OPTIONAL second object - if omitted then physijs_mesh_1 will be constrained to the scene
	    new THREE.Vector3(pos.x, pos.y+cyli_height+base_height,pos.z+base_length/2), // point in the scene to apply the constraint
		);
		scene.addConstraint( crane.baseAndFirstArm );
		crane.baseAndFirstArm.setAngularLowerLimit( new THREE.Vector3( -Math.PI / 50, 0, 0 ) );
		crane.baseAndFirstArm.setAngularUpperLimit( new THREE.Vector3( -Math.PI / 50, 0, 0 ) );

		// first arm to second
		crane.firstAndSecondArm = new Physijs.DOFConstraint(
			crane.arm2,
		    crane.arm1,
		    new THREE.Vector3( pos.x, pos.y+cyli_height+base_height,pos.z+base_length/2+arm1_length )
		);
		scene.addConstraint( crane.firstAndSecondArm );
		crane.firstAndSecondArm.setAngularLowerLimit( new THREE.Vector3( 0/*Math.PI / 3*/, 0, 0 ) );
		crane.firstAndSecondArm.setAngularUpperLimit( new THREE.Vector3( 0/*Math.PI / 3*/, 0, 0 ) );

		// second arm to third
		crane.secondAndThirdArm = new Physijs.DOFConstraint(
			crane.arm3,
		    crane.arm2,
		    new THREE.Vector3( pos.x, pos.y+cyli_height+base_height,pos.z+base_length/2+arm1_length+arm2_length )
		);
		scene.addConstraint( crane.secondAndThirdArm );
		crane.secondAndThirdArm.setAngularLowerLimit( new THREE.Vector3( 0/*Math.PI / 5*/, 0, 0 ) );
		crane.secondAndThirdArm.setAngularUpperLimit( new THREE.Vector3( 0/*Math.PI / 5*/, 0, 0 ) );

		// third arm and ball
		
		crane.clawAndThirdArm = new Physijs.ConeTwistConstraint(
		    crane.claw.ball, // First object to be constrained
		    crane.arm3, // Second object to be constrained
		    new THREE.Vector3( pos.x,pos.y+cyli_height+base_height+arm3_size/2,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius ), // point in the scene to apply the constraint
		);
		scene.addConstraint( crane.clawAndThirdArm );
		crane.clawAndThirdArm.setLimit( Math.PI / 4, Math.PI / 4, Math.PI / 4 );

		// first claw to ball
		crane.claw.first_constrain = new Physijs.DOFConstraint(
			crane.claw.claw1,
		    crane.claw.ball,
		    new THREE.Vector3( pos.x-0.6,pos.y+cyli_height+base_height+arm3_size/2,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+0.8 )
		);
		scene.addConstraint( crane.claw.first_constrain );
		crane.claw.first_constrain.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.claw.first_constrain.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// second claw to ball
		crane.claw.second_constrain = new Physijs.DOFConstraint(
			crane.claw.claw2,
		    crane.claw.ball,
		    new THREE.Vector3( pos.x+0.6,pos.y+cyli_height+base_height+arm3_size/2,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+0.8 )
		);
		scene.addConstraint( crane.claw.second_constrain );
		crane.claw.second_constrain.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.claw.second_constrain.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// third claw to ball
		crane.claw.third_constrain = new Physijs.DOFConstraint(
			crane.claw.claw3,
		    crane.claw.ball,
		    new THREE.Vector3( pos.x,pos.y+cyli_height+base_height+arm3_size/2-0.6,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+0.8 )
		);
		scene.addConstraint( crane.claw.third_constrain );
		crane.claw.third_constrain.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.claw.third_constrain.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// fourth claw to ball
		crane.claw.fourth_constrain = new Physijs.DOFConstraint(
			crane.claw.claw4,
		    crane.claw.ball,
		    new THREE.Vector3( pos.x,pos.y+cyli_height+base_height+arm3_size/2+0.6,pos.z+base_length/2+arm1_length+arm2_length+arm3_length+sphere_radius+0.8 )
		);
		scene.addConstraint( crane.claw.fourth_constrain );
		crane.claw.fourth_constrain.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.claw.fourth_constrain.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// leg1 to base
		crane.leg1ToBase = new Physijs.DOFConstraint(
			crane.base.leg1,
		    crane.base.suspention,
		    new THREE.Vector3( pos.x+suspension_middle_width/2+leg_width/2, pos.y-leg_width/2, pos.z+suspention_lenght/2-leg_width/2 )
		);
		scene.addConstraint( crane.leg1ToBase );
		crane.leg1ToBase.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.leg1ToBase.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// leg2 to base
		crane.leg2ToBase = new Physijs.DOFConstraint(
			crane.base.leg2,
		    crane.base.suspention,
		    new THREE.Vector3( pos.x+suspension_middle_width/2+leg_width/2, pos.y-leg_width/2, pos.z-suspention_lenght/2+leg_width/2 )
		);
		scene.addConstraint( crane.leg2ToBase );
		crane.leg2ToBase.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.leg2ToBase.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// leg3 to base
		crane.leg3ToBase = new Physijs.DOFConstraint(
			crane.base.leg3,
		    crane.base.suspention,
		    new THREE.Vector3( pos.x-suspension_middle_width/2-leg_width/2, pos.y-leg_width/2, pos.z+suspention_lenght/2-leg_width/2 )
		);
		scene.addConstraint( crane.leg3ToBase );
		crane.leg3ToBase.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.leg3ToBase.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );

		// leg4 to base
		crane.leg4ToBase = new Physijs.DOFConstraint(
			crane.base.leg4,
		    crane.base.suspention,
		    new THREE.Vector3( pos.x-suspension_middle_width/2-leg_width/2, pos.y-leg_width/2, pos.z-suspention_lenght/2+leg_width/2 )
		);
		scene.addConstraint( crane.leg4ToBase );
		crane.leg4ToBase.setAngularLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
		crane.leg4ToBase.setAngularUpperLimit( new THREE.Vector3( 0, 0, 0 ) );


		//makePoint(pos.x+suspension_middle_width/2+leg_width/2, pos.y-leg_width/2, pos.z+suspention_lenght/2-leg_width/2);
	}
	function inputDetect(){
		document.addEventListener(
			'keydown',
			function( ev ) {
				switch( ev.keyCode ) {
					case 100: // left
						input.direction = 1;
						break;
					case 104: // forward
						input.power = 200;
						break;
					case 102: // right
						input.direction = -1;
						break;
					case 98: // reverse
						input.power = -100;
						break;
					case 101: // break
						input.break = true;
						break;
					case 80: // parking break
						if(input.parking_break){
							input.parking_break = false;
							document.getElementById( 'break' ).innerHTML = "OFF";
						}else{
							input.parking_break = true;
							document.getElementById( 'break' ).innerHTML = "ON";
						}
						break;
					case 107: // + legs up
						crane.leg1ToBase.configureAngularMotor( 0, - Math.PI / 2.01 , 0, 0.3, 10000 );
						crane.leg2ToBase.configureAngularMotor( 0, 0 , Math.PI / 2.01, -0.3, 10000 );
						crane.leg3ToBase.configureAngularMotor( 0, - Math.PI / 2.01 , 0, 0.3, 10000 );
						crane.leg4ToBase.configureAngularMotor( 0, 0 , Math.PI / 2.01, -0.3, 10000 );
						crane.leg1ToBase.enableAngularMotor( 0 );
						crane.leg2ToBase.enableAngularMotor( 0 );
						crane.leg3ToBase.enableAngularMotor( 0 );
						crane.leg4ToBase.enableAngularMotor( 0 );
						break;
					case 109: // - legs down
						crane.leg1ToBase.configureAngularMotor( 0, - Math.PI / 2.01 , 0, -0.3, 10000 );
						crane.leg2ToBase.configureAngularMotor( 0, 0 , Math.PI / 2.01, 0.3, 10000 );
						crane.leg3ToBase.configureAngularMotor( 0, - Math.PI / 2.01 , 0, -0.3, 10000 );
						crane.leg4ToBase.configureAngularMotor( 0, 0 , Math.PI / 2.01, 0.3, 10000 );
						crane.leg1ToBase.enableAngularMotor( 0 );
						crane.leg2ToBase.enableAngularMotor( 0 );
						crane.leg3ToBase.enableAngularMotor( 0 );
						crane.leg4ToBase.enableAngularMotor( 0 );
						break;
					case 90:
						// Z (rotate left)
						RotationUnlock();
						crane.rotation_constrain.enableAngularMotor( -0.2, 2000 );
						break;
					case 88:
						// X (rotate right)
						RotationUnlock();
						crane.rotation_constrain.enableAngularMotor( 0.2, 2000 );
						break;
					case 81:
						// Q (move first arm up)
						crane.baseAndFirstArm.configureAngularMotor( 0, - Math.PI / 2.2 , 0, -0.4, 8000 );
						crane.baseAndFirstArm.enableAngularMotor( 0 );						
						break;
					case 65:
						// A (move first arm down)
						crane.baseAndFirstArm.configureAngularMotor( 0, - Math.PI / 2.2 , 0, 0.2, 8000 );
						crane.baseAndFirstArm.enableAngularMotor( 0 );	
						break;
					case 87:
						// W (move second arm up)
						crane.firstAndSecondArm.configureAngularMotor( 0, 0 , Math.PI / 2.2, -0.3, 8000 );
						crane.firstAndSecondArm.enableAngularMotor( 0 );	
						break;
					case 83:
						// S (move second arm down)
						crane.firstAndSecondArm.configureAngularMotor( 0, 0 , Math.PI / 2.2, 0.2, 8000 );
						crane.firstAndSecondArm.enableAngularMotor( 0 );
						break;
					case 69:
						// E (move third arm up)
						crane.secondAndThirdArm.configureAngularMotor( 0, 0 , Math.PI / 1.5, -0.2, 2000 );
						crane.secondAndThirdArm.enableAngularMotor( 0 );
						break;
					case 68:
						// D (move third arm down)
						crane.secondAndThirdArm.configureAngularMotor( 0, 0 , Math.PI / 1.5, 0.2, 2000 );
						crane.secondAndThirdArm.enableAngularMotor( 0 );
						break;
					case 82:
						// R (open claw)
						crane.claw.first_constrain.configureAngularMotor( 1, -Math.PI / 2.5 , 0.02, -0.6, 1000 );
						crane.claw.second_constrain.configureAngularMotor( 1, - 0.02, Math.PI / 2.5, 0.6, 1000 );
						crane.claw.third_constrain.configureAngularMotor( 0, - 0.02, Math.PI / 2.5, 0.6, 1000 );
						crane.claw.fourth_constrain.configureAngularMotor( 0, -Math.PI / 2.5 ,  0.02, -0.6, 1000 );
						crane.claw.first_constrain.enableAngularMotor( 1 );
						crane.claw.second_constrain.enableAngularMotor( 1 );
						crane.claw.third_constrain.enableAngularMotor( 0 );
						crane.claw.fourth_constrain.enableAngularMotor( 0 );
						break;
					case 70:
						// F (close claw)
						crane.claw.first_constrain.configureAngularMotor( 1, -Math.PI / 2.5 ,  0.02, 0.6, 1000 );
						crane.claw.second_constrain.configureAngularMotor( 1, - 0.02, Math.PI / 2.5, -0.6, 1000 );
						crane.claw.third_constrain.configureAngularMotor( 0, - 0.02, Math.PI / 2.5, -0.6, 1000 );
						crane.claw.fourth_constrain.configureAngularMotor( 0, -Math.PI / 2.5 ,  0.02, 0.6, 1000 );
						crane.claw.first_constrain.enableAngularMotor( 1 );
						crane.claw.second_constrain.enableAngularMotor( 1 );
						crane.claw.third_constrain.enableAngularMotor( 0 );
						crane.claw.fourth_constrain.enableAngularMotor( 0);
						break;
				}
			}
		);

		document.addEventListener(
			'keyup',
			function( ev ) {
				switch( ev.keyCode ) {
					case 100: // left
						input.direction = null;
						break;
					case 104: // forward
						input.power = null;
						break;
					case 102: // right
						input.direction = null;
						break;
					case 98: // break
						input.power = null;
						break;
					case 101: // reverse
						input.break = null;
						break;
					case 107: // legs up
						//setXLock(crane.leg1ToBase);
						//crane.leg1ToBase.disableAngularMotor( 0 );
						break;
					case 109: // legs down
						//setXLock(crane.leg1ToBase);
						//crane.leg1ToBase.disableAngularMotor( 0 );
						break;
					case 90:
						// Z (rotate left)
						RotationLock();
						crane.rotation_constrain.disableMotor();
						break;	
					case 88:
						// X (rotate right)
						RotationLock();
						crane.rotation_constrain.disableMotor();
						break;
					
					case 81:
						// Q
						setXLock(crane.baseAndFirstArm);
						crane.baseAndFirstArm.disableAngularMotor(0);
						break;
					
					case 65:
						// A
						setXLock(crane.baseAndFirstArm);
						crane.baseAndFirstArm.disableAngularMotor(0);
						break;
					case 87:
						// W (move second arm up)
						setXLock(crane.firstAndSecondArm);
						crane.firstAndSecondArm.disableAngularMotor( 0 );	
						break;
					case 83:
						// S (move second arm down)
						setXLock(crane.firstAndSecondArm);
						crane.firstAndSecondArm.disableAngularMotor( 0 );
						break;
					case 69:
						// E (move third arm up)
						setXLock(crane.secondAndThirdArm);
						crane.secondAndThirdArm.disableAngularMotor( 0 );
						break;
					case 68:
						// D (move third arm down)
						setXLock(crane.secondAndThirdArm);
						crane.secondAndThirdArm.disableAngularMotor( 0 );
						break;
					case 82:
						// R (open claw)
						setYLock(crane.claw.first_constrain);
						setYLock(crane.claw.second_constrain);
						setXLock(crane.claw.third_constrain);
						setXLock(crane.claw.fourth_constrain);
						crane.claw.first_constrain.disableAngularMotor( 1 );
						crane.claw.second_constrain.disableAngularMotor( 1 );
						crane.claw.third_constrain.disableAngularMotor( 0 );
						crane.claw.fourth_constrain.disableAngularMotor( 0 );
						break;
					case 70:
						// F (close claw)
						setYLock(crane.claw.first_constrain);
						setYLock(crane.claw.second_constrain);
						setXLock(crane.claw.third_constrain);
						setXLock(crane.claw.fourth_constrain);
						crane.claw.first_constrain.disableAngularMotor( 1 );
						crane.claw.second_constrain.disableAngularMotor( 1 );
						crane.claw.third_constrain.disableAngularMotor( 0 );
						crane.claw.fourth_constrain.disableAngularMotor( 0 );
						break;
				}
			}
		);
	}
	function makePoint(x,y,z){
		var geometry = new THREE.SphereGeometry(0.1,1,1);
		var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
		var sphere = new THREE.Mesh( geometry, material );
		scene.add(sphere);
		sphere.position.set(x,y,z);
	}
	window.onload = initScene;