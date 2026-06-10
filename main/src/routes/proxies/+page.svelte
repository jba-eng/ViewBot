<script lang="ts">
	import GoodDisplay from '../../proxy_containers/good.svelte';
	import BadDisplay from '../../proxy_containers/bad.svelte';
	import AllDisplay from '../../proxy_containers/all.svelte';

	import axios from 'axios';
	import { opts, dataChanged, newData, socket } from '../../background.js';

	let data = opts;
	dataChanged((newData: any) => (data = newData));
	$: newData(data);

	let good_proxies: string[] = [];
	let bad_proxies: string[] = [];
	let untested_proxies: string[] = [];

	let proxies: string[] = [];
	let proxies_raw = '';
	let single_proxy = '';
	let import_file_input: HTMLInputElement;
	let testing = false;

	axios
		.get('/api/proxies')
		.then((data) => {
			proxies = data.data;
			proxies_raw = proxies.join('\n');
		})
		.catch(() => {});

	axios
		.get('/api/proxiesStats')
		.then((data) => {
			good_proxies = data.data.good;
			untested_proxies = data.data.untested;
			bad_proxies = data.data.bad;
		})
		.catch(() => {});

	function formatProxies(e: any) {
		let newProxies = e.target.value;

		proxies = newProxies.split('\n');

		publishProxies(proxies);
	}

	function publishProxies(newProxies: string[]) {
		socket.emit('proxies', newProxies);
	}

	function addSingleProxy() {
		const p = single_proxy.trim();
		if (!p) return;
		proxies = [...proxies, p];
		proxies_raw = proxies.join('\n');
		publishProxies(proxies);
		single_proxy = '';
	}

	function importProxiesFromFile(files: FileList | null) {
		if (!files || !files[0]) return;
		const reader = new FileReader();
		reader.onload = (e: any) => {
			const text = String(e.target?.result || '');
			const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
			proxies = [...proxies, ...lines];
			proxies_raw = proxies.join('\n');
			publishProxies(proxies);
		};
		reader.readAsText(files[0]);
	}

	async function testProxies() {
		testing = true;
		try {
			await axios.post('/api/workingStatus', { status: 1 });
		} catch (e) {}
		setTimeout(() => (testing = false), 5000);
	}

	function removeFailedProxies() {
		const badSet = new Set(bad_proxies.map((b: any) => b.url || b));
		proxies = proxies.filter((p) => !badSet.has(p));
		proxies_raw = proxies.join('\n');
		publishProxies(proxies);
	}

	socket.on('proxiesChanged', (newProxies) => {
		proxies = newProxies;
		proxies_raw = proxies.join('\n');
	});

	socket.on('newProxiesStats', (newProxies) => {
		good_proxies = newProxies.good;
		untested_proxies = newProxies.untested;
		bad_proxies = newProxies.bad;
	});

	let displayingProxyType = 'all';
	$: colorFromDisplay =
		(displayingProxyType == 'all' && 'gray') ||
		(displayingProxyType == 'bad' && 'red') ||
		'white';
</script>

<div id="local_container">
	<div id="form_container">
		<div class="proxies_grid">
			<div class="proxies_settings_col">
				<div class="settings_container container_gray">
					<h1 class="setting_discloser">Proxy settings</h1>
					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">
								Timeout:
								<span class="info-icon" data-tooltip="How much to wait before declaring proxy is nonfunctional?&#10;If set to 0 it will wait infinitely until it resolves/errors.&#10;Expected test time: {data.timeout * 3}s.&#10;It only tests bad/untested proxies. Please remove bad proxies manually.">ⓘ</span>
							</h2>

							<input class="setting_text" type="number" bind:value={data.timeout} />
						</div>
					</div>

					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">
								Default proxy protocol:
								<span class="info-icon" data-tooltip="Default proxy protocol to use if one isn't provided">ⓘ</span>
							</h2>

							<input class="setting_text" type="string" bind:value={data.default_proxy_protocol} />
						</div>
					</div>

					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">
								Accept all proxies:
								<span class="info-icon" data-tooltip="Should the application declare all proxies as functional?&#10;NOTE: THIS IS EXPERIMENTAL, USE IT AT YOUR OWN RISK! DO NOT REPORT ISSUES ABOUT IT.">ⓘ</span>
							</h2>

							<input
								class="setting_checkbox"
								type="checkbox"
								bind:checked={data.disable_proxy_tests}
							/>
						</div>
					</div>
				</div>

				<div class="settings_container container_gray" style="margin-top: 12px; padding-bottom: 12px;">
					<p class="proxy_title setting_discloser">Proxy list</p>
					<textarea class="setting_proxies" rows="6" value={proxies_raw} on:input={formatProxies} placeholder="protocol://ip:port or ip:port" />
					<div class="input_action_row">
						<input class="setting_text_field" type="text" bind:value={single_proxy} placeholder="Add single proxy" />
						<button class="action_btn" on:click={addSingleProxy}>Add</button>
					</div>
					<div class="input_action_row">
						<input bind:this={import_file_input} type="file" accept=".txt" style="display: none;" on:change={(e)=>importProxiesFromFile(e.target?.files)} />
						<button class="action_btn" style="width: 100%;" on:click={() => import_file_input?.click()}>Import TXT file</button>
					</div>
					<div class="input_action_row" style="margin-top: 12px;">
						<button class="action_btn primary_btn" on:click={testProxies} disabled={testing}>{testing ? 'Testing…' : 'Test proxies'}</button>
						<button class="action_btn danger_btn" on:click={removeFailedProxies}>Remove failed</button>
					</div>
				</div>
			</div>

			<div class="proxies_list_col">
				<div class="proxy_selector_container container_{colorFromDisplay}">
					<div id="proxy_type_selector">
						<button
							class="proxy_selector_button tab_{displayingProxyType == 'all'}"
							on:click={() => (displayingProxyType = 'all')}>All</button
						>
						<button
							class="proxy_selector_button tab_{displayingProxyType == 'good'}"
							on:click={() => (displayingProxyType = 'good')}>Good</button
						>
						<button
							class="proxy_selector_button tab_{displayingProxyType == 'bad'}"
							on:click={() => (displayingProxyType = 'bad')}>Bad</button
						>
					</div>

					<div id="proxy_display_container">
						{#if displayingProxyType == 'all'}
							<AllDisplay {good_proxies} {bad_proxies} {untested_proxies} />
						{:else if displayingProxyType == 'good'}
							<GoodDisplay {good_proxies} />
						{:else if displayingProxyType == 'bad'}
							<BadDisplay {bad_proxies} />
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.proxies_grid {
		display: grid;
		grid-template-columns: 420px 1fr;
		gap: 24px;
		align-items: start;
		width: 100%;
		height: calc(100vh - 110px);
		box-sizing: border-box;
	}

	.proxies_settings_col {
		display: flex;
		flex-direction: column;
		max-height: 100%;
		overflow-y: auto;
		padding-right: 4px;
	}

	.proxies_list_col {
		height: 100%;
		max-height: 100%;
		display: flex;
		flex-direction: column;
	}

	.proxy_selector_container {
		background-color: #1e2225;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
	}

	#proxy_display_container {
		overflow-y: auto;
		flex-grow: 1;
		margin-top: 12px;
		padding-right: 4px;
	}

	#proxy_type_selector {
		display: flex;
		gap: 8px;
		width: 100%;
	}

	.proxy_selector_button {
		flex: 1;
		padding: 10px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		border: 1px solid transparent;
		background-color: rgba(255, 255, 255, 0.03);
		color: #a0aec0;
		cursor: pointer;
		transition: all 0.2s;
	}

	.proxy_selector_button.tab_true {
		background-color: #e50914;
		color: #ffffff;
		border-color: #e50914;
	}

	.proxy_selector_button:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.container_gray {
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.container_white {
		border: 1px solid rgba(255, 255, 255, 0.4);
		box-shadow: 0 4px 20px rgba(255, 255, 255, 0.08);
	}

	.container_red {
		border: 1px solid rgba(229, 9, 20, 0.45);
		box-shadow: 0 4px 20px rgba(229, 9, 20, 0.1);
	}

	.same_line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
	}

	.input_action_row {
		display: flex;
		gap: 8px;
		width: 100%;
		align-items: center;
		margin-top: 8px;
	}

	.setting_proxies {
		width: 100%;
		background-color: #2d3139;
		color: #e2e8f0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
		box-sizing: border-box;
		resize: none;
		outline: none;
		margin-top: 8px;
	}

	.setting_proxies:focus {
		border-color: #e50914;
	}

	.setting_text_field {
		background-color: #2d3139;
		color: #e2e8f0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s;
		flex-grow: 1;
		width: 100%;
	}

	.setting_text_field:focus {
		border-color: #e50914;
	}

	.setting_text {
		background-color: #2d3139;
		color: #e2e8f0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s;
		max-width: 60%;
		flex-grow: 1;
		text-align: right;
	}

	.setting_text:focus {
		border-color: #e50914;
	}

	.action_btn {
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background-color: #2d3748;
		color: #e2e8f0;
		transition: all 0.2s;
	}

	.action_btn:hover {
		background-color: #4a5568;
		color: #ffffff;
	}

	.primary_btn {
		background: linear-gradient(135deg, #e50914 0%, #b3070f 100%);
		border: none;
		color: #ffffff;
		flex-grow: 1;
	}

	.primary_btn:hover {
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
	}

	.danger_btn {
		background-color: rgba(229, 9, 20, 0.1);
		color: #e50914;
		border-color: rgba(229, 9, 20, 0.25);
		flex-grow: 1;
	}

	.danger_btn:hover {
		background-color: #e50914;
		color: #ffffff;
	}

	.setting_checkbox {
		accent-color: #e50914;
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.setting_name {
		color: #cbd5e0;
		font-size: 13px;
		font-weight: 500;
		margin: 0;
	}

	.setting_div {
		margin: 8px 0;
		padding: 12px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.setting_discloser {
		text-align: left;
		color: #f7fafc;
		font-size: 14px;
		font-weight: 700;
		margin: 8px 0;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.settings_container {
		background-color: #1e2225;
		padding: 16px;
		border-radius: 12px;
	}

	#form_container {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
