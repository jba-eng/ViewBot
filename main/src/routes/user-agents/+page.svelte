<script lang="ts">
  import axios from 'axios';
  import { categories, all } from '../../user_agents';
  import { opts, dataChanged, newData } from '../../background.js';
  let data = opts;
  dataChanged((d:any)=>data=d);
  $: newData(data);
  let selectedCategories: Set<string> = new Set();
  let filtered: string[] = all;
  let selectedAgents: Set<number> = new Set();
  let lastIndex = -1;
  let allSelected = true;
  function toggleCategory(name: string) {
    if (selectedCategories.has(name)) selectedCategories.delete(name); else selectedCategories.add(name);
    const arr: string[] = [];
    if (selectedCategories.size === 0) { filtered = all; allSelected = true; } else {
      for (const c of categories) if (selectedCategories.has(c.name)) arr.push(...c.list);
      filtered = arr;
      allSelected = false;
    }
    selectedAgents.clear();
    lastIndex = -1;
  }
  function toggleAll(on: boolean) {
    selectedCategories.clear();
    allSelected = on;
    if (on) filtered = all; else filtered = [];
    selectedAgents.clear();
    lastIndex = -1;
  }
  function onClickItem(i: number, e: MouseEvent) {
    if (e.shiftKey && lastIndex >= 0) {
      const [a,b] = [Math.min(lastIndex, i), Math.max(lastIndex, i)];
      for (let k=a;k<=b;k++) selectedAgents.add(k);
    } else {
      if (selectedAgents.has(i)) selectedAgents.delete(i); else selectedAgents.add(i);
      lastIndex = i;
    }
  }
  async function saveSelection() {
    const cats = Array.from(selectedCategories);
    const agents = Array.from(selectedAgents).map(i => filtered[i]);
    const newSettings = { ...data, user_agents_categories: cats, user_agents_selected: agents };
    await axios.post('/api/settings', newSettings);
  }
</script>

<div id="form_container">
  <div class="ua_grid">
    <!-- Left Column: Categories, Fingerprints, Mouse Movements -->
    <div class="ua_col left_col">
      <!-- User Agents categories -->
      <div class="settings_container container_blue">
        <h1 class="setting_discloser">Category Selection</h1>
        <div class="setting_div">
          <div class="categories_row">
            <label class="checkbox_label">
              <input type="checkbox" class="setting_checkbox" bind:checked={allSelected} on:change={() => toggleAll(allSelected)} />
              <span class="label_text">All</span>
            </label>
            {#each categories as c}
              <label class="checkbox_label">
                <input type="checkbox" class="setting_checkbox" on:change={()=>toggleCategory(c.name)} />
                <span class="label_text">{c.name}</span>
              </label>
            {/each}
            <span class="info-icon" data-tooltip="Select by category, or hold Shift and click multiple individual agents in the list to select custom ranges.">ⓘ</span>
          </div>
        </div>
      </div>

      <!-- Fingerprint Settings -->
      <div class="settings_container container_purple">
        <h1 class="setting_discloser">Fingerprint Configuration</h1>
        <div class="setting_div fingerprint_inputs">
          <div class="grid_row">
            <div class="input_field">
              <span class="setting_name">
                Viewport width:
                <span class="info-icon" data-tooltip="Simulated browser viewport width in pixels">ⓘ</span>
              </span>
              <input class="setting_text" type="number" bind:value={data.viewport_width} />
            </div>
            <div class="input_field">
              <span class="setting_name">
                Viewport height:
                <span class="info-icon" data-tooltip="Simulated browser viewport height in pixels">ⓘ</span>
              </span>
              <input class="setting_text" type="number" bind:value={data.viewport_height} />
            </div>
          </div>

          <div class="grid_row">
            <div class="input_field">
              <span class="setting_name">
                Device scale:
                <span class="info-icon" data-tooltip="Device pixel ratio (e.g. 1 for standard, 2 for retina)">ⓘ</span>
              </span>
              <input class="setting_text" type="number" step="0.1" bind:value={data.device_scale_factor} />
            </div>
            <div class="input_field">
              <span class="setting_name">
                Mobile device:
                <span class="info-icon" data-tooltip="Emulate mobile environment and touch events">ⓘ</span>
              </span>
              <input type="checkbox" class="setting_checkbox" bind:checked={data.is_mobile_device} />
            </div>
          </div>

          <div class="grid_row">
            <div class="input_field">
              <span class="setting_name">
                Platform:
                <span class="info-icon" data-tooltip="The navigator.platform string (e.g., Win32, MacIntel)">ⓘ</span>
              </span>
              <input class="setting_text" type="text" bind:value={data.platform} />
            </div>
            <div class="input_field">
              <span class="setting_name">
                CPU threads:
                <span class="info-icon" data-tooltip="Value of navigator.hardwareConcurrency (simulated CPU cores)">ⓘ</span>
              </span>
              <input class="setting_text" type="number" bind:value={data.hardwareConcurrency} />
            </div>
          </div>

          <div class="grid_row">
            <div class="input_field">
              <span class="setting_name">
                Languages:
                <span class="info-icon" data-tooltip="Preferred languages, comma-separated (e.g. en-US,en)">ⓘ</span>
              </span>
              <input class="setting_text" type="text" value={Array.isArray(data.languages) ? data.languages.join(',') : data.languages} on:input={(e)=>{ const v = String(e.target?.value||''); data.languages = v.split(',').map(s=>s.trim()).filter(Boolean); }} />
            </div>
            <div class="input_field">
              <span class="setting_name">
                Timezone offset:
                <span class="info-icon" data-tooltip="Timezone offset in minutes relative to UTC (e.g. -240)">ⓘ</span>
              </span>
              <input class="setting_text" type="number" bind:value={data.timezone_offset} />
            </div>
          </div>

          <div class="grid_row">
            <div class="input_field">
              <span class="setting_name">
                WebGL vendor:
                <span class="info-icon" data-tooltip="Simulated graphics hardware vendor (e.g. Google Inc.)">ⓘ</span>
              </span>
              <input class="setting_text" type="text" bind:value={data.webgl_vendor} />
            </div>
            <div class="input_field">
              <span class="setting_name">
                WebGL renderer:
                <span class="info-icon" data-tooltip="Simulated graphics card name (e.g. ANGLE (NVIDIA GeForce...))">ⓘ</span>
              </span>
              <input class="setting_text" type="text" bind:value={data.webgl_renderer} />
            </div>
          </div>
        </div>
      </div>

      <!-- Mouse Movements -->
      <div class="settings_container container_blue">
        <h1 class="setting_discloser">Mouse Movement Simulation</h1>
        <div class="setting_div">
          <div class="grid_row">
            <div class="input_field">
              <span class="setting_name">
                Behavior mode:
                <span class="info-icon" data-tooltip="Mode of simulated cursor movement: Automated (direct paths), Humanized (Bezier curves), or Random (jittery)">ⓘ</span>
              </span>
              <select class="setting_select" bind:value={data.mouse_behavior}>
                <option value="automated">automated</option>
                <option value="humanized">humanized</option>
                <option value="random">random</option>
              </select>
            </div>
            <div class="input_field">
              <span class="setting_name">
                Speed factor:
                <span class="info-icon" data-tooltip="Multiplier for cursor movement speed (0.1 to 5.0)">ⓘ</span>
              </span>
              <input class="setting_text" type="number" step="0.1" min="0.1" max="5" bind:value={data.mouse_speed} />
            </div>
            <div class="input_field">
              <span class="setting_name">
                Jitter/Random:
                <span class="info-icon" data-tooltip="Randomness weight applied to coordinates (0 to 1)">ⓘ</span>
              </span>
              <input class="setting_text" type="number" step="0.1" min="0" max="1" bind:value={data.mouse_randomness} />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: User Agents List and Save -->
    <div class="ua_col right_col">
      <div class="settings_container container_green">
        <h1 class="setting_discloser">User Agent List</h1>
        <div class="ua_list_wrapper">
          <div class="ua_list">
            {#each filtered as ua, i}
              <div class="ua_item {selectedAgents.has(i) ? 'selected' : ''}" on:click={(e)=>onClickItem(i,e)}>
                <span class="ua_index">{i + 1}.</span> {ua}
              </div>
            {/each}
          </div>
        </div>
        <div class="actions_row">
          <button class="save_button" on:click={saveSelection}>Save Selection</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  #form_container {
    padding: 24px;
    height: calc(100vh - 108px);
    box-sizing: border-box;
    overflow: hidden;
  }

  .ua_grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 24px;
    height: 100%;
    align-items: stretch;
  }

  .ua_col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    overflow: hidden;
  }

  .left_col {
    overflow-y: auto;
    padding-right: 4px;
    /* Hide scrollbar for clean view but allow scroll if viewport is very short */
    &::-webkit-scrollbar {
      width: 6px;
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

  .settings_container {
    background-color: #1e2225;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .right_col .settings_container {
    height: 100%;
  }

  .container_blue {
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .container_purple {
    border: 1px solid rgba(229, 9, 20, 0.35);
    box-shadow: 0 4px 20px rgba(229, 9, 20, 0.08);
  }

  .container_green {
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.08);
  }

  .setting_discloser {
    text-align: left;
    color: #f7fafc;
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 10px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .setting_div {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 12px;
  }

  .categories_row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  .checkbox_label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: #cbd5e0;
    font-size: 13px;
    user-select: none;
  }

  .setting_checkbox {
    accent-color: #e50914;
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin: 0;
  }

  .grid_row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .input_field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    gap: 12px;
  }

  .setting_name {
    color: #cbd5e0;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
  }

  .setting_text, .setting_select {
    background-color: #2d3139;
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
    max-width: 110px;
    flex-grow: 1;
    text-align: right;
    box-sizing: border-box;
  }

  .setting_select {
    text-align: left;
    max-width: 130px;
  }

  .setting_text:focus, .setting_select:focus {
    border-color: #e50914;
  }

  /* Right column table/list styling */
  .ua_list_wrapper {
    flex-grow: 1;
    overflow-y: auto;
    background: #1a1d20;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .ua_list {
    display: flex;
    flex-direction: column;
  }

  .ua_item {
    padding: 10px 14px;
    color: #cbd5e0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    cursor: pointer;
    font-size: 12px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    transition: background-color 0.15s ease;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .ua_item:hover {
    background: rgba(255, 255, 255, 0.02);
    color: #ffffff;
  }

  .ua_item.selected {
    background: linear-gradient(135deg, rgba(229, 9, 20, 0.15) 0%, rgba(229, 9, 20, 0.03) 100%);
    border-left: 3px solid #e50914;
    color: #e50914;
  }

  .ua_index {
    color: #4a5568;
    user-select: none;
  }

  .actions_row {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
  }

  .save_button {
    background-color: #e50914;
    color: white;
    border: none;
    font-weight: 600;
    font-size: 14px;
    padding: 10px 24px;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
    transition: all 0.2s ease;
  }

  .save_button:hover {
    background-color: #c20710;
    box-shadow: 0 6px 16px rgba(229, 9, 20, 0.45);
  }
</style>
