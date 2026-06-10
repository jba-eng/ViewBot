<script lang="ts">
	import { socket } from '../background.js';

	import { fade } from 'svelte/transition';
	import axios from 'axios';


	import Message from './Message.svelte';
	import ReminderMessage from './ReminderMessage.svelte';
	let showMessage = false;
	let secondButton = false;
	let messageTitle = ''
  	let messageText = '';
	let messageButton1Text = '';
	let messageButton2Text = ''

	let showReminderMessage = false;
	let reminderMessageTitle = ''
  	let reminderMessageText = '';
	let reminderImage = '';
	let reminderMessageButton1Text = '';
	let reminderMessageButton2Text = ''
	let reminderMessageButton3Text = ''

	let messageOnDecision = (decisionIndex: number) => {
		socket.emit("decisionTaken", decisionIndex)
	}

	let onClose = () => {
		showMessage = false;
		showReminderMessage = false;
	}

	socket.on('showMessage', (messageData) => {
		showMessage = true;

		messageTitle = messageData.title;
		messageText = messageData.text;
		messageButton1Text = messageData.button1text;
		messageButton2Text = messageData.button2text;
		secondButton = messageData.secondButton;
	});

	socket.on('showReminderMessage', (messageData) => {
		showReminderMessage = true;

		reminderMessageTitle = messageData.title;
		reminderMessageText = messageData.text;
		reminderImage = messageData.image;
		reminderMessageButton1Text = messageData.button1text;
		reminderMessageButton2Text = messageData.button2text;
		reminderMessageButton3Text = messageData.button3text;
	});

	/*let cpu_load = '0';
	let memory_usage = '0';
	let temp = '0';

	let cpu_color = 'gray';
	let memory_color = 'gray';
	let temp_color = 'gray';
	let connected_color = 'gray';*/

	let showNavbar = true;

	/*function changeHealth(health: any) {
		if (!health || !health.load) return;

		cpu_load = health.load.currentLoad.toFixed(1);
		memory_usage = ((health.memory.active / health.memory.total) * 100).toFixed(1);
		temp = health.temperature.main?.toFixed(1) || '0';

		if (parseInt(cpu_load) < 45) {
			cpu_color = 'green';
		} else if (parseInt(cpu_load) < 75) {
			cpu_color = 'orange';
		} else {
			cpu_color = 'red';
		}

		if (parseInt(memory_usage) < 50) {
			memory_color = 'green';
		} else if (parseInt(memory_usage) < 85) {
			memory_color = 'orange';
		} else {
			memory_color = 'red';
		}

		if (parseInt(temp) < 55) {
			temp_color = 'green';
		} else if (parseInt(temp) < 80) {
			temp_color = 'orange';
		} else {
			temp_color = 'red';
		}

		connected_color = 'green';
	}

	socket.on('disconnect', () => {
		cpu_load = 'unknown';
		memory_usage = 'unknown';
		temp = 'unknown ';

		cpu_color = 'black';
		memory_color = 'black';
		temp_color = 'black';
		connected_color = 'black';
	});

	socket.on('health', (newHealth) => {
		changeHealth(newHealth.main);
	});*/

	let latestHref = window.location.href;

	let location = new URL(window.location.href);
	let no_navbar = location.searchParams.get('no_navbar');
	let pLocation = location.pathname.substring(1);

	setInterval(() => {
		if (latestHref !== window.location.href) {
			actualNavbar = window.innerHeight < window.innerWidth;

			latestHref = window.location.href;
			location = new URL(window.location.href);
			no_navbar = location.searchParams.get('no_navbar');
			pLocation = location.pathname.substring(1);
		}
	}, 100);

	/*if (no_navbar !== 'true' && pLocation !== 'login') {
		axios
			.get('/api/health?minimal=true&multiple=false')
			.then((data) => {
				showNavbar = true;

				changeHealth(data.data.main);
			})
			.catch(() => {
				cpu_load = 'unknown';
				memory_usage = 'unknown';
				temp = 'unknown ';

				cpu_color = 'black';
				memory_color = 'black';
				temp_color = 'black';
				connected_color = 'red';
			});
	}*/

	showNavbar = true;

	let el = document.querySelector('#slot');
	let scrollpos_str = localStorage.getItem(`scrollpos-${window.location.href.split('://')[1]}`);
	let scrollpos = scrollpos_str ? parseInt(scrollpos_str) : 0;
	el?.scrollTo(0, scrollpos);

	window.onbeforeunload = function () {
		if (el)
			localStorage.setItem(
				`scrollpos-${window.location.href.split('://')[1]}`,
				el.scrollTop.toString()
			);
	};

	let actualNavbar = window.innerHeight < window.innerWidth;

	let VRS = 'V?.?.?';
	let latestVRS = 'V?.?.?';

	axios
		.get('/api/version')
		.then((data) => {
			VRS = data.data;
		})
		.catch(() => {});

	axios
		.get('/api/latest_version')
		.then((data) => {
			latestVRS = data.data;
		})
		.catch(() => {});

	function hideSidebar() {
		actualNavbar = !actualNavbar;
	}

	let statusArray = ['Start Workers', 'Checking Proxies', 'Stop Workers'];
	let workersStatus = 0;
	$: workersTitle = statusArray[workersStatus];

	axios
		.get('/api/workingStatus')
		.then((data) => {
			workersStatus = data.data;
		})
		.catch(() => {});

	socket.on('workerStatusChanged', (newStatus) => {
		workersStatus = newStatus;
	});

	let bounce = Date.now() - 3000;

	function start_workers() {
		if (bounce + 1000 < Date.now()) {
			bounce = Date.now();

			workersStatus += 1;
			if (workersStatus >= 2) workersStatus = 0;

			axios.post('/api/workingStatus', { status: workersStatus });
		}
	}

	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;

	console.log = (...args) => {
		socket.emit('log_message', { type: 'info', message: args.join(' ') });
		originalConsoleLog(...args);
	};

	console.error = (...args) => {
		socket.emit('log_message', { type: 'error', message: args.join(' ') });
		originalConsoleError(...args);
	};

	console.warn = (...args) => {
		socket.emit('log_message', { type: 'warn', message: args.join(' ') });
		originalConsoleWarn(...args);
	};

	window.onerror = function (message, source, lineno, colno, error) {
		let msg = `${message}, ${source}, ${lineno}, ${colno}`;
		socket.emit('log_message', { type: 'error', message: msg });

		return false;
	};

	window.addEventListener('unhandledrejection', function (event) {
		socket.emit('log_message', { type: 'error', message: `Promise unhandled rejection: ${event.reason}` });
	});

	let isFreeLoggedIn = false;
	let isPremiumLoggedIn = false;
	let checkedStatus = false;

	function navigate(){
		if(!(isFreeLoggedIn || isPremiumLoggedIn) && checkedStatus){
			if(!window.location.href.includes("/manage_key")){
				window.location.href = "/manage_key";
			}
		}
	}

	async function checkPremiumLoginStatus(){
		let logedInData = (await axios.get(`/api/patreon_status`)).data
		isPremiumLoggedIn = logedInData.status;
		checkedStatus = logedInData.checkedStatus;
	}

	async function checkFreeLoginStatus(){
		let logedInData = (await axios.get(`/api/free_status`)).data
		isFreeLoggedIn = logedInData.status;
	}

	setInterval(async () => {
		await checkFreeLoginStatus().catch(err => {});
		await checkPremiumLoginStatus().catch(err => {});
		navigate();
	}, 2500);
</script>

<ReminderMessage
  text={reminderMessageText}
  button1Text={reminderMessageButton1Text}
  button2Text={reminderMessageButton2Text}
  button3Text={reminderMessageButton3Text}
  title={reminderMessageTitle}
  showMessage={showReminderMessage}
  image={reminderImage}
  onDecision={messageOnDecision}
  onClose={onClose}
/>

<Message
  text={messageText}
  button1Text={messageButton1Text}
  button2Text={messageButton2Text}
  title={messageTitle}
  showMessage={showMessage}
  secondButton={secondButton}
  onDecision={messageOnDecision}
  onClose={onClose}
/>

<div id="main_div">
	{#if showNavbar}
		<div class="navbar">
			<div id="navbar-buttons">
				<div class="branding_container">
					<img src="/images/logo.png" alt="logo" class="logo_image" />
					<span class="brand_name">
						<span class="brand_white">Youtube Watch</span> <span class="brand_red">Bot</span>
					</span>
				</div>

				<div class="nav_center_group">
					<a class="nav_button" href="/" class:active={pLocation == ''}>
						<img src="/svgs/dashboard.svg" alt="dashboard svg" class="nav_image" />
						<span>Dashboard</span>
					</a>
					<a class="nav_button" href="/proxies" class:active={pLocation == 'proxies'}>
						<img src="/svgs/proxies.svg" alt="proxies svg" class="nav_image" />
						<span>Proxies</span>
					</a>
					<a class="nav_button" href="/videos" class:active={pLocation == 'videos'}>
						<img src="/svgs/videos.svg" alt="videos svg" class="nav_image" />
						<span>Videos</span>
					</a>

					<button id="start_workers" class="worker_{workersStatus}" on:click={start_workers}>
						{workersTitle}
					</button>

					<a class="nav_button" href="/settings" class:active={pLocation == 'settings'}>
						<img src="/svgs/settings.svg" alt="settings svg" class="nav_image" />
						<span>Settings</span>
					</a>
					<a class="nav_button" href="/user-agents" class:active={pLocation == 'user-agents'}>
						<img src="/svgs/settings.svg" alt="user agents svg" class="nav_image" />
						<span>User Agents</span>
					</a>
				</div>

				<p id="version_container" class={latestVRS == VRS ? 'latest_version' : 'old_version'}>
					version {VRS}
				</p>
			</div>

			<div id="slot" class="slot-color">
				<slot />
			</div>
		</div>
	{:else}
		<div id="slot">
			<slot />
		</div>
	{/if}
</div>

<style lang="scss">
	.latest_version {
		color: #ffffff;
	}

	.old_version {
		color: #e50914;
	}

	#start_workers {
		border-radius: 30px;
		border: 0;
		font-weight: 700;
		font-size: 14px;
		padding: 8px 24px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		box-sizing: border-box;
		margin: 0;
		flex-shrink: 0;
	}

	.worker_0 {
		background-color: #e50914;
		color: #ffffff;
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
	}
	.worker_0:hover {
		background-color: #c20710;
		box-shadow: 0 6px 16px rgba(229, 9, 20, 0.45);
	}

	.worker_1 {
		background-color: #e50914;
		color: #ffffff;
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
	}
	.worker_1:hover {
		background-color: #c20710;
		box-shadow: 0 6px 16px rgba(229, 9, 20, 0.45);
	}

	.worker_2 {
		background-color: #e50914;
		color: #ffffff;
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
	}
	.worker_2:hover {
		background-color: #c20710;
		box-shadow: 0 6px 16px rgba(229, 9, 20, 0.45);
	}

	#version_container {
		display: flex;
		align-items: center;
		font-weight: 600;
		font-size: 13px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		padding: 4px 12px;
		border-radius: 15px;
		margin: 0;
		position: absolute;
		right: 24px;
	}

	@media only screen and (max-width: 768px) {
		#start_workers {
			font-size: 12px;
			padding: 6px 16px;
		}

		#version_container {
			font-size: 11px;
			padding: 3px 8px;
		}
	}

	.navbar {
		display: flex;
		flex-direction: column;
		height: 100vh;
		min-height: 100vh;
		max-height: 100vh;
		width: 100vw;
		background-color: transparent;
	}

	#navbar-buttons {
		height: 60px;
		min-height: 60px;
		max-height: 60px;
		background-color: #1e2225;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 24px;
		box-sizing: border-box;
		width: 100%;
		position: relative;
	}

	.nav_center_group {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.branding_container {
		display: flex;
		align-items: center;
		gap: 10px;
		position: absolute;
		left: 24px;
	}

	.logo_image {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		object-fit: contain;
	}

	.brand_name {
		font-size: 15px;
		font-weight: 700;
		white-space: nowrap;
		letter-spacing: 0.2px;
	}

	.brand_white {
		color: #ffffff;
	}

	.brand_red {
		color: #e50914;
	}

	.nav_button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border-radius: 8px;
		color: #a0aec0;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s ease;
		border: 1px solid transparent;
		background-color: transparent;
		cursor: pointer;
	}

	.nav_button:hover {
		background-color: rgba(255, 255, 255, 0.04);
		color: #ffffff;
	}

	.nav_button.active {
		background: linear-gradient(135deg, rgba(229, 9, 20, 0.15) 0%, rgba(229, 9, 20, 0.03) 100%);
		border: 1px solid rgba(229, 9, 20, 0.25);
		color: #e50914;
		font-weight: 600;
	}

	.nav_button.active .nav_image {
		filter: brightness(0) invert(1) drop-shadow(0 0 4px rgba(229, 9, 20, 0.6)) !important;
		opacity: 1;
	}

	.nav_image {
		width: 16px;
		height: 16px;
		object-fit: contain;
		filter: brightness(0) invert(1);
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.nav_button:hover .nav_image {
		opacity: 1;
	}

	#main_div {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		display: flex;
	}

	.slot-color {
		background-color: #272c30;
		flex-grow: 1;
		width: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}

	#slot {
		flex: 1;
	}
</style>
