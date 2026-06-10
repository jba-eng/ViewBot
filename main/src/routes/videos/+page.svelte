<script lang="ts">
	import Slider from '@bulatdashiev/svelte-slider';
	import MultiSelect from 'svelte-multiselect';

	import axios from 'axios';
	import { socket } from '../../background.js';

	let videos: any[] = [];
	let watch_time_options = ['channel', 'search', 'direct', 'subscribers', 'suggestions'];

	$: publishVideos(videos);
	let justChanged = Date.now();

	axios
		.get('/api/videos')
		.then((data) => {
			justChanged = Date.now();
			videos = data.data;
		})
		.catch(() => {});

	function publishVideos(newVideos: any[]) {
		if (justChanged + 100 < Date.now()) socket.emit('videos', newVideos);
	}

	socket.on('videosChanged', (newVideos) => {
		justChanged = Date.now();
		videos = newVideos;
	});

	function getVideoInfo(id: string) {
		return new Promise((resolve, reject) => {
			axios
				.get(`/api/video_info?id=${encodeURIComponent(id)}`)
				.then((data) => resolve(data.data))
				.catch(reject);
		});
	}

	function changeVideoKeywords(video: any, newKeywords: string, element: any) {
		video.keywords = newKeywords.trim().split('\n').map(v => v.trim());
		videos = videos;
	}

	function changeVideoReferrals(video: any, newReferrals: string, element: any) {
		video.referrals = newReferrals.trim().split('\n').map(v => v.trim());
		videos = videos;
	}

	function generateUploadDate(video: any) {
		if (!videoInfo[video.id]) return ['any'];

		let result_arr = ['any'];
		let difference =
			(new Date().getTime() - new Date(videoInfo[video.id].uploadDate).getTime()) / 86400000;
		if (difference < 7) result_arr.unshift('this week');
		if (difference < 30) result_arr.unshift('this month');
		if (difference < 365) result_arr.unshift('this year');

		return result_arr;
	}

	let availableSortBy = ['relevance', 'upload date', 'view count', 'rating'];

	function generateDuration(video: any) {
		if (!videoInfo[video.id]) return ['any'];
		if (videoInfo[video.id].videoType == 'livestream') return ['any'];

		let duration = videoInfo[video.id].duration;
		if (duration < 240) return ['under 4 minutes', 'any'];
		if (duration > 1200) return ['over 20 minutes', 'any'];
		return ['4-20 minutes', 'any'];
	}

	function generateFeatures(video: any) {
		if (!videoInfo[video.id]) return [];
		let result_arr = [];

		if (videoInfo[video.id].videoType == 'livestream') result_arr.unshift('live');

		if (videoInfo[video.id].validFilters.is4K) result_arr.unshift('4k');
		if (videoInfo[video.id].validFilters.isHD) result_arr.unshift('hd');
		if (videoInfo[video.id].validFilters.is3D) result_arr.unshift('3d');
		if (videoInfo[video.id].validFilters.isHDR) result_arr.unshift('hdr');

		return result_arr;
	}

	let videoInfo: any = {};

	let badIds: string[] = [];
	let cachedResults: string[] = [];

	$: for (let video of videos) {
		if (!badIds.includes(video.id) && !cachedResults.includes(video.id)) {
			cachedResults.push(video.id);

			getVideoInfo(video.id)
				.then((result) => {
					videoInfo[video.id] = result;
				})
				.catch((err) => {
					badIds.push(video.id);
				});
		}
	}
</script>

<div id="form_container">
	<button
		class="new_button"
		on:click={() => {
			videos.unshift({
				id: ``,
				watch_time: [47, 87],
				livestream_watchtime: 300,
				watch_entire_livestream: true,
				guest_views: 10,
				available_watch_types: ['channel', 'search', 'direct'],
				keywords: [],
				referrals: ["https://www.discord.com", "https://www.youtube.com", "https://www.facebook.com", "https://www.x.com"],
				filters: {
					upload_date: 'any',
					duration: 'any',
					sort_by: 'relevance',
					features: []
				},

				accounts: [],
				comments: [],

				likePercent: 50,
				dislikePercent: 100,
				subscribePercent: 0,
				likeAt: [25, 75],
				dislikeAt: [25, 75],
				subscribeAt: [25, 75],
				commentAt: [25, 75]
			});

			videos = videos;
		}}>Add Video</button
	>

	<div class="videos_parent" on:input={() => videos = videos} on:change={() => videos = videos}>
		<div class="videos_container">
			{#each videos as video, index}
				<div class="video_container settings_container {(videoInfo[video.id] || {}).isRumble ? 'container_gray_red' : 'container_gray'}">
					<div class="card_header">
						<span class="video_index_badge">Video #{index + 1}</span>
						<button
							class="delete_video_btn"
							title="Delete Video"
							on:click={() => {
								videos.splice(index, 1);
								videos = videos;
							}}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right: 4px;">
								<path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path>
							</svg>
							Delete
						</button>
					</div>
					{#if index == 0}
						<p class="setting_info" style="margin: 0 0 8px 0; font-weight: bold; color: #a0aec0;">
							Press the Delete button to remove this video block
						</p>
					{/if}

					{#if videoInfo[video.id]}
						<div class="video_preview_card">
							<img
								alt="video_thumbnail"
								class="video_thumbnail"
								src={videoInfo[video.id].thumbnail}
							/>
							<div class="video_details">
								<p class="video_title" title={videoInfo[video.id].title}>{videoInfo[video.id].title}</p>
								<div class="video_meta">
									<span class="video_type_badge">{videoInfo[video.id].videoType}</span>
								</div>
							</div>
						</div>
					{/if}

					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">
								Video ID/URL:
								<span class="info-icon" data-tooltip="The ID/URL of the video to bot">ⓘ</span>
							</h2>

							<input
								class="setting_text"
								placeholder="video id"
								type="text"
								bind:value={video.id}
							/>
						</div>
					</div>

					{#if videoInfo[video.id]}
						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">
									Guest views:
									<span class="info-icon" data-tooltip="How many views to generate without using a google account?&#10;&#10;NOTE: If the video is a livestream it should be smaller or equal to the concurrency setting.">ⓘ</span>
								</h2>

								<input class="setting_text" type="number" bind:value={video.guest_views} />
							</div>
						</div>


						{#if videoInfo[video.id].videoType == 'livestream'}
							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Watch entire livestream:
										<span class="info-icon" data-tooltip="Should the bot watch the entire livestream?">ⓘ</span>
									</h2>

									<input
										class="setting_button setting_checkbox"
										type="checkbox"
										bind:checked={video.watch_entire_livestream}
									/>
								</div>
							</div>

							{#if !video.watch_entire_livestream}
								<div class="setting_div">
									<div class="same_line">
										<h2 class="setting_name">
											Watch time:
											<span class="info-icon" data-tooltip="How much to watch the livestream (in seconds)">ⓘ</span>
										</h2>

										<input
											class="setting_text"
											type="number"
											bind:value={video.livestream_watchtime}
										/>
									</div>
								</div>
							{/if}
						{:else}
							<p class="watchtime_line">
								{video.watch_time[0]}% - {video.watch_time[1]}% watchtime
							</p>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Watch time:
										<span class="info-icon" data-tooltip="How much watch time should be generated?">ⓘ</span>
									</h2>

									<Slider max="100" bind:value={video.watch_time} range order />
								</div>
							</div>
						{/if}

						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">
									Watch type:
									<span class="info-icon" data-tooltip="In what ways could the bot find the video?">ⓘ</span>
								</h2>

								<MultiSelect
									bind:selected={video.available_watch_types}
									options={watch_time_options}
								/>
							</div>
						</div>

						{#if video.available_watch_types.includes('search')}
							<div class="setting_div">
								<div class="different_line">
									<h2 class="setting_name" style="text-align: center;">
										Search titles (Optional)
										<span class="info-icon" data-tooltip="What titles should it use when using the search function?&#10;Using improper titles may damage your video in the algorithm.&#10;Make sure each title is separated by a new line.">ⓘ</span>
									</h2>

									<textarea
										class="setting_stringarea"
										placeholder="cool title"
										value={video.keywords.join('\n').trim()}
										on:input={(event) =>
											changeVideoKeywords(video, event.target?.value, event.target)}
									/>
								</div>
							</div>

							<h1 class="setting_discloser">Search filters (Optional)</h1>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Upload date:</h2>

									<select class="setting_text" bind:value={video.filters.upload_date}>
										{#each generateUploadDate(video) as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Sort by:</h2>

									<select class="setting_text" bind:value={video.filters.sort_by}>
										{#each availableSortBy as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Duration:</h2>

									<select class="setting_text" bind:value={video.filters.duration}>
										{#each generateDuration(video) as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Features:</h2>

									<MultiSelect bind:selected={video.features} options={generateFeatures(video)} />
								</div>
							</div>
						{/if}

						{#if video.available_watch_types.includes('direct')}
							<div class="setting_div">
								<div class="different_line">
									<h2 class="setting_name" style="text-align: center;">
										Referrals (Optional)
										<span class="info-icon" data-tooltip="What referals should it use when going directly to the video?&#10;Using improper or wrong referals will damage your video in the algorithm.&#10;NOTE: PREMIUM ONLY, WON'T APPLY IF YOU DON'T HAVE PREMIUM.&#10;Make sure each title is separated by a new line.">ⓘ</span>
									</h2>

									<textarea
										class="setting_stringarea"
										placeholder="https://www.discord.com
https://www.youtube.com
https://www.facebook.com
https://www.x.com"
										value={video.referrals.join('\n').trim()}
										on:input={(event) =>
											changeVideoReferrals(video, event.target?.value, event.target)}
									/>
								</div>
							</div>
						{/if}

						<h1 class="setting_discloser">Search filters (Optional)</h1>

						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">Upload date:</h2>

								<select class="setting_text" bind:value={video.filters.upload_date}>
									{#each generateUploadDate(video) as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">Sort by:</h2>

								<select class="setting_text" bind:value={video.filters.sort_by}>
									{#each availableSortBy as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">Duration:</h2>

								<select class="setting_text" bind:value={video.filters.duration}>
									{#each generateDuration(video) as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">Features:</h2>

								<MultiSelect bind:selected={video.features} options={generateFeatures(video)} />
							</div>
						</div>

						<h1 class="setting_discloser">Account list</h1>

						<div class="import_line">
							<button
								class="new_button_account"
								on:click={() => {
									video.accounts.unshift({
										email: '',
										password: '',
										cookies: ''
									});

									videos = videos;
								}}>Add account</button
							>

							<input
								id="hidden_account_input-{index}"
								type="file"
								accept=".txt,.xlsx,.csv"
								on:change={(e) => {
									let file = e.target.files[0];
									let reader = new FileReader();
									reader.onload = function (e) {
										let data = e.target.result;

										socket.emit('accounts_import', {
											data: data,
											fileType: file.type,
											video: video
										});
										setTimeout(() => {
											document.location.reload();
										}, 250);
									};

									reader.readAsArrayBuffer(file);
								}}
								hidden
							/>

							<button
								class="new_button_account"
								on:click={() => {
									let hidden_input = document.querySelector(`#hidden_account_input-${index}`);
									hidden_input?.click();
								}}>Import accounts</button
							>

							<button
								class="new_button_account"
								on:click={() => {
									const a = document.createElement('a');
									const url = `/api/video_details?type=accounts&video=${video.id}`;
									a.href = url;
									document.body.appendChild(a);
									a.click();
									document.body.removeChild(a);
								}}>Extract accounts</button
							>
						</div>

						<div class="accounts_container">
							{#each video.accounts as account, acc_index}
								<div class="account_container container_gray">
									<button
										class="video_id"
										on:click={() => {
											video.accounts.splice(acc_index, 1);
											videos = videos;
										}}>#{acc_index + 1}</button
									>

									<div class="setting_div">
										<div class="same_line">
											<h2 class="setting_name">
												Email (Optional):
												<span class="info-icon" data-tooltip="What email should the bot use? (Email, Password / Cookies / both)">ⓘ</span>
											</h2>

											<input
												class="setting_text"
												placeholder="Email"
												type="text"
												bind:value={account.email}
												on:input={() => videos = videos}
											/>
										</div>
									</div>

									<div class="setting_div">
										<div class="same_line">
											<h2 class="setting_name">
												Password (Optional):
												<span class="info-icon" data-tooltip="What password should the bot use?">ⓘ</span>
											</h2>

											<input
												class="setting_text"
												placeholder="Password"
												type="text"
												bind:value={account.password}
												on:input={() => videos = videos}
											/>
										</div>
									</div>

									<div class="setting_div">
										<div class="same_line">
											<h2 class="setting_name">
												Cookies (Optional):
												<span class="info-icon" data-tooltip="What cookies should the bot use? (Email, Password / Cookies / both)">ⓘ</span>
											</h2>

											<input
												class="setting_text"
												placeholder="Cookies"
												type="text"
												bind:value={account.cookies}
												on:input={() => videos = videos}
											/>
										</div>
									</div>
								</div>
							{/each}
						</div>

						{#if video.accounts.length > 0}
							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Like at:
										<span class="info-icon" data-tooltip="When should each account like?">ⓘ</span>
									</h2>

									<Slider max="100" bind:value={video.likeAt} range order />
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Dislike at:
										<span class="info-icon" data-tooltip="When should each account dislike?">ⓘ</span>
									</h2>

									<Slider max="100" bind:value={video.dislikeAt} range order />
								</div>
							</div>
							
							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Subscribe at:
										<span class="info-icon" data-tooltip="When should each account subscribe?">ⓘ</span>
									</h2>

									<Slider max="100" bind:value={video.subscribeAt} range order />
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Comment at:
										<span class="info-icon" data-tooltip="When should each account comment?">ⓘ</span>
									</h2>

									<Slider max="100" bind:value={video.commentAt} range order />
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Like percent:
										<span class="info-icon" data-tooltip="What is the chance of the bot liking the video?">ⓘ</span>
									</h2>

									<input
										class="setting_text"
										type="number"
										min="0"
										max="100"
										bind:value={video.likePercent}
									/>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Dislike percent:
										<span class="info-icon" data-tooltip="What is the chance of the bot disliking the video?">ⓘ</span>
									</h2>
									<input
										class="setting_text"
										type="number"
										min="0"
										max="100"
										bind:value={video.dislikePercent}
									/>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">
										Subscribe percent:
										<span class="info-icon" data-tooltip="What is the chance of the bot to subscribe to the channel?">ⓘ</span>
									</h2>

									<input
										class="setting_text"
										type="number"
										min="0"
										max="100"
										bind:value={video.subscribePercent}
									/>
								</div>
							</div>

							<h1 class="setting_discloser">Comment list</h1>

							<div class="import_line">
								<button
									class="new_button_account"
									on:click={() => {
										video.comments.unshift('Hello world');

										videos = videos;
									}}>Add comment</button
								>

								<input
									id="hidden_comment_input-{index}"
									type="file"
									accept=".json"
									on:change={(e) => {
										let file = e.target.files[0];
										let reader = new FileReader();
										reader.onload = function (e) {
											let data = e.target.result;

											socket.emit('comments_import', {
												data: data,
												video: video
											});

											setTimeout(() => {
												document.location.reload();
											}, 250);
										};

										reader.readAsArrayBuffer(file);
									}}
									hidden
								/>

								<button
									class="new_button_account"
									on:click={() => {
										let hidden_input = document.querySelector(`#hidden_comment_input-${index}`);
										hidden_input?.click();
									}}>Import comments</button
								>

								<button
									class="new_button_account"
									on:click={() => {
										const a = document.createElement('a');
										const url = `/api/video_details?type=comments&video=${video.id}`;
										a.href = url;
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
									}}>Extract comments</button
								>

								<div class="accounts_container">
									{#each video.comments as comment, comment_index}
										<div class="account_container container_gray">
											<button
												class="video_id"
												on:click={() => {
													video.comments.splice(comment_index, 1);
													videos = videos;
												}}>#{comment_index + 1}</button
											>

											<textarea class="setting_text comment_text" cols="50" bind:value={comment} on:input={() => videos = videos} />
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.comment_text {
		height: 120px;
		width: 95%;
		margin-top: 8px;
	}

	.accounts_container {
		display: flex;
		overflow-x: auto;
		gap: 16px;
		padding: 8px 4px;
		margin-top: 12px;
	}

	.accounts_container::-webkit-scrollbar {
		height: 6px;
	}
	.accounts_container::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.02);
		border-radius: 3px;
	}
	.accounts_container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
	}
	.accounts_container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.account_container {
		min-width: 260px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 12px;
		margin: 0;
	}

	.import_line {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: flex-start;
		margin-top: 12px;
	}

	.videos_parent {
		display: block;
		width: 100%;
	}

	.videos_container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
		padding: 20px 0;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.video_thumbnail {
		width: 160px;
		height: 90px;
		border-radius: 6px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.video_preview_card {
		display: flex;
		gap: 16px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 12px;
		align-items: center;
		margin-bottom: 12px;
	}

	.video_details {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
		flex-grow: 1;
	}

	.video_title {
		font-size: 14px;
		font-weight: 600;
		color: #f7fafc;
		margin: 0;
		white-space: normal;
		overflow: visible;
		text-overflow: clip;
		text-align: left;
		word-break: break-word;
	}

	.video_meta {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.video_type_badge {
		font-size: 11px;
		font-weight: bold;
		text-transform: uppercase;
		background-color: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.video_container {
		background-color: #1e2225;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 20px;
		margin: 0;
		box-sizing: border-box;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	@media only screen and (max-width: 1280px) {
		.videos_container {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media only screen and (max-width: 768px) {
		.videos_container {
			grid-template-columns: 1fr;
		}
	}

	.card_header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		padding-bottom: 10px;
		margin-bottom: 8px;
	}

	.video_index_badge {
		font-size: 14px;
		font-weight: 700;
		color: #e50914;
	}

	.delete_video_btn {
		display: flex;
		align-items: center;
		background-color: rgba(229, 9, 20, 0.1);
		color: #e50914;
		border: 1px solid rgba(229, 9, 20, 0.25);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.delete_video_btn:hover {
		background-color: #e50914;
		color: #ffffff;
	}

	.watchtime_line {
		color: #cbd5e0;
		font-size: 14px;
		text-align: center;
		font-weight: 600;
	}

	.new_button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		max-width: 250px;
		width: 100%;
		margin: 0 auto 24px auto;
		padding: 12px 24px;
		background: linear-gradient(135deg, #e50914 0%, #b3070f 100%);
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(229, 9, 20, 0.2);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new_button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(229, 9, 20, 0.45);
	}

	.new_button_account {
		padding: 6px 12px;
		background-color: #2d3748;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
		font-size: 13px;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.new_button_account:hover {
		background-color: #4a5568;
		color: #ffffff;
	}

	.container_gray {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
	}

	.container_gray_red {
		box-shadow: 0 4px 20px rgba(229, 9, 20, 0.15);
		border-color: rgba(229, 9, 20, 0.3);
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
		margin: 0;
		flex-grow: 1;
		max-width: 60%;
	}

	.setting_text:focus {
		border-color: #e50914;
	}

	.setting_text::placeholder {
		color: #718096;
	}

	.different_line {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.setting_stringarea {
		background-color: #2d3139;
		color: #e2e8f0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
		width: 100%;
		box-sizing: border-box;
		min-height: 100px;
		max-height: 200px;
		outline: none;
		resize: vertical;
		margin: 0;
	}

	.setting_stringarea:focus {
		border-color: #e50914;
	}

	.setting_stringarea::placeholder {
		color: #718096;
	}

	.setting_checkbox {
		accent-color: #e50914;
		margin: 0;
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
		box-shadow: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.setting_discloser {
		text-align: left;
		color: #f7fafc;
		font-size: 14px;
		font-weight: 700;
		margin: 16px 0 8px 0;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.settings_container {
		background-color: #1e2225;
		padding: 20px;
		border-radius: 12px;
	}

	#form_container {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	:global(.svelte-multiselect) {
		background: #2d3139 !important;
		border: 1px solid rgba(255, 255, 255, 0.1) !important;
		border-radius: 6px !important;
		color: #e2e8f0 !important;
		flex-grow: 1;
		max-width: 60% !important;
	}

	:global(.svelte-multiselect ul.selected) {
		background: transparent !important;
	}

	:global(.svelte-multiselect li.selected) {
		background-color: #e50914 !important;
		color: #ffffff !important;
	}

	:global(.slider) {
		--track-background: #2d3139 !important;
		--track-fill: #e50914 !important;
		--thumb-background: #ffffff !important;
		--thumb-border: 2px solid #e50914 !important;
	}
</style>
