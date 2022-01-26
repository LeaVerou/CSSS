import registry from "./plugin-autoload.js";
import * as util from "./util.js"

export {registry};

export let loaded = {};

export function load (id, def = {}) {
	if (!loaded[id]) {
		let path = def.path || "plugins";
		let pluginURL = new URL(`${path}/${id}/plugin.js`, import.meta.url);
		let loadCSS = !$(`.no-css-${id}, .no-${id}-css, .${id}-no-css`);
		let plugin = loaded[id] = {};

		plugin.loadedJS = util.defer();
		plugin.loadedCSS = loadCSS ? util.defer() : Promise.resolve(false);
		plugin.loaded = Promise.all([plugin.loadedJS, plugin.loadedCSS]);

		import(pluginURL).then(module => {
			plugin.module = module;


		}).catch(console.log).then(() => plugin.loadedJS.resolve(plugin));

		if (loadCSS) {
			plugin.loadedJS.then(({module}) => {
				if (module.hasCSS) {
					return $.load("plugin.css", pluginURL);
				}
			}).then(() => plugin.loadedCSS.resolve(plugin));
		}


	}

	return loaded[id].loaded;
}

export function loadAll () {
	let ret = [];

	for (let id in registry) {
		let def = registry[id];
		let test = def.test || def;

		if (($(test) || document.body.matches(`[data-load-plugins~="${id}"]`)) && !document.body.matches(`.no-${id}`)) {
			ret.push(load(id, def));
		}
	}

	return ret;
}