import { config } from '../config/config';
import { Immutable } from '../utils/ImmutableType';

console.log(config);

export type PartType = 'chassis' | 'cannon' | 'armor' | 'gun' | 'missile' | 'rocket';

export type ItemType = 'scrap' | 'barrel' | 'armor' | 'battery';

export type ItemsList = {
	[x in ItemType]: number;
};

export type AttributeType = 'range' | 'damage' | 'attackInterval' | 'aimSpeed' | 'maxHP' | 'movementSpeed' | 'turnSpeed' | 'maxBattery' | 'dmgMultiplier';

export type AttributeObject = {
	[x in AttributeType]: number;
}

export class UpgradeObject {
	private _partsList: ItemsList = {
		'scrap': 0,
		'barrel': 0,
		'armor': 0,
		'battery': 0,
	};
	constructor() {

	}

	static setDataSheet() {

	}

	static getRandomPartFromPool() {
		const upgrades = new UpgradeObject();

		const cumulativeSpawnChance: { cumulativeWeight: number, key: ItemType }[] = [];
		let totalWeight = 0;
		Object.entries(config.itemSpawnChance).forEach(([key, weight]) => {
			totalWeight += weight;
			cumulativeSpawnChance.push({
				cumulativeWeight: 0 + totalWeight,
				key: key as ItemType,
			})
		});
		// console.log(cumulativeSpawnChance);
		const num = Math.random() * totalWeight;
		let randomUpgradeKey: ItemType | null = null;

		for (let i = 0; i < cumulativeSpawnChance.length; i++) {
			const { cumulativeWeight, key } = cumulativeSpawnChance[i];
			randomUpgradeKey = key;
			if (cumulativeWeight > num) { break; }
		}

		// console.log(num, randomUpgradeKey);


		if (randomUpgradeKey != null) {
			upgrades.addParts({
				[randomUpgradeKey]: 1,
			});
		}

		return upgrades;
	}

	get partsList(): Immutable<ItemsList> {
		return this._partsList;
	}

	setParts(params: Partial<ItemsList>) {
		this._partsList = {
			'scrap': 0,
			'barrel': 0,
			'armor': 0,
			'battery': 0,
		} as ItemsList;
		Object.entries(params).forEach(([k, v]) => {
			if (v != undefined) {
				this._partsList[k as ItemType] = v;
			}
		});
	}

	addParts(params: Partial<ItemsList>) {
		Object.entries(params).forEach(([k, v]) => {
			if (v != undefined) {
				this._partsList[k as ItemType] += v;
			}
		});
	}

	clone() {
		const result = new UpgradeObject();
		result.setParts(this._partsList);
		return result;
	}

	getAttribute(attributeName: AttributeType) {
		return Object.entries(this._partsList).reduce((result, [k, v]) => {
			if (v != undefined) {
				const itemEffects = config.items[k as ItemType];
				let eligibleEffect: Partial<AttributeObject> = {};
				let i = 0;
				for (; i < itemEffects.length; i++) {
					const effect = itemEffects[i];
					if (v < effect.xp) {
						// if v is smaller than the lowest requirement, just give them an empty object
						break;
					}
					eligibleEffect = itemEffects[i];
				}
				result += eligibleEffect[attributeName] || 0;
			}
			return result;
		}, 0);
	}

	toString() {
		return `${this._partsList.scrap}/${this._partsList.barrel}/${this._partsList.armor}/${this._partsList.battery}`;
	}
}
