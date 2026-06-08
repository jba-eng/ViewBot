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
  function toggleCategory(name: string) {
    if (selectedCategories.has(name)) selectedCategories.delete(name); else selectedCategories.add(name);
    const arr: string[] = [];
    if (selectedCategories.size === 0) filtered = all; else {
      for (const c of categories) if (selectedCategories.has(c.name)) arr.push(...c.list);
      filtered = arr;
    }
    selectedAgents.clear();
    lastIndex = -1;
  }
  function toggleAll(on: boolean) {
    selectedCategories.clear();
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
<div style="padding: 24px;">
  <div class="settings_container container_blue">
    <h1 class="setting_discloser">User Agents</h1>
    <div class="setting_div">
      <div class="same_line">
        <label><input type="checkbox" on:change={(e)=>toggleAll(e.target?.checked)} />All</label>
        {#each categories as c}
          <label style="margin-left: 12px;"><input type="checkbox" on:change={()=>toggleCategory(c.name)} />{c.name}</label>
        {/each}
      </div>
      <p class="setting_info">Select by category or individually with Shift+Click</p>
    </div>
  </div>
  <div class="settings_container container_blue">
    <h2 class="setting_discloser">Fingerprint</h2>
    <div class="setting_div">
      <div class="same_line">
        <span class="setting_name">Viewport width</span>
        <input class="setting_text" type="number" bind:value={data.viewport_width} />
        <span class="setting_name" style="margin-left:12px;">Viewport height</span>
        <input class="setting_text" type="number" bind:value={data.viewport_height} />
        <span class="setting_name" style="margin-left:12px;">Scale</span>
        <input class="setting_text" type="number" step="0.1" bind:value={data.device_scale_factor} />
      </div>
      <div class="same_line" style="margin-top: 8px;">
        <label><input type="checkbox" class="setting_button setting_checkbox" bind:checked={data.is_mobile_device} />Mobile device</label>
        <span class="setting_name" style="margin-left:12px;">Platform</span>
        <input class="setting_text" type="text" bind:value={data.platform} />
        <span class="setting_name" style="margin-left:12px;">CPU threads</span>
        <input class="setting_text" type="number" bind:value={data.hardwareConcurrency} />
      </div>
      <div class="same_line" style="margin-top: 8px;">
        <span class="setting_name">Languages (comma)</span>
        <input class="setting_text" type="text" value={Array.isArray(data.languages) ? data.languages.join(',') : data.languages} on:input={(e)=>{ const v = String(e.target?.value||''); data.languages = v.split(',').map(s=>s.trim()).filter(Boolean); }} />
        <span class="setting_name" style="margin-left:12px;">Timezone offset</span>
        <input class="setting_text" type="number" bind:value={data.timezone_offset} />
      </div>
      <div class="same_line" style="margin-top: 8px;">
        <span class="setting_name">WebGL vendor</span>
        <input class="setting_text" type="text" bind:value={data.webgl_vendor} />
        <span class="setting_name" style="margin-left:12px;">WebGL renderer</span>
        <input class="setting_text" type="text" bind:value={data.webgl_renderer} />
      </div>
    </div>
  </div>
  <div class="settings_container container_green">
    <h2 class="setting_discloser">List</h2>
    <div class="ua_list">
      {#each filtered as ua, i}
        <div class="ua_item {selectedAgents.has(i) ? 'selected' : ''}" on:click={(e)=>onClickItem(i,e)}>{ua}</div>
      {/each}
    </div>
    <div class="same_line" style="margin-top: 12px;">
      <button class="setting_button" on:click={saveSelection}>Save</button>
    </div>
  </div>
  <div class="settings_container container_blue">
    <h2 class="setting_discloser">Mouse Movements</h2>
    <div class="setting_div">
      <div class="same_line">
        <span class="setting_name">Mode</span>
        <select class="setting_text" bind:value={data.mouse_behavior}>
          <option value="automated">automated</option>
          <option value="humanized">humanized</option>
          <option value="random">random</option>
        </select>
        <span class="setting_name" style="margin-left:12px;">Speed</span>
        <input class="setting_text" type="number" step="0.1" min="0.1" max="5" bind:value={data.mouse_speed} />
        <span class="setting_name" style="margin-left:12px;">Randomness</span>
        <input class="setting_text" type="number" step="0.1" min="0" max="1" bind:value={data.mouse_randomness} />
      </div>
      <p class="setting_info">Applies to automation; random adds jitter; humanized smooths movement.</p>
    </div>
  </div>
</div>
<style>
  .ua_list { max-height: 420px; overflow-y: auto; background:#1f2428; padding:12px; }
  .ua_item { padding:6px 8px; color:#eaeaea; border-bottom:1px solid #333; cursor:pointer; }
  .ua_item.selected { background:#2b3136; }
  .settings_container { background-color:#272c30; padding-bottom:2%; margin-bottom:5%; }
  .setting_discloser { text-align:center; color:#eee; font-size:1.3em; }
  .setting_div { margin:3%; box-shadow:0 0 2px 3px #363635; }
  .same_line { display:flex; align-items:center; }
  .setting_button { aspect-ratio:1.7/1; min-height:0.9em; min-width:0.9em; margin-left:5%; background-color:#272c30; }
  .setting_info { font-size:0.8em; color:#b2bac2; margin-bottom:2%; margin-top:1%; }
  .container_blue { box-shadow:0 0 12px 4px rgba(2,71,197,.95); }
  .container_green { box-shadow:0 0 12px 4px rgba(8,197,24,.86); padding:12px; }
</style>
