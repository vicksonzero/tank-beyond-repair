import { config } from '../config/config';
import { Immutable } from '../utils/ImmutableType';

console.log(config);

export type PartType = 'scrap' | 'cannon' | 'armor' | 'battery';

export type PartsList = {
	[x in PartType]: number;
};

export type AttributeType = 'chassisLevel' | 'range' | 'damage' | 'attackInterval' | 'aimSpeed' | 'maxHP' | 'movementSpeed' | 'turnSpeed' | 'maxBattery' | 'dmgMultiplier' | 'battery';

export type AttributeObject = {
	[x in AttributeType]: number;
}

export class UpgradeObject {
	private _partsList: PartsList = {
		'scrap': 0,
		'cannon': 0,
		'armor': 0,
		'battery': 0,
	};
	constructor() {

	}

	static setDataSheet() {

	}

	static getRandomPartFromPool() {
		const upgrades = new UpgradeObject();

		const cumulativeSpawnChance: { cumulativeWeight: number, key: PartType }[] = [];
		let totalWeight = 0;
		Object.entries(config.itemSpawnChance).forEach(([key, weight]) => {
			totalWeight += weight;
			cumulativeSpawnChance.push({
				cumulativeWeight: 0 + totalWeight,
				key: key as PartType,
			})
		});
		// console.log(cumulativeSpawnChance);
		const num = Math.random() * totalWeight;
		let randomUpgradeKey: PartType | null = null;

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

	get partsList(): Immutable<PartsList> {
		return this._partsList;
	}

	setParts(params: Partial<PartsList>) {
		this._partsList = {
			'scrap': 0,
			'cannon': 0,
			'armor': 0,
			'battery': 0,
		} as PartsList;
		Object.entries(params).forEach(([k, v]) => {
			if (v != undefined) {
				this._partsList[k as PartType] = v;
			}
		});
	}

	addParts(params: Partial<PartsList>) {
		Object.entries(params).forEach(([k, v]) => {
			if (v != undefined) {
				this._partsList[k as PartType] += v;
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
				const itemEffects = config.items[k as PartType];
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
}
