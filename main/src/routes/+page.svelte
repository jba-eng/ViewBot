<script lang="ts">
	import axios from 'axios';
	import { Line } from 'svelte-chartjs';
	import 'chart.js/auto';

	import { opts, dataChanged, newData, socket } from '../background.js';
	let data = opts;
	dataChanged((newData: any) => (data = newData));
	$: newData(data);

	let currentWorkers: any[] = [];

	let totalViews = 0;
	let totalWatch_time = 0;
	let totalBandwidth = 0;

	let savedTimes: number[] = [];
	let viewData: number[] = [];
	let watch_time_Data: number[] = [];
	let bandwidthData: number[] = [];
	let timeYAxis: string[] = [];

	for (let i = 0; i < 24; i++) {
		savedTimes[i] = new Date().getDay();
		viewData[i] = 0;
		watch_time_Data[i] = 0;
		bandwidthData[i] = 0;
		timeYAxis[i] = `${i}:00`;
	}

	axios
		.get('/api/view_workers_stats')
		.then((data) => {
			currentWorkers = data.data;
		})
		.catch(() => {});

	axios
		.get('/api/view_stats')
		.then((data) => {
			let currentDay = new Date().getDay();

			for (let view of data.data.views) totalViews += view.value;
			for (let watch_time of data.data.watch_time) totalWatch_time += watch_time.value;
			for (let bandwidth of data.data.bandwidth) totalBandwidth += bandwidth.value;

			let views = data.data.views
				.filter((v: any) => Date.now() - 8.64e7 < v.date)
				.filter((v: any) => currentDay == new Date(v.date).getDay());

			let watch_times = data.data.watch_time
				.filter((v: any) => Date.now() - 8.64e7 < v.date)
				.filter((v: any) => currentDay == new Date(v.date).getDay());

			let bandwiths = data.data.bandwidth
				.filter((v: any) => Date.now() - 8.64e7 < v.date)
				.filter((v: any) => currentDay == new Date(v.date).getDay());

			for (let bandwidth of bandwiths) {
				let viewDate = new Date(bandwidth.date);

				bandwidthData[viewDate.getHours()] = bandwidth.value;
			}

			for (let view of views) {
				let viewDate = new Date(view.date);

				viewData[viewDate.getHours()] = view.value;
			}

			for (let watch_time of watch_times) {
				let viewDate = new Date(watch_time.date);

				watch_time_Data[viewDate.getHours()] = watch_time.value / 60 / 60;
			}

			bandwidthData = bandwidthData
			watch_time_Data = watch_time_Data;
			viewData = viewData;
		})
		.catch((err) => {
			console.log(err);
		});

	socket.on('increase_views_amount', () => {
		let currentDay = new Date().getDay();
		let currentHour = new Date().getHours();

		totalViews += 1;

		if (savedTimes[currentHour] !== currentDay) {
			savedTimes[currentHour] = currentDay;

			viewData[currentHour] = 1;
			watch_time_Data[currentHour] = 0;
		} else {
			viewData[currentHour] += 1;
		}
	});

	let lastReceived = Date.now() - 30000;
	let lastReceived2 = Date.now() - 30000;
	let bandwidth_gathered = 0;
	let watchtime_gathered = 0;

	socket.on('increase_watch_time_amount', (newAmount) => {
		watchtime_gathered += newAmount;
		totalWatch_time += newAmount;

		if (Date.now() - lastReceived > 30000) {
			lastReceived = Date.now();

			let currentDay = new Date().getDay();
			let currentHour = new Date().getHours();

			if (savedTimes[currentHour] !== currentDay) {
				savedTimes[currentHour] = currentDay;

				watch_time_Data[currentHour] = watchtime_gathered / 60 / 60;
			} else {
				watch_time_Data[currentHour] += watchtime_gathered / 60 / 60;
			}

			watchtime_gathered = 0;
		}
	});

	socket.on('increase_bandwidth_amount', (newAmount) => {
		bandwidth_gathered += newAmount;
		totalBandwidth += newAmount;

		if (Date.now() - lastReceived2 > 30000) {
			lastReceived2 = Date.now();

			let currentDay = new Date().getDay();
			let currentHour = new Date().getHours();

			if (savedTimes[currentHour] !== currentDay) {
				savedTimes[currentHour] = currentDay;

				bandwidthData[currentHour] = bandwidth_gathered;
			} else {
				bandwidthData[currentHour] += bandwidth_gathered;
			}

			bandwidth_gathered = 0;
		}
	});

	$: bandwidth_Graph = {
		labels: timeYAxis,
		datasets: [
			{
				label: 'Bandwidth',
				fill: false,
				data: bandwidthData,
				borderColor: '#e50914',
				backgroundColor: 'rgba(229, 9, 20, 0.05)',
				borderWidth: 2
			}
		]
	};

	$: viewsGraph = {
		labels: timeYAxis,
		datasets: [
			{
				label: 'Views',
				fill: false,
				data: viewData,
				borderColor: '#e50914',
				backgroundColor: 'rgba(229, 9, 20, 0.05)',
				borderWidth: 2
			}
		]
	};

	$: watch_time_Graph = {
		labels: timeYAxis,
		datasets: [
			{
				label: 'Watch time (Hours)',
				fill: false,
				data: watch_time_Data,
				borderColor: '#ffffff',
				backgroundColor: 'rgba(255, 255, 255, 0.05)',
				borderWidth: 2
			}
		]
	};

	$: defaultOpts = {
		maintainAspectRatio: false,
		animation: {
			duration: 0
		},
		scales: {
			y: {
				beginAtZero: true
			}
		}
	};

	socket.on('update_workers', (newWorkers) => {
		currentWorkers = newWorkers;
	});

	function getVideoInfo(id: string) {
		return new Promise((resolve, reject) => {
			axios
				.get(`/api/video_info?id=${encodeURIComponent(id)}`)
				.then((data) => resolve(data.data))
				.catch(reject);
		});
	}

	let videoInfo: any = {};
	let cachedResults: string[] = [];

	$: for (let worker of currentWorkers) {
		if (!cachedResults.includes(worker.video_info.id)) {
			cachedResults.push(worker.video_info.id);

			getVideoInfo(worker.video_info.url)
				.then((result) => {
					videoInfo[worker.video_info.id] = result;
				})
				.catch(() => {});
		}
	}
</script>

<div id="local_container">
	<div id="form_container">
		<!-- Stats row -->
		<div class="stats_row">
			<div class="stat_card show_blue">
				<p class="show_container_title">Total views</p>
				<h2 class="show_container_value">{totalViews}</h2>
			</div>

			<div class="stat_card show_green">
				<p class="show_container_title">Total watch time</p>
				<h2 class="show_container_value">{(totalWatch_time / 60 / 60).toFixed(3)}h</h2>
			</div>

			<div class="stat_card show_yellow">
				<p class="show_container_title">Views (24h)</p>
				<h2 class="show_container_value">{viewData.reduce((a, b) => a + b, 0)}</h2>
			</div>

			<div class="stat_card show_orange">
				<p class="show_container_title">Watch time (24h)</p>
				<h2 class="show_container_value">
					{watch_time_Data.reduce((a, b) => a + b, 0).toFixed(2)}h
				</h2>
			</div>

			<div class="stat_card show_red">
				<p class="show_container_title">Total bandwidth</p>
				<h2 class="show_container_value">{totalBandwidth.toFixed(1)}mb</h2>
			</div>

			<div class="stat_card show_db">
				<p class="show_container_title">Bandwidth (24h)</p>
				<h2 class="show_container_value">
					{bandwidthData.reduce((a, b) => a + b, 0).toFixed(1)}mb
				</h2>
			</div>
		</div>

		<!-- Charts row -->
		<div class="charts_row">
			<div class="chart_container">
				<h3 class="chart_title">Views / Hour</h3>
				<div class="chart_wrapper">
					<Line data={viewsGraph} options={defaultOpts} />
				</div>
			</div>

			<div class="chart_container">
				<h3 class="chart_title">Watch time (Hours) / Hour</h3>
				<div class="chart_wrapper">
					<Line data={watch_time_Graph} options={defaultOpts} />
				</div>
			</div>

			<div class="chart_container">
				<h3 class="chart_title">Bandwidth (MB) / Hour</h3>
				<div class="chart_wrapper">
					<Line data={bandwidth_Graph} options={defaultOpts} />
				</div>
			</div>
		</div>

		<!-- Workers list row -->
		{#if currentWorkers.length > 0}
			<div class="workers_section">
				<h3 class="section_title">Active Workers ({currentWorkers.length})</h3>
				<div class="workers_container">
					{#each currentWorkers as worker, index}
						{#if videoInfo[worker.video_info.id]}
							<div class="worker_card">
								<div class="worker_top">
									<span class="worker_badge">Worker #{index + 1}</span>
									<span class="worker_status">active</span>
								</div>
								<div class="worker_body">
									<img
										alt="video_thumbnail"
										class="worker_thumb"
										src={videoInfo[worker.video_info.id].thumbnail}
									/>
									<div class="worker_details">
										<p class="worker_title" title={videoInfo[worker.video_info.id].title}>
											{videoInfo[worker.video_info.id].title}
										</p>
										<div class="worker_stats_grid">
											<div class="stat_item" title="Current seconds / total duration">
												<span class="stat_lbl">Time:</span> {worker.currentTime.toFixed(1)}s
											</div>
											{#if videoInfo[worker.video_info.id].videoType !== 'livestream'}
												<div class="stat_item" title="Progress percentage">
													<span class="stat_lbl">Prog:</span> {((worker.currentTime / (worker.job.video_info?.duration || 1)) * 100).toFixed(0)}%
												</div>
											{/if}
											<div class="stat_item proxy_item" title={worker.job.proxy}>
												<span class="stat_lbl">Proxy:</span> {worker.job.proxy}
											</div>
											<div class="stat_item" title="Bandwidth consumed by this worker">
												<span class="stat_lbl">Data:</span> {worker.bandwidth.toFixed(1)}mb
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	#local_container {
		height: calc(100vh - 60px);
		width: 100%;
		overflow: hidden;
		box-sizing: border-box;
	}

	#form_container {
		padding: 20px 24px;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* Stats Cards Styles */
	.stats_row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 16px;
		width: 100%;
	}

	.stat_card {
		padding: 12px 16px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 70px;
		box-sizing: border-box;
		transition: transform 0.2s, box-shadow 0.2s;

		&:hover {
			transform: translateY(-2px);
		}

		.show_container_title {
			color: rgba(255, 255, 255, 0.7);
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			margin: 0 0 4px 0;
			letter-spacing: 0.5px;
		}

		.show_container_value {
			color: #ffffff;
			font-weight: 700;
			font-size: 20px;
			margin: 0;
			line-height: 1.2;
		}
	}

	.show_blue {
		background-color: #1a202c;
		border: 1px solid rgba(229, 9, 20, 0.35);
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.08);
	}

	.show_green {
		background-color: #1a202c;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
	}

	.show_yellow {
		background-color: #1a202c;
		border: 1px solid rgba(229, 9, 20, 0.35);
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.08);
	}

	.show_orange {
		background-color: #1a202c;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
	}

	.show_red {
		background-color: #1a202c;
		border: 1px solid rgba(229, 9, 20, 0.35);
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.08);
	}

	.show_db {
		background-color: #1a202c;
		border: 1px solid rgba(229, 9, 20, 0.35);
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.08);
	}

	/* Charts Grid Styles */
	.charts_row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		flex-grow: 1;
		min-height: 0;
	}

	.chart_container {
		background: #1e2225;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
		min-height: 0;
	}

	.chart_title {
		color: #a0aec0;
		font-size: 12px;
		font-weight: 600;
		margin: 0 0 12px 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.chart_wrapper {
		flex-grow: 1;
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
	}

	/* Workers Section Styles */
	.workers_section {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 155px;
		min-height: 155px;
		max-height: 155px;
		box-sizing: border-box;
		margin-top: auto;
	}

	.section_title {
		color: #cbd5e0;
		font-size: 13px;
		font-weight: 700;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.workers_container {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		overflow-y: hidden;
		flex-grow: 1;
		padding-bottom: 6px;
		box-sizing: border-box;

		&::-webkit-scrollbar {
			height: 6px;
		}
		&::-webkit-scrollbar-track {
			background: rgba(255, 255, 255, 0.02);
			border-radius: 3px;
		}
		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.1);
			border-radius: 3px;
		}
		&::-webkit-scrollbar-thumb:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.worker_card {
		min-width: 300px;
		max-width: 300px;
		height: 110px;
		background: #1e2225;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		padding: 10px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.worker_top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		padding-bottom: 4px;
	}

	.worker_badge {
		color: #e50914;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.worker_status {
		background: rgba(229, 9, 20, 0.1);
		color: #e50914;
		font-size: 9px;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 10px;
		text-transform: uppercase;
	}

	.worker_body {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-grow: 1;
		min-height: 0;
	}

	.worker_thumb {
		width: 80px;
		height: 45px;
		object-fit: cover;
		border-radius: 4px;
		background: #2d3139;
		flex-shrink: 0;
	}

	.worker_details {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex-grow: 1;
		min-width: 0;
	}

	.worker_title {
		color: #e2e8f0;
		font-size: 11px;
		font-weight: 600;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.worker_stats_grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2px 8px;
		font-size: 10px;
		color: #a0aec0;
	}

	.stat_item {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stat_lbl {
		color: #718096;
		font-weight: 600;
	}

	.proxy_item {
		max-width: 100%;
	}

	@media only screen and (max-width: 1024px) {
		.stats_row {
			grid-template-columns: repeat(3, 1fr);
		}
		.charts_row {
			grid-template-columns: 1fr;
			overflow-y: auto;
		}
		#local_container {
			overflow-y: auto;
		}
	}
</style>
