import { parse } from 'node-html-parser';
import fetch from 'node-fetch';

const [startShopId, endShopId, threadCnt] = process.argv.slice(2);

const baseUrl = `https://www.bol.com/nl/nl/v/v/`;

(async function main() {
	const storage = {
		save: async (shop) => console.log(shop)
	};

	const csvStorage = {
		save: async (shop) => console.log(Object.keys(shop).map(key => `"${shop[key]}"`).join(',')),
		saveTitle: () => console.log(Object.keys(createEmptyShopDataObject(0)).map(key => `"${key}"`).join(','))
	};

	csvStorage.saveTitle();
	await scrapeShops(startShopId, endShopId, threadCnt, csvStorage);
})();

async function scrapeShops(fromId, toId, threadCnt, storage) {
	let nextShopId = fromId;

	async function scheduleNext(shopId, storage) {
		const data = await scrapeShopRetry(shopId, 3);
		if (storage) await storage.save(data);
		if (nextShopId <= toId) {
			setTimeout(() => scheduleNext(nextShopId++, storage), 2000)
		}
	}

	for (let i = 0; i < threadCnt; i++) {
		scheduleNext(nextShopId++, storage);
	}
}

function extractShopData(body) {
	const root = parse(body);

	const scoreText = root.querySelector('div.seller-rating-abtest')?.innerHTML.trim().replaceAll('\n', '').match(/[\d\.\,]+/);
	return {
		shopId: root.querySelector('link[rel=\'canonical\']')?.getAttribute('href').match(/\d+/)[0],
		brandName: root.querySelector('h1.bol_header')?.innerHTML.trim(),
		activeSince: root.querySelector('.u-mb--m p')?.innerHTML.match(/\d.+/)[0] ?? '',
		url: root.querySelector('link[rel=\'canonical\']')?.getAttribute('href'),
		aanbod: root.querySelector('span.small_details')?.innerHTML.match(/\d+/)[0] ?? '',
		beoordeling: root.querySelector('.media__body p')?.innerHTML.replaceAll('<br>', ' ') ?? '',
		score: scoreText ? scoreText[0] : '',
		kvk: root.querySelector('dt:contains(\'KvK-nummer\') + dd')?.innerHTML ?? '',
		btw: root.querySelector('dt:contains(\'Btw-nummer\') + dd')?.innerHTML ?? '',
		address: root.querySelector('p.u-pb--xs')?.innerHTML.trim().replaceAll('\n', '').replaceAll('<br>', '').replaceAll(/\s+/g, ' ') ?? '',
		tradeName: root.querySelector('dt:contains(\'Handelsnaam\') + dd')?.innerHTML ?? '',
	};
}

async function scrapeShop(shopId) {
	const url = `${baseUrl}${shopId}/`;
	const response = await fetch(url);
	if (response.status === 404) {
	 	const shop = createEmptyShopDataObject(shopId);
		shop.url = url;
		return shop;
	}
	if (response.status !== 200) throw new Error();
	const body = await response.text();
	return extractShopData(body);
}

async function scrapeShopRetry(shopId, retryCnt = 3) {
	while (true) {
		try {
			return scrapeShop(shopId);
		} catch (e) {
			if (--retryCnt <= 0) throw e;
		}
	}
}

function createEmptyShopDataObject(shopId) {
	return {
		shopId: shopId,
		brandName: '',
		activeSince: '',
		url: '',
		aanbod: '',
		beoordeling: '',
		score: '',
		kvk: '',
		btw: '',
		address: '',
		tradeName: '',
	};
}