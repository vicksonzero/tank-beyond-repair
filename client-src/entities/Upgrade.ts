import { AttributeType, config, IPartList, ItemsList, ItemType, PartType } from '../config/config';
import { Immutable } from '../utils/ImmutableType';
import { capitalize } from '../utils/utils';


export class UpgradeObject {
	private _partsList: ItemsList = {
		'scrap': 0,
		'barrel': 0,
		'armor': 0,
		'battery': 0,
	};
	private _levels: IPartList | null = null;
	constructor() {

	}

	static setDataSheet() {

	}

	static getRandomPartFromPool(partsValueMin: number, partsValueMaxIncl = 1, upgradeTypesMin = 1, upgradeTypesMax = 1) {
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
			let partVal = Math.ceil(Math.random() * Math.min(partsValueMaxIncl - partsValueMin)) + partsValueMin;

			if (randomUpgradeKey === ItemType.BATTERY) {
				partVal *= 100;
			}
			upgrades.addParts({
				[randomUpgradeKey]: partVal,
			});
		}

		return upgrades;
	}

	static makeUpgradeString(upgrades: UpgradeObject) {
		return (Object.entries(upgrades.partsList)
			.filter(([key, value]) => value !== 0)
			.map(([key, value]) => `${capitalize(key)}${(value >= 0 ? ' x' + value : value)}`)
			.join('\n')
		);
	}

	get partsList(): Immutable<ItemsList> {
		return this._partsList;
	}

	get levels(): Immutable<IPartList> {
		if (!this._levels) {
			this._levels = this._getLevel();
		}
		return this._levels;
	}

	setParts(params: Partial<ItemsList>) {
		this._partsList = {
			scrap: 0,
			barrel: 0,
			armor: 0,
			battery: 0,
		} as ItemsList;
		Object.entries(params).forEach(([k, v]) => {
			if (v != undefined) {
				this._partsList[k as ItemType] = v;
			}
		});
		this._levels = null; // set dirty
	}

	addParts(params: Partial<ItemsList>) {
		Object.entries(params).forEach(([k, v]) => {
			if (v != undefined) {
				this._partsList[k as ItemType] += v;
			}
		});
		this._levels = null; // set dirty
	}

	addAllParts(params: Array<Partial<ItemsList>>) {
		for (const p of params) {
			this.addParts(p);
		}
	}

	clone() {
		const result = new UpgradeObject();
		result.setParts(this.partsList);
		return result;
	}

	private _getLevel() {
		const result: IPartList = {
			chassis: 0,
			cannon: 0,
			armor: 0,
			gun: 0,
			missile: 0,
			rocket: 0,
		};
		const fulfillRequirements = (req: ItemsList): boolean => {
			return Object.entries(req)
				.every(([requiredItem, count]: [ItemType, number]) => this.partsList[requiredItem] >= count)
				;
		};

		Object.entries(config.partRequirements).forEach(([partType, partReq]: [PartType, Array<ItemsList>]) => {
			if (!partReq) return;
			let i = 0;
			for (; i < partReq.length; i++) {
				const req = partReq[i];

				if (!fulfillRequirements(req)) {
					// if v is smaller than the lowest requirement, just give them an empty object
					break;
				}
			}
			result[partType] = i;
		});

		return result;
	}

	getAttribute(attributeName: AttributeType) {
		return Object.entries(this.levels).reduce((result, [partType, partLevel]: [PartType, number]) => {

			const a = config.parts[partType] || [];
			const b = a[partLevel] || {};


			const stat = b.stat?.[attributeName] || 0;
			return result + stat;
		}, 0);
	}

	toString() {
		return `${this.partsList.scrap}/${this.partsList.barrel}/${this.partsList.armor}/${this.partsList.battery}\n` +
			`${this.levels.chassis}|${this.levels.cannon}|${this.levels.armor}|${this.levels.gun}|${this.levels.missile}|${this.levels.rocket}`;
	}
}
