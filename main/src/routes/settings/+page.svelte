<script lang="ts">
	import axios from 'axios';
	import Slider from '@bulatdashiev/svelte-slider';
	import { opts, dataChanged, newData } from '../../background.js';

	let data = opts;
	dataChanged((newData: any) => (data = newData));
	$: newData(data);

	$: changePort(data.server_port);
	$: changeAPIKey(data.api_key);

	let isLoggedIn = false;

	function changePort(newPort: number) {
		if (newPort < 1024) {
			data.server_port = 1024;
		}

		if (newPort > 65535) {
			data.server_port = 65535;
		}
	}

	async function checkLoginStatus(){
		let logedInData = (await axios.get(`/api/patreon_status`)).data
		isLoggedIn = logedInData.status;
	}

	function changeAPIKey(newAPIKey: string) {
		data.api_key = newAPIKey;
		checkLoginStatus();
	}

	checkLoginStatus();
	setInterval(() => {
		checkLoginStatus();
	}, 1000 * 15)
</script>

<div id="form_container">
	<div class="settings_grid">
		<!-- Column 1: Program Settings -->
		<div class="settings_col">
			<div class="settings_container container_white">
				<h1 class="setting_discloser">Program settings</h1>
				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Server port:
							<span class="info-icon" data-tooltip="What port should this server use? (Restart to apply)">ⓘ</span>
						</h2>

						<input
							class="setting_text"
							type="number"
							min="1024"
							max="65535"
							bind:value={data.server_port}
						/>
					</div>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Concurrency:
							<span class="info-icon" data-tooltip="The maximum amount of workers at the same time">ⓘ</span>
						</h2>

						<input class="setting_text" type="number" bind:value={data.concurrency} />
					</div>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Concurrency interval:
							<span class="info-icon" data-tooltip="How much to wait between spawning workers in seconds">ⓘ</span>
						</h2>

						<input class="setting_text" type="number" bind:value={data.concurrencyInterval} />
					</div>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Spawning on overload:
							<span class="info-icon" data-tooltip="Should it stop spawning workers when RAM/CPU is at 95%?">ⓘ</span>
						</h2>

						<input
							class="setting_checkbox"
							type="checkbox"
							bind:checked={data.stop_spawning_on_overload}
						/>
					</div>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Send reminders:
							<span class="info-icon" data-tooltip="Should it give occasional reminders?">ⓘ</span>
						</h2>

						<input
							class="setting_checkbox"
							type="checkbox"
							bind:checked={data.send_reminders}
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Column 2: Worker Settings -->
		<div class="settings_col">
			<div class="settings_container container_red">
				<h1 class="setting_discloser">Worker settings</h1>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Headless:
							<span class="info-icon" data-tooltip="Should the workers be invisible (Lower CPU/RAM usage)?">ⓘ</span>
						</h2>

						<input
							class="setting_checkbox"
							type="checkbox"
							bind:checked={data.headless}
						/>
					</div>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Allow AV1:
							<span class="info-icon" data-tooltip="Should the workers use AV1 if the video is encoded with 144p AV1?">ⓘ</span>
						</h2>

						<input
							class="setting_checkbox"
							type="checkbox"
							bind:checked={data.use_AV1}
						/>
					</div>
				</div>

				<div class="setting_div">
					<div class="same_line">
						<h2 class="setting_name">
							Auto skip ads:
							<span class="info-icon" data-tooltip="Should the workers automatically skip all ads?">ⓘ</span>
						</h2>

						<input
							class="setting_checkbox"
							type="checkbox"
							bind:checked={data.auto_skip_ads}
						/>
					</div>
				</div>

				{#if !data.auto_skip_ads}
					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">
								Skip ads (percent):
								<span class="info-icon" data-tooltip="After what percent to skip ads?">ⓘ</span>
							</h2>

							<Slider max="100" min="0" bind:value={data.skip_ads_after} range order />
						</div>
					</div>

					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">
								Skip ads (max sec):
								<span class="info-icon" data-tooltip="After how many seconds to forcefully skip?">ⓘ</span>
							</h2>

							<input class="setting_text" type="number" bind:value={data.max_seconds_ads} />
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.settings_grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
		align-items: start;
		width: 100%;
		box-sizing: border-box;
	}

	.settings_col {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.same_line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
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
		max-width: 50%;
		flex-grow: 1;
		text-align: right;
	}

	.setting_text:focus {
		border-color: #e50914;
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
		display: flex;
		align-items: center;
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

	.container_white {
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 4px 20px rgba(255, 255, 255, 0.05);
	}

	.container_red {
		border: 1px solid rgba(229, 9, 20, 0.35);
		box-shadow: 0 4px 20px rgba(229, 9, 20, 0.08);
	}

	#form_container {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	@media only screen and (max-width: 1024px) {
		.settings_grid {
			grid-template-columns: 1fr;
		}
	}

	:global(.slider) {
		--track-background: #2d3139 !important;
		--track-fill: #e50914 !important;
		--thumb-background: #ffffff !important;
		--thumb-border: 2px solid #e50914 !important;
	}
</style>
